const fs = require('fs');
let content = fs.readFileSync('src/services/trackerService.ts', 'utf8');

const regex = /await axios\.put\(\`https:\/\/api\.myanimelist\.net\/v2\/\$\{type\.toLowerCase\(\)\}\/\$\{malId\}\/my_list_status\`,\s*const params = new URLSearchParams\(\);/;

content = content.replace(regex, "const params = new URLSearchParams();");

fs.writeFileSync('src/services/trackerService.ts', content);
