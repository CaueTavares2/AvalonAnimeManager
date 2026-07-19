const fs = require('fs');
let content = fs.readFileSync('src/services/jikanService.ts', 'utf8');

// The sed command changed `volumes` to `volumes\n          popularity` globally.
// This affected the GraphQL query: `volumes\n          popularity`
// But it also affected: `volumes: m.volumes\n          popularity`
// Let's just fix it by replacing the bad code.

content = content.replace(/volumes: m\.volumes\n\s*popularity,/g, "volumes: m.volumes,\n          members: m.popularity || 0,");
content = content.replace(/members: 0,/g, ""); // clean up the duplicate members: 0

fs.writeFileSync('src/services/jikanService.ts', content);
console.log("Done");
