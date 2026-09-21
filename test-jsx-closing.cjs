const fs = require('fs');

let code = fs.readFileSync('src/components/views/ProductionView.tsx', 'utf8');

const regex = /\{\/\* Detailed Roster Drawer if Expanded \*\/\}/g;
const index = code.indexOf('{/* Detailed Roster Drawer if Expanded */}');
console.log(code.substring(index - 100, index + 100));

