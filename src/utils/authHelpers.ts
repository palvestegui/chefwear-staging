import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, writeBatch, collection, query, where, getDocs, serverTimestamp, Firestore } from 'firebase/firestore';
import { AuthUserProfile, ViewRoleOption } from '../types';
import { DEFAULT_USER_CONFIGS } from './constants';

export interface ImpersonationResult {
  effectiveUserProfile: AuthUserProfile | null;
  effectiveIsAdmin: boolean;
  effectiveIsSuperAdmin: boolean;
}

export const STAGING_ADMIN_USER_PROFILE: AuthUserProfile = {
  uid: 'staging-pablo-alvestegui-admin',
  id: 'staging-pablo-alvestegui-admin',
  email: 'palvestegui@gmail.com',
  name: 'Pablo Alvestegui',
  role: 'admin',
  status: 'APPROVED',
  canExport: true,
  canEditPrices: true,
  canManageRoles: true,
  canAccessDangerZone: true,
};

export function createStagingFirebaseUser(): User {
  return {
    uid: 'staging-pablo-alvestegui-admin',
    email: 'palvestegui@gmail.com',
    displayName: 'Pablo Alvestegui',
    emailVerified: true,
    isAnonymous: false,
    phoneNumber: null,
    photoURL: null,
    providerId: 'google.com',
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'mock-staging-token',
    getIdTokenResult: async () => ({
      token: 'mock-staging-token',
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      signInProvider: 'google.com',
      signInSecondFactor: null,
      claims: { email: 'palvestegui@gmail.com', admin: true },
    }),
    reload: async () => {},
    toJSON: () => ({}),
  } as unknown as User;
}

export function buildUserProfileFromDoc(
  authUser: User,
  data: Record<string, unknown>
): AuthUserProfile {
  const userEmail = authUser.email || '';
  const emailLower = userEmail.toLowerCase().trim();
  const defaultConfig = DEFAULT_USER_CONFIGS[emailLower];

  return {
    uid: authUser.uid,
    id: authUser.uid,
    role: (data.role as string) || (defaultConfig ? defaultConfig.role : 'SALES'),
    name: (data.name as string) || (data.displayName as string) || authUser.displayName || (defaultConfig ? defaultConfig.name : (authUser.email ? authUser.email.split('@')[0] : 'Vendedor')),
    status: (data.status as string) || (defaultConfig ? defaultConfig.status : 'PENDING'),
    canExport: typeof data.canExport === 'boolean' ? data.canExport : (defaultConfig ? defaultConfig.canExport : false),
    canEditPrices: typeof data.canEditPrices === 'boolean' ? data.canEditPrices : (defaultConfig ? defaultConfig.canEditPrices : false),
    canManageRoles: typeof data.canManageRoles === 'boolean' ? data.canManageRoles : (defaultConfig ? defaultConfig.canManageRoles : false),
    canAccessDangerZone: typeof data.canAccessDangerZone === 'boolean' ? data.canAccessDangerZone : (defaultConfig ? defaultConfig.canAccessDangerZone : false),
    email: authUser.email || ''
  };
}

/**
 * Resolves the effective user profile and permissions based on impersonation selection.
 */
export function resolveEffectiveImpersonation(
  rawUserProfile: AuthUserProfile | null,
  rawIsAdmin: boolean,
  isActualSuperAdmin: boolean,
  activeViewRole: ViewRoleOption
): ImpersonationResult {
  if (!isActualSuperAdmin || activeViewRole === 'admin') {
    return {
      effectiveUserProfile: rawUserProfile,
      effectiveIsAdmin: rawIsAdmin,
      effectiveIsSuperAdmin: isActualSuperAdmin
    };
  }

  if (activeViewRole === 'ventas') {
    return {
      effectiveUserProfile: {
        ...(rawUserProfile || {}),
        role: 'VENTAS',
        name: 'Matías (Ventas)',
        canExport: false,
        canEditPrices: false,
        canManageRoles: false,
        canAccessDangerZone: false
      },
      effectiveIsAdmin: false,
      effectiveIsSuperAdmin: false
    };
  }

  if (activeViewRole === 'operaciones') {
    return {
      effectiveUserProfile: {
        ...(rawUserProfile || {}),
        role: 'OPERACIONES',
        name: 'León (Operaciones)',
        canExport: true,
        canEditPrices: false,
        canManageRoles: false,
        canAccessDangerZone: false
      },
      effectiveIsAdmin: false,
      effectiveIsSuperAdmin: false
    };
  }

  if (activeViewRole === 'produccion') {
    return {
      effectiveUserProfile: {
        ...(rawUserProfile || {}),
        role: 'PRODUCCION',
        name: 'Doris (Producción)',
        canExport: true,
        canEditPrices: true,
        canManageRoles: false,
        canAccessDangerZone: false
      },
      effectiveIsAdmin: false,
      effectiveIsSuperAdmin: false
    };
  }

  return {
    effectiveUserProfile: rawUserProfile,
    effectiveIsAdmin: rawIsAdmin,
    effectiveIsSuperAdmin: isActualSuperAdmin
  };
}

/**
 * Syncs the authenticated user to their Firestore profile document, handling pre-provisioned bindings.
 */
export async function syncUserDocument(db: Firestore, authUser: User): Promise<void> {
  const userEmail = authUser.email || '';
  const emailLower = userEmail.toLowerCase().trim();
  const userDocRef = doc(db, 'users', authUser.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
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
}
