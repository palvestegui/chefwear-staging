const fs = require('fs');

// 1. pulseService.ts
let pulse = fs.readFileSync('src/server/pulseService.ts', 'utf8');
pulse = pulse.replace(/import \{ Firestore, /g, "import { ");
pulse = pulse.replace(/import \{ Firestore \} from 'firebase\/firestore';\n/g, "");
pulse = "import { db } from '../firebase';\n" + pulse;
pulse = pulse.replace(/export async function ([a-zA-Z0-9_]+)\(db: Firestore, /g, 'export async function $1(');
pulse = pulse.replace(/export async function ([a-zA-Z0-9_]+)\(db: Firestore\)/g, 'export async function $1()');
fs.writeFileSync('src/server/pulseService.ts', pulse);

// 2. mcp.ts
let mcp = fs.readFileSync('src/server/mcp.ts', 'utf8');
mcp = mcp.replace(/import \{ getFirestore \} from 'firebase\/firestore';\n/g, '');
mcp = mcp.replace(/import \{ app as firebaseApp \} from '\.\.\/firebase';\n/g, '');
mcp = mcp.replace(/const db = getFirestore\(firebaseApp, 'chefwear-db'\);\n?/g, '');
const funcs = ['getSummaryData', 'getReportsData', 'getSellersData', 'getBottlenecksData', 'getOrdersData', 'getQuotesData', 'getDirectoryData'];
for (const f of funcs) {
    mcp = mcp.replace(new RegExp(`await ${f}\\(db\\)`, 'g'), `await ${f}()`);
}
mcp = mcp.replace(/await handleActionCreateQuote\(db, /g, 'await handleActionCreateQuote(');
mcp = mcp.replace(/await handleActionRevertOrder\(db, /g, 'await handleActionRevertOrder(');
mcp = mcp.replace(/await handleActionDeleteQuote\(db, /g, 'await handleActionDeleteQuote(');
mcp = mcp.replace(/await handleActionMergeContacts\(db, /g, 'await handleActionMergeContacts(');
fs.writeFileSync('src/server/mcp.ts', mcp);

// 3. server.ts
let srv = fs.readFileSync('server.ts', 'utf8');
srv = srv.replace(/import \{ app as firebaseApp \} from '\.\/src\/firebase';\n/g, '');
srv = srv.replace(/import \{ getFirestore, DocumentData \} from 'firebase\/firestore';\n/g, '');
srv = srv.replace(/const db = getFirestore\(firebaseApp, 'chefwear-db'\);\n?/g, '');
for (const f of funcs) {
    srv = srv.replace(new RegExp(`await ${f}\\(db\\)`, 'g'), `await ${f}()`);
}
srv = srv.replace(/await handleActionCreateQuote\(db, /g, 'await handleActionCreateQuote(');
srv = srv.replace(/await handleActionRevertOrder\(db, /g, 'await handleActionRevertOrder(');
srv = srv.replace(/await handleActionDeleteQuote\(db, /g, 'await handleActionDeleteQuote(');
srv = srv.replace(/await handleActionMergeContacts\(db, /g, 'await handleActionMergeContacts(');
fs.writeFileSync('server.ts', srv);

console.log("Done refactoring DB imports.");
