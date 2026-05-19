import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mangaService } from '../services/mangaService';
import { jikanService } from '../services/jikanService';
import { useAnimeList } from '../hooks/useAnimeList';
import { 
  ChevronLeft, 
  Loader2, 
  BookOpen, 
  Settings, 
  PanelBottom, 
  Sun, 
  Maximize2,
  Minimize2,
  CheckCircle2,
  RotateCcw,
  Layout,
  X,
  ChevronUp
} from 'lucide-react';

import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const ReaderImage: React.FC<{ url: string; index: number; isLongStrip: boolean }> = ({ url, index, isLongStrip }) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setStatus('loading');
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className={cn(
      "relative w-full overflow-hidden transition-all duration-700",
      status === 'loading' ? "bg-white/[0.03] aspect-[2/3] animate-pulse rounded-3xl" : "bg-transparent",
      !isLongStrip ? "shadow-2xl rounded-3xl border border-white/5" : "border-none"
    )}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-t-2 border-brand rounded-full animate-spin opacity-40" />
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest animate-pulse">Página {index + 1}</span>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-red-500/5 rounded-3xl p-12 border border-red-500/10">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <RotateCcw className="w-8 h-8 text-red-500 animate-spin-reverse" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-[10px] text-red-500 font-black uppercase tracking-widest italic">Falha na Rede Neural</p>
            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-tight">O servidor negou o acesso ao frame {index + 1}</p>
          </div>
          <button 
            onClick={handleRetry}
            className="px-8 py-3 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20"
          >
            Recarregar Fragmento
          </button>
        </div>
      )}

      <motion.img 
        src={status !== 'error' ? `${url}${retryCount > 0 ? `&retry=${retryCount}` : ''}` : undefined}
        alt={`Pagina ${index + 1}`} 
        className={cn(
          "w-full h-auto block transition-all duration-1000",
          status === 'loaded' ? "opacity-100 scale-100" : "opacity-0 scale-95 absolute pointer-events-none"
        )}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        loading="lazy"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={status === 'loaded' ? { opacity: 1, scale: 1 } : {}}
      />
      
      <div className="absolute bottom-6 right-6 px-3 py-1.5 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 text-[9px] font-black text-white/50 pointer-events-none uppercase tracking-widest shadow-xl">
        Pag.{index + 1}
      </div>
    </div>
  );
};

