import React, { useState } from 'react';
import { Gift, Star, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { jikanService } from '../../services/jikanService';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function GachaRecommendation() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const GACHA_COST = 50;

  const pullGacha = async () => {
    if (!user || profile.availablePoints < GACHA_COST || loading) return;

    setLoading(true);
    setResult(null);

    try {
      // Deduct points
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        availablePoints: increment(-GACHA_COST)
      });

      // Get random recommendation (Random page from Jikan Top Anime)
      const randomPage = Math.floor(Math.random() * 10) + 1;
      const data = await jikanService.getTopRated('anime');
      
      const randomAnime = data[Math.floor(Math.random() * data.length)];

      setResult({
        id: randomAnime.mal_id,
        title: randomAnime.title,
        image: randomAnime.images.webp.large_image_url || randomAnime.images.webp.image_url,
        score: randomAnime.score,
        rarity: randomAnime.score >= 8.5 ? 'SSR' : randomAnime.score >= 7.5 ? 'SR' : 'R'
      });

      // Add to activity feed
      await addDoc(collection(db, 'activityFeed'), {
        userId: user.uid,
        username: profile.username,
        photoURL: profile.photoURL,
        type: 'ACHIEVEMENT',
        details: `Tirou um ${randomAnime.score >= 8.5 ? 'SSR' : randomAnime.score >= 7.5 ? 'SR' : 'R'} no Gacha: ${randomAnime.title}`,
        createdAt: serverTimestamp()
      });

    } catch (error) {
      console.error("Gacha pull failed", error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'SSR': return 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10 shadow-[0_0_15px_rgba(250,204,21,0.5)]';
      case 'SR': return 'text-purple-400 border-purple-400/50 bg-purple-400/10 shadow-[0_0_15px_rgba(192,132,252,0.5)]';
      default: return 'text-blue-400 border-blue-400/50 bg-blue-400/10';
    }
  };

  if (!user) return null;

  return (
    <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Gift className="w-32 h-32" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start justify-between">
        <div className="space-y-4 max-w-sm text-center md:text-left">
          <div>
            <h3 className="text-sm font-black text-brand uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
              <Sparkles className="w-4 h-4" /> Recomendação Gacha
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              Gaste PO para rolar uma recomendação aleatória. Encontre sua próxima obra favorita!
            </p>
          </div>
          
          <div className="flex items-center justify-center md:justify-start gap-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 bg-[var(--color-bg)] px-3 py-1.5 rounded-lg border border-[var(--color-border)]">
              Custo: <span className="text-brand">{GACHA_COST} PO</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 bg-[var(--color-bg)] px-3 py-1.5 rounded-lg border border-[var(--color-border)]">
              Seu Saldo: <span className={profile.availablePoints >= GACHA_COST ? "text-emerald-400" : "text-red-400"}>{profile.availablePoints} PO</span>
            </span>
          </div>

          <button
            onClick={pullGacha}
            disabled={profile.availablePoints < GACHA_COST || loading}
            className="w-full md:w-auto px-6 py-3 bg-brand text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
            {loading ? "Invocando..." : "Rolar Gacha"}
          </button>
        </div>

        <div className="w-full md:w-1/2 min-h-[160px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border w-full max-w-sm",
                  getRarityColor(result.rarity)
                )}
              >
                <div className="w-20 h-28 rounded-lg overflow-hidden shrink-0 border-2 border-current/30 shadow-inner">
                  <img src={result.image} alt={result.title} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-current/20 border border-current/30">
                    {result.rarity}
                  </span>
                  <Link to={`/anime/${result.id}`} className="block text-sm font-black text-white hover:underline line-clamp-2">
                    {result.title}
                  </Link>
                  <div className="flex items-center gap-1 text-[10px] font-bold">
                    <Star className="w-3 h-3 fill-current" /> {result.score}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-gray-500 border-2 border-dashed border-[var(--color-border)] rounded-2xl p-8 w-full max-w-sm flex flex-col items-center justify-center gap-3"
              >
                <Star className="w-8 h-8 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Aguardando sua invocação...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
