import React from 'react';
import { Lock } from 'lucide-react';
import { normalizePricingTier, isSystemAccount } from '../../../utils/constants';

export interface ClientAccountsTableProps {
  clientAccounts: any[];
  clientSearch: string;
  onSelectAccount: (account: any) => void;
  setViewingAccountHistoryId: (id: string | null) => void;
}

export const ClientAccountsTable: React.FC<ClientAccountsTableProps> = ({
  clientAccounts,
  clientSearch,
  onSelectAccount,
  setViewingAccountHistoryId
}) => {
  const filteredAccounts = clientAccounts.filter(c => 
    (c.accountName || '').toLowerCase().includes(clientSearch.toLowerCase()) || 
    (c.accountId || '').toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left min-w-[1500px]">
        <thead className="bg-stone-950 text-[10px] uppercase text-stone-500 font-black tracking-widest border-b border-stone-800">
          <tr>
            <th className="py-2.5 px-4 whitespace-nowrap">Account ID</th>
            <th className="py-2.5 px-4 whitespace-nowrap">Account Name</th>
            <th className="py-2.5 px-4 whitespace-nowrap">Parent Account ID</th>
            <th className="py-2.5 px-4 whitespace-nowrap">Account Type</th>
            <th className="py-2.5 px-4 whitespace-nowrap">Contact Person</th>
            <th className="py-2.5 px-4 whitespace-nowrap">Phone Number</th>
            <th className="py-2.5 px-4 whitespace-nowrap">Email Address</th>
            <th className="py-2.5 px-4 whitespace-nowrap">Delivery Address</th>
            <th className="py-2.5 px-4 whitespace-nowrap">Logo Embroidery</th>
            <th className="py-2.5 px-4 whitespace-nowrap">Logo Placement</th>
            <th className="py-2.5 px-4 whitespace-nowrap">Thread Colors</th>
            <th className="py-2.5 px-4 whitespace-nowrap">Logo File Location</th>
            <th className="py-2.5 px-4 whitespace-nowrap">Pricing Tier</th>
            <th className="py-2.5 px-4 whitespace-nowrap text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-800/50">
          {filteredAccounts.map((c, i) => (
            <tr 
              key={c.accountId || i} 
              onClick={() => onSelectAccount(c)} 
              className="hover:bg-stone-800/50 transition group cursor-pointer"
            >
              <td className="py-2.5 px-4 font-black text-stone-200 uppercase whitespace-nowrap">{c.accountId}</td>
              <td className="py-2.5 px-4 font-bold text-stone-300 whitespace-nowrap">{c.accountName}</td>
              <td className="py-2.5 px-4 text-xs font-bold text-stone-400 whitespace-nowrap">{c.parentAccountId || 'NULL'}</td>
              <td className="py-2.5 px-4 text-xs font-bold text-stone-300 whitespace-nowrap">{c.accountType}</td>
              <td className="py-2.5 px-4 text-xs text-stone-400 whitespace-nowrap">{c.contactNombre} {c.contactApellido}</td>
              <td className="py-2.5 px-4 text-xs font-mono text-stone-300 whitespace-nowrap">{c.phone || '-'}</td>
              <td className="py-2.5 px-4 text-xs text-stone-400 whitespace-nowrap">{c.email || '-'}</td>
              <td className="py-2.5 px-4 text-xs text-stone-400 whitespace-nowrap">{c.deliveryAddress || '-'}</td>
              <td className="py-2.5 px-4 text-xs font-bold text-stone-300 whitespace-nowrap">{c.logoEmbroidery ? 'Sí' : 'No'}</td>
              <td className="py-2.5 px-4 text-xs text-stone-400 max-w-[200px] truncate">{c.logoPlacements?.join(', ') || '-'}</td>
              <td className="py-2.5 px-4 text-xs text-stone-400 whitespace-nowrap">{c.threadColors || '-'}</td>
              <td className="py-2.5 px-4 text-xs font-mono text-stone-500 max-w-[150px] truncate" title={c.logoFileLocation}>{c.logoFileLocation || '-'}</td>
              <td className="py-2.5 px-4 text-xs font-black text-amber-500 uppercase whitespace-nowrap">{normalizePricingTier(c.pricingTier)}</td>
              <td className="py-2.5 px-4 whitespace-nowrap text-right">
                <div className="flex justify-end gap-2 items-center">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setViewingAccountHistoryId(c.accountId); 
                    }} 
                    className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition shadow-sm cursor-pointer"
                  >
                    Historial
                  </button>
                  {isSystemAccount(c.accountId) && (
                    <span className="inline-flex items-center gap-1 bg-stone-800/80 text-stone-400 border border-stone-700/50 px-2.5 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-widest cursor-not-allowed">
                      <Lock size={10} className="text-amber-500/80" /> Sistema
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
