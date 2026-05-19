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
  Info,
  Users
} from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useAuth, handleFirestoreError, OperationType } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';

interface RankingUser {
  uid: string;
  username: string;
  photoURL?: string;
  numericId?: number;
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
  const { friends } = useSocial();
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [activeLeague, setActiveLeague] = useState<string>('FERRO'); 
  const [viewMode, setViewMode] = useState<'GLOBAL' | 'FRIENDS'>('GLOBAL');
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
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
        if (viewMode === 'FRIENDS' && currentUser) {
          const friendIds = [currentUser.uid, ...friends.map(f => f.uid)];
          const usersRef = collection(db, 'users');
          // Fetch friends info
          const q = query(usersRef, where('uid', 'in', friendIds.slice(0, 10)));
          
          let snapshot;
          try {
            snapshot = await getDocs(q);
          } catch (err) {
            handleFirestoreError(err, OperationType.LIST, 'users');
          }
          
          if (snapshot) {
            const friendData = snapshot.docs.map(doc => ({
              uid: doc.id,
              ...doc.data()
            } as RankingUser));
            
            setRanking(friendData.sort((a, b) => b.otakuPoints - a.otakuPoints).map((u, i) => ({ ...u, currentPosition: i + 1 })));
          }
        } else {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('rank', '==', activeLeague), orderBy('otakuPoints', 'desc'), limit(50));
          
          let snapshot;
          try {
            snapshot = await getDocs(q);
          } catch (err) {
            handleFirestoreError(err, OperationType.LIST, 'users');
          }
          
