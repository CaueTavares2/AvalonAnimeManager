import { Cog, Shield, Bell, Palette, Globe, Save, Check, DownloadCloud, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useTheme, ColorTheme } from '../context/ThemeContext';
import { importService } from '../services/importService';
import { useAnimeList } from '../hooks/useAnimeList';
import { useLanguage, Language } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { darkMode, setDarkMode, colorTheme, setColorTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { batchAddAnimes } = useAnimeList();
  
  const [activeTab, setActiveTab] = useState('general');
  
  // Local state for settings to be saved
  const [localSettings, setLocalSettings] = useState({
    darkMode,
    colorTheme,
    language,
    titleLanguage: 'Romaji',
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const changed = 
      localSettings.darkMode !== darkMode ||
      localSettings.colorTheme !== colorTheme ||
      localSettings.language !== language ||
      localSettings.titleLanguage !== 'Romaji'; // Simplified for now as it's not in context
    setHasChanges(changed);
  }, [localSettings, darkMode, colorTheme, language]);

  const handleSave = () => {
    setSaveStatus('saving');
    
    // Apply global context changes
    setDarkMode(localSettings.darkMode);
    setColorTheme(localSettings.colorTheme);
    setLanguage(localSettings.language);

    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600);
  };

  // Import State
  const [anilistUser, setAnilistUser] = useState('');
  const [malUser, setMalUser] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success?: string; error?: string }>({});

  const handleImport = async (type: 'anilist' | 'mal') => {
    const user = type === 'anilist' ? anilistUser : malUser;
    if (!user) return;

    setIsImporting(true);
    setImportStatus({});
    try {
      const data = type === 'anilist' 
        ? await importService.importFromAniList(user)
        : await importService.importFromMAL(user);
      
      batchAddAnimes(data);
      setImportStatus({ success: `${data.length} animes importados com sucesso!` });
    } catch (error) {
      console.error(error);
      setImportStatus({ error: `Erro ao importar. Verifique o nome de usuário.` });
    } finally {
      setIsImporting(false);
    }
  };

  const tabs = [
    { id: 'general', icon: Cog, label: 'Geral' },
    { id: 'appearance', icon: Palette, label: 'Aparência' },
    { id: 'migration', icon: DownloadCloud, label: 'Migração' },
    { id: 'language', icon: Globe, label: 'Idioma' },
  ];

  const themes: { id: ColorTheme; label: string; color: string }[] = [
    { id: 'avalon', label: 'Avalon Gold', color: 'bg-[#f59e0b]' },
    { id: 'crunchyroll', label: 'Crunchyroll', color: 'bg-[#f47521]' },
    { id: 'netflix', label: 'Netflix', color: 'bg-[#e50914]' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-[var(--color-border)] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">{t('settings.title')}</h1>
          <p className="text-gray-500 text-sm font-medium">{t('settings.subtitle')}</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={!hasChanges || saveStatus === 'saving'}
          className={cn(
            "w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95",
            hasChanges 
              ? "bg-brand text-white shadow-brand/20 hover:bg-brand-dark" 
              : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
          )}
        >
          {saveStatus === 'saving' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveStatus === 'saved' ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saveStatus === 'saved' ? 'Salvo!' : t('settings.save')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="flex flex-row md:flex-col overflow-x-auto pb-2 md:pb-0 gap-2 md:gap-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "whitespace-nowrap flex-shrink-0 flex items-center gap-2 md:gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === item.id 
                  ? "bg-brand text-white shadow-lg shadow-brand/20 scale-[1.02]" 
                  : "text-gray-400 hover:bg-[var(--color-card)] hover:text-brand border border-transparent hover:border-[var(--color-border)]"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-[var(--color-card)] p-6 md:p-8 rounded-2xl border border-[var(--color-border)] shadow-sm space-y-8">
            {activeTab === 'appearance' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-widest flex items-center gap-2">
                    <Palette className="w-4 h-4 text-brand" /> {t('settings.theme.dark_mode')}
                  </h3>
                  <div className="flex items-center justify-between bg-[var(--color-bg)] p-6 rounded-2xl border border-[var(--color-border)]">
                    <div>
                      <p className="text-sm font-bold text-[var(--color-text-bright)]">Modo Noturno</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Dark mode experience</p>
                    </div>
                    <button 
                      onClick={async () => {
                        if (localSettings.darkMode && useAuth().user) {
                          const { rankingService } = await import('../services/rankingService');
                          // @ts-ignore
                          await rankingService.grantAchievement(useAuth().user.uid, 'NIGHT_MODE_RELIGION');
                        }
                        setLocalSettings(s => ({ ...s, darkMode: !s.darkMode }));
                      }}
                      className={cn(
                        "w-14 h-7 rounded-full relative transition-all duration-300",
                        localSettings.darkMode ? "bg-brand shadow-inner shadow-black/20" : "bg-gray-200 dark:bg-gray-700"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-lg",
                        localSettings.darkMode ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>

                <div className="space-y-6 border-t border-[var(--color-border)] pt-8">
                  <h3 className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-widest flex items-center gap-2">
                    <Palette className="w-4 h-4 text-brand" /> {t('settings.theme.colors')}
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {themes.map((theme) => (
                      <button 
                        key={theme.id}
                        onClick={() => setLocalSettings(s => ({ ...s, colorTheme: theme.id }))}
                        className={cn(
                          "flex items-center justify-between p-5 rounded-2xl border-2 transition-all group",
                          localSettings.colorTheme === theme.id 
                            ? "bg-[var(--color-bg)] border-brand ring-4 ring-brand/5 shadow-inner" 
                            : "bg-transparent border-[var(--color-border)] hover:border-gray-300 hover:scale-[1.01]"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn("w-8 h-8 rounded-xl shadow-lg transform group-hover:rotate-12 transition-transform", theme.color)} />
                          <span className={cn("font-black text-sm uppercase tracking-widest", localSettings.colorTheme === theme.id ? "text-brand" : "text-gray-400")}>
                            {theme.label}
                          </span>
                        </div>
                        {localSettings.colorTheme === theme.id && (
                          <div className="bg-brand rounded-full p-1 shadow-lg shadow-brand/40">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeTab === 'language' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-widest flex items-center gap-2">
                    <Globe className="w-4 h-4 text-brand" /> {t('settings.language.title')}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('settings.language.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {(['pt', 'en'] as const).map((lang) => (
                    <button 
                      key={lang}
                      onClick={() => setLocalSettings(s => ({ ...s, language: lang }))}
                      className={cn(
                        "flex items-center justify-between p-5 rounded-2xl border-2 transition-all",
                        localSettings.language === lang 
                          ? "bg-[var(--color-bg)] border-brand ring-4 ring-brand/5" 
                          : "bg-transparent border-[var(--color-border)] hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl flex items-center justify-center font-black text-xs text-brand">
                          {lang.toUpperCase()}
                        </div>
                        <span className={cn("font-black text-sm uppercase tracking-widest", localSettings.language === lang ? "text-brand" : "text-gray-400")}>
                          {lang === 'pt' ? 'Português (Brasil)' : 'English (United States)'}
                        </span>
                      </div>
                      {localSettings.language === lang && (
                        <div className="bg-brand rounded-full p-1 shadow-lg shadow-brand/40">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : activeTab === 'migration' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-widest">{t('settings.migration.title')}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('settings.migration.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* AniList Import */}
                  <div className="p-6 bg-[var(--color-bg)] rounded-3xl border-2 border-[var(--color-border)] space-y-5 group hover:border-brand/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#02a9ff]/20 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                        <DownloadCloud className="w-6 h-6 text-[#02a9ff]" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[var(--color-text-bright)] uppercase tracking-tight">{t('settings.migration.anilist')}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Connect via GraphQL</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="@username"
                        value={anilistUser}
                        onChange={(e) => setAnilistUser(e.target.value)}
                        className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-5 py-3 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:ring-2 focus:ring-brand shadow-inner"
                      />
                      <button 
                        onClick={() => handleImport('anilist')}
                        disabled={isImporting}
                        className="bg-brand text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-brand/20"
                      >
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('settings.migration.import')}
                      </button>
                    </div>
                  </div>

                  {/* MAL Import */}
                  <div className="p-6 bg-[var(--color-bg)] rounded-3xl border-2 border-[var(--color-border)] space-y-5 group hover:border-brand/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#2e51a2]/20 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                        <DownloadCloud className="w-6 h-6 text-[#2e51a2]" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[var(--color-text-bright)] uppercase tracking-tight">{t('settings.migration.mal')}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Via Jikan API v4</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="@username"
                        value={malUser}
                        onChange={(e) => setMalUser(e.target.value)}
                        className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-5 py-3 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:ring-2 focus:ring-brand shadow-inner"
                      />
                      <button 
                        onClick={() => handleImport('mal')}
                        disabled={isImporting}
                        className="bg-brand text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-brand/20"
                      >
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('settings.migration.import')}
                      </button>
                    </div>
                  </div>
                </div>

                {importStatus.success && (
                  <div className="p-5 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-2xl text-emerald-500 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2 flex items-center gap-3">
                    <Check className="w-4 h-4" /> {importStatus.success}
                  </div>
                )}
                {importStatus.error && (
                  <div className="p-5 bg-red-500/10 border-2 border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                    {importStatus.error}
                  </div>
                )}
              </div>
            ) : activeTab === 'general' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-widest flex items-center gap-2">
                  <Cog className="w-4 h-4 text-brand" /> Preferências do Sistema
                </h3>
                
                <div className="flex items-center justify-between bg-[var(--color-bg)] p-6 rounded-2xl border border-[var(--color-border)]">
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text-bright)]">Idioma do Título</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Como os nomes dos animes aparecem</p>
                  </div>
                  <select 
                    value={localSettings.titleLanguage}
                    onChange={(e) => setLocalSettings(s => ({ ...s, titleLanguage: e.target.value }))}
                    className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none text-[var(--color-text-bright)] shadow-sm"
                  >
                    <option>Romaji</option>
                    <option>Inglês</option>
                    <option>Nativo</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center space-y-6">
                <div className="w-16 h-16 text-gray-300 mx-auto border-4 border-dashed border-[var(--color-border)] rounded-3xl flex items-center justify-center rotate-12">
                  <Cog className="w-8 h-8 animate-spin-slow" />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Em breve</p>
              </div>
            )}
          </div>

          <div className="bg-red-500/[0.03] p-8 rounded-3xl border-2 border-red-500/10 space-y-5">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-red-500" />
              <h3 className="text-xs font-black text-red-500 uppercase tracking-widest">Zona de Perigo</h3>
            </div>
            <p className="text-[11px] text-red-500/70 font-bold uppercase tracking-wider leading-relaxed">
              Excluir sua conta removerá permanentemente todas as suas listas de animes, avaliações e progresso. Esta ação não pode ser desfeita.
            </p>
            <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95">
              Excluir Conta Permanentemente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

