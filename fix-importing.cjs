const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// wait, did I delete isImporting earlier?
const stateAdditions = `
  const [showAnilistWizard, setShowAnilistWizard] = useState(false);
  const [showMalWizard, setShowMalWizard] = useState(false);
  const { list } = useAnimeList();
  
  // Backup & Restore
  const [backupStatus, setBackupStatus] = useState<{ type: 'success'|'error'|'info'; message: string } | null>(null);

  const handleExportJSON = () => {
    const json = importExportService.exportToJSON(list);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`avalon-backup-\${new Date().toISOString().split('T')[0]}.json\`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupStatus({ type: 'success', message: 'Backup JSON exportado com sucesso!' });
    setTimeout(() => setBackupStatus(null), 3000);
  };

  const handleExportCSV = () => {
    const csv = importExportService.exportToCSV(list);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`avalon-backup-\${new Date().toISOString().split('T')[0]}.csv\`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupStatus({ type: 'success', message: 'Backup CSV exportado com sucesso!' });
    setTimeout(() => setBackupStatus(null), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      
      let result;
      if (file.name.endsWith('.csv')) {
        result = importExportService.importFromCSV(content);
      } else {
        result = importExportService.importFromJSON(content);
      }

      if (result.success && result.data.length > 0) {
        setBackupStatus({ type: 'success', message: \`\${result.data.length} itens importados/validados com sucesso! \` });
      } else {
        setBackupStatus({ 
          type: 'error', 
          message: \`Falha na validação: \${result.errors.length} erro(s). \${result.errors[0]?.message} (Linha \${result.errors[0]?.row})\` 
        });
      }
      setTimeout(() => setBackupStatus(null), 8000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success?: string; error?: string }>({});
`;

content = content.replace(
  "  const [testingStatus, setTestingStatus]",
  stateAdditions + "\n  const [testingStatus, setTestingStatus]"
);

fs.writeFileSync('src/pages/Settings.tsx', content);
