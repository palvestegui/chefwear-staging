import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, User, Auth } from 'firebase/auth';
import { doc, onSnapshot, Firestore } from 'firebase/firestore';
import { auth as defaultAuth, db as defaultDb } from '../firebase';
import { AuthUserProfile, ViewRoleOption, AuthErrorInfo } from '../types';
import {
  syncUserDocument,
  resolveEffectiveImpersonation,
  STAGING_ADMIN_USER_PROFILE,
  createStagingFirebaseUser,
  buildUserProfileFromDoc
} from '../utils/authHelpers';

export interface AuthContextType {
  user: User | null;
  userProfile: AuthUserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isActualSuperAdmin: boolean;
  activeViewRole: ViewRoleOption;
  setActiveViewRole: (role: ViewRoleOption) => void;
  isLoading: boolean;
  authError: AuthErrorInfo | null;
  clearAuthError: () => void;
  login: () => Promise<void>;
  loginAsStagingAdmin: () => void;
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
  authError: null,
  clearAuthError: () => {},
  login: async () => {},
  loginAsStagingAdmin: () => {},
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode, auth?: Auth, db?: Firestore }> = ({ children, auth = defaultAuth, db = defaultDb }) => {
  const [isStagingBypass, setIsStagingBypass] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('azafran_staging_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      if (sessionStorage.getItem('azafran_staging_auth') === 'true') {
        return createStagingFirebaseUser();
      }
    } catch {
      // Ignore
    }
    return null;
  });

  const [rawUserProfile, setRawUserProfile] = useState<AuthUserProfile | null>(() => {
    try {
      if (sessionStorage.getItem('azafran_staging_auth') === 'true') {
        return STAGING_ADMIN_USER_PROFILE;
      }
    } catch {
      // Ignore
    }
    return null;
  });

  const [rawIsAdmin, setRawIsAdmin] = useState(() => {
    try {
      return sessionStorage.getItem('azafran_staging_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    try {
      return sessionStorage.getItem('azafran_staging_auth') !== 'true';
    } catch {
      return true;
    }
  });

  const [authError, setAuthError] = useState<AuthErrorInfo | null>(null);

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

  const clearAuthError = () => {
    setAuthError(null);
  };
  
  const login = async () => {
    clearAuthError();
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      // onAuthStateChanged listener will automatically pick up result.user and resolve their Firestore profile.
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      const errCode = authErr.code || '';
      
      if (errCode === 'auth/popup-closed-by-user' || errCode === 'auth/cancelled-popup-request') {
        return;
      }
      
      const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
      if (errCode === 'auth/unauthorized-domain') {
        setAuthError({
          code: 'auth/unauthorized-domain',
          message: 'Dominio no autorizado en Firebase Authentication.',
          domain: currentDomain
        });
        console.warn(`[FirebaseAuth] Domain "${currentDomain}" is not authorized in Firebase project.`);
        return;
      }
      
      setAuthError({
        code: errCode || 'auth/unknown',
        message: authErr.message || 'Error al iniciar sesión con Google.',
        domain: currentDomain
      });
      console.warn('[FirebaseAuth] Error during sign-in:', authErr.message);
    }
  };

  const loginAsStagingAdmin = () => {
    clearAuthError();
    try {
      sessionStorage.setItem('azafran_staging_auth', 'true');
    } catch {
      // Ignore sessionStorage error
    }
    setIsStagingBypass(true);
    setUser(createStagingFirebaseUser());
    setRawUserProfile(STAGING_ADMIN_USER_PROFILE);
    setRawIsAdmin(true);
    setIsLoading(false);
  };
  
  const logout = async () => {
    clearAuthError();
    try {
      sessionStorage.removeItem('azafran_staging_auth');
    } catch {
      // Ignore
    }
    setIsStagingBypass(false);
    setUser(null);
    setRawUserProfile(null);
    setRawIsAdmin(false);
    await firebaseSignOut(auth);
  };

  useEffect(() => {
    if (isStagingBypass) {
      setUser(createStagingFirebaseUser());
      setRawUserProfile(STAGING_ADMIN_USER_PROFILE);
      setRawIsAdmin(true);
      setIsLoading(false);
      return;
    }

    let unsubProfile: (() => void) | null = null;
    
    const unsubAuth = onAuthStateChanged(auth, async (authUser) => {
      if (isStagingBypass) return;

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
        const userDocRef = doc(db, 'users', authUser.uid);
        
        await syncUserDocument(db, authUser);

        if (unsubProfile) unsubProfile();
        unsubProfile = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            const profile = buildUserProfileFromDoc(authUser, snap.data());
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
  }, [auth, db, isStagingBypass]);

  const isActualSuperAdmin = Boolean(
    isStagingBypass ||
    rawUserProfile?.role === 'SUPER_ADMIN' ||
    rawUserProfile?.role === 'SUPERADMIN' ||
    rawUserProfile?.role === 'admin' ||
    (user?.email && user.email.toLowerCase() === 'palvestegui@gmail.com') ||
    (rawUserProfile?.email && rawUserProfile.email.toLowerCase() === 'palvestegui@gmail.com')
  );

  const { effectiveUserProfile, effectiveIsAdmin, effectiveIsSuperAdmin } = resolveEffectiveImpersonation(
    rawUserProfile,
    rawIsAdmin,
    isActualSuperAdmin,
    activeViewRole
  );

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
        authError,
        clearAuthError,
        login,
        loginAsStagingAdmin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
