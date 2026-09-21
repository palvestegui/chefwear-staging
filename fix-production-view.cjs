const fs = require('fs');

let code = fs.readFileSync('src/components/views/ProductionView.tsx', 'utf8');

// There's a trailing duplicate syntax:
// );
//                })}
//              </div>                  </div>
//                </div>

// Let's rewrite the entire file cleanly based on git restore or a robust regex.
// Actually, I can just use a precise replace.
const malformedChunk = `                      </div>
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

const correctChunk = `                      </div>
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

code = code.replace(malformedChunk, correctChunk);

fs.writeFileSync('src/components/views/ProductionView.tsx', code);
