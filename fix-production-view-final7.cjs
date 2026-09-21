const fs = require('fs');

let code = fs.readFileSync('src/components/views/ProductionView.tsx', 'utf8');

// There is still a syntax error at line 253.
// Let's replace the block containing `)}` -> `{item.embroideries ...}`
const regex = /\}\)\n        \{item.embroideries/g;
code = code.replace(regex, ')}\n                      {item.embroideries');

fs.writeFileSync('src/components/views/ProductionView.tsx', code);
