const fs = require('fs');
let content = fs.readFileSync('src/services/trackerService.ts', 'utf8');

const regex = /const isAutoSync = localStorage\.getItem\('avalon_auto_sync_trackers'\);\s*if \(isAutoSync === 'false'\) return \[\];/;

content = content.replace(regex, "");

fs.writeFileSync('src/services/trackerService.ts', content);
