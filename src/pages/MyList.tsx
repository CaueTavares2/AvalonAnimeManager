import { useAnimeList, AnimeStatus, UserAnime } from '../hooks/useAnimeList';
import { LayoutGrid, List as ListIcon, Trash2, Edit2, TrendingUp, Star, Loader2, RefreshCw } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import CompletionModal from '../components/shared/CompletionModal';
import AnimeListRow from '../components/anime/AnimeListRow';
import { useLanguage } from '../context/LanguageContext';
import { rankingService } from '../services/rankingService';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

const ITEMS_PER_CHUNK = 50;

export default function MyList() {
  const { list, updateAnime, removeAnime } = useAnimeList();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { t } = useLanguage();
  const [mediaType, setMediaType] = useState<'ANIME' | 'MANGA'>('ANIME');
  const [isSyncing, setIsSyncing] = useState(false);
  const [filter, setFilter] = useState<AnimeStatus | 'ALL'>('ALL');

  const handleSyncPoints = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      await rankingService.syncListPoints(user.uid, list);
      alert("Pontos de Otaku sincronizados com sucesso!");
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };
  const [completedAnime, setCompletedAnime] = useState<UserAnime | null>(null);
  const [suggestion, setSuggestion] = useState<UserAnime | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_CHUNK);
  const observerTarget = useRef<HTMLDivElement>(null);

  const filteredList = useMemo(() => {
    const typeFiltered = list.filter(a => a.type === mediaType);
    return filter === 'ALL' ? typeFiltered : typeFiltered.filter(a => a.status === filter);
  }, [list, filter, mediaType]);

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
  }, [filter]);

  const handleStatusChange = useCallback((id: number, newStatus: AnimeStatus) => {
    const anime = list.find(a => a.id === id);
    if (newStatus === 'COMPLETED' && anime && anime.status !== 'COMPLETED') {
      setCompletedAnime(anime);
    }
    updateAnime(id, { status: newStatus });
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
  }, [list, updateAnime]);

  const handleSuggestion = () => {
    const planningList = filteredList.filter(a => a.status === 'PLANNING');
    if (planningList.length === 0) return;
    const random = planningList[Math.floor(Math.random() * planningList.length)];
    setSuggestion(random);
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

          <div className="flex items-center gap-4">
            <button 
              onClick={handleSyncPoints}
              disabled={isSyncing}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border border-brand/20 bg-brand/5 text-brand rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all disabled:opacity-50",
                isSyncing && "animate-pulse"
              )}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
              {isSyncing ? "Sincronizando..." : "Sincronizar PO"}
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
          {filter === 'PLANNING' && (
            <button 
              onClick={handleSuggestion}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-white transition-all shadow-lg shadow-yellow-500/5 group"
            >
              <Star className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Sugestão
            </button>
          )}
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
              <thead className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-4 w-20">COVER</th>
                  <th className="px-4 py-4">TITLE</th>
                  <th className="px-4 py-4 text-center">SCORE</th>
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
        animeTitle={completedAnime?.title || ''}
        onRate={(score) => {
          if (completedAnime) {
            updateAnime(completedAnime.id, { score });
          }
        }}
      />

      {/* Suggestion Modal */}
      {suggestion && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-[var(--color-card)] w-full max-w-md rounded-2xl shadow-2xl border border-[var(--color-border)] overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="bg-brand h-24 flex items-center justify-center relative">
               <Star className="w-12 h-12 text-white/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150 rotate-12" />
               <h2 className="text-xl font-black text-white uppercase tracking-widest italic z-10">Próxima Aventura!</h2>
             </div>
             
             <div className="p-8 space-y-6 text-center">
               <div className="w-32 h-44 mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-[var(--color-card)] -mt-16 relative z-20">
                 <img src={suggestion.image} className="w-full h-full object-cover" />
               </div>
               
               <div>
                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">A sorte escolheu:</p>
                 <h3 className="text-lg font-black text-[var(--color-text-bright)] uppercase tracking-tight italic">{suggestion.title}</h3>
               </div>

               <div className="flex gap-4">
                 <button 
                   onClick={() => setSuggestion(null)}
                   className="flex-1 px-4 py-3 border border-[var(--color-border)] rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-white transition-all"
                 >
                   Não agora
                 </button>
                 <button 
                   onClick={() => {
                     updateAnime(suggestion.id, { status: mediaType === 'ANIME' ? 'WATCHING' : 'READING' });
                     setSuggestion(null);
                   }}
                   className="flex-1 px-4 py-3 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-[1.02] transition-all"
                 >
                   Começar!
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
