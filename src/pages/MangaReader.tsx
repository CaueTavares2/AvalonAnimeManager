import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mangaLivreService } from '../services/mangaLivreService';
import { mangaDexScrapingService } from '../services/mangaDexScrapingService';
import { mangaService } from '../services/mangaService';
import { kitsuService } from '../services/kitsuService';
import { aniListService } from '../services/aniListService';
import { comickService } from '../services/comickService';
import { consumetService } from '../services/consumetService';
import { jikanService } from '../services/jikanService';
import { useAnimeList } from '../hooks/useAnimeList';
import { 
  ChevronLeft, 
  Loader2, 
  BookOpen, 
  Settings, 
  PanelBottom, 
  Sun, 
  Moon, 
  Smartphone, 
  Monitor,
  Layout,
  Maximize2,
  Minimize2,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const ReaderImage: React.FC<{ url: string; index: number; isLongStrip: boolean }> = ({ url, index, isLongStrip }) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setStatus('loading');
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className={cn(
      "relative w-full overflow-hidden transition-all duration-500",
      status === 'loading' ? "bg-zinc-900 aspect-[3/4] animate-pulse rounded-2xl" : "",
      !isLongStrip ? "shadow-2xl rounded-2xl bg-zinc-900 border border-white/5" : ""
    )}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 text-brand/20 animate-spin" />
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950 border border-white/5 rounded-2xl p-6">
          <RotateCcw className="w-8 h-8 text-red-500/50" />
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center">Erro ao carregar página {index + 1}</p>
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      <motion.img 
        src={status !== 'error' ? `${url}${retryCount > 0 ? `&retry=${retryCount}` : ''}` : ''}
        alt={`Pagina ${index + 1}`} 
        className={cn(
          "w-full h-auto block transition-opacity duration-700",
          status === 'loaded' ? "opacity-100" : "opacity-0 absolute pointer-events-none"
        )}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        loading="lazy"
        initial={{ opacity: 0, y: 10 }}
        animate={status === 'loaded' ? { opacity: 1, y: 0 } : {}}
      />
      
      {/* Page Number Overlay */}
      <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/40 backdrop-blur-md rounded-md border border-white/5 text-[10px] font-mono text-white/40 pointer-events-none">
        P.{index + 1}
      </div>
    </div>
  );
};

