const fs = require('fs');

let code = fs.readFileSync('src/components/views/ProductionView.tsx', 'utf8');

const malformed = `                      </div>
                    );
                })}
              </div>
                  </div>
                </div>
              )}
              {order.notes && <div className="text-sm font-bold text-amber-500 bg-amber-950/20 p-4 rounded-xl italic">"{order.notes}"</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};`;

// Wait, I messed up the `groupedItems.map` earlier by making it `{groupedItems.map(() => { ... return ... })}`
// The bottom block has `order.items.map((item: any, itIdx: number) => (` 
// which means it is an implicit return `(`, BUT inside it has `);` 
// Look at: 
// {order.items.map((item: any, itIdx: number) => (
//   <div key={itIdx}>...</div>
// );
// })}
// That's exactly it! `);` inside `(` implicit return block!

const correct = `                      </div>
                    ))}
                  </div>
                </div>
              )}
              {order.notes && <div className="text-sm font-bold text-amber-500 bg-amber-950/20 p-4 rounded-xl italic">"{order.notes}"</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};`;

code = code.replace(malformed, correct);
fs.writeFileSync('src/components/views/ProductionView.tsx', code);
