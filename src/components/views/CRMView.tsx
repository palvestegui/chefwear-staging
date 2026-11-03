import React, { useState, useMemo, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
const { Plus, UserCircle, CheckCircle, Ruler } = LucideIcons;

import { 
  requiredFields, 
  fieldLabels, 
  ACCOUNT_TYPES, 
  normalizeAccountType, 
  getRolesForAccountType, 
  normalizeRole 
} from '../../utils/constants';
import { buildUnifiedDirectoryContacts } from '../../utils/contactUtils';
import { extractValidMeasurements } from '../modals/ContactMeasurementsModal';

import { ClientAccountsTable } from './crm/ClientAccountsTable';

import { NewAccountModal } from '../modals/NewAccountModal';
import { NewContactModal } from '../modals/NewContactModal';
import { EditAccountModal } from '../modals/EditAccountModal';
import { EditContactModal } from '../modals/EditContactModal';
import { MergeContactModal } from '../modals/MergeContactModal';
import { MergeAccountModal } from '../modals/MergeAccountModal';
import { DeleteContactModal } from '../modals/DeleteContactModal';
import { AccountProfileModal } from '../modals/AccountProfileModal';
import { ContactProfileModal } from '../modals/ContactProfileModal';
import { doc, setDoc } from 'firebase/firestore';

export interface CRMViewProps {
  orders?: any[];
  clientAccounts?: any[];
  masterContacts?: any[];
  accountContacts?: any[];
  directoryContacts?: any[];
  uniqueClients?: any[];
  pricing?: any;
  db?: any;
  user?: any;
  setViewingClientId?: (id: string | null) => void;
  setViewingAccountHistoryId?: (id: string | null) => void;
}

export const CRMView: React.FC<CRMViewProps> = ({
  orders = [],
  clientAccounts = [],
  masterContacts = [],
  accountContacts = [],
  directoryContacts: passedDirectoryContacts,
  uniqueClients = [],
  pricing,
  db,
  user,
  setViewingClientId = (_id: string | null = null) => {},
  setViewingAccountHistoryId = (_id: string | null = null) => {}
}) => {

  
  // Resolve directory contacts unified with measurements from masterContacts and Orders
  const directoryContacts = useMemo(() => {
    return buildUnifiedDirectoryContacts(masterContacts, orders, passedDirectoryContacts);
  }, [masterContacts, orders, passedDirectoryContacts]);

  const hasRunRoleFix = React.useRef(false);
  useEffect(() => {
    if (!db || !masterContacts || masterContacts.length === 0 || hasRunRoleFix.current) return;
    hasRunRoleFix.current = true;
    
    const accountTypeMap = new Map();
    clientAccounts.forEach(acc => {
       if (acc.accountId) {
          accountTypeMap.set(acc.accountId, acc.accountType || 'Universidad / Instituto');
       }
    });

    masterContacts.forEach(contact => {
      let needsUpdate = false;
      let newRole = contact.role;

      const accType = accountTypeMap.get(contact.accountId) || accountTypeMap.get(contact.parentAccountId);
      if (accType && normalizeAccountType(accType) !== 'Particular / Individuo' && contact.role === 'PARTICULAR') {
         const expectedRole = normalizeRole('PARTICULAR', accType);
         if (expectedRole !== 'PARTICULAR') {
            newRole = expectedRole;
            needsUpdate = true;
         }
      }
      
      const isUdi = (contact.accountId === 'ACC-001' || (contact.companyName && contact.companyName.toUpperCase().includes('UDI')));
      if (isUdi && (contact.role === 'PARTICULAR' || newRole === 'PARTICULAR')) {
        newRole = 'ESTUDIANTE';
        needsUpdate = true;
      }

      if (needsUpdate && newRole) {
        const contactId = contact.id || contact.contactId;
        if (contactId) {
           setDoc(doc(db, 'masterContacts', contactId), { role: newRole }, { merge: true }).catch(e => console.warn(e));
        }
      }
    });
  }, [db, masterContacts, clientAccounts]);

  // Local CRM Search & Filter State
  const [clientSearch, setClientSearch] = useState('');
  const [directoryTab, setDirectoryTab] = useState<'accounts' | 'contacts'>('accounts');
  const [contactSuccessMsg, setContactSuccessMsg] = useState('');

  // Local Modal States for Accounts & Contacts
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountType: 'Universidad/Instituto',
    accountName: '',
    parentAccountId: '',
    contactNombre: '',
    contactApellido: '',
    phone: '',
    email: '',
    deliveryCity: 'Santa Cruz',
    deliveryAddress: '',
    deliveryNotes: '',
    logoEmbroidery: true,
    logoPlacements: [''] as string[],
    logoFileLocation: '',
    logoUrls: [] as string[],
    pricingTier: 'Estándar Raleo'
  });

  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newContact, setNewContact] = useState({
    accountId: '',
    contactNombre: '',
    contactApellido: '',
    role: 'Estudiante',
    phone: '',
    email: '',
    measurements: {} as any
  });

  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [editingMasterContact, setEditingMasterContact] = useState<any>(null);

  const [showMergeContactModal, setShowMergeContactModal] = useState(false);
  const [mergeSourceContact, setMergeSourceContact] = useState<any>(null);
  const [mergeTargetContactId, setMergeTargetContactId] = useState('');

  const [showDeleteContactModal, setShowDeleteContactModal] = useState(false);
  const [deleteTargetContact, setDeleteTargetContact] = useState<any>(null);

  const [showMergeAccountModal, setShowMergeAccountModal] = useState(false);
  const [mergeSourceAccount, setMergeSourceAccount] = useState<any>(null);
  const [mergeTargetAccountId, setMergeTargetAccountId] = useState('');
  const [mergeAccountStep, setMergeAccountStep] = useState(0);
  const [isMergingInProgress, setIsMergingInProgress] = useState(false);

  // Profile Card Modal States (Read-Only with Collapsible Accordions)
  const [viewingProfileAccount, setViewingProfileAccount] = useState<any | null>(null);
  const [viewingProfileContact, setViewingProfileContact] = useState<any | null>(null);
  const [openMeasurementsInProfile, setOpenMeasurementsInProfile] = useState(false);

  return (
    <>
      <div className="w-full space-y-6 animate-in fade-in">
        {contactSuccessMsg && (
          <div className="mb-4 p-4 bg-emerald-950/50 border border-emerald-900 text-emerald-400 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <CheckCircle size={16} /> {contactSuccessMsg}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-black text-stone-300 uppercase tracking-tight flex items-center gap-2">Directorio de Clientes</h2>
          
          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto mb-4 md:mb-0">
            <button onClick={() => setDirectoryTab('accounts')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${directoryTab === 'accounts' ? 'bg-stone-100 text-stone-900' : 'bg-stone-900 text-stone-500 border border-stone-800 hover:bg-stone-800'}`}>Cuentas Cliente</button>
            <button onClick={() => setDirectoryTab('contacts')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${directoryTab === 'contacts' ? 'bg-stone-100 text-stone-900' : 'bg-stone-900 text-stone-500 border border-stone-800 hover:bg-stone-800'}`}>Directorio Contactos</button>
            
            <button onClick={() => {
              setNewAccount({
                accountType: 'Empresa / Corporate',
                accountName: '',
                parentAccountId: '',
                contactNombre: '',
                contactApellido: '',
                phone: '',
                email: '',
                deliveryCity: 'Santa Cruz',
                deliveryAddress: '',
                deliveryNotes: '',
                logoEmbroidery: true,
                logoPlacements: [''],
                logoFileLocation: '',
                logoUrls: [],
                pricingTier: 'Estándar Raleo'
              });
              setShowNewAccountModal(true);
            }} className="ml-auto bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2">
              <Plus size={14} /> Nueva Cuenta
            </button>
            <button onClick={() => {
              setNewContact({
                accountId: 'ACC-000',
                contactNombre: '',
                contactApellido: '',
                role: 'PARTICULAR',
                phone: '',
                email: '',
                measurements: {}
              });
              setContactSuccessMsg('');
              setShowNewContactModal(true);
            }} className="ml-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2">
              <Plus size={14} /> Nuevo Contacto
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 py-2.5 px-4 pl-10 rounded-xl focus:border-amber-500 outline-none font-bold text-xs text-stone-300"
            />
            <span className="absolute left-3 top-3 text-stone-500"><UserCircle size={16} /></span>
          </div>
        </div>

        <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden shadow-xl overflow-x-auto">
          {directoryTab === 'accounts' && (
            <ClientAccountsTable
              clientAccounts={clientAccounts}
              clientSearch={clientSearch}
              onSelectAccount={(acc) => setViewingProfileAccount(acc)}
              setViewingAccountHistoryId={setViewingAccountHistoryId}
              onOpenEdit={(acc) => {
                setEditingAccount(acc);
                setShowEditAccountModal(true);
              }}
            />
          )}
          
          {directoryTab === 'contacts' && (
            <div className="overflow-x-auto pb-6">
              <table className="w-full text-left min-w-[1000px]">
                <thead className="bg-stone-950 text-[10px] uppercase text-stone-500 font-black tracking-widest border-b border-stone-800">
                  <tr>
                    <th className="py-2.5 px-4 whitespace-nowrap">Contact_ID</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Account_ID</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Full_Name</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Role</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Phone_Number</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Email_Address</th>
                    <th className="py-2.5 px-4 whitespace-nowrap text-right">Sizing_Matrix_12Pt_CM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/50">
                  {directoryContacts
                    .filter((c: any) => 
                      (c.fullName || c.contactId || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
                      (c.accountId || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
                      (c.phone || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
                      (c.role || '').toLowerCase().includes(clientSearch.toLowerCase())
                    )
                    .map((c: any, i: number) => {
                      const measurementsList = extractValidMeasurements(c);
                      const hasMeasurements = measurementsList.length > 0;

                      return (
                        <tr 
                          key={c.contactId || i} 
                          onClick={() => {
                            setViewingProfileContact(c);
                            setOpenMeasurementsInProfile(false);
                          }} 
                          className="hover:bg-stone-800/50 transition group cursor-pointer"
                        >
                          <td className="py-2.5 px-4 font-black text-stone-200 uppercase whitespace-nowrap">{c.contactId}</td>
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-stone-300">
                                {c.accountId}
                              </span>
                              {(c.companyName || c.parentAccountName) && c.accountId !== 'ACC-000' && (
                                <span className="text-[10px] text-stone-500 truncate max-w-[160px]">
                                  {c.companyName || c.parentAccountName}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-xs font-medium text-stone-200 uppercase whitespace-nowrap">{c.fullName || c.contactId}</td>
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span className="text-xs text-stone-400 font-medium uppercase tracking-wide">
                              {c.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-xs font-mono text-stone-300 whitespace-nowrap">{c.phone || '-'}</td>
                          <td className="py-2.5 px-4 text-xs text-stone-400 whitespace-nowrap">{c.email || '-'}</td>
                          <td className="py-2.5 px-4 text-xs text-stone-400 text-right">
                            <div className="flex justify-end">
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingProfileContact(c);
                                  setOpenMeasurementsInProfile(true);
                                }} 
                                className={`px-2.5 py-1 rounded-lg transition font-medium text-[11px] whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer ${
                                  hasMeasurements 
                                    ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40' 
                                    : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
                                }`}
                              >
                                <Ruler size={13} className={hasMeasurements ? 'text-amber-400' : 'text-stone-600'} />
                                <span>{hasMeasurements ? `Medidas (${measurementsList.length})` : 'Sin Medidas'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {(directoryTab === 'accounts' ? clientAccounts.length === 0 : directoryContacts.length === 0) && (
          <div className="text-center py-20 bg-stone-900 border border-stone-800 rounded-3xl">
            <p className="text-stone-500 font-bold uppercase tracking-widest">
              {directoryTab === 'accounts' ? 'No hay cuentas de clientes registradas.' : 'No hay contactos registrados.'}
            </p>
          </div>
        )}
      </div>

      {/* CRM Modals */}
      {showNewAccountModal && (
        <NewAccountModal 
          onClose={() => setShowNewAccountModal(false)} 
          newAccount={newAccount} 
          setNewAccount={setNewAccount} 
          clientAccounts={clientAccounts} 
          normalizeAccountType={normalizeAccountType} 
          ACCOUNT_TYPES={ACCOUNT_TYPES} 
          pricing={pricing}
          db={db} 
          user={user} 
        />
      )}

      {showNewContactModal && (
        <NewContactModal 
          onClose={() => setShowNewContactModal(false)} 
          newContact={newContact} 
          setNewContact={setNewContact} 
          clientAccounts={clientAccounts} 
          requiredFields={requiredFields} 
          fieldLabels={fieldLabels} 
          masterContacts={masterContacts} 
          setContactSuccessMsg={setContactSuccessMsg} 
          db={db} 
          user={user} 
          contactSuccessMsg={contactSuccessMsg} 
          getRolesForAccountType={getRolesForAccountType} 
          normalizeAccountType={normalizeAccountType} 
          normalizeRole={normalizeRole} 
          accountContacts={accountContacts} 
        />
      )}

      {showEditAccountModal && editingAccount && (
        <EditAccountModal 
          onClose={() => setShowEditAccountModal(false)} 
          editingAccount={editingAccount} 
          setEditingAccount={setEditingAccount} 
          clientAccounts={clientAccounts} 
          normalizeAccountType={normalizeAccountType} 
          ACCOUNT_TYPES={ACCOUNT_TYPES} 
          pricing={pricing}
          db={db} 
          setContactSuccessMsg={setContactSuccessMsg} 
        />
      )}

      {showEditContactModal && editingMasterContact && (
        <EditContactModal 
          onClose={() => setShowEditContactModal(false)} 
          editingMasterContact={editingMasterContact} 
          setEditingMasterContact={setEditingMasterContact} 
          clientAccounts={clientAccounts} 
          requiredFields={requiredFields} 
          fieldLabels={fieldLabels} 
          db={db} 
          setContactSuccessMsg={setContactSuccessMsg} 
          getRolesForAccountType={getRolesForAccountType} 
          normalizeAccountType={normalizeAccountType} 
          normalizeRole={normalizeRole} 
          accountContacts={accountContacts}
        />
      )}

      <MergeAccountModal 
        showMergeAccountModal={showMergeAccountModal}
        setShowMergeAccountModal={setShowMergeAccountModal}
        mergeSourceAccount={mergeSourceAccount}
        setMergeSourceAccount={setMergeSourceAccount}
        mergeTargetAccountId={mergeTargetAccountId}
        setMergeTargetAccountId={setMergeTargetAccountId}
        mergeAccountStep={mergeAccountStep}
        setMergeAccountStep={setMergeAccountStep}
        isMergingInProgress={isMergingInProgress}
        setIsMergingInProgress={setIsMergingInProgress}
        clientAccounts={clientAccounts}
        directoryContacts={directoryContacts}
        orders={orders}
        db={db}
      />

      <MergeContactModal 
        showMergeContactModal={showMergeContactModal}
        setShowMergeContactModal={setShowMergeContactModal}
        mergeSourceContact={mergeSourceContact}
        setMergeSourceContact={setMergeSourceContact}
        mergeTargetContactId={mergeTargetContactId}
        setMergeTargetContactId={setMergeTargetContactId}
        directoryContacts={directoryContacts}
        orders={orders}
        setContactSuccessMsg={setContactSuccessMsg}
        db={db}
      />

      {showDeleteContactModal && deleteTargetContact && (
        <DeleteContactModal 
          deleteTargetContact={deleteTargetContact} 
          onClose={() => setShowDeleteContactModal(false)} 
          setContactSuccessMsg={setContactSuccessMsg} 
          db={db} 
        />
      )}

      {/* Read-Only Profile Modals with Collapsible Accordions & Edit Toggles */}
      {viewingProfileAccount && (
        <AccountProfileModal
          account={viewingProfileAccount}
          isOpen={Boolean(viewingProfileAccount)}
          onClose={() => setViewingProfileAccount(null)}
          onOpenEdit={(acc) => {
            setViewingProfileAccount(null);
            setEditingAccount(acc);
            setShowEditAccountModal(true);
          }}
          onViewHistory={(accId) => {
            setViewingProfileAccount(null);
            if (setViewingAccountHistoryId) {
              setViewingAccountHistoryId(accId);
            }
          }}
          clientAccounts={clientAccounts}
          db={db}
        />
      )}

      {viewingProfileContact && (
        <ContactProfileModal
          contact={viewingProfileContact}
          isOpen={Boolean(viewingProfileContact)}
          onClose={() => {
            setViewingProfileContact(null);
            setOpenMeasurementsInProfile(false);
          }}
          onOpenEdit={(cnt) => {
            setViewingProfileContact(null);
            setEditingMasterContact(cnt);
            setShowEditContactModal(true);
          }}
          onRequestDelete={(cnt) => {
            setViewingProfileContact(null);
            setDeleteTargetContact(cnt);
            setShowDeleteContactModal(true);
          }}
          clientAccounts={clientAccounts}
          orders={orders}
          initialOpenMeasurements={openMeasurementsInProfile}
          db={db}
        />
      )}
    </>
  );
};
