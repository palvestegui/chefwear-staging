const fs = require('fs');
let code = fs.readFileSync('src/components/views/ProductionView.tsx', 'utf8');

const malformed = `                    </div>
                  );
                })}
              </div>`;

const correct = `                    </div>
                  </div>
                );
              })}
              </div>`;

code = code.replace(malformed, correct);
fs.writeFileSync('src/components/views/ProductionView.tsx', code);