          if (snapshot) {
            let fetched = snapshot.docs.map((doc, index) => ({
              uid: doc.id,
              ...doc.data(),
              currentPosition: index + 1,
              prevPosition: index + 1
            })) as RankingUser[];
            
            if (fetched.length === 0) {
              setRanking([]);
            } else {
              setRanking(fetched);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching rankings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, [activeLeague, viewMode, currentUser, friends]);

  const topThree = ranking.slice(0, 3);
  const others = ranking.slice(3);
  const myRank = ranking.find(u => u.uid === currentUser?.uid);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 bg-gradient-to-b from-[var(--color-bg)] to-black/20">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[var(--color-border)] pb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-10 h-10 text-brand" />
              <h1 className="text-4xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">Hall da Fama</h1>
            </div>
            <div className="flex bg-[var(--color-card)] p-1 rounded-xl border border-[var(--color-border)] w-fit">
              <button 
                onClick={() => setViewMode('GLOBAL')}
                className={cn(
                  "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  viewMode === 'GLOBAL' ? "bg-brand text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                )}
              >
                Global
              </button>
              <button 
                onClick={() => setViewMode('FRIENDS')}
                className={cn(
                  "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  viewMode === 'FRIENDS' ? "bg-brand text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                )}
              >
                Amigos
              </button>
            </div>
            <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" /> Temporada termina em: <span className="text-brand">{timeRemaining}</span>
            </p>
          </div>

           {viewMode === 'GLOBAL' && (
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              {LEAGUES.map(league => (
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
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-16">
            {/* Podium */}
            <div className="space-y-4">
              <div className="text-center">
                <span className="bg-brand/10 text-brand px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-brand/20">
                  Podium: {LEAGUES.find(l => l.id === activeLeague)?.name || 'Global'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-4xl mx-auto pt-12 relative">
               <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full h-full bg-brand/5 blur-[120px] rounded-full pointer-events-none" />
               
               {/* 2nd Place */}
               {topThree[1] && (
                 <div className="md:order-1 flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-3xl bg-slate-300/10 border-4 border-slate-300/30 overflow-hidden p-1 shadow-2xl">
                        <img src={topThree[1].photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topThree[1].username}`} className="w-full h-full object-cover rounded-2xl" />
                      </div>
                      <div className="absolute -top-4 -left-4 w-10 h-10 bg-slate-400 rounded-full flex items-center justify-center border-4 border-[var(--color-bg)] font-black text-white italic">2</div>
                    </div>
                    <div className="text-center">
                      <h3 className="font-black text-[var(--color-text-bright)] uppercase tracking-tight italic">{topThree[1].username}</h3>
                      <p className="text-brand font-black text-sm">{topThree[1].otakuPoints} PO</p>
                    </div>
                 </div>
               )}

               {/* 1st Place */}
               {topThree[0] && (
                 <div className="md:order-2 flex flex-col items-center space-y-6 scale-110">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-[2rem] bg-yellow-400/10 border-4 border-yellow-400 overflow-hidden p-1 shadow-2xl">
                        <img src={topThree[0].photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topThree[0].username}`} className="w-full h-full object-cover rounded-[1.75rem]" />
                      </div>
                      <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 w-10 h-10 text-yellow-400" />
                      <div className="absolute -top-4 -left-4 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-[var(--color-bg)] font-black text-black italic text-xl shadow-lg">1</div>
                    </div>
                    <div className="text-center">
                      <h2 className="text-xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">{topThree[0].username}</h2>
                      <p className="text-brand font-black text-lg">{topThree[0].otakuPoints} PO</p>
                    </div>
                 </div>
               )}

               {/* 3rd Place */}
               {topThree[2] && (
                 <div className="md:order-3 flex flex-col items-center space-y-4">
                    <div className="relative">
                       <div className="w-24 h-24 rounded-3xl bg-orange-400/10 border-4 border-orange-400/30 overflow-hidden p-1 shadow-2xl">
                          <img src={topThree[2].photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topThree[2].username}`} className="w-full h-full object-cover rounded-2xl" />
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
          </div>

          {/* Others List */}
             <div className="bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] overflow-hidden shadow-2xl">
                <div className="grid grid-cols-12 gap-2 md:gap-4 px-4 md:px-8 py-4 bg-white/5 border-b border-[var(--color-border)] text-[9px] font-black text-gray-500 uppercase tracking-widest hidden md:grid">
                  <div className="col-span-1">Pos</div>
                  <div className="col-span-6">Otaku</div>
                  <div className="col-span-2 text-center">Liga</div>
                  <div className="col-span-2 text-right">Potuação</div>
                  <div className="col-span-1"></div>
                </div>
                <div className="divide-y divide-[var(--color-border)]">
                  {others.map(u => (
                    <div key={u.uid} className={cn(
                      "flex md:grid md:grid-cols-12 gap-3 md:gap-4 px-4 md:px-8 py-3 md:py-4 items-center transition-all hover:bg-white/5",
                      u.uid === currentUser?.uid && "bg-brand/5 border-l-4 border-brand"
                    )}>
                       <div className="font-black text-[var(--color-text-bright)] italic md:col-span-1 w-8 md:w-auto text-center md:text-left">#{u.currentPosition}</div>
                       <div className="flex-1 md:col-span-6 flex items-center gap-3 md:gap-4">
                          <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-8 h-8 md:w-10 md:h-10 rounded-xl border border-[var(--color-border)]" />
                          <div className="flex flex-col">
                            <Link to={`/profile/${u.uid}`} className="font-black text-xs md:text-sm uppercase italic tracking-tight hover:text-brand transition-colors line-clamp-1">{u.username}</Link>
                            <span className="text-[9px] md:text-[10px] font-bold text-brand opacity-60">#{u.numericId !== undefined ? u.numericId : '???'}</span>
                          </div>
                       </div>
                       <div className="hidden md:flex md:col-span-2 justify-center">
                         <span className="text-[10px] font-black uppercase text-brand/70">{u.rank || 'Bronze'}</span>
                       </div>
                       <div className="md:col-span-2 text-right font-black italic text-xs md:text-base">{u.otakuPoints} PO</div>
                       <div className="hidden md:flex md:col-span-1 justify-end">
                         <ChevronRight className="w-4 h-4 text-gray-500" />
                       </div>
                    </div>
                  ))}

                  {/* Show current user if not in ranking list */}
                  {currentUser && !ranking.some(u => u.uid === currentUser.uid) && viewMode === 'GLOBAL' && (
                    <div className="p-8 text-center bg-brand/5 border-t border-[var(--color-brand)]">
                       <p className="text-[10px] font-black uppercase tracking-widest text-brand">Você ainda não está no Top 50 desta Liga</p>
                       <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Continue completando animes para subir de posição!</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
