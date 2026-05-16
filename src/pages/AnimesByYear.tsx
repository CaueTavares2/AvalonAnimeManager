import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jikanService } from '../services/jikanService';
import { cn } from '../lib/utils';

export default function AnimesByYear() {
  const years = Array.from({ length: 26 }, (_, i) => 2025 - i);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [animes, setAnimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    jikanService.getByYear(selectedYear).then(data => {
      setAnimes(data);
      setLoading(false);
    });
  }, [selectedYear]);

  return (
    <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="relative h-64 rounded-3xl overflow-hidden mb-8 shadow-2xl">
         <img src="https://images.unsplash.com/photo-1541560052-773aece0563b?auto=format&fit=crop&q=80&w=1200" alt="Banner" className="w-full h-full object-cover" />
         <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
             <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">Explorar por Ano</h1>
             <p className="text-brand font-bold uppercase mt-2">Viaje pela história dos Animes</p>
         </div>
      </div>
      
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4 mb-12">
        {years.map(year => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={cn(
                "p-4 rounded-xl font-black text-center transition-all",
                selectedYear === year ? "bg-brand text-black" : "bg-zinc-900 text-white hover:bg-zinc-800"
            )}
          >
            {year}
          </button>
        ))}
      </div>
      
      {loading && <p className="text-white text-center">Carregando...</p>}
      
      {!loading && animes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {animes.map((anime: any) => (
            <Link to={`/anime/${anime.mal_id}`} key={anime.mal_id} className="group">
              <div className="aspect-[2/3] rounded-2xl overflow-hidden mb-2 shadow-lg group-hover:scale-105 transition-transform">
                <img src={anime.images.webp.large_image_url} alt={anime.title} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-sm font-bold text-white truncate group-hover:text-brand">{anime.title}</h3>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
