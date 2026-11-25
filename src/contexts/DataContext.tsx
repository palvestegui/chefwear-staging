import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, Unsubscribe, Firestore } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { Order, PricingData, FirebaseUserSubset } from '../types';
import { ClientAccount, MasterContact } from '../types/crm';
import { runUdiFabricMigration } from '../utils/udiFabricMigration';
import { runUdiReconciliationPatch } from '../utils/udiReconciliationPatch';
import { initStagingSeed } from '../utils/stagingSeeder';
import { CatalogMediaDoc, hydratePricingWithMediaDocs } from '../utils/catalogMediaUtils';

let udiFabricAttempted = false;
let udiReconciliationAttempted = false;

export type AccountContactLink = { id: string; accountId?: string; contactId?: string };

export interface DataContextType {
  clientAccounts: ClientAccount[];
  masterContacts: MasterContact[];
  orders: Order[];
  accountContacts: AccountContactLink[];
  sizeTables: Record<string, unknown> | null;
  usersList: FirebaseUserSubset[];
  pricing: PricingData | null;
  setPricing: (pricing: PricingData | null) => void;
  isLoading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType>({
  clientAccounts: [],
  masterContacts: [],
  orders: [],
  accountContacts: [],
  sizeTables: null,
  usersList: [],
  pricing: null,
  setPricing: () => {},
  isLoading: true,
  error: null,
});

export const useData = () => useContext(DataContext);

export const DataProvider: React.FC<{ children: React.ReactNode; db: Firestore }> = ({ children, db }) => {
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([]);
  const [masterContacts, setMasterContacts] = useState<MasterContact[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [accountContacts, setAccountContacts] = useState<AccountContactLink[]>([]);
  const [sizeTables, setSizeTables] = useState<Record<string, unknown> | null>(null);
  const [usersList, setUsersList] = useState<FirebaseUserSubset[]>([]);

  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setClientAccounts([]);
      setMasterContacts([]);
      setOrders([]);
      setAccountContacts([]);
      setSizeTables(null);
      setUsersList([]);
      setPricing(null);
      setIsLoading(false);
      return;
    }

    const unsubs: Unsubscribe[] = [];
    setIsLoading(true);
    setError(null);

    const handleSnapshotError = (label: string) => (snapErr: Error) => {
      console.warn(`[DataContext] Snapshot error (${label}):`, snapErr.message);
      setIsLoading(false);
    };

    try {
      initStagingSeed(db).catch((err: unknown) => {
        console.warn('[DataContext] Staging baseline seed check:', err);
      });

      unsubs.push(
        onSnapshot(
          collection(db, 'clientAccounts'),
          (snapshot) => {
            setClientAccounts(
              snapshot.docs.map((d) => ({ id: d.id, accountId: d.data().accountId || d.id, ...d.data() } as ClientAccount))
            );
          },
          handleSnapshotError('clientAccounts')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'masterContacts'),
          (snapshot) => {
            setMasterContacts(
              snapshot.docs.map((d) => ({ id: d.id, contactId: d.data().contactId || d.id, ...d.data() } as MasterContact))
            );
          },
          handleSnapshotError('masterContacts')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'account_contacts'),
          (snapshot) => {
            setAccountContacts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AccountContactLink)));
          },
          handleSnapshotError('account_contacts')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
          (snapshot) => {
            setOrders(snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Order)));

            if (user && snapshot.docs.length > 0 && !udiFabricAttempted) {
              udiFabricAttempted = true;
              runUdiFabricMigration(db)
                .then((res) => {
                  if (res.updatedCount > 0) {
                    console.log('[UDI-MIGRATION] Auto-healed orders:', res.messages);
                  }
                })
                .catch((err: unknown) => {
                  console.warn('[UDI-MIGRATION] Background sync check:', err);
                });
            }

            if (user && snapshot.docs.length > 0 && !udiReconciliationAttempted) {
              udiReconciliationAttempted = true;
              runUdiReconciliationPatch(db)
                .then((res) => {
                  if (res.updatedCount > 0) {
                    console.log('[UDI-RECONCILIATION] Reconciled orders:', res.messages);
                  }
                })
                .catch((err: unknown) => {
                  console.warn('[UDI-RECONCILIATION] Background sync check:', err);
                });
            }
          },
          handleSnapshotError('orders')
        )
      );

      unsubs.push(
        onSnapshot(
          doc(db, 'settings', 'sizeTables'),
          (snap) => {
            if (snap.exists()) {
              setSizeTables(snap.data() as Record<string, unknown>);
            }
          },
          handleSnapshotError('settings/sizeTables')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'users'),
          (snapshot) => {
            setUsersList(snapshot.docs.map((d) => ({ ...d.data(), id: d.id, uid: d.id } as FirebaseUserSubset)));
          },
          handleSnapshotError('users')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'pricing'),
          (snapshot) => {
            const globalDoc = snapshot.docs.find((d) => d.id === 'global');
            if (!globalDoc) {
              setPricing(null);
              return;
            }
            const mediaDocs: CatalogMediaDoc[] = snapshot.docs
              .filter((d) => d.id.startsWith('media__'))
              .map((d) => d.data() as CatalogMediaDoc);
            setPricing(hydratePricingWithMediaDocs(globalDoc.data() as PricingData, mediaDocs));
          },
          handleSnapshotError('pricing')
        )
      );

      setIsLoading(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setIsLoading(false);
    }

    return () => unsubs.forEach((unsub) => unsub());
  }, [db, user, authLoading]);

  return (
    <DataContext.Provider
      value={{ clientAccounts, masterContacts, orders, accountContacts, sizeTables, usersList, pricing, setPricing, isLoading, error }}
    >
      {children}
    </DataContext.Provider>
  );
};
