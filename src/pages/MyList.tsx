import { useAnimeList, AnimeStatus, UserAnime } from '../hooks/useAnimeList';
import { LayoutGrid, List as ListIcon, Trash2, Edit2, TrendingUp, Star, Loader2 } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import CompletionModal from '../components/CompletionModal';
import AnimeListRow from '../components/AnimeListRow';
import { useLanguage } from '../context/LanguageContext';

const ITEMS_PER_CHUNK = 50;

export default function MyList() {
  const { list, updateAnime, removeAnime } = useAnimeList();
  const { t } = useLanguage();
  const [mediaType, setMediaType] = useState<'ANIME' | 'MANGA'>('ANIME');
  const [filter, setFilter] = useState<AnimeStatus | 'ALL'>('ALL');
  const [completedAnime, setCompletedAnime] = useState<UserAnime | null>(null);
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

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--color-border)] pb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">
                {t('list.title')}
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

          <div className="flex items-center gap-4 bg-[var(--color-card)] p-1 rounded-lg border border-[var(--color-border)] shadow-sm">
            {(['ALL', 'WATCHING', 'READING', 'COMPLETED', 'PLANNING'] as const).map(f => {
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
                  <th className="px-4 py-6 w-24">COVER</th>
                  <th className="px-4 py-6">TITLE</th>
                  <th className="px-4 py-6 text-center">SCORE</th>
                  <th className="px-4 py-6 text-center">STATUS</th>
                  <th className="px-4 py-6 text-center">PROGRESS</th>
                  <th className="px-4 py-6 text-right">ACTIONS</th>
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
    </div>
  );
}
