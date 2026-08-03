const fs = require('fs');
let content = fs.readFileSync('src/services/importExportService.ts', 'utf8');

// Replace Zod error property access
content = content.replace(/parsed\.error\.errors\.forEach/g, "parsed.error.issues.forEach");
content = content.replace(/parsedRow\.error\.errors\.forEach/g, "parsedRow.error.issues.forEach");

fs.writeFileSync('src/services/importExportService.ts', content);
