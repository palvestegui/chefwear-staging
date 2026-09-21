const fs = require('fs');

let code = fs.readFileSync('src/components/views/ProductionView.tsx', 'utf8');

// A bracket mismatch isn't 0 overall, but specifically within JSX.
// The error is: src/components/views/ProductionView.tsx(253,18): error TS1005: ';' expected.
// Let's look around line 253.
