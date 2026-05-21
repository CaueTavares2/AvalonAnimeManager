import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { jikanService, JikanAnime } from '../services/jikanService';
import { Search, Loader2, Filter, Play, Star, Calendar, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [results, setResults] = useState<JikanAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('anime'); // can be anime, manga, tv, movie
  
  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        const apiPath = filterType === 'manga' ? 'manga' : 'anime';
        const res = await fetch(`https://api.jikan.moe/v4/${apiPath}?q=${encodeURIComponent(query)}&page=${pageParam}&sfw=true`);
        if (!res.ok) throw new Error('API Error');
        const json = await res.json();
        
        // Filter locally if user changed filter, though we only search anime endpoint.
        let data = json.data || [];
        if (filterType !== 'anime' && filterType !== 'manga') {
           data = data.filter((a: any) => filterType === 'movie' ? a.type === 'Movie' : a.type === 'TV');
         }

        // Deduplicate results by mal_id to prevent key collisions
        const uniqueData = [];
        const seen = new Set();
        for (const item of data) {
          if (!seen.has(item.mal_id)) {
            uniqueData.push(item);
            seen.add(item.mal_id);
          }
        }

        setResults(uniqueData);
        setTotalPages(json.pagination?.last_visible_page || 1);
      } catch (err) {
        console.error('Search page error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, pageParam, filterType]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setSearchParams({ q: query, page: newPage.toString() });
  };

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', '1');
      return next;
    });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-bright)] uppercase italic tracking-tighter flex items-center gap-3">
            <Search className="w-8 h-8 text-brand" />
            Resultados da Busca
          </h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2 flex items-center gap-2">
            Mostrando resultados para <span className="text-brand">"{query}"</span>
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 p-1 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-sm self-stretch md:self-auto overflow-x-auto">
          {['anime', 'manga', 'movie', 'tv'].map((type) => (
            <button
              key={type}
              onClick={() => handleFilterChange(type)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterType === type 
                  ? 'bg-brand text-white shadow-md' 
                  : 'text-gray-500 hover:text-[var(--color-text-bright)] hover:bg-[var(--color-bg)]'
              }`}
            >
              {type === 'anime' ? 'Animes' : type === 'manga' ? 'Mangás' : type === 'movie' ? 'Filmes' : 'Séries (TV)'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <Loader2 className="w-10 h-10 text-brand animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 animate-pulse">Buscando na base de dados...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl">
          <Search className="w-16 h-16 text-gray-400" />
          <div className="text-center">
            <h3 className="text-lg font-black text-[var(--color-text-bright)] uppercase tracking-tight">Nenhum resultado</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">Nenhuma obra encontrada para "{query}".</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {results.map((anime, idx) => {
              const isMangaItem = filterType === 'manga';
              const detailType = isMangaItem ? 'manga' : 'anime';
              const itemYear = anime.year || (anime as any).published?.prop?.from?.year;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={anime.mal_id}
                >
                  <Link to={`/${detailType}/${anime.mal_id}`} className="group flex flex-col gap-3">
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-lg border border-[var(--color-border)]/50">
                      <img 
                        src={anime.images.webp.large_image_url || anime.images.webp.image_url} 
                        alt={anime.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-brand/90 backdrop-blur-md flex items-center justify-center text-white scale-50 group-hover:scale-100 transition-transform duration-300 shadow-xl shadow-brand/30">
                          {isMangaItem ? (
                            <BookOpen className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 ml-1" />
                          )}
                        </div>
                      </div>
                      
                      <div className="absolute top-2 right-2 flex flex-col gap-2">
                         <span className="bg-black/80 backdrop-blur-md text-brand px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg border border-white/10">
                          <Star className="w-3 h-3 fill-current" />
                          {anime.score || 'N/A'}
                        </span>
                      </div>

                      <div className="absolute bottom-2 left-2 right-2">
                         <span className="bg-black/80 backdrop-blur-md text-white px-2 py-1 flex items-center justify-center rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg border border-white/10 truncate">
                           {anime.type || (isMangaItem ? 'Manga' : 'TV')} {itemYear && `• ${itemYear}`}
                         </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-[12px] text-[var(--color-text-bright)] leading-tight line-clamp-2 uppercase tracking-tight group-hover:text-brand transition-colors">
                        {anime.title}
                      </h3>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <button 
                onClick={() => handlePageChange(pageParam - 1)}
                disabled={pageParam === 1}
                className="px-4 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[10px] font-black uppercase tracking-widest text-[var(--color-text-bright)] hover:bg-[var(--color-bg)] transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Anterior
              </button>
              
              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-brand">
                Página {pageParam} de {totalPages}
              </div>

              <button 
                onClick={() => handlePageChange(pageParam + 1)}
                disabled={pageParam === totalPages}
                className="px-4 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[10px] font-black uppercase tracking-widest text-[var(--color-text-bright)] hover:bg-[var(--color-bg)] transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
