import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Crown, 
  Shield, 
  Flame, 
  Search, 
  ChevronRight,
  Info
} from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RankingUser {
  uid: string;
  username: string;
  photoURL?: string;
  otakuPoints: number;
  weeklyPoints: number;
  rank: string;
  prevPosition?: number;
  currentPosition: number;
}

const LEAGUES = [
  { id: 'DESAFIANTE', name: 'Desafiante', rank: 'Mestre', color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' },
  { id: 'DIAMANTE', name: 'Diamante', rank: 'Rank S', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
  { id: 'PLATINA', name: 'Platina', rank: 'Rank A', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  { id: 'OURO', name: 'Ouro', rank: 'Rank B', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  { id: 'PRATA', name: 'Prata', rank: 'Rank C', color: 'text-slate-300', bg: 'bg-slate-300/10', border: 'border-slate-300/20' },
  { id: 'BRONZE', name: 'Bronze', rank: 'Rank D', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  { id: 'FERRO', name: 'Ferro', rank: 'Rank E', color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' },
];

export default function Rankings() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [activeLeague, setActiveLeague] = useState('DIAMANTE'); // Default view
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    // Update countdown to Sunday night
    const updateCountdown = () => {
      const now = new Date();
      const sunday = new Date();
      sunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
      sunday.setHours(23, 59, 59);
      
      const diff = sunday.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      
      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        // Fetch top global for now, in real scenario would filter by league/division
        const q = query(usersRef, orderBy('otakuPoints', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        
        const fetched = snapshot.docs.map((doc, index) => ({
          uid: doc.id,
          ...doc.data(),
          currentPosition: index + 1,
          prevPosition: index + (Math.random() > 0.5 ? 1 : -1) // Temporary mockup effect
        })) as RankingUser[];
        
        setRanking(fetched);
      } catch (error) {
        console.error("Error fetching rankings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [activeLeague]);

  const topThree = ranking.slice(0, 3);
  const others = ranking.slice(3);
  const myRank = ranking.find(u => u.uid === currentUser?.uid);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 bg-gradient-to-b from-[var(--color-bg)] to-black/20">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[var(--color-border)] pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Trophy className="w-10 h-10 text-brand" />
              <h1 className="text-4xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">Hall da Fama</h1>
            </div>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" /> Temporada termina em: <span className="text-brand">{timeRemaining}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {LEAGUES.slice(0, 4).map(league => (
              <button 
                key={league.id}
                onClick={() => setActiveLeague(league.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                  activeLeague === league.id 
                    ? `${league.bg} ${league.color} ${league.border} shadow-lg shadow-brand/5` 
                    : "bg-[var(--color-card)] border-[var(--color-border)] text-gray-500 hover:text-gray-300"
                )}
              >
                {league.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(255,51,51,0.2)]" />
          </div>
        ) : (
          <div className="space-y-16">
            {/* Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-4xl mx-auto pt-12 relative">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full h-full bg-brand/5 blur-[120px] rounded-full pointer-events-none" />
              
              {/* Silver - 2nd */}
              {topThree[1] && (
                <div className="md:order-1 flex flex-col items-center space-y-4 group">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-3xl bg-slate-300/10 border-4 border-slate-300/30 overflow-hidden p-1 shadow-2xl">
                      <img src={topThree[1].photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=2"} className="w-full h-full object-cover rounded-2xl" />
                    </div>
                    <div className="absolute -top-4 -left-4 w-10 h-10 bg-slate-400 rounded-full flex items-center justify-center border-4 border-[var(--color-bg)] font-black text-white italic">2</div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-black text-[var(--color-text-bright)] uppercase tracking-tight italic">{topThree[1].username}</h3>
                    <p className="text-brand font-black text-sm">{topThree[1].otakuPoints} PO</p>
                  </div>
                </div>
              )}

              {/* Gold - 1st */}
              {topThree[0] && (
                <div className="md:order-2 flex flex-col items-center space-y-6 scale-110">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-[2rem] bg-yellow-400/10 border-4 border-yellow-400 overflow-hidden p-1 shadow-[0_0_50px_rgba(250,204,21,0.2)] animate-pulse">
                      <img src={topThree[0].photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=1"} className="w-full h-full object-cover rounded-[1.75rem]" />
                    </div>
                    <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 w-10 h-10 text-yellow-400 drop-shadow-lg" />
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-[var(--color-bg)] font-black text-black italic text-xl shadow-lg">1</div>
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">{topThree[0].username}</h2>
                    <p className="text-brand font-black text-lg">{topThree[0].otakuPoints} PO</p>
                  </div>
                </div>
              )}

              {/* Bronze - 3rd */}
              {topThree[2] && (
                <div className="md:order-3 flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-3xl bg-orange-400/10 border-4 border-orange-400/30 overflow-hidden p-1 shadow-2xl">
                      <img src={topThree[2].photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=3"} className="w-full h-full object-cover rounded-2xl" />
                    </div>
                    <div className="absolute -top-4 -left-4 w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center border-4 border-[var(--color-bg)] font-black text-white italic">3</div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-black text-[var(--color-text-bright)] uppercase tracking-tight italic">{topThree[2].username}</h3>
                    <p className="text-brand font-black text-sm">{topThree[2].otakuPoints} PO</p>
                  </div>
                </div>
              )}
            </div>

            {/* List */}
            <div className="bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] overflow-hidden shadow-2xl">
              <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-white/5 border-b border-[var(--color-border)] text-[9px] font-black text-gray-500 uppercase tracking-widest">
                <div className="col-span-1">Rank</div>
                <div className="col-span-6">Usuário</div>
                <div className="col-span-2 text-center">Liga</div>
                <div className="col-span-2 text-right">Potuação</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-[var(--color-border)]">
                {others.map((u, i) => (
                  <div key={u.uid} className={cn(
                    "grid grid-cols-12 gap-4 px-8 py-4 items-center transition-all hover:bg-white/5",
                    u.uid === currentUser?.uid && "bg-brand/5 border-l-4 border-brand"
                  )}>
                    <div className="col-span-1 flex items-center gap-2">
                      <span className="font-black text-[var(--color-text-bright)] italic">{u.currentPosition}</span>
                      {u.prevPosition && u.prevPosition > u.currentPosition ? (
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                      ) : u.prevPosition && u.prevPosition < u.currentPosition ? (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      ) : null}
                    </div>
                    
                    <div className="col-span-6 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-[var(--color-border)]">
                        <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full object-cover" />
                      </div>
                      <Link to={`/profile/${u.uid}`} className="font-black text-[var(--color-text-bright)] uppercase tracking-tight italic hover:text-brand transition-colors text-sm">
                        {u.username}
                      </Link>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-indigo-500/20">
                        {u.rank || 'Bronze'}
                      </span>
                    </div>

                    <div className="col-span-2 text-right">
                      <span className="font-black text-[var(--color-text-bright)] italic text-sm">{u.otakuPoints} <span className="text-[10px] text-brand ml-0.5">PO</span></span>
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* My Focus Bar */}
            {myRank && (
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
                <div className="bg-brand rounded-2xl shadow-[0_20px_50px_rgba(255,51,51,0.3)] p-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-10 duration-700">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/20 border-2 border-white/30 overflow-hidden">
                      <img src={currentUser?.photoURL || ""} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">Sua Posição</p>
                      <p className="text-base font-black text-white italic tracking-tighter uppercase"># {myRank.currentPosition} Global</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-white">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-black italic">Faltam 145 PO para o Próximo Rank</span>
                    </div>
                    <div className="w-full h-1 bg-white/20 rounded-full mt-2">
                      <div className="h-full bg-white rounded-full w-[65%]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