export default function MangaReader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { list, updateAnime } = useAnimeList();

  const handleMarkAsUnread = async (e: React.MouseEvent, cap: any) => {
    e.stopPropagation();
    if (!id) return;
    
    const numericId = Number(id);
    const inList = list.find(item => item.id === numericId);
    if (!inList) return;

    const currentCapNum = parseFloat(cap.attributes?.chapter) || 0;
    
    // Find the chapter before this one in the sorted chapters list
    const sortedChapters = [...chapters].sort((a, b) => (parseFloat(a.attributes?.chapter) || 0) - (parseFloat(b.attributes?.chapter) || 0));
    const idx = sortedChapters.findIndex(c => (parseFloat(c.attributes?.chapter) || 0) === currentCapNum);
    
    let newProgress = 0;
    if (idx > 0) {
      newProgress = parseFloat(sortedChapters[idx - 1].attributes?.chapter) || 0;
    }
    
    await updateAnime(numericId, { progress: newProgress });
    
    // If this was the last read chapter stored in localStorage, clear it or move to previous
    const lastReadId = localStorage.getItem(`manga_last_read_${id}`);
    if (lastReadId === cap.id) {
       if (idx > 0) {
         localStorage.setItem(`manga_last_read_${id}`, sortedChapters[idx - 1].id);
       } else {
         localStorage.removeItem(`manga_last_read_${id}`);
       }
    }
  };

  const getIsRead = (cap: any) => {
    if (!id) return false;
    const numericId = Number(id);
    const inList = list.find(item => item.id === numericId);
    if (!inList) return false;
    
    const capNum = parseFloat(cap.attributes?.chapter) || 0;
    return (inList.progress || 0) >= capNum;
  };

  
  const [providerChapters, setProviderChapters] = useState<Record<string, any[]>>({});
  const [providerStatuses, setProviderStatuses] = useState<Record<string, 'loading' | 'success' | 'error'>>({});
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<any | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(-1);
  
  const [pages, setPages] = useState<string[]>([]);
  const [loadingChapter, setLoadingChapter] = useState(false);
  
  const [mangaTitle, setMangaTitle] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('');

  // Settings
  const [brightness, setBrightness] = useState(100);
  const [isLongStrip, setIsLongStrip] = useState(true);
  const [isDualPage, setIsDualPage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [useDataSaver, setUseDataSaver] = useState(() => {
    return localStorage.getItem('manga_data_saver') === 'true';
  });

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

  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "Tablet";
    if (/Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/i.test(ua)) return "Mobile";
    return "Desktop";
  };

  const providers = [
    { id: 'mangalivre', name: 'MangaLivre', lang: 'PT', fn: async (t: string) => {
      const res = await mangaLivreService.searchManga(t).catch(() => []);
      if (!res?.length) return [];
      const matches = res.slice(0, 2);
      const feeds = await Promise.all(matches.map(m => mangaLivreService.getChapters(m.id).catch(() => [])));
      return feeds.flat();
    }},
    { id: 'mangadex', name: 'MangaDex', lang: 'EN/PT', fn: async (t: string) => {
      const res = await mangaService.searchManga(t).catch(() => null);
      if (!res?.data?.length) return [];
      const feed = await mangaService.getMangaFeed(res.data[0].id).catch(() => null);
      return feed?.data || [];
    }},
    { id: 'comick', name: 'Comick', lang: 'PT/EN', fn: async (t: string) => {
      const res = await comickService.searchManga(t).catch(() => []);
      if (!res?.length) return [];
      const info = await comickService.getMangaChapters(res[0].hid).catch(() => []);
      return info;
    }},
    { id: 'bato', name: 'Bato', lang: 'EN', fn: async (t: string) => {
      const res = await consumetService.searchManga(t, 'bato').catch(() => null);
      if (!res?.results?.length) return [];
      const info = await consumetService.getMangaInfo(res.results[0].id, 'bato').catch(() => null);
      return info?.chapters || [];
    }},
    { id: 'manganato', name: 'Nato', lang: 'EN', fn: async (t: string) => {
      const res = await consumetService.searchManga(t, 'manganato').catch(() => null);
      if (!res?.results?.length) return [];
      const info = await consumetService.getMangaInfo(res.results[0].id, 'manganato').catch(() => null);
      return info?.chapters || [];
    }},
    { id: 'mangakakalot', name: 'Kakalot', lang: 'EN', fn: async (t: string) => {
      const res = await consumetService.searchManga(t, 'mangakakalot').catch(() => null);
      if (!res?.results?.length) return [];
      const info = await consumetService.getMangaInfo(res.results[0].id, 'mangakakalot').catch(() => null);
      return info?.chapters || [];
    }},
     { id: 'mangasee', name: 'MangaSee', lang: 'EN', fn: async (t: string) => {
      const res = await consumetService.searchManga(t, 'mangasee123').catch(() => null);
      if (!res?.results?.length) return [];
      const info = await consumetService.getMangaInfo(res.results[0].id, 'mangasee123').catch(() => null);
      return info?.chapters || [];
    }},
    { id: 'readm', name: 'ReadM', lang: 'EN', fn: async (t: string) => {
      const res = await consumetService.searchManga(t, 'readm').catch(() => null);
      if (!res?.results?.length) return [];
      const info = await consumetService.getMangaInfo(res.results[0].id, 'readm').catch(() => null);
      return info?.chapters || [];
    }},
    { id: 'mangapark', name: 'Park', lang: 'EN', fn: async (t: string) => {
      const res = await consumetService.searchManga(t, 'mangapark').catch(() => null);
      if (!res?.results?.length) return [];
      const info = await consumetService.getMangaInfo(res.results[0].id, 'mangapark').catch(() => null);
      return info?.chapters || [];
    }},
    { id: 'mangareader', name: 'Reader', lang: 'EN', fn: async (t: string) => {
      const res = await consumetService.searchManga(t, 'mangareader').catch(() => null);
      if (!res?.results?.length) return [];
      const info = await consumetService.getMangaInfo(res.results[0].id, 'mangareader').catch(() => null);
      return info?.chapters || [];
    }}
  ];

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        setProviderChapters({});
        setProviderStatuses(providers.reduce((acc, p) => ({ ...acc, [p.id]: 'loading' }), {}));
        
        let jikanData = await jikanService.getDetails(Number(id), 'manga');
        let kitsuData = null;
        let aniListData = null;

        try {
          if (jikanData) {
            const searchTitle = jikanData.title;
            const [kitsu, anilist] = await Promise.all([
              kitsuService.getMangaBySlug(searchTitle.toLowerCase().replace(/\s+/g, '-')).catch(() => null),
              aniListService.getMangaByTitle(searchTitle).catch(() => null)
            ]);
            kitsuData = kitsu;
            aniListData = anilist;
            
            if (!kitsuData) {
              const kitsuResults = await kitsuService.searchManga(searchTitle).catch(() => []);
              if (kitsuResults.length > 0) kitsuData = kitsuResults[0];
            }
          }
        } catch (e) {
          console.warn("External metadata fetch failed", e);
        }
        
        if (!jikanData && !kitsuData && !aniListData) {
          setError("Não foi possível encontrar detalhes deste mangá.");
          setLoading(false);
          return;
        }

        const title = jikanData?.title || kitsuData?.attributes?.canonicalTitle || aniListData?.title?.romaji;
        setMangaTitle(title);

        const titlesToTry = [
          jikanData?.title, 
          jikanData?.title_english, 
          jikanData?.title_japanese,
          ...(jikanData?.title_synonyms || []),
          kitsuData?.attributes?.canonicalTitle,
          kitsuData?.attributes?.titles?.en,
          kitsuData?.attributes?.titles?.en_jp,
          kitsuData?.attributes?.titles?.ja_jp,
          aniListData?.title?.romaji,
          aniListData?.title?.english,
          aniListData?.title?.native,
          ...(aniListData?.synonyms || [])
        ].filter(Boolean) as string[];
        
        // Broader titles (remove some symbols)
        const commonTitles = titlesToTry.map(t => t.replace(/[:!-]/g, ' ').replace(/\s+/g, ' ').trim());
        const searchTitles = Array.from(new Set([...titlesToTry, ...commonTitles])).filter(t => t.length > 2);

        // Process function
        const processChapters = (feedData: any[], sourceName: string) => {
          return feedData.map(cap => {
            let rawCh = cap.attributes?.chapter || cap.chapter || cap.number || cap.chap || '';
            const match = String(rawCh).match(/(\d+(\.\d+)?)/);
            const numKey = match ? parseFloat(match[1]).toString() : String(rawCh).trim();

            let lang = (cap.attributes?.translatedLanguage || cap.translatedLanguage || cap.lang || '').toLowerCase();
            if (!lang) {
              if (sourceName === 'mangalivre' || sourceName === 'comick') lang = 'pt-br';
              else if (sourceName.startsWith('consumet')) lang = 'en';
              else lang = 'en';
            }

            return {
              ...cap,
              id: cap.id || cap.hid || cap.chapterId,
              source: sourceName,
              numKey,
              attributes: cap.attributes || { chapter: rawCh, translatedLanguage: lang }
            };
          });
        };

        setLoading(false); // Enable UI after metadata is ready

        // Background Search
        providers.forEach(async (p, idx) => {
          try {
            await new Promise(r => setTimeout(r, idx * 300)); // Staggered loading
            let results: any[] = [];
            
            const isNative = ['mangalivre', 'mangadex', 'comick'].includes(p.id);
            const sourceName = isNative ? p.id : `consumet-${p.id}`;
            
            for (const t of searchTitles) {
               const raw = await p.fn(t);
               if (raw && raw.length > 0) {
                 results = processChapters(raw, sourceName);
                 break;
               }
            }

            if (results.length > 0) {
              const seen = new Set();
              const unique = results.filter(c => {
                 if (seen.has(c.numKey)) return false;
                 seen.add(c.numKey);
                 return true;
              });
              unique.sort((a, b) => (parseFloat(a.numKey) || 0) - (parseFloat(b.numKey) || 0));
              
              setProviderChapters(prev => ({ ...prev, [p.id]: unique }));
              setProviderStatuses(prev => ({ ...prev, [p.id]: 'success' }));
              
              // Direct update if this is the first successful or preferred one
              setChapters(current => {
                 if (current.length === 0) return unique;
                 return current;
              });
              setCurrentProvider(current => {
                 if (!current) return p.id;
                 if (p.id === 'mangalivre' && current !== 'mangalivre') return 'mangalivre';
                 return current;
              });
              setSelectedSource(current => {
                 if (!current) return p.id;
                 if (p.id === 'mangalivre' && current !== 'mangalivre') return 'mangalivre';
                 return current;
              });
            } else {
              setProviderStatuses(prev => ({ ...prev, [p.id]: 'error' }));
            }
          } catch (e) {
            setProviderStatuses(prev => ({ ...prev, [p.id]: 'error' }));
          }
        });

      } catch (err) {
        console.error(err);
        setError('Erro ao preparar leitura.');
        setLoading(false);
      }
    };
    if (id) init();
  }, [id, refreshTrigger]);

  useEffect(() => {
    if (currentProvider && providerChapters[currentProvider]) {
      setChapters(providerChapters[currentProvider]);
    }
  }, [currentProvider, providerChapters]);

  const switchProvider = (pid: string) => {
    setCurrentProvider(pid);
    setSelectedSource(pid);
    if (providerChapters[pid]) {
      setChapters(providerChapters[pid]);
    } else {
      setChapters([]);
    }
  };


  const retryInit = () => {
    setRefreshTrigger(prev => prev + 1);
  };

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
       const chapterNumber = Number(chapter.attributes?.chapter) || (index + 1);
       
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
        setLoadingChapter(false);
        return;
      }

      let images: string[] = [];
      const PROXY_URL = '/api/proxy?url=';

      const fetchPagesMatchSource = async (src: string, cap: any) => {
        if (src === 'mangalivre') {
          const pageRes = await mangaLivreService.getPages(cap.id);
          return pageRes?.map((img: any) => `${PROXY_URL}${encodeURIComponent(img.legacy || img.full || `${img.folder}${img.file}`)}`);
        } else if (src === 'comick') {
          const pageRes = await comickService.getChapterDetails(cap.hid || cap.id);
          return pageRes?.chapter?.images?.map((img: any) => `${PROXY_URL}${encodeURIComponent(`https://meo.comick.pictures/${img.url}`)}`);
        } else if (src.startsWith('consumet')) {
          const provider = src.split('-')[1] || 'mangadex';
          const pageRes = await consumetService.getChapterPages(cap.id, provider);
          return pageRes?.map((p: any) => `${PROXY_URL}${encodeURIComponent(p.img)}`);
        } else {
          // mangadex
          const pageRes = await mangaService.getChapterPages(cap.id, useDataSaver);
          return pageRes?.pages || null;
        }
        return null;
      };

      images = await fetchPagesMatchSource(chapter.source, chapter) || [];
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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-brand animate-spin" />
        <p className="text-gray-400 font-bold tracking-widest uppercase text-sm">Buscando capítulos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 md:px-12 pb-12 max-w-5xl mx-auto" style={{ filter: `brightness(${brightness}%)` }}>
      {/* Header Info */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <button 
          onClick={() => selectedChapter ? clearChapter() : navigate(-1)}
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
             <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic">
                * Data Saver reduz o uso de dados em até 50% (MangaDex). Recarregue o capítulo para aplicar.
             </p>
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
                <Smartphone size={14} /> Vertical
              </button>
              <button 
                onClick={() => { setIsLongStrip(false); setIsDualPage(false); }}
                className={cn(
                  "flex-1 py-2 px-4 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2",
                  (!isLongStrip && !isDualPage) ? "bg-brand text-white" : "bg-white/5 text-gray-400"
                )}
              >
                <Monitor size={14} /> Single
              </button>
              <button 
                onClick={() => { setIsLongStrip(false); setIsDualPage(true); }}
                className={cn(
                  "flex-1 py-2 px-4 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2",
                  isDualPage ? "bg-brand text-white" : "bg-white/5 text-gray-400"
                )}
              >
                <Layout size={14} /> Dual
              </button>
            </div>
          </div>

          {/* Secret Device ID */}
          <div className="md:col-span-2 pt-4 border-t border-white/5 flex justify-between items-center opacity-30 hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Dev Mode</span>
            <span className="text-[10px] font-mono text-brand uppercase">UID: {getDeviceType()} v1.02</span>
          </div>
        </div>
      )}

      {error && !selectedChapter ? (
        <div className="bg-red-500/5 border border-red-500/20 p-12 rounded-[40px] text-center backdrop-blur-xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tight mb-2">{error}</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Tente buscar em outros provedores ou verifique sua conexão com a internet.</p>
          <button 
            onClick={retryInit}
            className="px-8 py-4 bg-red-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-white hover:text-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-red-500/20 flex items-center gap-3 mx-auto"
          >
            <RotateCcw size={18} />
            Tentar Novamente
          </button>
        </div>
      ) : !selectedChapter ? (
        <div className="bg-[#0a0a0c]/80 rounded-[48px] p-8 md:p-20 border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-[100px]">
          {/* Bento grid pattern background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-brand/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[150px]" />
          
          {/* Provider Tabs - Advanced Source Selector */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.4em]">Fontes Disponíveis</h3>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
                 <span className="text-[9px] font-bold text-brand uppercase tracking-widest">Live Search</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {providers.map(p => {
                const status = providerStatuses[p.id];
                const count = providerChapters[p.id]?.length || 0;
                const isSelected = currentProvider === p.id;
                
                return (
                  <button
                    key={p.id}
                    onClick={() => switchProvider(p.id)}
                    disabled={status === 'error'}
                    className={cn(
                      "relative group flex flex-col items-center justify-center py-4 px-2 rounded-2xl border transition-all duration-500 overflow-hidden",
                      isSelected 
                        ? "bg-brand border-brand text-white shadow-2xl shadow-brand/40 scale-105 z-10" 
                        : status === 'error'
                          ? "bg-black/20 border-white/5 text-gray-700 cursor-not-allowed opacity-50"
                          : "bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-center truncate w-full px-2">
                       {p.name}
                    </span>
                    
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={cn(
                        "text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter",
                        isSelected ? "bg-white/20 text-white" : "bg-brand/10 text-brand"
                      )}>
                        {p.lang}
                      </span>
                      
                      {status === 'loading' ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin opacity-50" />
                      ) : status === 'success' ? (
                        <span className={cn(
                          "text-[8px] font-bold opacity-80",
                          isSelected ? "text-white" : "text-gray-400"
                        )}>
                          {count} Cap
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold text-red-900/50">OFFLINE</span>
                      )}
                    </div>

                    {isSelected && (
                      <motion.div 
                        layoutId="activeSource"
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-white rounded-full" 
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black text-[var(--color-text-bright)] uppercase italic tracking-tighter max-w-2xl leading-[0.9]">
                {mangaTitle}
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">Prepare seu café e boa leitura</p>
                <div className="h-px bg-white/5 flex-1 max-w-[100px]" />
                <span className="text-brand font-black text-[10px] uppercase tracking-widest">
                  {chapters.length} Capítulos Encontrados
                </span>
              </div>
            </div>
            
            {currentProvider && providerStatuses[currentProvider] === 'loading' && (
              <div className="flex items-center gap-3 bg-brand/10 px-4 py-2 rounded-2xl border border-brand/20">
                <Loader2 className="w-4 h-4 text-brand animate-spin" />
                <span className="text-[10px] font-black text-brand uppercase tracking-widest">Buscando nesta fonte...</span>
              </div>
            )}
          </div>
          
          {chapters.length === 0 ? (
            <div className="text-center py-20 bg-black/20 rounded-3xl border border-dashed border-[var(--color-border)]">
              <p className="text-gray-400">Nenhum capítulo disponível.</p>
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
                          className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-all p-2 bg-red-500/20 md:bg-black/60 rounded-xl hover:bg-red-500 hover:text-white backdrop-blur-sm border border-red-500/30 md:border-white/10 flex items-center gap-1"
                          title="Desmarcar como lido"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span className="md:hidden text-[8px] font-black uppercase tracking-tighter">Undo</span>
                        </button>
                      </div>
                    ) : (
                      <BookOpen className={cn("w-6 h-6 transition-colors", isLastRead ? "text-white" : "text-gray-500 group-hover:text-black")} />
                    )}
                    
                    <span className="font-black text-sm">Capítulo {cap.attributes.chapter || '?'}</span>
                    
                    {isLastRead ? (
                      <span className="text-[10px] uppercase tracking-widest font-black opacity-80">Último Lido</span>
                    ) : isRead ? (
                      <span className="text-[10px] uppercase tracking-widest font-black opacity-50">Lido</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 pb-32 px-4 md:px-0">
          {/* Reader Controls */}
          <div className="w-full flex justify-between items-center bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)] sticky top-24 z-10 shadow-xl flex-wrap gap-4 backdrop-blur-md bg-opacity-80">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-brand font-black uppercase tracking-[0.2em]">
                  {selectedChapter.source === 'mangalivre' ? 'MangaLivre (PT)' : 
                   selectedChapter.source === 'mangadex' ? 'MangaDex (EN/PT)' :
                   selectedChapter.source.replace('consumet-', '').toUpperCase()}
                </span>
                <h2 className="font-black text-white uppercase text-sm">Capítulo {selectedChapter.attributes.chapter}</h2>
              </div>
              <select 
                value={currentChapterIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  if(!isNaN(idx)) loadChapter(chapters[idx], idx);
                }}
                className="bg-black text-white border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs font-black uppercase tracking-widest outline-none appearance-none cursor-pointer hover:border-brand transition-colors"
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
                className="p-2 md:px-4 bg-zinc-800 text-white rounded-xl font-black uppercase text-xs tracking-widest disabled:opacity-50 hover:bg-zinc-700 transition-all active:scale-95"
              >
                <ChevronLeft size={16} className="md:hidden" />
                <span className="hidden md:inline">Anterior</span>
              </button>
              <button 
                onClick={goToNextChapter}
                disabled={currentChapterIndex >= chapters.length - 1}
                className="p-2 md:px-4 bg-brand text-white rounded-xl font-black uppercase text-xs tracking-widest disabled:opacity-50 hover:bg-white hover:text-black transition-all active:scale-95 shadow-lg shadow-brand/20"
              >
                <span className="md:hidden">{'>'}</span>
                <span className="hidden md:inline">Próximo</span>
              </button>
            </div>
          </div>
          
          {loadingChapter ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
               <Loader2 className="w-12 h-12 text-brand animate-spin" />
               <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Carregando páginas...</p>
            </div>
          ) : (
            <div className={cn(
              "w-full transition-all",
              isLongStrip ? "flex flex-col gap-4" : "max-w-xl"
            )}>
              {pages.length > 0 && pages[0].startsWith('external:') ? (
                <div className="py-32 flex flex-col items-center justify-center gap-6 bg-[var(--color-card)] rounded-[32px] border border-[var(--color-border)] px-4 text-center">
                  <div className="w-20 h-20 bg-brand/20 flex items-center justify-center rounded-full text-brand">
                    <BookOpen size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white uppercase italic">Capítulo Oficial</h3>
                    <p className="text-gray-400 max-w-sm mx-auto font-medium">
                      Este capítulo redireciona para a fonte oficial. A leitura externa é necessária.
                    </p>
                  </div>
                  <a 
                    href={pages[0].replace('external:', '')}
                    target="_blank"
                    rel="noreferrer"
                    className="px-8 py-4 bg-brand text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-white hover:text-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-brand/20"
                  >
                    Ler no Site Oficial
                  </a>
                </div>
              ) : isLongStrip ? (
                <div className="flex flex-col gap-4">
                  {pages.map((url, i) => (
                    <ReaderImage 
                      key={i} 
                      url={url} 
                      index={i} 
                      isLongStrip={true} 
                    />
                  ))}
                </div>
              ) : isDualPage ? (
                <div className="flex flex-col gap-8 md:gap-12">
                  {Array.from({ length: Math.ceil(pages.length / 2) }).map((_, i) => (
                    <div key={i} className="flex gap-2 w-full justify-center max-w-7xl mx-auto">
                      <div className="w-1/2">
                        <ReaderImage 
                          url={pages[i * 2]} 
                          index={i * 2} 
                          isLongStrip={false} 
                        />
                      </div>
                      {pages[i * 2 + 1] && (
                        <div className="w-1/2">
                          <ReaderImage 
                            url={pages[i * 2 + 1]} 
                            index={i * 2 + 1} 
                            isLongStrip={false} 
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-12">
                   {pages.map((url, i) => (
                    <ReaderImage 
                      key={i} 
                      url={url} 
                      index={i} 
                      isLongStrip={false} 
                    />
                  ))}
                </div>
              )}

              {/* Bottom Navigation */}
              {!pages[0]?.startsWith('external:') && (
                <div className="w-full flex justify-between gap-4 mt-8 bg-[var(--color-card)] p-6 rounded-[32px] border border-[var(--color-border)] shadow-2xl">
                  <button 
                    onClick={goToPrevChapter}
                    disabled={currentChapterIndex <= 0}
                    className="flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-sm transition-all disabled:opacity-50 bg-zinc-800 text-white hover:bg-zinc-700 active:scale-95"
                  >
                    Capítulo Anterior
                  </button>
                  <button 
                    onClick={goToNextChapter}
                    disabled={currentChapterIndex >= chapters.length - 1}
                    className="flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-sm transition-all disabled:opacity-50 bg-brand text-white hover:bg-white hover:text-black active:scale-95 shadow-xl shadow-brand/20"
                  >
                    Próximo Capítulo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
