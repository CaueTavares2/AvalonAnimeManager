const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

content = content.replace(
  "const initialAutoSyncTrackers = localStorage.getItem('avalon_auto_sync_trackers') === 'true';",
  "const initialAutoSyncTrackers = localStorage.getItem('avalon_auto_sync_trackers') !== 'false';"
);

fs.writeFileSync('src/pages/Settings.tsx', content);
