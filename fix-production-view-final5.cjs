const fs = require('fs');
let code = fs.readFileSync('src/components/views/ProductionView.tsx', 'utf8');

const endChunk = `                      </div>
                    ))}
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

// Wait, let's look at the full tail to figure out the nesting.
