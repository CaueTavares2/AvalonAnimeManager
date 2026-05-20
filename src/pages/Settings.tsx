import { Cog, Shield, Bell, Palette, Globe, Save, Check, DownloadCloud, Loader2, Radio, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useTheme, ColorTheme } from '../context/ThemeContext';
import { importService } from '../services/importService';
import { useAnimeList } from '../hooks/useAnimeList';
import { useLanguage, Language } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useExtensions, AVAILABLE_EXTENSIONS } from '../services/extensionService';
import { createStremioExtension } from '../services/stremioExtension';
import { AnilistGuideModal } from '../components/shared/AnilistGuideModal';

export default function Settings() {
  const { darkMode, setDarkMode, colorTheme, setColorTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { batchAddAnimes } = useAnimeList();
  const { user } = useAuth();
  const { installed, install, uninstall, manifests, addManifest, removeManifest } = useExtensions();
  
  const [activeTab, setActiveTab] = useState('general');
  const [showAnilistGuide, setShowAnilistGuide] = useState(false);
  const [newManifestUrl, setNewManifestUrl] = useState('');
  
  const initialAnilistUser = localStorage.getItem('avalon_anilist_user') || '';
  const initialAnilistToken = localStorage.getItem('avalon_anilist_token') || '';
  const initialAnilistClientId = localStorage.getItem('avalon_anilist_client_id') || '';
  const initialMalUser = localStorage.getItem('avalon_mal_user') || '';
  const initialMalToken = localStorage.getItem('avalon_mal_token') || '';
  const initialAutoSyncTrackers = localStorage.getItem('avalon_auto_sync_trackers') === 'true';

  const [localSettings, setLocalSettings] = useState({
    darkMode,
    colorTheme,
    language,
    titleLanguage: localStorage.getItem('titleLanguage') || 'Romaji',
    anilistUser: initialAnilistUser,
    anilistToken: initialAnilistToken,
    anilistClientId: initialAnilistClientId,
    malUser: initialMalUser,
    malToken: initialMalToken,
    autoSyncTrackers: initialAutoSyncTrackers,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    setLocalSettings(s => ({
      ...s,
      darkMode,
      colorTheme,
      language
    }));
  }, [darkMode, colorTheme, language]);

  useEffect(() => {
    const currentTitleLang = localStorage.getItem('titleLanguage') || 'Romaji';
    const changed = 
      localSettings.darkMode !== darkMode ||
      localSettings.colorTheme !== colorTheme ||
      localSettings.language !== language ||
      localSettings.titleLanguage !== currentTitleLang ||
      localSettings.anilistUser !== initialAnilistUser ||
      localSettings.anilistToken !== initialAnilistToken ||
      localSettings.anilistClientId !== initialAnilistClientId ||
      localSettings.malUser !== initialMalUser ||
      localSettings.malToken !== initialMalToken ||
      localSettings.autoSyncTrackers !== initialAutoSyncTrackers;
    setHasChanges(changed);
  }, [localSettings, darkMode, colorTheme, language, initialAnilistUser, initialAnilistToken, initialAnilistClientId, initialMalUser, initialMalToken, initialAutoSyncTrackers]);

  const handleSave = () => {
    setSaveStatus('saving');
    
    // Persist and apply changes
    setTimeout(() => {
      // Global context updates
      setDarkMode(localSettings.darkMode);
      setColorTheme(localSettings.colorTheme);
      setLanguage(localSettings.language);
      
      // Local storage updates
      localStorage.setItem('titleLanguage', localSettings.titleLanguage);
      localStorage.setItem('avalon_anilist_user', localSettings.anilistUser);
      localStorage.setItem('avalon_anilist_token', localSettings.anilistToken);
      localStorage.setItem('avalon_anilist_client_id', localSettings.anilistClientId);
      localStorage.setItem('avalon_mal_user', localSettings.malUser);
      localStorage.setItem('avalon_mal_token', localSettings.malToken);
      localStorage.setItem('avalon_auto_sync_trackers', localSettings.autoSyncTrackers ? 'true' : 'false');

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      setHasChanges(false);
    }, 600);
  };

  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success?: string; error?: string }>({});
  const [testingStatus, setTestingStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});

  const testAllExtensions = async () => {
    const all = [...AVAILABLE_EXTENSIONS, ...manifests.map(m => createStremioExtension(m))];
    for (const ext of all) {
      setTestingStatus(prev => ({ ...prev, [ext.id]: 'pending' }));
      try {
        const results = await ext.search('Naruto');
        if (results && results.length > 0) {
          setTestingStatus(prev => ({ ...prev, [ext.id]: 'success' }));
        } else {
          setTestingStatus(prev => ({ ...prev, [ext.id]: 'error' }));
        }
      } catch (e) {
        setTestingStatus(prev => ({ ...prev, [ext.id]: 'error' }));
      }
    }
  };

  const handleImport = async (type: 'anilist' | 'mal') => {
    // If the user tries to import, we should use the current typed value (localSettings)
    const username = type === 'anilist' ? localSettings.anilistUser : localSettings.malUser;
    if (!username) return;

    setIsImporting(true);
    setImportStatus({});
    try {
      const data = type === 'anilist' 
        ? await importService.importFromAniList(username)
        : await importService.importFromMAL(username);
      
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
    { id: 'extensions', icon: Radio, label: 'Fontes' },
    { id: 'language', icon: Globe, label: 'Idioma' },
    { id: 'diagnostics', icon: AlertTriangle, label: 'Testes' },
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
                        if (localSettings.darkMode && user) {
                          const { rankingService } = await import('../services/rankingService');
                          // @ts-ignore
                          await rankingService.grantAchievement(user.uid, 'NIGHT_MODE_RELIGION');
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
            ) : activeTab === 'extensions' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-widest flex items-center gap-2">
                    <Radio className="w-4 h-4 text-brand" /> Fontes de Anime & Streams (P2P)
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sistemas de agregação e conexões externas de vídeo (Stremio Proto)</p>
                    <button 
                      onClick={testAllExtensions}
                      className="text-[9px] font-black uppercase text-brand flex items-center gap-1.5 hover:underline"
                    >
                      <Shield className="w-3 h-3" /> Testar Todas Conexões
                    </button>
                  </div>
                </div>

                {/* Custom Manifest Input */}
                <div className="p-6 bg-[var(--color-bg)] rounded-3xl border border-[var(--color-border)] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-[var(--color-text-bright)] uppercase tracking-widest">Adicionar Addon do Stremio</h4>
                    <span className="text-[8px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-black">NOVO</span>
                  </div>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="https://.../manifest.json"
                      value={newManifestUrl}
                      onChange={(e) => setNewManifestUrl(e.target.value)}
                      className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-5 py-3 text-xs font-bold text-[var(--color-text-bright)] focus:outline-none focus:border-brand"
                    />
                    <button 
                      onClick={() => {
                        if (newManifestUrl.trim().endsWith('manifest.json')) {
                          addManifest(newManifestUrl.trim());
                          setNewManifestUrl('');
                        }
                      }}
                      className="bg-brand text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand/20"
                    >
                      Adicionar
                    </button>
                  </div>
                  <p className="text-[8px] text-gray-500 font-medium">
                    * Avalon suporta addons do Stremio (arquivos manifest.json). Para torrents P2P, recomendamos usar uma configuração com Real-Debrid no Torrentio para evitar bloqueios do navegador.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[...AVAILABLE_EXTENSIONS, ...manifests.map(m => createStremioExtension(m))].map((ext) => {
                    const isInstalled = installed.includes(ext.id);
                    const isCustom = manifests.includes(AVAILABLE_EXTENSIONS.find(a => a.id === ext.id) ? '' : (ext as any).manifestUrl || ''); // Logic helper
                    const manifestUrl = manifests.find(m => `stremio-${btoa(m).slice(0, 10)}` === ext.id);

                    return (
                      <div key={ext.id} className="p-5 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-border)] flex items-center justify-between group hover:border-brand/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-12 h-12 bg-[var(--color-card)] rounded-xl flex items-center justify-center text-2xl shadow-sm", isInstalled && "border border-brand/50")}>
                            {ext.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-[var(--color-text-bright)] uppercase tracking-tight">{ext.name}</span>
                              <span className="text-[8px] bg-gray-500/10 text-gray-500 px-1.5 py-0.5 rounded font-black uppercase">v{ext.version}</span>
                              {manifestUrl && <span className="text-[8px] text-brand font-black uppercase tracking-widest bg-brand/5 px-2 py-0.5 rounded border border-brand/10">Custom</span>}
                              {testingStatus[ext.id] === 'pending' && <Loader2 className="w-3 h-3 animate-spin text-brand" />}
                              {testingStatus[ext.id] === 'success' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />}
                              {testingStatus[ext.id] === 'error' && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />}
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{ext.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {manifestUrl && (
                            <button 
                              onClick={() => {
                                uninstall(ext.id);
                                removeManifest(manifestUrl);
                              }}
                              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                            >
                              <Check className="w-4 h-4 rotate-45" />
                            </button>
                          )}
                          <button 
                            onClick={() => isInstalled ? uninstall(ext.id) : install(ext.id)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                              isInstalled 
                                ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" 
                                : "bg-brand text-white hover:scale-105 shadow-lg shadow-brand/20"
                            )}
                          >
                            {isInstalled ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-widest">{t('settings.migration.title')}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('settings.migration.subtitle')}</p>
                  </div>
                  
                  {/* Toggle para Auto-Sync */}
                  <div className="flex items-center gap-3 bg-[var(--color-card)] border border-[var(--color-border)] px-4 py-3 rounded-2xl shadow-sm">
                    <input 
                      type="checkbox"
                      id="autoSyncTrackers"
                      checked={localSettings.autoSyncTrackers}
                      onChange={(e) => setLocalSettings(s => ({ ...s, autoSyncTrackers: e.target.checked }))}
                      className="w-4 h-4 text-brand bg-gray-100 border-gray-300 rounded focus:ring-brand dark:focus:ring-brand dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-brand cursor-pointer"
                    />
                    <label htmlFor="autoSyncTrackers" className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-bright)] cursor-pointer select-none">
                      Sincronização Ativa (Auto-Sync)
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* AniList Integration */}
                  <div className="p-6 bg-[var(--color-bg)] rounded-3xl border-2 border-[var(--color-border)] space-y-5 group hover:border-brand/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#02a9ff]/20 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                          <DownloadCloud className="w-6 h-6 text-[#02a9ff]" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[var(--color-text-bright)] uppercase tracking-tight">{t('settings.migration.anilist')}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">GraphQL API v2</p>
                        </div>
                      </div>
                      {localSettings.anilistUser && (
                        <span className="bg-[#02a9ff]/10 text-[#02a9ff] border border-[#02a9ff]/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                          {localSettings.anilistToken ? 'CONECTADO (MUTAÇÕES)' : 'PREVIEW ATIVO'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <input 
                          type="text" 
                          placeholder="Nome de usuário no AniList (@username)"
                          value={localSettings.anilistUser}
                          onChange={(e) => setLocalSettings(s => ({ ...s, anilistUser: e.target.value }))}
                          className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-5 py-3 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:ring-2 focus:ring-brand shadow-inner"
                        />
                        <button 
                          onClick={() => handleImport('anilist')}
                          disabled={isImporting || !localSettings.anilistUser}
                          className="bg-brand text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-brand/20"
                        >
                          {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('settings.migration.import')}
                        </button>
                      </div>

                      <div className="flex flex-col gap-2">
                        {!import.meta.env.VITE_ANILIST_CLIENT_ID && (
                          <div className="flex gap-3 mb-2">
                            <input 
                              type="text" 
                              placeholder="Client ID (Pegue no AniList Developer Settings)"
                              value={localSettings.anilistClientId}
                              onChange={(e) => setLocalSettings(s => ({ ...s, anilistClientId: e.target.value }))}
                              className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-5 py-3 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:ring-2 focus:ring-brand shadow-inner"
                            />
                          </div>
                        )}
                        <div className="flex gap-3">
                          <input 
                            type="password" 
                            placeholder="Token de Acesso AniList"
                            value={localSettings.anilistToken}
                            onChange={(e) => setLocalSettings(s => ({ ...s, anilistToken: e.target.value }))}
                            className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-5 py-3 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:ring-2 focus:ring-brand shadow-inner"
                          />
                        </div>
                        <div className="flex justify-between items-center px-1 mt-2">
                          <p className="text-[9px] text-gray-500 font-medium">
                            * Cole seu token aqui se você já o possui, ou autorize o aplicativo para sincronização.
                          </p>
                          {(import.meta.env.VITE_ANILIST_CLIENT_ID || localSettings.anilistClientId || '41911') ? (
                            <div className="text-right flex flex-col items-end gap-1">
                              <a 
                                href={`https://anilist.co/api/v2/oauth/authorize?client_id=${import.meta.env.VITE_ANILIST_CLIENT_ID || localSettings.anilistClientId || '41911'}&response_type=token`}
                                className="text-[10px] text-brand font-bold uppercase tracking-widest hover:underline whitespace-nowrap"
                              >
                                Obter Token de Acesso (Login AniList)
                              </a>
                              <button 
                                onClick={() => setShowAnilistGuide(true)}
                                className="text-[9px] text-gray-500 font-bold uppercase tracking-widest hover:text-white"
                              >
                                Erro ao pegar token? Veja como corrigir.
                              </button>
                            </div>
                          ) : (
                            <div className="text-right">
                              <button 
                                onClick={() => setShowAnilistGuide(true)}
                                className="text-[10px] text-brand font-bold uppercase tracking-widest hover:underline block"
                              >
                                Como configurar o modo Desenvolvedor
                              </button>
                              <p className="text-[9px] text-gray-500 font-bold">Client ID não configurado</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MAL Integration */}
                  <div className="p-6 bg-[var(--color-bg)] rounded-3xl border-2 border-[var(--color-border)] space-y-5 group hover:border-brand/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#2e51a2]/20 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                          <DownloadCloud className="w-6 h-6 text-[#2e51a2]" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[var(--color-text-bright)] uppercase tracking-tight">{t('settings.migration.mal')}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Jikan REST API v4</p>
                        </div>
                      </div>
                      {localSettings.malUser && (
                        <span className="bg-[#2e51a2]/10 text-[#2e51a2] border border-[#2e51a2]/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                          {localSettings.malToken ? 'CONECTADO (HTTP CLIENT)' : 'PREVIEW ATIVO'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <input 
                          type="text" 
                          placeholder="Nome de usuário no MyAnimeList (@username)"
                          value={localSettings.malUser}
                          onChange={(e) => setLocalSettings(s => ({ ...s, malUser: e.target.value }))}
                          className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-5 py-3 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:ring-2 focus:ring-brand shadow-inner"
                        />
                        <button 
                          onClick={() => handleImport('mal')}
                          disabled={isImporting || !localSettings.malUser}
                          className="bg-brand text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-brand/20"
                        >
                          {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('settings.migration.import')}
                        </button>
                      </div>

                      <input 
                        type="password" 
                        placeholder="Token ou Senha de Acesso MyAnimeList (Necessário para sincronização real)"
                        value={localSettings.malToken}
                        onChange={(e) => setLocalSettings(s => ({ ...s, malToken: e.target.value }))}
                        className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-5 py-3 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:ring-2 focus:ring-brand shadow-inner"
                      />
                      <p className="text-[9px] text-gray-500 font-medium">
                        * O MyAnimeList offline faz o mock automático de escrita simulada baseado no usuário conectado se deixado em branco.
                      </p>
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
            ) : activeTab === 'diagnostics' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-brand" /> Funcionalidades e Testes de Sistema
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Execute verificações manuais de estado e detecção de erros.</p>
                </div>
                
                <div className="p-6 bg-[var(--color-bg)] rounded-3xl border border-[var(--color-border)] space-y-4">
                  <button 
                    onClick={async () => {
                      const { runSelfDiagnostics } = await import('../utils/healthCheck');
                      runSelfDiagnostics();
                      alert("Diagnóstico executado! Abra o console do navegador (F12) para ver o relatório completo.");
                    }}
                    className="w-full bg-brand hover:bg-brand-dark text-white px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                  >
                    Executar Verificação de Sistema (Console Log)
                  </button>
                  <p className="text-[9px] text-gray-500 font-bold text-center uppercase tracking-widest">Verifica API, Rotas e Assets estáticos</p>
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
      <AnilistGuideModal isOpen={showAnilistGuide} onClose={() => setShowAnilistGuide(false)} />
    </div>
  );
}

