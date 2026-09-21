const fs = require('fs');
let code = fs.readFileSync('src/components/views/ProductionView.tsx', 'utf8');

const regex = /\{order\.items\.map\(\(item: any, itIdx: number\) => \([\s\S]*?\}\)/;
const replacement = `{order.items.map((item: any, itIdx: number) => (
                      <div key={itIdx} className="bg-stone-900/80 border border-stone-800/80 p-2.5 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-stone-200 truncate">{item.recipientName || \`Prenda #\${itIdx + 1}\`}</span>
                          <span className="text-[10px] font-mono font-bold text-amber-400 bg-stone-950 px-1.5 py-0.5 rounded">{item.size || 'STD'}</span>
                        </div>
                        <p className="text-[10px] text-stone-400 truncate">{item.name} • {item.fabric || 'Drill'}</p>
                        {item.recipientNotes && (
                          <p className="text-[9px] text-amber-300/80 italic truncate">Obs: {item.recipientNotes}</p>
                        )}
                      </div>
                    ))}`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/views/ProductionView.tsx', code);
