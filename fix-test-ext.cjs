const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

content = content.replace(
  "    for (const ext of all) {",
  `
  const [testingStatus, setTestingStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});

  const testAllExtensions = async () => {
    const all = [...AVAILABLE_EXTENSIONS, ...manifests.map(m => createStremioExtension(m))];
    for (const ext of all) {`
);

fs.writeFileSync('src/pages/Settings.tsx', content);
