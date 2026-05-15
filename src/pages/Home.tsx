import { TrendingUp, Award, Calendar, Heart } from 'lucide-react';
import MediaGrid from '../components/MediaGrid';
import { useState, useEffect } from 'react';
import { jikanService, JikanAnime } from '../services/jikanService';
import { cn } from '../lib/utils';
import type { Media } from '../types';

export default function Home() {
  const [mediaType, setMediaType] = useState<'anime' | 'manga'>('anime');
  const [trending, setTrending] = useState<Media[]>([]);
  const [popular, setPopular] = useState<Media[]>([]);
  const [stats, setStats] = useState({
    topTrending: 'Carregando...',
    topPopular: 'Carregando...',
    topUpcoming: 'Carregando...',
    topRated: 'Carregando...'
  });
  const [loading, setLoading] = useState(true);

  const mapJikanToMedia = (item: JikanAnime, type: 'anime' | 'manga'): Media => ({
    id: item.mal_id,
    title: item.title,
    image: item.images.webp.large_image_url || item.images.webp.image_url,
    type: type.toUpperCase() as 'ANIME' | 'MANGA',
    status: 'TRENDING',
    genres: item.genres.map(g => g.name),
    score: Math.round(item.score * 10),
    format: item.status,
    episodes: item.episodes,
    chapters: item.chapters,
    volumes: item.volumes,
    season: item.season,
    year: item.year
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const trendingData = await jikanService.getTrending(mediaType);
        if (trendingData) {
          setTrending(trendingData.map(item => mapJikanToMedia(item, mediaType)));
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        const popularData = await jikanService.getPopular(mediaType);
        if (popularData) {
          setPopular(popularData.map(item => mapJikanToMedia(item, mediaType)));
        }

        await new Promise(resolve => setTimeout(resolve, 300));
        const upcomingData = await jikanService.getUpcoming(mediaType);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        const topRatedData = await jikanService.getTopRated(mediaType);

        setStats({
          topTrending: trendingData?.[0]?.title || 'N/A',
          topPopular: popularData?.[0]?.title || 'N/A',
          topUpcoming: (upcomingData && upcomingData[0]?.title) || 'N/A',
          topRated: (topRatedData && topRatedData[0]?.title) || 'N/A'
        });
      } catch (error) {
        console.error(`Failed to fetch ${mediaType}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mediaType]);

  return (
    <div className="space-y-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">
          Explorar {mediaType === 'anime' ? 'Animes' : 'Mangás'}
        </h1>
        <div className="flex bg-[var(--color-card)] p-1.5 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <button 
            onClick={() => setMediaType('anime')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              mediaType === 'anime' 
                ? "bg-brand text-white shadow-[0_0_20px_rgba(255,51,51,0.3)] scale-105" 
                : "text-gray-400 hover:text-[var(--color-text-bright)] hover:bg-white/5"
            )}
          >
            Animes
          </button>
          <button 
            onClick={() => setMediaType('manga')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              mediaType === 'manga' 
                ? "bg-brand text-white shadow-[0_0_20px_rgba(255,51,51,0.3)] scale-105" 
                : "text-gray-400 hover:text-[var(--color-text-bright)] hover:bg-white/5"
            )}
          >
            Mangás
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(255,51,51,0.2)]" />
        </div>
      ) : (
        <>
          {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-6 px-4 md:px-8 bg-[var(--color-card)] backdrop-blur-md rounded-2xl shadow-sm border border-[var(--color-border)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left transition-all hover:translate-y-[-2px] duration-300 relative z-10">
          <div className="p-2 bg-brand/10 rounded-lg shadow-inner">
            <TrendingUp className="w-5 h-5 text-brand" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-80">Em Alta</p>
            <p className="text-sm font-black text-[var(--color-text-bright)] line-clamp-1">{stats.topTrending}</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left transition-all hover:translate-y-[-2px] duration-300 relative z-10">
          <div className="p-2 bg-yellow-500/10 rounded-lg shadow-inner">
            <Award className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-80">Popular</p>
            <p className="text-sm font-black text-[var(--color-text-bright)] line-clamp-1">{stats.topPopular}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left transition-all hover:translate-y-[-2px] duration-300 relative z-10">
          <div className="p-2 bg-red-500/10 rounded-lg shadow-inner">
            <Calendar className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-80">
              {mediaType === 'anime' ? 'Próximos' : 'Recentemente Finalizados'}
            </p>
            <p className="text-sm font-black text-[var(--color-text-bright)] line-clamp-1">{stats.topUpcoming}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left transition-all hover:translate-y-[-2px] duration-300 relative z-10">
          <div className="p-2 bg-emerald-500/10 rounded-lg shadow-inner">
            <Heart className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-80">Top Rated</p>
            <p className="text-sm font-black text-[var(--color-text-bright)] line-clamp-1">{stats.topRated}</p>
          </div>
        </div>
      </div>

      <MediaGrid title={`Trending ${mediaType === 'anime' ? 'Anime' : 'Manga'}`} items={trending} />
      <MediaGrid title={`Popular ${mediaType === 'anime' ? 'Anime' : 'Manga'}`} items={popular} />
    </>
    )}
    </div>
  );
}
