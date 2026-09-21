import React, { useState } from 'react';
import { X, UploadCloud, Database, Loader2, CheckCircle2 } from 'lucide-react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';

export interface MigrationModalProps {
  onClose: () => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({ onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState('');

  const handleExecuteMigration = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError('');
    
    try {
      const text = await file.text();
      const rawOrders = JSON.parse(text);
      if (!Array.isArray(rawOrders)) throw new Error("JSON debe contener un arreglo de órdenes.");

      const sortedOrders = rawOrders.sort((a, b) => {
        const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeA - timeB;
      });

      let activeOrderCount = 1;
      let quoteCount = 0;
      let contactCount = 5;
      let accountCount = 2;

      const contactNameMap = new Map<string, string>();
      const corporateAccountMap = new Map<string, string>();
      
      const newAccounts: any[] = [];
      const newContacts: any[] = [];
      const accountContactLinks: any[] = [];
      const processedOrders: any[] = [];

      let hugoAssigned = false;

      for (const order of sortedOrders) {
        order.legacyId = order.id;

        const normCustomer = (order.customer || '').toLowerCase().trim();
        const isHugo = normCustomer.includes('hugo') && normCustomer.includes('salazar');
        
        // Order IDs
        let newOrderId = '';
        if (order.status === 'Estimado' || order.status === 'Cotización') {
          quoteCount++;
          newOrderId = `#COT-${quoteCount.toString().padStart(5, '0')}`;
        } else {
          if (isHugo && !hugoAssigned) {
            newOrderId = '#ORD-00001';
            hugoAssigned = true;
          } else {
            activeOrderCount++;
            newOrderId = `#ORD-${activeOrderCount.toString().padStart(5, '0')}`;
          }
        }
        order.id = newOrderId;

        // Contact IDs
        let contactId = '';
        const isDaniela = normCustomer.includes('daniela cuellar');
        const isMatias = normCustomer.includes('matias') && normCustomer.includes('peñaranda');
        const contactNormName = (order.customer || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        if (isHugo) contactId = 'CON-0005';
        else if (isDaniela) contactId = 'CON-0004';
        else if (isMatias) contactId = 'CON-0001';
        else if (contactNameMap.has(contactNormName)) {
          contactId = contactNameMap.get(contactNormName)!;
        } else {
          contactCount++;
          contactId = `CON-${contactCount.toString().padStart(4, '0')}`;
          contactNameMap.set(contactNormName, contactId);
          newContacts.push({
            id: contactId,
            contactId,
            fullName: order.customer || 'Cliente sin nombre',
            phone: order.phone || '',
            measurements: order.measurements || {}
          });
        }
        order.contactId = contactId;

        // Account IDs
        let accountId = 'ACC-000';
        const rawCompany = (order.companyName || '').trim();
        const normCompany = rawCompany.toLowerCase();
        
        const clientType = (order.clientType || '').toLowerCase();
        const category = (order.category || '').toLowerCase();
        const isUDI = category === 'udi' || clientType.includes('udi') || normCompany.includes('udi');
        const isMilCaprichos = normCompany.includes('mil caprichos') || isDaniela;
        
        if (isUDI) {
          accountId = 'ACC-001';
        } else if (isMilCaprichos) {
          accountId = 'ACC-002';
        } else if (rawCompany && normCompany !== 'cliente particular' && normCompany !== 'empresa corporativa') {
          if (corporateAccountMap.has(normCompany)) {
            accountId = corporateAccountMap.get(normCompany)!;
          } else {
            accountCount++;
            accountId = `ACC-${accountCount.toString().padStart(3, '0')}`;
            corporateAccountMap.set(normCompany, accountId);
            newAccounts.push({
              id: accountId,
              accountId,
              accountName: rawCompany,
              accountType: 'Empresa / Corporate',
              pricingTier: 'Estándar B2B'
            });
          }
        }
        order.accountId = accountId;
        order.companyName = rawCompany || (accountId === 'ACC-000' ? 'Cliente Particular' : rawCompany);

        // Relational link
        const linkId = `link_${accountId}_${contactId}`;
        if (!accountContactLinks.find(l => l.id === linkId)) {
          accountContactLinks.push({
            id: linkId,
            accountId,
            contactId
          });
        }

        const contactIndex = newContacts.findIndex(c => c.id === contactId);
        if (contactIndex !== -1 && !newContacts[contactIndex].accountId) {
          newContacts[contactIndex].accountId = accountId;
        }

        processedOrders.push(order);
      }
      
      const operations: any[] = [];
      
      for (const order of processedOrders) {
        operations.push({ type: 'set', ref: doc(db, 'orders', order.id), data: order });
      }
      for (const contact of newContacts) {
        operations.push({ type: 'set', ref: doc(db, 'masterContacts', contact.id), data: contact });
      }
      for (const account of newAccounts) {
        operations.push({ type: 'set', ref: doc(db, 'clientAccounts', account.id), data: account });
      }
      for (const link of accountContactLinks) {
        const linkData = { accountId: link.accountId, contactId: link.contactId };
        operations.push({ type: 'set', ref: doc(db, 'account_contacts', link.id), data: linkData });
      }

      const CHUNK_SIZE = 20;
      let chunksCompleted = 0;
      const totalChunks = Math.ceil(operations.length / CHUNK_SIZE);

      for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
        const chunk = operations.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        for (const op of chunk) {
          batch.set(op.ref, op.data, { merge: true });
        }
        await batch.commit();
        chunksCompleted++;
        setProgress(Math.round((chunksCompleted / totalChunks) * 100));
      }

      setSummary({
        orderRange: processedOrders.length > 0 
          ? `#ORD-00002 to #ORD-${activeOrderCount.toString().padStart(5, '0')} (Quotes to #COT-${quoteCount.toString().padStart(5, '0')})`
          : 'None',
        contactRange: newContacts.length > 0
          ? `CON-0006 to CON-${contactCount.toString().padStart(4, '0')}`
          : 'None',
        accountRange: newAccounts.length > 0
          ? `ACC-003 to ACC-${accountCount.toString().padStart(3, '0')}`
          : 'None',
      });
      setIsProcessing(false);
    } catch (err: any) {
      setError(err.message || 'Error occurred during migration');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4">
      <div className="bg-stone-900 border border-stone-800 p-6 rounded-3xl w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3 text-amber-500">
            <Database size={24} />
            <h2 className="text-xl font-black uppercase tracking-tighter text-white">Migration Engine</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-stone-800 hover:bg-stone-700 rounded-full text-stone-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {!summary ? (
          <div className="space-y-6">
            <p className="text-sm text-stone-400 font-bold leading-relaxed">
              Cargue el archivo JSON con las órdenes a migrar. El motor secuencial normalizará y reconstruirá las referencias relacionales a cuentas y contactos de forma transaccional.
            </p>
            
            <div className="border-2 border-dashed border-stone-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-amber-500/50 transition-colors bg-stone-950/50">
              <input 
                type="file" 
                accept=".json"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="hidden" 
                id="file-upload" 
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <UploadCloud size={48} className="text-stone-600 mb-4" />
                <span className="text-sm font-bold text-stone-300">
                  {file ? file.name : 'Seleccionar archivo JSON...'}
                </span>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-900 rounded-xl text-red-400 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleExecuteMigration}
              disabled={!file || isProcessing}
              className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-all ${
                !file || isProcessing
                  ? 'bg-stone-800 text-stone-600 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-500 text-stone-950'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Procesando ({progress}%)
                </>
              ) : (
                'Ejecutar Migración'
              )}
            </button>
            
            {isProcessing && (
              <div className="w-full bg-stone-800 rounded-full h-2 mt-4 overflow-hidden">
                <div 
                  className="bg-amber-500 h-2 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
              <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Migración Exitosa</h3>
              <p className="text-stone-400 text-sm">Los datos han sido normalizados y subidos correctamente.</p>
            </div>
            
            <div className="bg-stone-950 rounded-2xl p-4 border border-stone-800 space-y-3">
              <h4 className="text-[10px] font-black uppercase text-stone-500 tracking-widest border-b border-stone-800 pb-2 mb-3">Resumen de IDs Asignados</h4>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-400">Rango de Órdenes:</span>
                <span className="text-emerald-400 font-mono font-bold">{summary.orderRange}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-400">Rango de Contactos:</span>
                <span className="text-emerald-400 font-mono font-bold">{summary.contactRange}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-400">Rango de Cuentas:</span>
                <span className="text-emerald-400 font-mono font-bold">{summary.accountRange}</span>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors mt-6"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
