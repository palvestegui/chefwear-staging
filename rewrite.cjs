const fs = require('fs');

let content = fs.readFileSync('src/server/pulseService.ts', 'utf8');

// Replace imports
content = content.replace(
  "import { Firestore } from 'firebase-admin/firestore';",
  "import { Firestore, collection, getDocs, doc, updateDoc, deleteDoc, query, where, writeBatch, orderBy, limit, setDoc } from 'firebase/firestore';"
);

// Replace queries
content = content.replace(/await db\.collection\('([^']+)'\)\.get\(\)/g, "await getDocs(collection(db, '$1'))");
content = content.replace(/await db\.collection\('([^']+)'\)\.where\(([^,]+),\s*([^,]+),\s*([^)]+)\)\.get\(\)/g, "await getDocs(query(collection(db, '$1'), where($2, $3, $4)))");
content = content.replace(/await db\.collection\('([^']+)'\)\.doc\(([^)]+)\)\.update\(/g, "await updateDoc(doc(db, '$1', $2), ");
content = content.replace(/await db\.collection\('([^']+)'\)\.doc\(([^)]+)\)\.delete\(\)/g, "await deleteDoc(doc(db, '$1', $2))");
content = content.replace(/const batch = db\.batch\(\);/g, "const batch = writeBatch(db);");
content = content.replace(/batch\.delete\(db\.collection\('([^']+)'\)\.doc\(([^)]+)\)\);/g, "batch.delete(doc(db, '$1', $2));");
content = content.replace(/batch\.update\(doc\.ref, /g, "batch.update(doc.ref, "); // Wait, doc.ref is from web SDK getDocs, so it's a DocumentReference, this works
content = content.replace(/await db\.collection\('([^']+)'\)\.orderBy\(([^,]+),\s*([^)]+)\)\.limit\(([^)]+)\)\.get\(\)/g, "await getDocs(query(collection(db, '$1'), orderBy($2, $3), limit($4)))");

// newQuoteRef logic
content = content.replace(/const newQuoteRef = db\.collection\('([^']+)'\)\.doc\(\);/g, "const newQuoteRef = doc(collection(db, '$1'));");
content = content.replace(/await newQuoteRef\.set\(([^)]+)\);/g, "await setDoc(newQuoteRef, $1);");

fs.writeFileSync('src/server/pulseService.ts', content);
