import React from 'react';

export const StatusBadge = ({ status }: {status: string}) => {
  const colors: any = {
    'Estimado': 'bg-[#292524] text-[#d6d3d1] border-[#44403c]',
    'Cotización': 'bg-[#292524] text-[#d6d3d1] border-[#44403c]',
    'Expirado': 'bg-amber-950/40 text-amber-500 border-amber-900/60',
    'Cancelado': 'bg-red-950/60 text-red-500 border-red-900/80',
    'Inventario Pendiente': 'bg-[#422006]/50 text-[#f59e0b] border-[#78350f]',
    'Medidas Pendientes': 'bg-[#422006]/50 text-[#f59e0b] border-[#78350f]',
    'Nombres Pendientes': 'bg-[#422006]/50 text-[#f59e0b] border-[#78350f]',
    'Logo Pendiente': 'bg-[#422006]/50 text-[#f59e0b] border-[#78350f]',
    'En Taller de Bordado': 'bg-indigo-950/50 text-indigo-400 border-indigo-900/60',
    'Orden Activa': 'bg-amber-900/40 text-amber-400 border-amber-800/60',
    'Activo': 'bg-amber-900/40 text-amber-400 border-amber-800/60',
    'Material Listo': 'bg-[#451a03]/50 text-[#f59e0b] border-[#78350f]',
    'En Producción': 'bg-[#3b0764]/50 text-[#c084fc] border-[#581c87]',
    'En Confección': 'bg-[#3b0764]/50 text-[#c084fc] border-[#581c87]',
    'Producido': 'bg-[#1e1b4b]/50 text-[#818cf8] border-[#312e81]',
    'En Entrega': 'bg-[#431407]/50 text-[#f97316] border-[#7c2d12]',
    'Entregado': 'bg-[#064e3b]/50 text-[#22c55e] border-[#065f46]'
  };
  const label = status === 'Estimado' ? 'Cotización' : (status === 'Activo' ? 'Orden Activa' : status);
  return <span className={`status-badge px-2 py-1 flex items-center rounded-lg text-[10px] font-black uppercase tracking-widest border ${colors[status] || 'bg-[#292524] text-[#d6d3d1]'}`} style={{ borderColor: 'inherit' }}>{label}</span>;
};
