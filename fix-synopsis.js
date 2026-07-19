const fs = require('fs');
let content = fs.readFileSync('src/services/jikanService.ts', 'utf8');
content = content.replace(/synopsis: m\.description\?\.replace\(\/<\[\^>\]\*\>?\/gm, ''\) \|\| '',/g, "synopsis: m.description?.replace(/<br\\s*\\/?>/gi, '\\n').replace(/<[^>]*>?/gm, '') || '',");
fs.writeFileSync('src/services/jikanService.ts', content);
console.log("Done");
