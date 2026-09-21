import React from 'react';
import { User, CheckSquare } from 'lucide-react';

interface InstitutionalPackingSlipProps {
  order: any;
  formatDate: (ts: string | number) => string;
}

export const InstitutionalPackingSlip: React.FC<InstitutionalPackingSlipProps> = ({
  order,
  formatDate
}) => {
  // Aggregate items by employee/recipient
  const employees = (() => {
    if (order.institutionalRoster && Array.isArray(order.institutionalRoster) && order.institutionalRoster.length > 0) {
      return order.institutionalRoster.map((emp: any) => ({
        fullName: emp.fullName || 'Empleado',
        phone: emp.phone || '',
        role: emp.role || 'Personal',
        notes: emp.notes || '',
        items: (emp.garments || []).map((g: any) => ({
          name: g.garmentName,
          fabric: g.fabric,
          fabricColor: g.fabricColor,
          size: g.size,
          measurements: g.measurements,
          pocketName: g.pocketName,
          embroideries: g.embroideries || (g.pocketName ? [`Nombre en Bolsillo: ${g.pocketName}`] : [])
        }))
      }));
    }

    const employeeMap = new Map<string, {
      fullName: string;
      phone: string;
      role: string;
      notes?: string;
      items: any[];
    }>();

    (order.items || []).forEach((it: any) => {
      const key = it.recipientName || 'Sin Asignar';
      if (!employeeMap.has(key)) {
        employeeMap.set(key, {
          fullName: it.recipientName || 'General / Stock',
          phone: it.recipientPhone || '',
          role: it.recipientRole || 'Personal',
          notes: it.recipientNotes || it.notes || '',
          items: []
        });
      }
      employeeMap.get(key)!.items.push(it);
    });

    return Array.from(employeeMap.values());
  })();

  return (
    <div className="space-y-6 text-stone-900 font-sans">
      {/* Header Info */}
      <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">
              Planilla de Distribución & Control de Entrega
            </span>
            <h3 className="text-xl font-black uppercase tracking-tight text-stone-900 mt-0.5">
              {order.customer}
            </h3>
            {order.companyName && order.companyName !== order.customer && (
              <p className="text-xs font-bold text-stone-600 uppercase">{order.companyName}</p>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-amber-600 block">Orden #{order.id}</span>
            <span className="text-[10px] text-stone-500">{formatDate(order.createdAt || Date.now())}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-stone-200 text-xs">
          <div>
            <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">Total Empleados</span>
            <span className="font-bold text-stone-900">{employees.length} Personas</span>
          </div>
          <div>
            <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">Total Prendas</span>
            <span className="font-bold text-stone-900">{order.items?.length || 0} Unidades</span>
          </div>
          <div>
            <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">Estado de Orden</span>
            <span className="font-bold text-amber-600">{order.status}</span>
          </div>
        </div>
      </div>

      {/* Distribution Table */}
      <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-stone-100 text-[9px] font-black uppercase tracking-wider text-stone-600 border-b border-stone-200">
            <tr>
              <th className="py-3 px-3 w-8 text-center">#</th>
              <th className="py-3 px-3 min-w-[150px]">Empleado / Cargo</th>
              <th className="py-3 px-3 min-w-[200px]">Prendas & Tallas</th>
              <th className="py-3 px-3 min-w-[130px]">Bordado / Bolsillo</th>
              <th className="py-3 px-3 w-36 text-center border-l border-stone-200">Firma de Recepción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {employees.map((emp, idx) => (
              <tr key={idx} className="hover:bg-stone-50/80 transition">
                <td className="py-3 px-3 text-center font-mono font-bold text-stone-400 text-[11px]">
                  {idx + 1}
                </td>
                <td className="py-3 px-3">
                  <div className="font-black text-stone-900">{emp.fullName}</div>
                  <div className="text-[10px] text-stone-500 font-medium">
                    {emp.role} {emp.phone ? `• Tel: ${emp.phone}` : ''}
                  </div>
                  {emp.notes && (
                    <div className="text-[9px] font-bold text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 mt-1 border border-amber-200/60 inline-block">
                      Obs: {emp.notes}
                    </div>
                  )}
                </td>
                <td className="py-3 px-3">
                  <div className="space-y-1">
                    {emp.items.map((it, iIdx) => (
                      <div key={iIdx} className="flex items-center gap-1.5 text-[11px]">
                        <span className="font-bold text-stone-800">{it.name}</span>
                        <span className="bg-stone-100 border border-stone-200 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded text-stone-700">
                          {it.size || 'M'}
                        </span>
                        {it.fabricColor && (
                          <span className="text-[10px] text-stone-500">({it.fabricColor})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="space-y-0.5">
                    {emp.items
                      .map((it: any) => it.pocketName || (it.embroideries?.[0] ? it.embroideries[0].replace('Nombre en Bolsillo: ', '') : ''))
                      .filter(Boolean)
                      .map((pName: string, pIdx: number) => (
                        <div key={pIdx} className="font-bold text-amber-700 text-[11px]">
                          "{pName}"
                        </div>
                      ))}
                    {!emp.items.some((it: any) => it.pocketName || it.embroideries?.length > 0) && (
                      <span className="text-[10px] text-stone-400 italic">Sin bordado</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 border-l border-stone-200 text-center">
                  <div className="h-9 border-b border-dashed border-stone-300 w-full mb-1"></div>
                  <span className="text-[8px] text-stone-400 uppercase tracking-widest font-bold">Recibido Conforme</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-[9px] text-stone-400 text-center italic pt-2">
        Documento oficial de control y entrega de indumentaria corporativa • Azafrán Chefwear
      </div>
    </div>
  );
};
