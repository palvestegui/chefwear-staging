const fs = require('fs');
let code = fs.readFileSync('src/components/views/ProductionView.tsx', 'utf8');

console.log("Evaluating bracket matching...");
let openCount = 0;
let lastErrorLine = -1;
let lines = code.split('\\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let c of line) {
     if (c === '{') openCount++;
     if (c === '}') openCount--;
     if (c === '(') openCount++;
     if (c === ')') openCount--;
  }
}
console.log("Final balance: ", openCount);