export default function MangaReader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { list, updateAnime } = useAnimeList();
  const searchInProgress = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mangaTitle, setMangaTitle] = useState('');
  
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<any | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(-1);
  
  const [pages, setPages] = useState<string[]>([]);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  // Settings
  const [brightness, setBrightness] = useState(100);
  const [isLongStrip, setIsLongStrip] = useState(true);
  const [isDualPage, setIsDualPage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [useDataSaver, setUseDataSaver] = useState(() => {
    return localStorage.getItem('manga_data_saver') === 'true';
  });
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showBanner, setShowBanner] = useState(() => {
    return localStorage.getItem('hide_experimental_banner') !== 'true';
  });
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowScrollTop(currentScrollY > 1000);

      // Auto-hide controls on scroll down, show on scroll up
      if (selectedChapter) {
        if (currentScrollY > 150 && currentScrollY > lastScrollY.current + 5) {
          setControlsVisible(false);
        } else if (currentScrollY < lastScrollY.current - 5) {
          setControlsVisible(true);
        }
      } else {
        setControlsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedChapter]);

  useEffect(() => {
    localStorage.setItem('manga_data_saver', String(useDataSaver));
  }, [useDataSaver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedChapter) {
        if (e.key === 'ArrowRight') {
          if (currentChapterIndex < chapters.length - 1) loadChapter(chapters[currentChapterIndex + 1], currentChapterIndex + 1);
        } else if (e.key === 'ArrowLeft') {
          if (currentChapterIndex > 0) loadChapter(chapters[currentChapterIndex - 1], currentChapterIndex - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChapter, chapters, currentChapterIndex]);

  useEffect(() => {
    const init = async () => {
      if (!id || searchInProgress.current) return;
      searchInProgress.current = true;

      try {
        setLoading(true);
        setError(null);
        setStatus('loading');
        
        // 1. Get basic info first to show Title
        const jikanData = await jikanService.getDetails(Number(id), 'manga').catch(() => null);
        if (!jikanData) {
          throw new Error("Informações do mangá não encontradas.");
        }

        setMangaTitle(jikanData.title);
        setLoading(false);

        // 2. Search on MangaDex
        const titlesToSearch = [
          jikanData.title,
          jikanData.title_english,
          ...(jikanData.title_synonyms || [])
        ].filter(Boolean) as string[];

        let dexId = '';
        for (const t of titlesToSearch) {
          const searchRes = await mangaService.searchManga(t).catch(() => null);
          if (searchRes?.data?.length > 0) {
            dexId = searchRes.data[0].id;
            break;
          }
        }

        if (!dexId) {
          setStatus('error');
          return;
        }

        const feed = await mangaService.getMangaFeed(dexId).catch(() => null);
        if (feed?.data?.length > 0) {
          const processed = feed.data.map((cap: any) => {
            const rawCh = cap.attributes?.chapter || '';
            const match = String(rawCh).match(/(\d+(\.\d+)?)/);
            const numKey = match ? parseFloat(match[1]).toString() : String(rawCh).trim();
            const lang = (cap.attributes?.translatedLanguage || '').toLowerCase();

            return {
              ...cap,
              id: cap.id,
              source: 'mangadex',
              numKey,
              attributes: {
                ...cap.attributes,
                chapter: rawCh,
                translatedLanguage: lang
              }
            };
          });

          // Group by chapter number to select best language (PT-BR > Global)
          const groups: Record<string, any[]> = {};
          processed.forEach(c => {
            if (!groups[c.numKey]) groups[c.numKey] = [];
            groups[c.numKey].push(c);
          });

          const unique = Object.keys(groups).map(num => {
            const items = groups[num];
            const pt = items.find(i => i.attributes.translatedLanguage.startsWith('pt'));
            return pt || items[0];
          }).sort((a, b) => (parseFloat(a.numKey) || 0) - (parseFloat(b.numKey) || 0));

          setChapters(unique);
          setStatus('success');
        } else {
          setStatus('error');
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Erro ao carregar capítulos.');
        setLoading(false);
      } finally {
        searchInProgress.current = false;
      }
    };

    init();
  }, [id]);

  const loadChapter = async (chapter: any, index: number) => {
    setCurrentChapterIndex(index);
    setSelectedChapter(chapter);
    setLoadingChapter(true);
    setPages([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (id) {
       localStorage.setItem(`manga_last_read_${id}`, chapter.id);
       const numericId = Number(id);
       const inList = list.find(item => item.id === numericId);
       const chapterNumber = parseFloat(chapter.attributes?.chapter) || (index + 1);
       
       if (inList) {
         if (!inList.progress || inList.progress < chapterNumber) {
           updateAnime(numericId, { 
             progress: chapterNumber, 
             status: inList.status === 'PLANNING' ? 'READING' : inList.status 
           });
         }
       }
    }

    try {
      if (chapter.attributes?.externalUrl) {
        setPages([`external:${chapter.attributes.externalUrl}`]);
        return;
      }

      const pageRes = await mangaService.getChapterPages(chapter.id, useDataSaver);
      const images = pageRes?.pages || [];
      setPages(images);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChapter(false);
    }
  };

  const goToNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      loadChapter(chapters[currentChapterIndex + 1], currentChapterIndex + 1);
    }
  };

  const goToPrevChapter = () => {
    if (currentChapterIndex > 0) {
      loadChapter(chapters[currentChapterIndex - 1], currentChapterIndex - 1);
    }
  };

  const clearChapter = () => {
    setSelectedChapter(null);
    setCurrentChapterIndex(-1);
    setPages([]);
    window.scrollTo(0, 0);
  };

  const handleMarkAsUnread = async (e: React.MouseEvent, cap: any) => {
    e.stopPropagation();
    if (!id) return;
    
    const numericId = Number(id);
    const inList = list.find(item => item.id === numericId);
    if (!inList) return;

    const currentCapNum = parseFloat(cap.attributes?.chapter) || 0;
    const sortedChapters = [...chapters].sort((a, b) => (parseFloat(a.attributes?.chapter) || 0) - (parseFloat(b.attributes?.chapter) || 0));
    const idx = sortedChapters.findIndex(c => (parseFloat(c.attributes?.chapter) || 0) === currentCapNum);
    
    let newProgress = 0;
    if (idx > 0) {
      newProgress = parseFloat(sortedChapters[idx - 1].attributes?.chapter) || 0;
    }
    
    await updateAnime(numericId, { progress: newProgress });
  };

  const getIsRead = (cap: any) => {
    if (!id) return false;
    const numericId = Number(id);
    const inList = list.find(item => item.id === numericId);
    if (!inList) return false;
    
    const capNum = parseFloat(cap.attributes?.chapter) || 0;
    return (inList.progress || 0) >= capNum;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-brand animate-spin" />
        <p className="text-gray-400 font-bold tracking-widest uppercase text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 md:px-12 pb-12 max-w-5xl mx-auto" style={{ filter: `brightness(${brightness}%)` }}>
      
      {/* Experimental Warning */}
      {!selectedChapter && showBanner && (
        <div className="bg-orange-500/10 border border-orange-500/20 p-4 lg:p-6 rounded-3xl mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6 backdrop-blur-sm shadow-xl shadow-orange-500/5 relative group">
          <button 
            onClick={() => {
              setShowBanner(false);
              localStorage.setItem('hide_experimental_banner', 'true');
            }}
            className="absolute top-4 right-4 p-1 rounded-full bg-orange-500/10 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-orange-500/20"
          >
            <X size={16} />
          </button>
          <div className="bg-orange-500/20 p-3 rounded-2xl shrink-0">
            <BookOpen className="text-orange-500 w-6 h-6" />
          </div>
          <div>
            <h3 className="text-orange-500 font-black uppercase tracking-widest text-xs lg:text-sm mb-1.5 flex items-center gap-2">
              Leitor Experimental <span className="text-orange-400 text-[10px] bg-orange-500/20 px-2 py-0.5 rounded-full border border-orange-500/30">BETA</span>
            </h3>
            <p className="text-orange-200/70 text-xs lg:text-sm font-medium leading-relaxed max-w-3xl">
              Sincronizando com <strong>MangaDex</strong> para garantir a melhor qualidade. Otimizado para PT-BR.
            </p>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <button 
          onClick={() => selectedChapter ? clearChapter() : navigate(`/manga/${id}`)}
          className="flex items-center gap-2 text-brand font-black uppercase tracking-widest text-xs md:text-sm hover:translate-x-[-4px] transition-all bg-white/5 active:bg-brand/20 px-3 md:px-5 py-2.5 rounded-2xl border border-white/10 hover:border-brand/40 shadow-lg backdrop-blur-md"
        >
          <ChevronLeft className="w-5 h-5" />
          {selectedChapter ? 'Voltar para Capítulos' : 'Voltar aos Detalhes'}
        </button>

        {selectedChapter && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showSettings ? "bg-brand text-white" : "bg-white/5 text-gray-400 hover:text-white"
              )}
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={() => {
                if (document.fullscreenElement) {
                   document.exitFullscreen();
                   setIsFullScreen(false);
                } else {
                   document.documentElement.requestFullscreen();
                   setIsFullScreen(true);
                }
              }}
              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && selectedChapter && (
        <div className="mb-8 bg-[var(--color-card)] p-6 rounded-3xl border border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4">
          <div className="space-y-4">
            <h3 className="font-black text-xs uppercase text-gray-500 tracking-widest flex items-center gap-2">
              <Sun size={14} /> Brilho
            </h3>
            <input 
              type="range" 
              min="30" 
              max="150" 
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full accent-brand"
            />
          </div>

          <div className="space-y-4">
             <h3 className="font-black text-xs uppercase text-gray-500 tracking-widest flex items-center gap-2">
                <PanelBottom size={14} /> Qualidade da Imagem
             </h3>
             <div className="flex gap-2">
                <button 
                  onClick={() => setUseDataSaver(false)}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-xl font-bold text-xs uppercase transition-all",
                    !useDataSaver ? "bg-brand text-white" : "bg-white/5 text-gray-400"
                  )}
                >
                  Máxima
                </button>
                <button 
                  onClick={() => setUseDataSaver(true)}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-xl font-bold text-xs uppercase transition-all",
                    useDataSaver ? "bg-brand text-white" : "bg-white/5 text-gray-400"
                  )}
                >
                  Data Saver
                </button>
             </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-xs uppercase text-gray-500 tracking-widest flex items-center gap-2">
              <Layout size={14} /> Modo de Leitura
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => { setIsLongStrip(true); setIsDualPage(false); }}
                className={cn(
                  "flex-1 py-2 px-4 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2",
                  isLongStrip ? "bg-brand text-white" : "bg-white/5 text-gray-400"
                )}
              >
                Vertical
              </button>
              <button 
                onClick={() => { setIsLongStrip(false); setIsDualPage(false); }}
                className={cn(
                  "flex-1 py-2 px-4 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2",
                  (!isLongStrip && !isDualPage) ? "bg-brand text-white" : "bg-white/5 text-gray-400"
                )}
              >
                Single
              </button>
              <button 
                onClick={() => { setIsLongStrip(false); setIsDualPage(true); }}
                className={cn(
                  "flex-1 py-2 px-4 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2",
                  isDualPage ? "bg-brand text-white" : "bg-white/5 text-gray-400"
                )}
              >
                Dual
              </button>
            </div>
          </div>
        </div>
      )}

      {error && !selectedChapter ? (
        <div className="bg-red-500/5 border border-red-500/20 p-12 rounded-[40px] text-center backdrop-blur-xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tight mb-2">{error}</h2>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-red-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-white hover:text-black transition-all flex items-center gap-3 mx-auto"
          >
            <RotateCcw size={18} />
            Tentar Novamente
          </button>
        </div>
      ) : !selectedChapter ? (
        <div className="bg-[#0a0a0c]/80 rounded-[48px] p-8 md:p-20 border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-[100px]">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-brand/10 rounded-full blur-[120px]" />
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black text-[var(--color-text-bright)] uppercase italic tracking-tighter max-w-2xl leading-[0.9]">
                {mangaTitle}
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">Via MangaDex • Priorizando PT-BR</p>
                <div className="h-px bg-white/5 flex-1 max-w-[100px]" />
                <span className="text-brand font-black text-[10px] uppercase tracking-widest">
                  {chapters.length} Capítulos Encontrados
                </span>
              </div>
            </div>
            
            {status === 'loading' && (
              <div className="flex items-center gap-3 bg-brand/10 px-4 py-2 rounded-2xl border border-brand/20">
                <Loader2 className="w-4 h-4 text-brand animate-spin" />
                <span className="text-[10px] font-black text-brand uppercase tracking-widest">Sincronizando...</span>
              </div>
            )}
          </div>
          
          {chapters.length === 0 && status !== 'loading' ? (
            <div className="text-center py-20 bg-black/20 rounded-3xl border border-dashed border-[var(--color-border)]">
              <p className="text-gray-400">Nenhum capítulo disponível para este mangá.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {chapters.map((cap, index) => {
                const isRead = getIsRead(cap);
                const isLastRead = id && localStorage.getItem(`manga_last_read_${id}`) === cap.id;
                
                return (
                  <button
                    key={cap.id}
                    onClick={() => loadChapter(cap, index)}
                    className={cn(
                      "transition-all p-4 rounded-2xl flex flex-col items-center justify-center gap-2 group border relative overflow-hidden",
                      isLastRead 
                        ? "bg-brand border-brand text-white shadow-lg shadow-brand/20 scale-[1.02]" 
                        : isRead
                          ? "bg-brand/10 border-brand/30 text-brand hover:border-brand hover:bg-brand/20"
                          : "bg-black/20 hover:bg-brand hover:text-black border-[var(--color-border)] text-gray-400"
                    )}
                  >
                    {isRead ? (
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        <CheckCircle2 className="w-4 h-4 text-brand bg-black/80 rounded-full" />
                        <button 
                          onClick={(e) => handleMarkAsUnread(e, cap)}
                          className="opacity-0 group-hover:opacity-100 transition-all p-2 bg-black/60 rounded-xl hover:bg-red-500 hover:text-white backdrop-blur-sm border border-white/10"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <BookOpen className={cn("w-6 h-6 transition-colors", isLastRead ? "text-white" : "text-gray-500 group-hover:text-black")} />
                    )}
                    
                    <span className="font-black text-sm">Capítulo {cap.attributes.chapter || '?'}</span>
                    
                    <span className="text-[10px] uppercase tracking-widest font-black opacity-50">
                      {cap.attributes.translatedLanguage?.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 pb-32 px-4 md:px-0">
          
          {/* Interaction Zone to restore controls */}
          {!controlsVisible && (
            <div 
              className="fixed top-0 left-0 w-full h-32 z-50 cursor-pointer"
              onClick={() => setControlsVisible(true)}
            />
          )}

          <motion.div 
            animate={{ 
              y: controlsVisible ? 0 : -120,
              opacity: controlsVisible ? 1 : 0,
              pointerEvents: controlsVisible ? 'auto' : 'none'
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex justify-between items-center bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)] sticky top-24 z-[70] shadow-xl flex-wrap gap-4 backdrop-blur-md bg-opacity-80"
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={clearChapter}
                className="p-2 bg-white/5 hover:bg-white/10 text-brand rounded-xl border border-white/5 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] text-brand font-black uppercase tracking-[0.2em]">MangaDex (PT-BR)</span>
                <h2 className="font-black text-white uppercase text-sm">Capítulo {selectedChapter.attributes.chapter}</h2>
              </div>
              <select 
                value={currentChapterIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  if(!isNaN(idx)) loadChapter(chapters[idx], idx);
                }}
                className="bg-black text-white border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs font-black uppercase outline-none"
              >
                {chapters.map((cap, idx) => (
                  <option key={cap.id} value={idx}>
                    Cap {cap.attributes.chapter}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={goToPrevChapter}
                disabled={currentChapterIndex <= 0}
                className="p-2 md:px-4 bg-zinc-800 text-white rounded-xl font-black uppercase text-xs disabled:opacity-50"
              >
                Anterior
              </button>
              <button 
                onClick={goToNextChapter}
                disabled={currentChapterIndex >= chapters.length - 1}
                className="p-2 md:px-4 bg-brand text-white rounded-xl font-black uppercase text-xs disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </motion.div>
          
          {loadingChapter ? (
            <div className="py-32 flex flex-col items-center justify-center gap-8 animate-pulse">
              <div className="relative">
                <div className="w-24 h-24 border-t-2 border-brand rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-brand animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic text-xl">Sincronizando Páginas</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">Codificando sequência do capítulo</p>
              </div>
            </div>
          ) : (
            <div className={cn("w-full transition-all", isLongStrip ? "flex flex-col gap-4" : "max-w-xl")}>
              {pages.length > 0 && pages[0].startsWith('external:') ? (
                <div className="py-32 flex flex-col items-center justify-center gap-6 bg-[var(--color-card)] rounded-[32px] border border-[var(--color-border)] px-4 text-center">
                  <div className="w-20 h-20 bg-brand/20 flex items-center justify-center rounded-full text-brand">
                    <BookOpen size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase italic">Capítulo Oficial</h3>
                  <a 
                    href={pages[0].replace('external:', '')}
                    target="_blank"
                    rel="noreferrer"
                    className="px-8 py-4 bg-brand text-white font-black uppercase tracking-widest text-sm rounded-2xl"
                  >
                    Ler no Site Oficial
                  </a>
                </div>
              ) : isLongStrip ? (
                <div className="flex flex-col gap-4">
                  {pages.map((url, i) => (
                    <ReaderImage key={i} url={url} index={i} isLongStrip={true} />
                  ))}
                </div>
              ) : isDualPage ? (
                <div className="flex flex-col gap-8 md:gap-12">
                  {Array.from({ length: Math.ceil(pages.length / 2) }).map((_, i) => (
                    <div key={i} className="flex gap-2 w-full justify-center max-w-7xl mx-auto">
                      <div className="w-1/2">
                        <ReaderImage url={pages[i * 2]} index={i * 2} isLongStrip={false} />
                      </div>
                      {pages[i * 2 + 1] && (
                        <div className="w-1/2">
                          <ReaderImage url={pages[i * 2 + 1]} index={i * 2 + 1} isLongStrip={false} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-12">
                   {pages.map((url, i) => (
                    <ReaderImage key={i} url={url} index={i} isLongStrip={false} />
                  ))}
                </div>
              )}

              {!pages[0]?.startsWith('external:') && (
                <div className="w-full flex justify-between gap-4 mt-8 bg-[var(--color-card)] p-6 rounded-[32px] border border-[var(--color-border)] shadow-2xl">
                  <button 
                    onClick={goToPrevChapter}
                    disabled={currentChapterIndex <= 0}
                    className="flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-sm bg-zinc-800 text-white disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button 
                    onClick={goToNextChapter}
                    disabled={currentChapterIndex >= chapters.length - 1}
                    className="flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-sm bg-brand text-white disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {showScrollTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 p-4 bg-brand text-white rounded-full shadow-2xl shadow-brand/40 hover:scale-110 active:scale-95 transition-all z-[100] border border-white/20"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </div>
  );
}
