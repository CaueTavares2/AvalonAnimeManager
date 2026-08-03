const fs = require('fs');
const ts = require('typescript');

const content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
const sourceFile = ts.createSourceFile(
  'Settings.tsx',
  content,
  ts.ScriptTarget.Latest,
  true
);

console.log('Errors:', sourceFile.parseDiagnostics.map(d => ({
  message: d.messageText,
  start: d.start,
  length: d.length
})));
