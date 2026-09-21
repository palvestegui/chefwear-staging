const fs = require('fs');

let code = fs.readFileSync('src/components/views/ProductionView.tsx', 'utf8');

const targetRegex = /\{expandedMeasurements\[\`\$\{order\.id\}-\$\{idx\}\`\] && \([\s\S]*?\{\(!showFil && !showPan && hasDirectSpecs\) && \([\s\S]*?\}\)\n                            <\/div>\n                          \)\}/;

const startIdx = code.indexOf('{expandedMeasurements[`${order.id}-${idx}`] && (');
const endIdx = code.indexOf(')}', code.indexOf('</div>', code.indexOf('{(!showFil && !showPan && hasDirectSpecs) && ('))) + 2;

// To be safe, I'll extract it dynamically.
const searchStr = '{expandedMeasurements[`${order.id}-${idx}`] && (';
const i1 = code.indexOf(searchStr);

if (i1 > -1) {
    let openCount = 1;
    let i2 = i1 + searchStr.length;
    while(openCount > 0 && i2 < code.length) {
        if (code[i2] === '(') openCount++;
        if (code[i2] === ')') openCount--;
        i2++;
    }
    
    const block = code.substring(i1, i2);
    
    const newBlock = `{expandedMeasurements[\`\${order.id}-\${idx}\`] && (
                            <div className="bg-stone-900/95 border border-amber-500/30 p-3.5 rounded-2xl mt-2 font-mono w-full min-w-[320px] sm:min-w-[380px] shadow-lg space-y-3">
                              {showFil && (
                                <div>
                                  <span className="text-[10px] font-black text-amber-500 mb-1.5 block">👘 FILIPINA</span>
                                  <div className="grid grid-cols-4 gap-2">
                                    <div className="bg-stone-950/80 border border-stone-800/90 rounded-lg p-1.5 flex flex-col items-center justify-center text-center"><span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block truncate w-full">Hombros</span><span className="text-xs font-mono font-black text-amber-400 mt-0.5 whitespace-nowrap">{filMeasurements.hombros || filMeasurements.F_Hombros || '—'} cm</span></div>
                                    <div className="bg-stone-950/80 border border-stone-800/90 rounded-lg p-1.5 flex flex-col items-center justify-center text-center"><span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block truncate w-full">Cuello</span><span className="text-xs font-mono font-black text-amber-400 mt-0.5 whitespace-nowrap">{filMeasurements.cuello || filMeasurements.F_Cuello || '—'} cm</span></div>
                                    <div className="bg-stone-950/80 border border-stone-800/90 rounded-lg p-1.5 flex flex-col items-center justify-center text-center"><span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block truncate w-full">Pecho</span><span className="text-xs font-mono font-black text-amber-400 mt-0.5 whitespace-nowrap">{filMeasurements.anchoTorso || filMeasurements.F_Ancho_Torso || '—'} cm</span></div>
                                    <div className="bg-stone-950/80 border border-stone-800/90 rounded-lg p-1.5 flex flex-col items-center justify-center text-center"><span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block truncate w-full">Largo Torso</span><span className="text-xs font-mono font-black text-amber-400 mt-0.5 whitespace-nowrap">{filMeasurements.largoTorso || filMeasurements.F_Largo_Torso || '—'} cm</span></div>
                                    <div className="bg-stone-950/80 border border-stone-800/90 rounded-lg p-1.5 flex flex-col items-center justify-center text-center"><span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block truncate w-full">Cintura</span><span className="text-xs font-mono font-black text-amber-400 mt-0.5 whitespace-nowrap">{filMeasurements.cintura || filMeasurements.F_Cintura || '—'} cm</span></div>
                                    <div className="bg-stone-950/80 border border-stone-800/90 rounded-lg p-1.5 flex flex-col items-center justify-center text-center"><span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block truncate w-full">Cadera</span><span className="text-xs font-mono font-black text-amber-400 mt-0.5 whitespace-nowrap">{filMeasurements.cadera || filMeasurements.F_Cadera || '—'} cm</span></div>
                                    <div className="bg-stone-950/80 border border-stone-800/90 rounded-lg p-1.5 flex flex-col items-center justify-center text-center"><span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block truncate w-full">Largo Brazo</span><span className="text-xs font-mono font-black text-amber-400 mt-0.5 whitespace-nowrap">{filMeasurements.largoBrazo || filMeasurements.F_Largo_Brazo || '—'} cm</span></div>
                                    <div className="bg-stone-950/80 border border-stone-800/90 rounded-lg p-1.5 flex flex-col items-center justify-center text-center"><span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block truncate w-full">Ancho Brazo</span><span className="text-xs font-mono font-black text-amber-400 mt-0.5 whitespace-nowrap">{filMeasurements.anchoBrazo || filMeasurements.F_Ancho_Brazo || '—'} cm</span></div>
                                  </div>
                                </div>
                              )}
                              
                              {showPan && (
                                <div className={showFil ? "pt-2 border-t border-stone-800" : ""}>
                                  <span className="text-[10px] font-black text-amber-500 mb-1.5 block">👖 PANTALÓN</span>
                                  <div className="grid grid-cols-4 gap-2">
                                    <div className="bg-stone-950/80 border border-stone-800/90 rounded-lg p-1.5 flex flex-col items-center justify-center text-center"><span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block truncate w-full">Cintura</span><span className="text-xs font-mono font-black text-amber-400 mt-0.5 whitespace-nowrap">{panMeasurements.cintura || panMeasurements.P_Cintura || '—'} cm</span></div>
                                    <div className="bg-stone-950/80 border border-stone-800/90 rounded-lg p-1.5 flex flex-col items-center justify-center text-center"><span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block truncate w-full">Cadera</span><span className="text-xs font-mono font-black text-amber-400 mt-0.5 whitespace-nowrap">{panMeasurements.cadera || panMeasurements.P_Cadera || '—'} cm</span></div>
                                    <div className="bg-stone-950/80 border border-stone-800/90 rounded-lg p-1.5 flex flex-col items-center justify-center text-center"><span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block truncate w-full">Ancho Pierna</span><span className="text-xs font-mono font-black text-amber-400 mt-0.5 whitespace-nowrap">{panMeasurements.anchoPierna || panMeasurements.P_Ancho_Pierna || '—'} cm</span></div>
                                    <div className="bg-stone-950/80 border border-stone-800/90 rounded-lg p-1.5 flex flex-col items-center justify-center text-center"><span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block truncate w-full">Largo Pierna</span><span className="text-xs font-mono font-black text-amber-400 mt-0.5 whitespace-nowrap">{panMeasurements.largoPierna || panMeasurements.P_Largo_Pierna || '—'} cm</span></div>
                                  </div>
                                </div>
                              )}
                              
                              {(!showFil && !showPan && hasDirectSpecs) && (
                                <div>
                                  <span className="text-[10px] font-black text-amber-500 mb-1.5 block">MEDIDAS</span>
                                  <div className="grid grid-cols-4 gap-2">
                                    {Object.entries(item.measurements).filter(([_, v]) => v && String(v).trim() !== '' && String(v).trim() !== '0').map(([k, v]) => (
                                      <div key={k} className="bg-stone-950/80 border border-stone-800/90 rounded-lg p-1.5 flex flex-col items-center justify-center text-center"><span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block truncate w-full">{k}</span><span className="text-xs font-mono font-black text-amber-400 mt-0.5 whitespace-nowrap">{String(v)} cm</span></div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}`;

    code = code.replace(block, newBlock);
    fs.writeFileSync('src/components/views/ProductionView.tsx', code);
    console.log("Replacement successful.");
} else {
    console.log("Could not find the target block.");
}

