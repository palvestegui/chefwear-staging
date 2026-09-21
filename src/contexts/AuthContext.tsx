import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, User, Auth } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, writeBatch, collection, query, where, getDocs, serverTimestamp, Firestore } from 'firebase/firestore';
import { auth as defaultAuth, db as defaultDb } from '../firebase';
import { DEFAULT_USER_CONFIGS } from '../utils/constants';
import { AuthUserProfile, ViewRoleOption } from '../types';

export interface AuthContextType {
  user: User | null;
  userProfile: AuthUserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isActualSuperAdmin: boolean;
  activeViewRole: ViewRoleOption;
  setActiveViewRole: (role: ViewRoleOption) => void;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole?: (role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  isAdmin: false,
  isSuperAdmin: false,
  isActualSuperAdmin: false,
  activeViewRole: 'admin',
  setActiveViewRole: () => {},
  isLoading: true,
  login: async () => {},
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode, auth?: Auth, db?: Firestore }> = ({ children, auth = defaultAuth, db = defaultDb }) => {
  const [user, setUser] = useState<User | null>(null);
  const [rawUserProfile, setRawUserProfile] = useState<AuthUserProfile | null>(null);
  const [rawIsAdmin, setRawIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Impersonation state for SuperAdmin preview / video recording
  const [activeViewRole, setActiveViewRoleState] = useState<ViewRoleOption>(() => {
    try {
      const saved = sessionStorage.getItem('azafran_active_view_role');
      if (saved === 'admin' || saved === 'ventas' || saved === 'operaciones' || saved === 'produccion') {
        return saved;
      }
    } catch {
      // Ignore sessionStorage unavailability
    }
    return 'admin';
  });

  const setActiveViewRole = (role: ViewRoleOption) => {
    setActiveViewRoleState(role);
    try {
      sessionStorage.setItem('azafran_active_view_role', role);
    } catch {
      // Ignore storage errors
    }
  };
  
  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener will automatically pick up result.user and resolve their Firestore profile.
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        console.error("Auth Popup Error:", err);
        alert('Error al iniciar sesión: ' + err.message);
      }
    }
  };
  
  const logout = async () => {
    await firebaseSignOut(auth);
  };

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    
    const unsubAuth = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (!authUser) {
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }
        setRawUserProfile(null);
        setRawIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const userEmail = authUser.email || '';
        const emailLower = userEmail.toLowerCase().trim();
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          // Query the 'users' collection where 'email' == user.email
          let preDocSnap: { id: string; data: () => Record<string, unknown> } | null = null;

          if (userEmail) {
            const q = query(collection(db, 'users'), where('email', '==', userEmail));
            const qSnap = await getDocs(q);
            const found = qSnap.docs.find(d => d.id !== authUser.uid);
            if (found) {
              preDocSnap = found;
            } else if (emailLower && emailLower !== userEmail) {
              const qLower = query(collection(db, 'users'), where('email', '==', emailLower));
              const qLowerSnap = await getDocs(qLower);
              const foundLower = qLowerSnap.docs.find(d => d.id !== authUser.uid);
              if (foundLower) {
                preDocSnap = foundLower;
              }
            }
          }

          const preData = preDocSnap ? preDocSnap.data() : null;
          const isPreApproved = preData && preData.status === 'APPROVED';

          if (isPreApproved && preDocSnap) {
            // Atomically create the new document doc(db, 'users', user.uid)
            // with the pre-provisioned role, permissions, and metadata,
            // and delete the temporary email-keyed document.
            const batch = writeBatch(db);
            batch.set(userDocRef, {
              email: authUser.email,
              emailLower,
              displayName: (preData.displayName as string) || (preData.name as string) || authUser.displayName || 'Usuario',
              name: (preData.name as string) || (preData.displayName as string) || authUser.displayName || 'Usuario',
              photoURL: authUser.photoURL || (preData.photoURL as string) || null,
              role: (preData.role as string) || 'VENTAS',
              status: 'APPROVED',
              canExport: Boolean(preData.canExport),
              canEditPrices: Boolean(preData.canEditPrices),
              canManageRoles: Boolean(preData.canManageRoles),
              canAccessDangerZone: Boolean(preData.canAccessDangerZone),
              preProvisioned: false,
              boundAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              createdAt: (preData.createdAt as unknown) || serverTimestamp(),
              updatedAt: serverTimestamp()
            });

            batch.delete(doc(db, 'users', preDocSnap.id));
            await batch.commit();
          } else {
            const defaultConfig = DEFAULT_USER_CONFIGS[emailLower];
            await setDoc(userDocRef, {
              email: authUser.email,
              emailLower,
              displayName: authUser.displayName || (authUser.email ? authUser.email.split('@')[0] : 'Usuario'),
              name: authUser.displayName || (authUser.email ? authUser.email.split('@')[0] : 'Usuario'),
              photoURL: authUser.photoURL || null,
              role: defaultConfig ? defaultConfig.role : 'SALES',
              status: defaultConfig ? defaultConfig.status : 'PENDING',
              canExport: defaultConfig ? defaultConfig.canExport : false,
              canEditPrices: defaultConfig ? defaultConfig.canEditPrices : false,
              canManageRoles: defaultConfig ? defaultConfig.canManageRoles : false,
              canAccessDangerZone: defaultConfig ? defaultConfig.canAccessDangerZone : false,
              preProvisioned: false,
              lastLoginAt: serverTimestamp(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        } else {
          await setDoc(userDocRef, {
            lastLoginAt: serverTimestamp(),
            photoURL: authUser.photoURL || null
          }, { merge: true });
        }

        if (unsubProfile) unsubProfile();
        unsubProfile = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const defaultConfig = DEFAULT_USER_CONFIGS[emailLower];

            const profile: AuthUserProfile = {
              uid: authUser.uid,
              id: authUser.uid,
              role: data.role || (defaultConfig ? defaultConfig.role : 'SALES'),
              name: data.name || data.displayName || authUser.displayName || (defaultConfig ? defaultConfig.name : (authUser.email ? authUser.email.split('@')[0] : 'Vendedor')),
              status: data.status || (defaultConfig ? defaultConfig.status : 'PENDING'),
              canExport: data.canExport ?? (defaultConfig ? defaultConfig.canExport : false),
              canEditPrices: data.canEditPrices ?? (defaultConfig ? defaultConfig.canEditPrices : false),
              canManageRoles: data.canManageRoles ?? (defaultConfig ? defaultConfig.canManageRoles : false),
              canAccessDangerZone: data.canAccessDangerZone ?? (defaultConfig ? defaultConfig.canAccessDangerZone : false),
              email: authUser.email || ''
            };

            setRawUserProfile(profile);
            setRawIsAdmin(profile.role === 'SUPERADMIN' || profile.role === 'ADMIN' || profile.role === 'SUPER_ADMIN');
          } else {
            setRawUserProfile(null);
            setRawIsAdmin(false);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("User profile snapshot error:", error);
          setIsLoading(false);
        });
      } catch (err) {
        console.error("Auth profile resolution error:", err);
        setIsLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, [auth, db]);

  const isActualSuperAdmin = Boolean(
    rawUserProfile?.role === 'SUPER_ADMIN' ||
    rawUserProfile?.role === 'SUPERADMIN' ||
    (user?.email && user.email.toLowerCase() === 'palvestegui@gmail.com') ||
    (rawUserProfile?.email && rawUserProfile.email.toLowerCase() === 'palvestegui@gmail.com')
  );

  let effectiveUserProfile = rawUserProfile;
  let effectiveIsAdmin = rawIsAdmin;
  let effectiveIsSuperAdmin = isActualSuperAdmin;

  // When SuperAdmin impersonates a specific role for preview or mobile video recording
  if (isActualSuperAdmin && activeViewRole !== 'admin') {
    if (activeViewRole === 'ventas') {
      effectiveUserProfile = {
        ...(rawUserProfile || {}),
        role: 'VENTAS',
        name: 'Matías (Ventas)',
        canExport: false,
        canEditPrices: false,
        canManageRoles: false,
        canAccessDangerZone: false
      };
      effectiveIsAdmin = false;
      effectiveIsSuperAdmin = false;
    } else if (activeViewRole === 'operaciones') {
      effectiveUserProfile = {
        ...(rawUserProfile || {}),
        role: 'OPERACIONES',
        name: 'León (Operaciones)',
        canExport: true,
        canEditPrices: false,
        canManageRoles: false,
        canAccessDangerZone: false
      };
      effectiveIsAdmin = false;
      effectiveIsSuperAdmin = false;
    } else if (activeViewRole === 'produccion') {
      effectiveUserProfile = {
        ...(rawUserProfile || {}),
        role: 'PRODUCCION',
        name: 'Doris (Producción)',
        canExport: true,
        canEditPrices: true,
        canManageRoles: false,
        canAccessDangerZone: false
      };
      effectiveIsAdmin = false;
      effectiveIsSuperAdmin = false;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile: effectiveUserProfile,
        isAdmin: effectiveIsAdmin,
        isSuperAdmin: effectiveIsSuperAdmin,
        isActualSuperAdmin,
        activeViewRole,
        setActiveViewRole,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
