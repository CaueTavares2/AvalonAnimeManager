import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { jikanService } from '../services/jikanService';
import { cn } from '../lib/utils';
import { Loader2, Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function AnimesByYear() {
  const { formatTitle } = useLanguage();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);
  
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [animes, setAnimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);

  // Fetch initial page for selected year (includes clean cancellation)
  useEffect(() => {
    let active = true;
    loadingRef.current = true;
    setLoading(true);
    setAnimes([]);
    setPage(1);
    setHasNextPage(true);

    const loadInitial = async () => {
      try {
        const response = await jikanService.getByYear(selectedYear, 1);
        if (!active) return;
        
        const filtered = response.data.filter((a: any) => a.type === 'TV' || a.type === 'Movie');
        setAnimes(filtered);
        setHasNextPage(response.pagination.has_next_page);
      } catch (e) {
        console.error('[AnimesByYear] Error loading year initial page:', e);
      } finally {
        if (active) {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    };

    loadInitial();

    return () => {
      active = false;
    };
  }, [selectedYear]);

  // Load more pages sequentially (strict locking against duplicates)
  const loadMore = async () => {
    if (loadingRef.current || !hasNextPage) return;
    
    loadingRef.current = true;
    setLoading(true);
    const nextPage = page + 1;

    try {
      const response = await jikanService.getByYear(selectedYear, nextPage);
      const filtered = response.data.filter((a: any) => a.type === 'TV' || a.type === 'Movie');
      
      setAnimes(prev => [...prev, ...filtered]);
      setPage(nextPage);
      setHasNextPage(response.pagination.has_next_page);
    } catch (e) {
      console.error('[AnimesByYear] Error loading next page:', e);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const lastElementRef = useCallback((node: HTMLAnchorElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !loadingRef.current) {
        loadMore();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasNextPage, selectedYear, page]);

  return (
    <div className="min-h-screen pt-20 px-4 pb-12 max-w-7xl mx-auto md:pt-24 SafeBottomClass">
      <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden mb-6 md:mb-8 shadow-2xl border border-[var(--color-border)]">
         <img src="https://images.unsplash.com/photo-1541560052-773aece0563b?auto=format&fit=crop&q=80&w=1200" alt="Banner" className="w-full h-full object-cover opacity-60" />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col items-center justify-center p-4 md:p-6 text-center">
             <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-lg flex items-center gap-2 md:gap-3">
               <Calendar className="w-8 h-8 md:w-12 md:h-12 text-brand" /> Explorar por Ano
             </h1>
             <p className="text-brand font-bold uppercase mt-2 drop-shadow-md text-[10px] md:text-sm tracking-widest">Apenas Animes e Filmes completos do acervo oficial</p>
         </div>
      </div>
      
      {/* Year Selector Horizontal Row - Enhanced mobile scroll layout */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth touch-pan-x">
        {years.map(year => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={cn(
                "px-5 py-3.5 rounded-xl font-black text-center transition-all whitespace-nowrap text-xs md:text-sm active:scale-95 touch-manipulation min-w-[70px] min-h-[44px] flex items-center justify-center",
                selectedYear === year 
                  ? "bg-brand text-white shadow-lg shadow-brand/20 scale-105" 
                  : "bg-[var(--color-card)] text-gray-400 hover:text-white border border-[var(--color-border)] hover:border-brand/50"
            )}
          >
            {year}
          </button>
        ))}
      </div>
      
      {animes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
          {animes.map((anime: any, index: number) => {
            const isLast = index === animes.length - 1;
            return (
              <Link 
                ref={isLast ? lastElementRef : null}
                to={`/anime/${anime.mal_id}`} 
                key={`${anime.mal_id}-${index}`} 
                className="group flex flex-col gap-2 scale-100 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
              >
                <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-lg border border-[var(--color-border)] relative">
                  <img 
                    src={anime.images.webp.large_image_url} 
                    alt={formatTitle(anime)} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
                    <p className="text-[8px] md:text-[10px] font-black tracking-widest uppercase text-white">{anime.type}</p>
                  </div>
                </div>
                <h3 className="text-xs md:text-sm font-bold text-[var(--color-text-bright)] line-clamp-2 group-hover:text-brand transition-colors px-1 leading-tight">{formatTitle(anime)}</h3>
              </Link>
            );
          })}
        </div>
      )}
      
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
           <Loader2 className="w-8 h-8 text-brand animate-spin" />
           <p className="text-brand font-black uppercase tracking-widest text-[9px] animate-pulse">Buscando obras no arquivo de {selectedYear}...</p>
        </div>
      )}

      {!loading && animes.length === 0 && (
        <div className="text-center py-16 border border-dashed border-[var(--color-border)] rounded-2xl">
          <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Nenhum anime encontrado para {selectedYear}</p>
        </div>
      )}

      {!loading && !hasNextPage && animes.length > 0 && (
        <div className="text-center py-12 mt-4">
          <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Fim do catálogo de {selectedYear}</p>
        </div>
      )}
    </div>
  );
}
