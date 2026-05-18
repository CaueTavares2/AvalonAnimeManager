import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { jikanService } from '../services/jikanService';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

export default function AnimesByYear() {
  const years = Array.from({ length: 26 }, (_, i) => 2025 - i);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [animes, setAnimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchAnimes = async (year: number, pageNum: number, reset: boolean = false) => {
    setLoading(true);
    try {
      const response = await jikanService.getByYear(year, pageNum);
      const filtered = response.data.filter((a: any) => a.type === 'TV' || a.type === 'Movie');
      
      setAnimes(prev => reset ? filtered : [...prev, ...filtered]);
      setHasNextPage(response.pagination.has_next_page);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchAnimes(selectedYear, 1, true);
  }, [selectedYear]);

  const loadMore = () => {
    if (!loading && hasNextPage) {
      setPage(p => p + 1);
      fetchAnimes(selectedYear, page + 1);
    }
  };

  const lastElementRef = useCallback((node: HTMLAnchorElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasNextPage, selectedYear, page]);

  return (
    <div className="min-h-screen pt-24 px-4 pb-12 max-w-7xl mx-auto">
      <div className="relative h-64 rounded-3xl overflow-hidden mb-8 shadow-2xl border border-[var(--color-border)]">
         <img src="https://images.unsplash.com/photo-1541560052-773aece0563b?auto=format&fit=crop&q=80&w=1200" alt="Banner" className="w-full h-full object-cover opacity-60" />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col items-center justify-center p-6 text-center">
             <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-lg">Explorar por Ano</h1>
             <p className="text-brand font-bold uppercase mt-2 drop-shadow-md text-xs md:text-sm tracking-widest">Apenas Animes e Filmes completos</p>
         </div>
      </div>
      
      <div className="flex overflow-x-auto gap-2 mb-12 pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {years.map(year => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={cn(
                "px-6 py-3 rounded-xl font-black text-center transition-all whitespace-nowrap text-sm",
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {animes.map((anime: any, index: number) => {
            const isLast = index === animes.length - 1;
            return (
              <Link 
                ref={isLast ? lastElementRef : null}
                to={`/anime/${anime.mal_id}`} 
                key={`${anime.mal_id}-${index}`} 
                className="group flex flex-col gap-2"
              >
                <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-lg group-hover:scale-[1.02] transition-transform border border-[var(--color-border)] relative">
                  <img src={anime.images.webp.large_image_url} alt={anime.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded border border-white/10">
                    <p className="text-[10px] font-black tracking-widest uppercase text-white">{anime.type}</p>
                  </div>
                </div>
                <h3 className="text-xs md:text-sm font-bold text-[var(--color-text-bright)] line-clamp-2 group-hover:text-brand transition-colors">{anime.title}</h3>
              </Link>
            );
          })}
        </div>
      )}
      
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
           <Loader2 className="w-8 h-8 text-brand animate-spin" />
           <p className="text-brand font-black uppercase tracking-widest text-xs animate-pulse">Carregando catálogo...</p>
        </div>
      )}

      {!loading && !hasNextPage && animes.length > 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Fim do catálogo de {selectedYear}</p>
        </div>
      )}
    </div>
  );
}
