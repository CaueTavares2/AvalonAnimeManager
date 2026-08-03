const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// I will just use prettier or tsc to see what the actual error is
// wait, the error is TS1128: Declaration or statement expected.
// which means there's an extra closing brace or bracket somewhere in the file
// I will just print the file and pipe it to `tsc --noEmit` and grep for the error
