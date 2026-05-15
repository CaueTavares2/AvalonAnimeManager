import { TrendingUp, Award, Calendar, Heart, Zap, Trophy } from 'lucide-react';
import MediaGrid from '../components/MediaGrid';
import { useState, useEffect } from 'react';
import { jikanService, JikanAnime } from '../services/jikanService';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import type { Media } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Home() {
  const { mediaType, setMediaType, streakInfo, showStreakPopUp, setShowStreakPopUp } = useAuth();
  const [trending, setTrending] = useState<Media[]>([]);
  const [popular, setPopular] = useState<Media[]>([]);
  const [stats, setStats] = useState({
    topTrending: 'Carregando...',
    topPopular: 'Carregando...',
    topUpcoming: 'Carregando...',
    topRated: 'Carregando...'
  });
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const quotes = [
    "Você está mais perto do topo, jovem gafanhoto!",
    "Um ninja nunca volta atrás em sua palavra!",
    "Não importa o quão difícil seja, sempre há uma saída.",
    "O trabalho duro vence o talento natural!",
    "Aqueles que rompem as regras são lixo, mas aqueles que abandonam seus amigos são piores que lixo."
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  useEffect(() => {
    // Timer for streak urgency
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      
      if (diff > 0 && diff < 2 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining('');
      }
    }, 60000);

    return () => clearInterval(timer);
  }, []);

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
      setTrending([]);
      setPopular([]);
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
    <div className="space-y-12">
      {/* Streak Help Needed Alert */}
      {streakInfo?.needsHelp && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-orange-500/20 border border-orange-500/50 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-6">
            <div className="bg-orange-500 p-4 rounded-3xl shadow-lg shadow-orange-500/40 animate-bounce">
              <Heart className="text-white fill-white" size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">SEU STREAK QUEBROOU! 😱</h3>
              <p className="text-sm text-gray-400 font-medium">Não entre em pânico! Peça ajuda a um amigo para recuperá-lo nas próximas 24 horas.</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Link 
              to="/social" 
              className="flex-1 md:flex-none text-center bg-orange-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-orange-500 transition-all"
            >
              CHAMAR REFORÇOS
            </Link>
          </div>
        </motion.div>
      )}

      {/* Streak Urgency Alert */}
      {timeRemaining && streakInfo && !streakInfo.needsHelp && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand/20 border border-brand/50 p-6 rounded-3xl flex items-center justify-between animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="bg-brand p-3 rounded-2xl shadow-[0_0_20px_rgba(var(--color-brand-rgb),0.4)]">
              <Zap className="text-white fill-white" size={24} />
            </div>
            <div>
              <h3 className="font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">AVISO DE LINHA DE FRENTE!</h3>
              <p className="text-sm text-gray-400">Sua ofensiva vai expirar em <span className="text-brand font-bold">{timeRemaining}</span>! Marque um episódio agora!</p>
            </div>
          </div>
          <Link to="/my-list" className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
            IR PARA LISTA
          </Link>
        </motion.div>
      )}

      {/* Streak Pop-up Modal */}
      <AnimatePresence>
        {showStreakPopUp && streakInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowStreakPopUp(false)}
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="relative bg-[var(--color-card)] border border-[var(--color-border)] p-10 rounded-[40px] max-w-sm w-full text-center overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand via-brand-light to-brand animate-pulse" />
              
              <div className="relative mb-8">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="relative z-10"
                >
                  <Trophy className="w-24 h-24 text-brand mx-auto drop-shadow-[0_0_25px_rgba(var(--color-brand-rgb),0.6)]" />
                </motion.div>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-4 -right-2 bg-brand text-white text-[10px] font-black tracking-widest px-4 py-2 rounded-full uppercase shadow-lg border-2 border-white"
                >
                  FASE {streakInfo.phase}
                </motion.div>
                <div className="absolute inset-0 bg-brand/5 blur-3xl rounded-full" />
              </div>

              <h2 className="text-4xl font-black mb-4 text-[var(--color-text-bright)] italic tracking-tighter uppercase">
                {streakInfo.count} DIAS!
              </h2>
              <p className="text-gray-400 font-medium mb-10 leading-relaxed italic">
                "{randomQuote}"
              </p>

              <div className="bg-black/20 p-6 rounded-[32px] mb-10 border border-[var(--color-border)]">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                  <span className="text-gray-500">Bônus de Otaku Points</span>
                  <span className="text-brand">{streakInfo.multiplier}x PO</span>
                </div>
                <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (streakInfo.count % 30) / 30 * 100)}%` }}
                    className="h-full bg-gradient-to-r from-brand to-brand-light rounded-full"
                  />
                </div>
              </div>

              <button 
                onClick={() => setShowStreakPopUp(false)}
                className="w-full bg-[var(--color-text-bright)] text-black font-black py-5 rounded-[24px] text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                PROSSEGUIR OFENSIVA
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-[var(--color-border)] pb-8">
        <h1 className="text-4xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">
          Explorar {mediaType === 'anime' ? 'Animes' : 'Mangás'}
        </h1>
        
        <div className="flex bg-[var(--color-card)] p-1.5 rounded-2xl border border-[var(--color-border)]">
          <button 
            onClick={() => setMediaType('anime')}
            className={cn(
              "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              mediaType === 'anime' 
                ? "bg-brand text-white shadow-lg" 
                : "text-gray-400 hover:text-gray-200"
            )}
          >
            Animes
          </button>
          <button 
            onClick={() => setMediaType('manga')}
            className={cn(
              "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              mediaType === 'manga' 
                ? "bg-brand text-white shadow-lg" 
                : "text-gray-400 hover:text-gray-200"
            )}
          >
            Mangás
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-40">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-20">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[var(--color-card)] p-6 rounded-3xl border border-[var(--color-border)] shadow-xl hover:translate-y-[-4px] transition-all">
              <div className="flex items-center gap-4 mb-2">
                <TrendingUp className="w-5 h-5 text-brand" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Trending</span>
              </div>
              <p className="text-sm font-black text-[var(--color-text-bright)] line-clamp-1">{stats.topTrending}</p>
            </div>
            
            <div className="bg-[var(--color-card)] p-6 rounded-3xl border border-[var(--color-border)] shadow-xl hover:translate-y-[-4px] transition-all">
              <div className="flex items-center gap-4 mb-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Popular</span>
              </div>
              <p className="text-sm font-black text-[var(--color-text-bright)] line-clamp-1">{stats.topPopular}</p>
            </div>

            <div className="bg-[var(--color-card)] p-6 rounded-3xl border border-[var(--color-border)] shadow-xl hover:translate-y-[-4px] transition-all">
              <div className="flex items-center gap-4 mb-2">
                <Calendar className="w-5 h-5 text-red-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Próximos</span>
              </div>
              <p className="text-sm font-black text-[var(--color-text-bright)] line-clamp-1">{stats.topUpcoming}</p>
            </div>

            <div className="bg-[var(--color-card)] p-6 rounded-3xl border border-[var(--color-border)] shadow-xl hover:translate-y-[-4px] transition-all">
              <div className="flex items-center gap-4 mb-2">
                <Heart className="w-5 h-5 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Favoritos</span>
              </div>
              <p className="text-sm font-black text-[var(--color-text-bright)] line-clamp-1">{stats.topRated}</p>
            </div>
          </div>

          <MediaGrid title={`Em Alta: ${mediaType === 'anime' ? 'Animes' : 'Mangás'}`} items={trending} />
          <MediaGrid title={`Populares: ${mediaType === 'anime' ? 'Animes' : 'Mangás'}`} items={popular} />
        </div>
      )}
    </div>
  );
}
