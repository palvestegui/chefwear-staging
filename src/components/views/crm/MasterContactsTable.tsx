import React from 'react';
import { Ruler } from 'lucide-react';
import { extractValidMeasurements } from '../../modals/ContactMeasurementsModal';

export interface MasterContactsTableProps {
  directoryContacts: any[];
  clientSearch: string;
  onSelectContact: (contact: any, openMeasurements?: boolean) => void;
}

export const MasterContactsTable: React.FC<MasterContactsTableProps> = ({
  directoryContacts,
  clientSearch,
  onSelectContact
}) => {
  const filteredContacts = directoryContacts.filter(c => 
    (c.fullName || c.contactId || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.accountId || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.phone || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.role || '').toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
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
          {filteredContacts.map((c, i) => {
            const measurementsList = extractValidMeasurements(c);
            const hasMeasurements = measurementsList.length > 0;

            return (
              <tr 
                key={c.contactId || i} 
                onClick={() => onSelectContact(c, false)} 
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
                        onSelectContact(c, true);
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
  );
};
