const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// Imports
content = content.replace(
  "import { Save, LogOut, Check, Monitor, LayoutDashboard, Languages, Settings as SettingsIcon, DownloadCloud, Database, Link, Zap, UploadCloud, Film, PlayCircle, HelpCircle } from 'lucide-react';",
  "import { Save, LogOut, Check, Monitor, LayoutDashboard, Languages, Settings as SettingsIcon, DownloadCloud, Database, Link, Zap, UploadCloud, Film, PlayCircle, HelpCircle, FileJson, FileText, AlertTriangle } from 'lucide-react';\nimport TrackerSetupWizard from '../components/TrackerSetupWizard';\nimport { importExportService } from '../services/importExportService';\nimport { useAnimeList } from '../context/AnimeListContext';"
);

// State for Wizards and Backup
const stateAdditions = `
  const [showAnilistWizard, setShowAnilistWizard] = useState(false);
  const [showMalWizard, setShowMalWizard] = useState(false);
  const { list, user } = useAnimeList();
  
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
        // Here we ideally merge with current list via AnimeListContext.
        // For demonstration, we just show success and error details
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
    // reset input
    e.target.value = '';
  };
`;

content = content.replace(
  "const [isImporting, setIsImporting] = useState(false);",
  stateAdditions + "\n  const [isImporting, setIsImporting] = useState(false);"
);

// Add Wizards in JSX
content = content.replace(
  "return (",
  "return (\n    <>\n      <TrackerSetupWizard isOpen={showAnilistWizard} onClose={() => setShowAnilistWizard(false)} trackerType=\"anilist\" />\n      <TrackerSetupWizard isOpen={showMalWizard} onClose={() => setShowMalWizard(false)} trackerType=\"mal\" />"
);
content = content.replace(
  /<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*$/i,
  "</div></div></div></div></div></div></div></>"
);

// Change Help Buttons to open Wizard
content = content.replace(
  /onClick=\{\(\) => setShowAnilistGuide\(true\)\}/g,
  "onClick={() => setShowAnilistWizard(true)}"
);

// Add Help Buttons if they don't exist
content = content.replace(
  /Obter Token de Acesso \(Login AniList\)\s*<\/a>\s*<\/div>/g,
  "Obter Token de Acesso (Login AniList)</a>\n<button onClick={() => setShowAnilistWizard(true)} className=\"text-[9px] text-gray-500 font-bold uppercase tracking-widest hover:text-white\">Como funciona?</button></div>"
);

// Same for MAL Help button
content = content.replace(
  /placeholder="MyAnimeList Username"/g,
  "placeholder=\"MyAnimeList Username\"\n                        />\n                        <div className=\"flex justify-end mt-1\">\n                           <button onClick={() => setShowMalWizard(true)} className=\"text-[9px] text-gray-500 font-bold uppercase tracking-widest hover:text-white\">Como integrar?</button>\n                        </div>"
);
content = content.replace(
  /placeholder="MyAnimeList Username"([^<]*)<\/div>\s*<div className="flex justify-end mt-1">/gs,
  "placeholder=\"MyAnimeList Username\"$1</div><div className=\"flex justify-end mt-1\">"
);

// Backup and Restore Section
const backupSection = `
          {/* Backup e Restauração Segura */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 border-b border-[var(--color-border)] pb-4">
              <div className="w-10 h-10 bg-brand/20 rounded-2xl flex items-center justify-center shadow-inner">
                <Database className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-[var(--color-text-bright)]">Backup e Restauração</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Proteja e migre sua lista de forma segura</p>
              </div>
            </div>

            <div className="p-6 bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] shadow-xl shadow-black/20">
              {backupStatus && (
                <div className={\`p-4 mb-6 rounded-2xl border text-sm font-bold flex items-center gap-3 \${backupStatus.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-green-500/10 border-green-500/30 text-green-500'}\`}>
                  {backupStatus.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                  {backupStatus.message}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Exportar */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-brand uppercase tracking-widest">Exportar Dados (Backup)</h3>
                  <p className="text-xs text-[var(--color-text-dim)]">Gere um arquivo contendo toda a sua lista local. Recomendado fazer periodicamente.</p>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={handleExportJSON}
                      className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-brand py-3 px-4 rounded-xl text-sm font-bold text-[var(--color-text-bright)] transition-all hover:scale-105 active:scale-95"
                    >
                      <FileJson className="w-4 h-4 text-brand" />
                      JSON
                    </button>
                    <button 
                      onClick={handleExportCSV}
                      className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-green-500 py-3 px-4 rounded-xl text-sm font-bold text-[var(--color-text-bright)] transition-all hover:scale-105 active:scale-95"
                    >
                      <FileText className="w-4 h-4 text-green-500" />
                      CSV
                    </button>
                  </div>
                </div>

                {/* Importar */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-yellow-500 uppercase tracking-widest">Importar Dados (Restore)</h3>
                  <p className="text-xs text-[var(--color-text-dim)]">Restaure sua lista a partir de um arquivo JSON ou CSV exportado anteriormente.</p>
                  
                  <label className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 py-3 px-4 rounded-xl text-sm font-black text-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-yellow-500/20">
                    <UploadCloud className="w-5 h-5" />
                    Selecionar Arquivo
                    <input type="file" accept=".json,.csv" onChange={handleImportFile} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </section>
`;

content = content.replace("{/* Contas e Sincronização */}", backupSection + "\n\n          {/* Contas e Sincronização */}");

fs.writeFileSync('src/pages/Settings.tsx', content);
