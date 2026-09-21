const fs = require('fs');

let code = fs.readFileSync('src/components/views/ProductionView.tsx', 'utf8');

const malformed = `                      </div>
                    ))}}
              </div>
                  </div>
                </div>
              )}
              {order.notes && <div className="text-sm font-bold text-amber-500 bg-amber-950/20 p-4 rounded-xl italic">"{order.notes}"</div>}
            </div>`;

const correct = `                      </div>
                    ))}
                  </div>
                </div>
              )}
              {order.notes && <div className="text-sm font-bold text-amber-500 bg-amber-950/20 p-4 rounded-xl italic">"{order.notes}"</div>}
            </div>`;

code = code.replace(malformed, correct);
fs.writeFileSync('src/components/views/ProductionView.tsx', code);
