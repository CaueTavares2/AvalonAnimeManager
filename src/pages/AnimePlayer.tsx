import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Play, LayoutGrid, Settings, AlertCircle, Share2, Maximize2, X, List, Search as SearchIcon, Terminal as TerminalIcon } from 'lucide-react';
import ReactPlayer from 'react-player';
import { useExtensions, AnimeExtension, Episode, StreamSource, AVAILABLE_EXTENSIONS } from '../services/extensionService';
import { jikanService } from '../services/jikanService';
import { mappingService } from '../services/mappingService';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import logoLight from '../assets/images/logo-light.jpeg';
import logoDark from '../assets/images/logo-dark.jpeg';
import GoAnimeTerminal from '../components/anime/GoAnimeTerminal';
import AdSenseBanner from '../components/anime/AdSenseBanner';

export default function AnimePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getInstalledExtensions } = useExtensions();
  
  const [extension, setExtension] = useState<AnimeExtension | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  
  const [streams, setStreams] = useState<StreamSource[]>([]);
  const [streamIndex, setStreamIndex] = useState(0);
  const stream = streams[streamIndex] || null;
  
  const [loading, setLoading] = useState(true);
  const [loadingStream, setLoadingStream] = useState(false);
  const [animeTitle, setAnimeTitle] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const installedExts = getInstalledExtensions();
  const Player = ReactPlayer as any;

  const episodesListRef = useRef<HTMLDivElement>(null);

  // Filtered episodes
  const filteredEpisodes = useMemo(() => {
    if (!episodeSearch.trim()) return episodes;
    const q = episodeSearch.toLowerCase();
    return episodes.filter(ep => 
      ep.number.toString().includes(q) || 
      (ep.title && ep.title.toLowerCase().includes(q))
    );
  }, [episodes, episodeSearch]);

  // Scroll to active episode
  useEffect(() => {
    if (currentEpisode && episodesListRef.current) {
      const activeBtn = episodesListRef.current.querySelector(`[data-active="true"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentEpisode]);

  // Initialize extension and episodes
  useEffect(() => {
    const init = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      setIsReady(false);
      
      try {
        if (installedExts.length === 0) {
          setError("As fontes de vídeo estão temporariamente indisponíveis por falta de provedores externos estáveis (sistemas como o Consumet foram desativados mundialmente ou estão em reconstrução). Esse estado é provisório e estamos trabalhando para restabelecer os servidores!");
          return;
        }
        
        const selectedExt = extension || installedExts[0];
        setExtension(selectedExt);

        let finalId = id;
        let title = '';
        let totalEpisodesCount = 0;
        let releaseYear = 0;

        // Fetch anime title and metadata for mapping accuracy if ID is numeric
        if (!id.includes(':') && !isNaN(Number(id))) {
          try {
            const data = await jikanService.getDetails(Number(id));
            title = data.title;
            totalEpisodesCount = data.episodes || 0;
            releaseYear = data.year || 0;
            setAnimeTitle(title);
          } catch (e) {
            console.warn('Failed to fetch anime title for mapping fallback', e);
          }
        }

        // AUTOMATIC MAPPING FOR BETTERFLIX
        if (selectedExt.id === 'betterflix' && !id.includes(':') && !isNaN(Number(id))) {
          const mapping = await mappingService.getTMDBId(Number(id), title, releaseYear);
          if (mapping && mapping.tmdb_id) {
            finalId = `${mapping.type}:${mapping.tmdb_id}`;
          }
        }

        const eps = await selectedExt.getEpisodes(finalId, totalEpisodesCount);
        const sortedEps = [...eps].sort((a, b) => a.number - b.number);
        setEpisodes(sortedEps);
        
        if (sortedEps.length > 0 && !currentEpisode) {
          setCurrentEpisode(sortedEps[0]);
        }
      } catch (e: any) {
        setError("Erro ao carregar episódios da fonte selecionada.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, extension]);

  // Load stream when episode changes (stream loading errors are localized now)
  useEffect(() => {
    const loadStream = async () => {
      if (!extension || !currentEpisode) return;
      
      // Cleanup previous state immediately
      setLoadingStream(true);
      setIsReady(false);
      setStreamError(null);

      try {
        const fetchedStreams = await extension.getStreams(currentEpisode.id);
        if (fetchedStreams && fetchedStreams.length > 0) {
          setStreams(fetchedStreams);
          setStreamIndex(0);
        } else {
          setStreamError("Nenhum sinal encontrado nesta fonte para este episódio.");
        }
      } catch (e) {
        console.error(e);
        setStreamError("Erro na conexão com o servidor de vídeo desta fonte.");
      } finally {
        setLoadingStream(false);
      }
    };
    loadStream();
  }, [currentEpisode, extension]);

  // Load stream timeout watchdog to prevent infinite "Sincronizando..." loop
  // It automatically attempts to recover to secondary streaming servers before raising error!
  useEffect(() => {
    if (stream && !isReady && !loadingStream) {
      const timer = setTimeout(() => {
        if (!isReady) {
          if (streamIndex + 1 < streams.length) {
            console.warn(`Watchdog timeout hit for stream index ${streamIndex}. Auto-recovering to next server...`);
            // Add a small delay between failovers to avoid rapid cycling
            setStreamIndex(prev => prev + 1);
          } else {
            console.warn('Watchdog timeout: All streams exhausted.');
            setStreamError("Tempo limite esgotado. Todos os servidores de vídeo estão lentos ou instáveis no momento.");
          }
        }
      }, 12000); // 12 seconds failover watch window (faster but safer)
      return () => clearTimeout(timer);
    }
  }, [stream, isReady, streamIndex, streams, loadingStream]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Sintonizando frequências...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen pt-24 px-4 flex items-center justify-center bg-[var(--color-bg)]">
      <div className="bg-[var(--color-card)] p-8 rounded-3xl border border-[var(--color-border)] shadow-2xl max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={32} />
        </div>
        <div>
          <h2 className="text-xl font-black text-[var(--color-text-bright)] uppercase italic mb-2">Sinal Interrompido</h2>
          <p className="text-sm text-gray-400 font-medium">{error}</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => navigate('/settings')} className="flex-1 bg-[var(--color-bg)] text-gray-400 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-[var(--color-border)] hover:text-brand transition-colors">Configurar</button>
           <button onClick={() => navigate(-1)} className="flex-1 bg-brand text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20">Voltar</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-[var(--color-text-bright)] selection:bg-brand selection:text-white pb-20">
      {/* Dynamic Header */}
      <div className="fixed top-0 left-0 right-0 h-16 px-4 md:px-8 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-all group z-50 relative"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <ChevronLeft size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Voltar</span>
          </button>

          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity z-50">
            <img src={logoLight} alt="Avalon" className="h-6 w-6 md:h-8 md:w-8 object-cover rounded-lg shadow-md block dark:hidden" />
            <img src={logoDark} alt="Avalon" className="h-6 w-6 md:h-8 md:w-8 object-cover rounded-lg shadow-md hidden dark:block" />
            <div className="text-brand font-black text-xs md:text-lg tracking-tighter uppercase italic hidden xs:block">Avalon</div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSourceSelector(!showSourceSelector)}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-gray-400 hover:text-brand"
            title="Mudar Fonte"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="pt-20 px-4 md:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Main Player Area */}
        <div className="flex-1 space-y-6">
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5 group">
            {/* Inside-Player Loading Indicator */}
            {loadingStream && !stream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-20">
                <div className="w-10 h-10 border-4 border border-brand border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand mb-1 animate-pulse">Sintonizando sinal de vídeo...</p>
                <p className="text-[8px] text-gray-500 uppercase tracking-widest">Conectando aos servidores de streaming...</p>
              </div>
            )}

            {/* Loading Overlay with click-to-bypass and autoplay support */}
            {(loadingStream || !isReady) && stream && (
               <div 
                 onClick={() => setIsReady(true)}
                 className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md z-20 cursor-pointer select-none group/overlay"
               >
                  <div className="w-14 h-14 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center mb-4 transition-all duration-300 group-hover/overlay:scale-110 group-hover/overlay:bg-brand/30">
                    <Play size={24} className="text-brand fill-current ml-1 animate-pulse" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand mb-1">Iniciar Transmissão</p>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest">Clique se o vídeo não iniciar automaticamente</p>
               </div>
            )}

            {stream && stream.type === 'iframe' ? (
              <iframe 
                src={stream.url} 
                className="w-full h-full border-0 absolute inset-0" 
                allowFullScreen 
                allow="autoplay; encrypted-media; picture-in-picture; clipboard-write; geolocation"
              />
            ) : (
                <div className={cn("w-full h-full transition-opacity duration-500", !stream || !isReady ? "opacity-0" : "opacity-100")}>
                {stream && (
                  <Player 
                    key={stream.url}
                    url={stream.url as string}
                    controls={true}
                    width="100%"
                    height="100%"
                    playing={isReady}
                    onReady={() => setIsReady(true)}
                    onStart={() => setIsReady(true)}
                    onPlay={() => setIsReady(true)}
                    onEnded={() => {
                      const currentIndex = episodes.findIndex(e => e.id === currentEpisode?.id);
                      if (currentIndex !== -1 && currentIndex + 1 < episodes.length) {
                        setCurrentEpisode(episodes[currentIndex + 1]);
                      }
                    }}
                    onError={() => {
                      if (streamIndex + 1 < streams.length) {
                        console.warn(`Playback failed for stream index ${streamIndex}. Auto-recovering to next server...`);
                        setStreamIndex(prev => prev + 1);
                        setIsReady(false);
                      } else {
                        setIsReady(false);
                        setStreamError("O sinal deste episódio foi perdido, bloqueado por CORS ou travado pelo seu navegador.");
                      }
                    }}
                    config={{ 
                      file: { 
                        forceHLS: stream.type === 'hls',
                        hlsOptions: {
                          enableWorker: true,
                          lowLatencyMode: true,
                          backBufferLength: 60
                        },
                        attributes: {
                          controlsList: 'nodownload',
                          disablePictureInPicture: true
                        }
                      } 
                    } as any}
                  />
                )}
              </div>
            )}

            {!stream && !loadingStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-black/40 backdrop-blur-sm z-30">
                <AlertCircle size={48} className="text-red-500 mb-4 animate-pulse" />
                <p className="text-gray-200 font-bold max-w-sm uppercase text-[10px] tracking-widest leading-relaxed">
                  {streamError || "Nenhum sinal encontrado nesta fonte para este episódio."}
                </p>
                <button 
                  onClick={() => setShowSourceSelector(true)}
                  className="mt-6 px-6 py-2.5 bg-brand hover:bg-brand/90 hover:scale-105 active:scale-95 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-brand/20 shrink-0"
                >
                  Tentar outra fonte
                </button>
              </div>
            )}
            
            {/* Quick Controls overlay? */}
          </div>

          {/* Server Selector / Alternador de Servidor */}
          {streams.length > 1 && (
            <div className="bg-[var(--color-card)] p-5 rounded-3xl border border-[var(--color-border)] space-y-3 shadow-xl">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand flex items-center gap-2">
                  <span className="w-2 h-2 bg-brand rounded-full animate-pulse" />
                  Servidores de Streaming
                </span>
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/10">
                  Auto-Failover Ativo
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {streams.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setStreamIndex(idx);
                      setIsReady(false);
                      setStreamError(null);
                    }}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                      streamIndex === idx
                        ? "bg-brand/10 border-brand/30 text-brand scale-[1.01]"
                        : "bg-black/20 border-transparent text-gray-500 hover:border-white/10 hover:text-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{idx === 0 ? "⚡" : idx === 1 ? "📺" : "🔗"}</span>
                      <span className="truncate">{s.quality || `Servidor ${idx + 1}`}</span>
                    </div>
                    {streamIndex === idx && <div className="w-1.5 h-1.5 bg-brand rounded-full shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}



          <div className="bg-[var(--color-card)] p-6 rounded-3xl border border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="hidden sm:block">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Qualidade Atual</p>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-xs font-bold">{stream?.quality || 'Auto'}</span>
                </div>
              </div>
              <div className="w-px h-8 bg-[var(--color-border)] hidden sm:block" />
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status do Sinal</p>
                <span className="text-xs font-bold text-emerald-500">ESTÁVEL</span>
              </div>
            </div>
            
            <div className="flex gap-2">
               <button 
                onClick={() => {
                  const currentIndex = episodes.findIndex(e => e.id === currentEpisode?.id);
                  if (currentIndex !== -1 && currentIndex + 1 < episodes.length) {
                    setCurrentEpisode(episodes[currentIndex + 1]);
                  }
                }}
                disabled={!currentEpisode || episodes.findIndex(e => e.id === currentEpisode?.id) === episodes.length - 1}
                className="px-4 py-2 bg-brand/10 border border-brand/20 rounded-xl text-brand font-black text-[9px] uppercase tracking-widest hover:bg-brand hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
               >
                Próximo Ep
               </button>
               <button className="p-3 bg-[var(--color-bg)] rounded-xl text-gray-400 hover:text-brand transition-colors"><Share2 size={18} /></button>
               <button className="p-3 bg-[var(--color-bg)] rounded-xl text-gray-400 hover:text-brand transition-colors"><Maximize2 size={18} /></button>
            </div>
          </div>

          {/* Monetização Adsense */}
          <AdSenseBanner slotId="8215930211" format="auto" />
        </div>

        {/* Sidebar: Episodes & Sources */}
        <div className="w-full lg:w-96 space-y-6">
          
          {/* Source Selector (Mobile fixed / Desktop card) */}
          <AnimatePresence>
            {showSourceSelector && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--color-card)] p-6 rounded-3xl border border-brand/20 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-brand">Fontes Disponíveis</h3>
                  <button onClick={() => setShowSourceSelector(false)} className="text-gray-500 hover:text-white transition-colors"><X size={16} /></button>
                </div>
                <div className="space-y-2">
                  {installedExts.map((ext) => (
                    <button 
                      key={ext.id}
                      onClick={() => {
                        setExtension(ext);
                        setShowSourceSelector(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl transition-all border",
                        extension?.id === ext.id 
                          ? "bg-brand/10 border-brand/30 text-brand" 
                          : "bg-[var(--color-bg)] border-transparent text-gray-400 hover:border-gray-700"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{ext.icon}</span>
                        <span className="text-xs font-bold uppercase">{ext.name}</span>
                      </div>
                      {extension?.id === ext.id && <Play size={12} className="fill-current" />}
                    </button>
                  ))}
                </div>
                <Link to="/settings" className="block text-center text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-brand transition-colors mt-2">Gerenciar Extensões</Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Episodes List */}
          <div className="bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] overflow-hidden flex flex-col h-[500px] lg:h-[600px] shadow-xl">
            <div className="p-5 border-b border-[var(--color-border)] space-y-4 bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutGrid size={16} className="text-brand" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">Episódios</h3>
                </div>
                <div className="flex bg-[var(--color-bg)] p-1 rounded-lg border border-[var(--color-border)]">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-brand text-white shadow-sm" : "text-gray-500 hover:text-brand")}
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-brand text-white shadow-sm" : "text-gray-500 hover:text-brand")}
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>

              <div className="relative group">
                <SearchIcon size={12} className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", episodeSearch ? "text-brand" : "text-gray-500")} />
                <input 
                  type="text"
                  placeholder="Pesquisar episódio..."
                  value={episodeSearch}
                  onChange={(e) => setEpisodeSearch(e.target.value)}
                  className="w-full h-8 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg pl-9 pr-3 text-[10px] font-bold text-[var(--color-text-bright)] focus:outline-none focus:border-brand transition-all placeholder:text-gray-600"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[var(--color-bg)]/30" ref={episodesListRef}>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2">
                  {filteredEpisodes.map((ep) => (
                    <button
                      key={ep.id}
                      data-active={currentEpisode?.id === ep.id}
                      onClick={() => setCurrentEpisode(ep)}
                      className={cn(
                        "aspect-square flex flex-col items-center justify-center rounded-xl font-black transition-all relative group overflow-hidden border",
                        currentEpisode?.id === ep.id 
                          ? "bg-brand border-brand text-white shadow-lg shadow-brand/20 scale-[1.02]" 
                          : "bg-[var(--color-card)] border-[var(--color-border)] text-gray-500 hover:border-brand/50 hover:text-brand"
                      )}
                    >
                      <span className="text-sm">{ep.number}</span>
                      {currentEpisode?.id === ep.id && (
                         <motion.div 
                          layoutId="activeEp"
                          className="absolute inset-0 bg-brand/10 pointer-events-none"
                         />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredEpisodes.map((ep) => (
                    <button
                      key={ep.id}
                      data-active={currentEpisode?.id === ep.id}
                      onClick={() => setCurrentEpisode(ep)}
                      className={cn(
                        currentEpisode?.id === ep.id 
                          ? "bg-brand border-brand text-white shadow-md" 
                          : "bg-[var(--color-card)] border-[var(--color-border)] text-gray-400 hover:border-brand/40 hover:text-brand"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0",
                        currentEpisode?.id === ep.id ? "bg-white/20" : "bg-[var(--color-bg)]"
                      )}>
                        {ep.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black truncate uppercase tracking-tight italic">
                          {ep.title || `Episódio ${ep.number}`}
                        </p>
                      </div>
                      {currentEpisode?.id === ep.id && <Play size={12} className="fill-current mr-1" />}
                    </button>
                  ))}
                </div>
              )}
              
              {filteredEpisodes.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-10">
                   <AlertCircle size={24} className="mb-2" />
                   <p className="text-[9px] font-black uppercase tracking-widest">Nenhum episódio encontrado</p>
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-[var(--color-border)] bg-white/[0.01]">
               <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest text-center">
                 Mostrando {filteredEpisodes.length} de {episodes.length} episódios
               </p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {terminalOpen && <GoAnimeTerminal onClose={() => setTerminalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
