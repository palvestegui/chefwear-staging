const fs = require('fs');
let code = fs.readFileSync('src/components/views/ProductionView.tsx', 'utf8');

const regex = /\}\)\}\n              <\/div>/;
const match = code.match(regex);
console.log(match);
