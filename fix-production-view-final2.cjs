const fs = require('fs');

let code = fs.readFileSync('src/components/views/ProductionView.tsx', 'utf8');

// The JSX returned at the outer block: 
// return ( 
//   <div key={order.id} ... >
//     ...
//     <div className="grid ...">
//       {groupedItems.map(() => { return (<div ...> ... </div>); })}
//     </div>
//     {/* Detailed Roster... */}

// Wait! At line 285 error TS1381 Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
console.log(code.substring(code.length - 800));

