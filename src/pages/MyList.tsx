import { useAnimeList, AnimeStatus, UserAnime } from '../hooks/useAnimeList';
import { LayoutGrid, List as ListIcon, Trash2, Edit2, TrendingUp, Star, Loader2, RefreshCw, Sparkles, Search, X, Zap, Crown, Compass, Shuffle } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import CompletionModal from '../components/shared/CompletionModal';
import AnimeListRow from '../components/anime/AnimeListRow';
import { useLanguage } from '../context/LanguageContext';
import { rankingService } from '../services/rankingService';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { motion, AnimatePresence } from 'motion/react';

const ITEMS_PER_CHUNK = 50;

export default function MyList() {
  const { list, updateAnime, removeAnime } = useAnimeList();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { t, formatTitle } = useLanguage();
  const navigate = useNavigate();
  const [mediaType, setMediaType] = useState<'ANIME' | 'MANGA'>('ANIME');
  const [filter, setFilter] = useState<AnimeStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: 'title' | 'score' | null, direction: 'asc' | 'desc' | 'normal' }>({ key: null, direction: 'normal' });

  // Automatically sync Otaku Points (PO) on list changes with a 5s debounce for performance
  useEffect(() => {
    if (!user || list.length === 0) return;


    const timer = setTimeout(async () => {
      try {
        await rankingService.syncListPoints(user.uid, list);
        console.log("Pontos de Otaku (PO) sincronizados automaticamente com sucesso!");
      } catch (error) {
        console.error("Auto PO sync error:", error);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [list, user]);
  const [completedAnime, setCompletedAnime] = useState<UserAnime | null>(null);
  const [suggestion, setSuggestion] = useState<UserAnime | null>(null);
  
  // Advanced Suggestion Roulette state
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningImage, setSpinningImage] = useState('');
  const [spinningTitle, setSpinningTitle] = useState('');
  const [vibeFilter, setVibeFilter] = useState<'any' | 'quick' | 'treasures' | 'marathon'>('any');

  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_CHUNK);
  const observerTarget = useRef<HTMLDivElement>(null);

  const filteredList = useMemo(() => {
    let typeFiltered = list.filter(a => a.type === mediaType);
    let result = filter === 'ALL' ? typeFiltered : typeFiltered.filter(a => a.status === filter);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => a.title.toLowerCase().includes(query));
    }

    // Filter duplicates by id just in case
    const seen = new Set();
    result = result.filter(a => {
      const duplicate = seen.has(a.id);
      seen.add(a.id);
      return !duplicate;
    });

    if (sortConfig.key && sortConfig.direction !== 'normal') {
      result = [...result].sort((a, b) => {
        if (sortConfig.key === 'title') {
          const titleA = a.title.toLowerCase();
          const titleB = b.title.toLowerCase();
          if (titleA < titleB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (titleA > titleB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        } else if (sortConfig.key === 'score') {
          const scoreA = a.score || 0;
          const scoreB = b.score || 0;
          return sortConfig.direction === 'asc' ? scoreA - scoreB : scoreB - scoreA;
        }
        return 0;
      });
    }
    return result;
  }, [list, filter, mediaType, sortConfig, searchQuery]);

  const visibleList = useMemo(() => 
    filteredList.slice(0, visibleCount),
  [filteredList, visibleCount]);

  // Infinite scroll logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && visibleCount < filteredList.length) {
          setVisibleCount(prev => prev + ITEMS_PER_CHUNK);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [filteredList.length, visibleCount]);

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_CHUNK);
  }, [filter, sortConfig]);

  const toggleSort = (key: 'title' | 'score') => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'normal') return { key, direction: 'asc' };
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return { key: null, direction: 'normal' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleStatusChange = useCallback((id: number, newStatus: AnimeStatus) => {
    const anime = list.find(a => a.id === id);
    if (newStatus === 'COMPLETED' && anime && anime.status !== 'COMPLETED') {
      setCompletedAnime(anime);
    }
    updateAnime(id, { status: newStatus });

    if (anime) {
      import('../services/trackerService').then(({ trackerService }) => {
        trackerService.syncToAllActive(id, newStatus, anime.progress, anime.score);
      });
    }
  }, [list, updateAnime]);

  const handleProgressUpdate = useCallback((id: number, increment: boolean) => {
    const anime = list.find(a => a.id === id);
    if (!anime) return;

    let newProgress = increment 
      ? Math.min(anime.totalProgress || 999, anime.progress + 1)
      : Math.max(0, anime.progress - 1);
    
    let newStatus = anime.status;
    if (anime.totalProgress && newProgress === anime.totalProgress) {
      if (anime.status !== 'COMPLETED') {
        setCompletedAnime(anime);
      }
      newStatus = 'COMPLETED';
    }

    updateAnime(id, { progress: newProgress, status: newStatus });

    import('../services/trackerService').then(({ trackerService }) => {
      trackerService.syncToAllActive(id, newStatus, newProgress, anime.score);
    });
  }, [list, updateAnime]);

  const handleSuggestion = (forcedVibe?: 'any' | 'quick' | 'treasures' | 'marathon') => {
    if (!list || list.length === 0) {
        console.error('List is empty, cannot suggest.');
        return;
    }
    const activeVibe = forcedVibe || vibeFilter;

    // Advanced Next-Season Auto-Detector & Smart Filtering logic
    // We group by anime/manga franchise root by stripping out common sequel suffixes or notations.
    const sanitizeTitle = (t: string) => {
      let clean = t;
      // Strip Common Season/Part indicators of sequels/continuations
      clean = clean.replace(/\s\b(season|temporada|temp|s\d|t\d)\s*(2|3|4|5|6|7|8|9|10|[iI|vV|xX]+)?\b/gi, '');
      clean = clean.replace(/\s\b([2-9]|\d{2,})(nd|rd|th)\s+(season|temporada)\b/gi, '');
      clean = clean.replace(/\s\b(part|partie|parte|cour|arc)\s*(2|3|4|5|6|7|8|9|10|[iI|vV|xX]+)?\b/gi, '');
      clean = clean.replace(/\s\b(ii|iii|iv|v|vi|vii|viii|ix|x)\b/gi, '');
      clean = clean.replace(/\s([2-9])$/, '');
      clean = clean.replace(/\b(r2|r3)\b/gi, '');
      // Strip subtitle delimiters
      clean = clean.replace(/[:\-].*$/i, '');
      return clean.trim().toLowerCase();
    };

    const isSequelOrSubsequentSeason = (title: string): boolean => {
      const norm = title.toLowerCase().trim();

      // Standalone or trailing Roman numerals from II to X (cases like "Date A Live V", "InuYasha Kanketsu-hen")
      if (/\b(ii|iii|iv|v|vi|vii|viii|ix|x)\b$/i.test(norm)) return true;
      if (/\b(ii|iii|iv|v|vi|vii|viii|ix|x)\b[\s:\-]/i.test(norm)) return true;

      // Season with indices >= 2
      if (/\b(season|temporada|temp|s|t)\s*([2-9]|\d{2,})\b/i.test(norm)) return true;
      if (/\b(season|temporada|temp\.)\s*([iI][iI]+|[iI][vV]|[vV]|[vV][iI]+|[iI][xX]|[xX])\b/i.test(norm)) return true;

      // Ordinal seasons >= 2nd
      if (/\b([2-9]|\d{2,})(nd|rd|th|ª|º)\s*(season|temporada|temp|part|parte)\b/i.test(norm)) return true;

      // Parts >= 2
      if (/\b(part|partie|parte|cour|arc)\s*([2-9]|0[2-9]|\d{2,})\b/i.test(norm)) return true;
      if (/\b(part|partie|parte|cour|arc)\s*(ii|iii|iv|v|vi|vii|viii|ix|x)\b/i.test(norm)) return true;

      // Standalone trailing digit >= 2 (e.g. Kaguya-sama 3)
      if (/\s([2-9]|\d{2,})$/.test(norm)) return true;

      // R2 / R3 sequels
      if (/\b(r[2-9]|final\s+season|final\s+part|last\s+season|sequel|continuacao|continuação)\b/i.test(norm)) return true;

      // Common sequel title keywords (exclusive/distinctive sequel keywords)
      const sequelKeywords = [
        'culling game',
        'shimetsu kaiyuu',
        'shibuya jihen',
        'shibuya incident',
        'mugen train',
        'entertainment district',
        'yuukaku-hen',
        'swordsmith village',
        'katanakaji no riso-hen',
        'hashira training',
        'hashira geiko-hen',
        'final season',
        'last season',
        'season finale',
        'final chapter',
        'kouhen',
        'zenpen',
        'shigaiku',
        'kyoto saga',
        'kanketsu-hen',
        'movie 0',
        '0 the movie'
      ];
      if (sequelKeywords.some(keyword => norm.includes(keyword))) return true;

      return false;
    };

    const getChronologicalSortValue = (item: UserAnime) => {
      const title = item.title.toLowerCase();
      if (!isSequelOrSubsequentSeason(item.title)) {
        return 0;
      }
      const matchDigit = title.match(/\b(?:season|temporada|part|parte|seq|v)\s*([0-9]+)\b/i) || title.match(/\s([2-9]|\d+)\b$/);
      if (matchDigit) {
        return parseInt(matchDigit[1], 10);
      }
      const matchRoman = title.match(/\b(ii|iii|iv|v|vi|vii|viii|ix|x)\b/i);
      if (matchRoman) {
        const romanMap: Record<string, number> = { ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };
        return romanMap[matchRoman[1].toLowerCase()] || 2;
      }
      return 1.5;
    };

    const getGroups = () => {
      const groups: Record<string, UserAnime[]> = {};
      list.filter(a => a.type === mediaType).forEach(a => {
        const root = sanitizeTitle(a.title);
        if (!groups[root]) groups[root] = [];
        groups[root].push(a);
      });
      return groups;
    };

    const groups = getGroups();
    const candidateList: UserAnime[] = [];

    Object.values(groups).forEach(franchise => {
      // Sort franchise chronologically by season/part numerical value
      franchise.sort((a, b) => getChronologicalSortValue(a) - getChronologicalSortValue(b));
      
      const uncompleted = franchise.filter(a => a.status !== 'COMPLETED' && a.status !== 'DROPPED');
      if (uncompleted.length > 0) {
        const firstIncomplete = uncompleted[0];
        
        // Find any earlier prequel in this franchise that has status planning or watching
        const incompletePrequel = franchise.find(anime => {
          return (
            (anime.status !== 'COMPLETED' && anime.status !== 'DROPPED') &&
            getChronologicalSortValue(anime) < getChronologicalSortValue(firstIncomplete)
          );
        });

        if (incompletePrequel) {
          // Add the earlier uncompleted prequel to candidate list instead of the sequel!
          candidateList.push(incompletePrequel);
        } else {
          // If first incomplete is franchise start or previous parts are fully completed, push
          candidateList.push(firstIncomplete);
        }
      }
    });

    // Fallback: If candidate list became completely empty because everything left is a sequel/season, 
    // fall back to showing original uncompleted list items without the sequel filter.
    let finalCandidates = candidateList.length > 0 ? candidateList : list.filter(a => a.type === mediaType && a.status !== 'COMPLETED' && a.status !== 'DROPPED');
    
    // Final fallback: If still empty (e.g. all completed), just use anything of that type
    if (finalCandidates.length === 0) {
      finalCandidates = list.filter(a => a.type === mediaType);
    }

    // Apply interactive "Vibe Filter" on top of final candidates
    let vibeCandidates = [...finalCandidates];
    if (activeVibe === 'quick') {
      vibeCandidates = finalCandidates.filter(a => a.totalProgress && a.totalProgress <= 13);
      if (vibeCandidates.length === 0) {
        vibeCandidates = [...finalCandidates].sort((a, b) => (a.totalProgress || 12) - (b.totalProgress || 12)).slice(0, 5);
      }
    } else if (activeVibe === 'marathon') {
      vibeCandidates = finalCandidates.filter(a => !a.totalProgress || a.totalProgress > 13);
      if (vibeCandidates.length === 0) {
        vibeCandidates = [...finalCandidates].sort((a, b) => (b.totalProgress || 24) - (a.totalProgress || 24)).slice(0, 5);
      }
    } else if (activeVibe === 'treasures') {
      // High rating candidates or items that user scored high, or favorited
      vibeCandidates = finalCandidates.filter(a => a.score && a.score >= 8);
      if (vibeCandidates.length === 0) {
        vibeCandidates = [...finalCandidates].filter(a => a.score && a.score > 0);
      }
    }

    if (vibeCandidates.length === 0) {
      vibeCandidates = finalCandidates;
    }

    if (vibeCandidates.length === 0) {
      return;
    }

    // Sub-select candidates in PLANNING first if any are planning, within the vibe candidates
    let planningCandidates = vibeCandidates.filter(a => a.status === 'PLANNING');
    if (planningCandidates.length === 0) {
      planningCandidates = vibeCandidates;
    }
    
    if (planningCandidates.length === 0) return;
    const chosenOne = planningCandidates[Math.floor(Math.random() * planningCandidates.length)];
    
    // Start spinning/wheel animation in the UI modal
    setSuggestion(chosenOne);
    setIsSpinning(true);
    setSpinningTitle(formatTitle(chosenOne));
    setSpinningImage(chosenOne.image);

    // Dynamic shuffle list for cover animation
    const listForShuffle = list.filter(a => a.type === mediaType && a.id !== chosenOne.id);
    if (listForShuffle.length > 2) {
      let runCount = 0;
      const totalRuns = 15;
      
      const triggerSpinCycle = () => {
        if (runCount < totalRuns) {
          const rand = listForShuffle[Math.floor(Math.random() * listForShuffle.length)];
          setSpinningTitle(formatTitle(rand));
          setSpinningImage(rand.image);
          runCount++;
          const delay = 60 + (runCount * 18); // progressive deceleration
          setTimeout(triggerSpinCycle, delay);
        } else {
          // resolve the spin to final selection
          setSpinningTitle(formatTitle(chosenOne));
          setSpinningImage(chosenOne.image);
          setIsSpinning(false);
        }
      };
      
      setTimeout(triggerSpinCycle, 60);
    } else {
      // Instantly finish if list doesn't have enough random items to shuffle
      setIsSpinning(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--color-border)] pb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">
                {t('list.title')} <span className="text-brand not-italic opacity-40 ml-1">#{profile?.numericId || '??'}</span>
              </h1>
              <span className="bg-brand text-white px-2 py-0.5 rounded text-[10px] font-bold">{filteredList.length}</span>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setMediaType('ANIME')}
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                  mediaType === 'ANIME' ? "text-brand" : "text-gray-500 hover:text-gray-400"
                )}
              >
                Animes
              </button>
              <button 
                onClick={() => setMediaType('MANGA')}
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                  mediaType === 'MANGA' ? "text-brand" : "text-gray-500 hover:text-gray-400"
                )}
              >
                Mangás
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative group w-full md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 group-focus-within:text-brand transition-colors" />
              <input 
                type="text"
                placeholder="Pesquisar na lista..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-bright)] focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all shadow-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button 
              onClick={() => handleSuggestion()}
              disabled={filteredList.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-brand/10 border border-brand/20 text-brand rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all shadow-lg shadow-brand/5 group disabled:opacity-40 disabled:hover:bg-brand/10 disabled:hover:text-brand disabled:shadow-none whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand group-hover:rotate-12 transition-transform shrink-0" /> Me Surpreenda!
            </button>

            <div className="flex bg-[var(--color-card)] p-1 rounded-lg border border-[var(--color-border)] shadow-sm">
            {(['ALL', 'WATCHING', 'READING', 'COMPLETED', 'PLANNING', 'DROPPED'] as const).map(f => {
              // Hide READING for Anime, hide WATCHING for Manga (optional UX)
              if (mediaType === 'ANIME' && f === 'READING') return null;
              if (mediaType === 'MANGA' && f === 'WATCHING') return null;
              
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                    filter === f ? "bg-brand text-white" : "text-gray-400 hover:text-brand"
                  )}
                >
                  {t(`list.${f.toLowerCase()}`)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

        {filteredList.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 bg-[var(--color-card)] rounded-full flex items-center justify-center mx-auto text-gray-300">
              <TrendingUp className="w-8 h-8" />
            </div>
            <p className="text-gray-400 font-medium">{t('list.empty')}</p>
            <Link to="/" className="text-brand font-bold text-sm hover:underline">{t('list.browse_trending')}</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black border-b border-[var(--color-border)] select-none">
                <tr>
                  <th className="px-4 py-4 w-20">COVER</th>
                  <th 
                    className="px-4 py-4 cursor-pointer hover:text-[var(--color-text-bright)] transition-colors"
                    onClick={() => toggleSort('title')}
                  >
                    <div className="flex items-center gap-1">
                      TITLE
                      <span className="flex flex-col gap-[1px]">
                        <span className={cn("text-[6px] leading-[4px]", sortConfig.key === 'title' && sortConfig.direction === 'desc' ? "text-brand" : "text-gray-600 opacity-50")}>▲</span>
                        <span className={cn("text-[6px] leading-[4px]", sortConfig.key === 'title' && sortConfig.direction === 'asc' ? "text-brand" : "text-gray-600 opacity-50")}>▼</span>
                      </span>
                    </div>
                  </th>
                  <th 
                    className="px-4 py-4 text-center cursor-pointer hover:text-[var(--color-text-bright)] transition-colors"
                    onClick={() => toggleSort('score')}
                  >
                     <div className="flex items-center justify-center gap-1">
                      SCORE
                      <span className="flex flex-col gap-[1px]">
                        <span className={cn("text-[6px] leading-[4px]", sortConfig.key === 'score' && sortConfig.direction === 'desc' ? "text-brand" : "text-gray-600 opacity-50")}>▲</span>
                        <span className={cn("text-[6px] leading-[4px]", sortConfig.key === 'score' && sortConfig.direction === 'asc' ? "text-brand" : "text-gray-600 opacity-50")}>▼</span>
                      </span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center">STATUS</th>
                  <th className="px-4 py-4 text-center">PROGRESS</th>
                  <th className="px-4 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {visibleList.map((anime) => (
                  <AnimeListRow 
                    key={anime.id}
                    anime={anime}
                    updateAnime={updateAnime}
                    removeAnime={removeAnime}
                    onStatusChange={handleStatusChange}
                    onProgressUpdate={handleProgressUpdate}
                  />
                ))}
              </tbody>
            </table>
            
            {visibleCount < filteredList.length && (
              <div ref={observerTarget} className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 text-brand animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      <CompletionModal 
        isOpen={!!completedAnime} 
        onClose={() => setCompletedAnime(null)}
        animeTitle={completedAnime ? formatTitle(completedAnime) : ''}
        onRate={(score) => {
          if (completedAnime) {
            updateAnime(completedAnime.id, { score });
          }
        }}
      />

      {/* Suggestion Modal */}
      {suggestion && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-[var(--color-card)] w-full max-w-sm rounded-2xl shadow-3xl border border-[var(--color-border)] overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="bg-brand h-24 flex items-center justify-center relative overflow-hidden">
               <motion.div 
                 animate={isSpinning ? { rotate: 360 } : { rotate: 12 }}
                 transition={isSpinning ? { repeat: Infinity, duration: 2, ease: "linear" } : { duration: 0.5 }}
                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.8] opacity-20 pointer-events-none"
               >
                 <Star className="w-16 h-16 text-white" />
               </motion.div>
               <h2 className="text-lg font-black text-white uppercase tracking-widest italic z-10 flex items-center gap-2">
                 {isSpinning ? (
                   <>
                     <RefreshCw className="w-4 h-4 animate-spin text-yellow-350" />
                     Sorteando...
                   </>
                 ) : (
                   <>
                     <Sparkles className="w-4 h-4 text-yellow-300" />
                     Roleta Otaku!
                   </>
                 )}
               </h2>
             </div>
             
             <div className="p-6 space-y-6 text-center -mt-10 relative z-10">
               {/* Cover Image with slot machine sliding animation */}
               <div className="w-32 h-44 mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-[var(--color-card)] bg-[var(--color-bg)] relative flex items-center justify-center">
                 <AnimatePresence mode="popLayout">
                   <motion.div
                     key={spinningImage || suggestion.image}
                     initial={{ y: isSpinning ? 40 : 0, opacity: isSpinning ? 0.4 : 1, filter: isSpinning ? "blur(2px)" : "blur(0px)" }}
                     animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                     exit={{ y: -40, opacity: 0 }}
                     transition={{ type: "spring", stiffness: isSpinning ? 500 : 300, damping: isSpinning ? 30 : 20 }}
                     className="absolute inset-0 w-full h-full"
                   >
                     <img 
                       src={spinningImage || suggestion.image} 
                       className="w-full h-full object-cover select-none"
                       referrerPolicy="no-referrer"
                       alt="Sugestão"
                     />
                   </motion.div>
                 </AnimatePresence>
                 
                 {isSpinning && (
                   <span className="absolute inset-x-0 bottom-2 bg-brand/85 text-white text-[8px] font-black uppercase tracking-widest py-0.5 px-1 animate-pulse rounded mx-4 z-30">
                     GIRANDO
                   </span>
                 )}
               </div>
               
               {/* Anime Info Box */}
               <div className="space-y-2">
                 <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
                   {isSpinning ? "PROCURANDO PRECIOSIDADE..." : "A SORTE APONTOU PARA:"}
                 </p>
                 <h3 className="text-base font-black text-[var(--color-text-bright)] uppercase tracking-tight italic leading-snug min-h-[44px] flex items-center justify-center px-2">
                   {spinningTitle || formatTitle(suggestion)}
                 </h3>
                 
                 {!isSpinning && (
                   <div className="flex flex-col items-center gap-1.5 pt-1 animate-in fade-in duration-300">
                     {/* Attributes tagging */}
                     <div className="flex flex-wrap items-center justify-center gap-1.5">
                       {suggestion.totalProgress ? (
                         <span className="bg-brand/10 text-brand px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                           {suggestion.totalProgress} {mediaType === 'ANIME' ? 'EPISÓDIOS' : 'CAPÍTULOS'}
                         </span>
                       ) : null}
                       
                       {suggestion.score ? (
                         <span className="bg-brand/10 text-brand px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-0.5">
                           <Star className="w-2.5 h-2.5 fill-brand stroke-none" /> {suggestion.score}
                         </span>
                       ) : null}

                       <span className="bg-neutral-500/10 text-gray-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                         {t(`list.${suggestion.status.toLowerCase()}`)}
                       </span>
                     </div>
                     
                     {/* Show Genres if any are loaded */}
                     {suggestion.genres && suggestion.genres.length > 0 && (
                       <div className="flex flex-wrap justify-center gap-1 mt-1 max-w-[280px]">
                         {suggestion.genres.slice(0, 3).map((g: string) => (
                           <span key={g} className="bg-[var(--color-border)] text-gray-400 px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest">
                             {g}
                           </span>
                         ))}
                       </div>
                     )}
                   </div>
                 )}
               </div>

               {/* Vibe Selector Buttons */}
               <div className="bg-[var(--color-border)]/20 p-2 rounded-xl border border-[var(--color-border)]/40">
                 <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1.5 text-center">
                   Ajustar Vibe do Destino:
                 </p>
                 <div className="grid grid-cols-4 gap-1">
                   {[
                     { label: 'Qualquer', vibe: 'any' as const, icon: Sparkles, color: 'text-brand hover:bg-brand/10 hover:text-brand' },
                     { label: 'Curtos', vibe: 'quick' as const, icon: Zap, color: 'text-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-400' },
                     { label: 'Relíquias', vibe: 'treasures' as const, icon: Crown, color: 'text-amber-500 hover:bg-amber-500/10 hover:text-amber-400' },
                     { label: 'Mundiais', vibe: 'marathon' as const, icon: Compass, color: 'text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400' }
                   ].map(v => (
                     <button
                       key={v.vibe}
                       disabled={isSpinning}
                       type="button"
                       onClick={() => {
                         setVibeFilter(v.vibe);
                         handleSuggestion(v.vibe);
                       }}
                       className={cn(
                         "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all text-center border disabled:opacity-50",
                         vibeFilter === v.vibe
                           ? "bg-brand border-brand text-white scale-[1.03] shadow-md shadow-brand/10"
                           : `bg-[var(--color-card)] border-transparent text-gray-400 ${v.color}`
                       )}
                     >
                       <v.icon className={cn("w-3.5 h-3.5", vibeFilter === v.vibe ? "text-white" : "")} />
                       <span className="text-[7px] font-black uppercase tracking-wider">{v.label}</span>
                     </button>
                   ))}
                 </div>
               </div>

               {/* Action Buttons */}
               <div className="flex gap-2 pt-2 border-t border-[var(--color-border)]/40">
                 <button 
                   disabled={isSpinning}
                   type="button"
                   onClick={() => setSuggestion(null)}
                   className="px-4 py-3 border border-[var(--color-border)] rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-[var(--color-border)]/30 transition-all disabled:opacity-45"
                 >
                   IGNORAR
                 </button>
                 
                 <button 
                   disabled={isSpinning}
                   type="button"
                   onClick={() => handleSuggestion(vibeFilter)}
                   className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 bg-brand/15 border border-brand/25 text-brand hover:bg-brand hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-45"
                 >
                   <Shuffle className={cn("w-3 h-3", isSpinning ? "animate-spin" : "")} />
                   OUTRO
                 </button>

                 <button 
                   disabled={isSpinning}
                   type="button"
                   onClick={() => {
                     const activeStatus = mediaType === 'ANIME' ? 'WATCHING' : 'READING';
                     updateAnime(suggestion.id, { status: activeStatus });
                     setSuggestion(null);
                     
                     if (mediaType === 'ANIME') {
                       navigate(`/anime/${suggestion.id}/watch`);
                     } else {
                       navigate(`/manga/${suggestion.id}/read`);
                     }
                   }}
                   className="flex-1 px-3 py-3 bg-brand hover:bg-brand-dark text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand/10 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-45"
                 >
                   {mediaType === 'ANIME' ? 'ASSISTIR!' : 'LER SAGA!'}
                 </button>
               </div>
             </div>
           </div>
        </div>
      , document.body)}
    </div>
  );
}
