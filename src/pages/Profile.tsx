import { User as UserIcon, Calendar, MapPin, Edit3, Save, X, LogOut, ShieldCheck, TrendingUp, Heart, Trophy, Medal, Star, Ghost } from 'lucide-react';
import { useAnimeList } from '../hooks/useAnimeList';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites, FavoriteCharacter } from '../context/FavoritesContext';
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { doc, updateDoc, collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ACHIEVEMENTS } from '../services/rankingService';

export default function Profile() {
  const { list } = useAnimeList();
  const { profile, updateProfile } = useProfile();
  const { user, logout, isAdmin } = useAuth();
  const { favoriteCharacters } = useFavorites();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'ANIME' | 'CHARACTERS'>('ANIME');

  const [editedPhotoURL, setEditedPhotoURL] = useState(profile.photoURL || user?.photoURL || '');
  const [editedBannerURL, setEditedBannerURL] = useState(profile.bannerURL || '');
  const isAdminUser = user?.email === 'caue.nanda.tavares@gmail.com';
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  // Helper to check if user has achievement
  const hasAchievement = (achId: string) => {
    if (isAdminUser) return true;
    return achievements.some(a => a.id === achId);
  };

  // Calculate unlocked count based on hasAchievement to ensure admin/real progress is consistent
  const unlockedCount = Object.keys(ACHIEVEMENTS).filter(id => hasAchievement(id)).length;

  const stats = {
    completed: list.filter(a => a.status === 'COMPLETED').length,
    watching: list.filter(a => a.status === 'WATCHING' || a.status === 'READING').length,
    planning: list.filter(a => a.status === 'PLANNING').length,
    total: list.length
  };

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user) return;
      try {
        const achRef = collection(db, 'users', user.uid, 'achievements');
        const snap = await getDocs(achRef);
        setAchievements(snap.docs.map(doc => doc.data()));
      } catch (error) {
        console.error("Error fetching achievements:", error);
      }
    };
    fetchAchievements();
  }, [user]);

  // Rank Info logic
  const RANK_COLORS: Record<string, string> = {
    'FERRO': 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
    'BRONZE': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    'PRATA': 'text-slate-300 bg-slate-300/10 border-slate-300/20',
    'OURO': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    'PLATINA': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    'DIAMANTE': 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    'DESAFIANTE': 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
  };

  const handleSave = async () => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
      const userData = userSnap.docs[0]?.data();
      const currentChanges = (userData?.weeklyChangesCount || 0) + 1;

      await updateDoc(userRef, {
        username: editedProfile.username,
        bio: editedProfile.bio,
        location: editedProfile.location,
        favoriteAnime: editedProfile.favoriteAnime,
        photoURL: editedPhotoURL,
        bannerURL: editedBannerURL,
        weeklyChangesCount: currentChanges,
        updatedAt: new Date().toISOString()
      });

      if (currentChanges >= 3) {
        const { rankingService } = await import('../services/rankingService');
        await rankingService.grantAchievement(user.uid, 'SINDROME_PROTAGONISTA');
      }

      if (editedBannerURL && editedBannerURL !== profile.bannerURL) {
        const { rankingService } = await import('../services/rankingService');
        await rankingService.grantAchievement(user.uid, 'DESIGNER_INTERIOR');
      }
    }
    updateProfile({ ...editedProfile, photoURL: editedPhotoURL, bannerURL: editedBannerURL });
    setIsEditing(false);
  };

  const memberSince = profile.createdAt?.seconds 
    ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString('pt-BR')
    : profile.joinedDate || 'Recentemente';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Card */}
      <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden group/banner">
        <div className="h-48 relative overflow-hidden">
          <img 
            src={profile.bannerURL || 'https://images.unsplash.com/photo-1578632738908-48b4850ee98d?auto=format&fit=crop&q=80&w=1200'} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover/banner:scale-105" 
            alt="Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card)] to-transparent opacity-60" />
        </div>
        <div className="px-8 pb-8 flex flex-col md:flex-row items-end justify-between gap-6 -translate-y-12">
          <div className="flex items-end gap-6">
            <div className="w-32 h-32 bg-[var(--color-card)] rounded-[32px] shadow-2xl border-8 border-[var(--color-card)] overflow-hidden shrink-0 relative group/avatar">
              {profile.photoURL || user?.photoURL ? (
                <img src={profile.photoURL || user?.photoURL || ''} alt={profile.username} className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-[var(--color-bg)] flex items-center justify-center text-gray-300">
                  <UserIcon className="w-16 h-16" />
                </div>
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic drop-shadow-sm">{profile.username}</h1>
                <div className={cn(
                  "px-2 py-0.5 rounded flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest border shadow-sm",
                  RANK_COLORS[profile.rank || 'FERRO']
                )}>
                  <Trophy className="w-3 h-3" /> {profile.rank || 'FERRO'}
                </div>
                {isAdmin && (
                  <div className="bg-brand/10 text-brand px-2 py-0.5 rounded flex items-center gap-1 text-[8px] font-black uppercase tracking-widest border border-brand/20">
                    <ShieldCheck className="w-3 h-3" /> Staff
                  </div>
                )}
              </div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                  <span className="text-brand italic" title="Pontos de Ranking">{profile.otakuPoints || 0} PO</span>
                  <span className="opacity-30">|</span>
                  <span className="text-blue-400 italic" title="Saldo na Loja">{profile.availablePoints || 0} AP</span>
                  <span className="opacity-30">|</span>
                  <Calendar className="w-3 h-3" /> Membro desde {memberSince}
                  {profile.location && (
                    <>
                      <span className="opacity-30">|</span>
                      <MapPin className="w-3 h-3" /> {profile.location}
                    </>
                  )}
                </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="hidden md:flex flex-col items-end justify-center px-4 border-r border-[var(--color-border)]">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Nível de Poder</p>
              <p className="text-lg font-black text-[var(--color-text-bright)] italic leading-none">{profile.otakuPoints || 0}</p>
            </div>
            <button 
              onClick={() => {
                setEditedProfile(profile);
                setIsEditing(true);
              }}
              className="flex items-center gap-2 bg-[var(--color-card)] hover:bg-[var(--color-bg)] border border-[var(--color-border)] px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-[var(--color-text-bright)] transition-all"
            >
              <Edit3 className="w-4 h-4" /> Editar
            </button>
            <button 
              onClick={() => logout()}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Stats */}
        <div className="space-y-6">
          <div className="bg-[var(--color-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Estatísticas Rápidas</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center bg-[var(--color-bg)] p-3 rounded-lg border border-[var(--color-border)]">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total na Lista</span>
                <span className="text-lg font-black text-brand">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center bg-[var(--color-bg)] p-3 rounded-lg border border-[var(--color-border)]">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completados</span>
                <span className="text-lg font-black text-emerald-500">{stats.completed}</span>
              </div>
              <div className="flex justify-between items-center bg-[var(--color-bg)] p-3 rounded-lg border border-[var(--color-border)]">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assistindo</span>
                <span className="text-lg font-black text-blue-500">{stats.watching}</span>
              </div>
              <div className="flex justify-between items-center bg-[var(--color-bg)] p-3 rounded-lg border border-[var(--color-border)]">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Planejados</span>
                <span className="text-lg font-black text-orange-500">{stats.planning}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bio/Activity */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[var(--color-card)] p-8 rounded-xl border border-[var(--color-border)] shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[var(--color-text-bright)] uppercase tracking-widest">Sobre Mim</h3>
              <div className="flex bg-[var(--color-bg)] p-1 rounded-lg border border-[var(--color-border)]">
                <button 
                  onClick={() => setViewMode('ANIME')}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all",
                    viewMode === 'ANIME' ? "bg-brand text-white shadow-md" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  Bio
                </button>
                <button 
                  onClick={() => setViewMode('CHARACTERS')}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all",
                    viewMode === 'CHARACTERS' ? "bg-brand text-white shadow-md" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  Favoritos
                </button>
              </div>
            </div>

            {viewMode === 'ANIME' ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <p className="text-[var(--color-text)] text-sm leading-relaxed italic">
                  {profile.bio}
                </p>
                <div className="h-px bg-[var(--color-border)] w-full" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-border)]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Anime Favorito</p>
                    <p className="text-sm font-bold text-[var(--color-text-bright)]">{profile.favoriteAnime}</p>
                  </div>
                  <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-border)]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Gêneros Prediletos</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.favoriteGenres.map(genre => (
                        <span key={genre} className="bg-brand/10 text-brand px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                {favoriteCharacters.length > 0 ? favoriteCharacters.map(char => (
                  <div key={char.id} className="bg-[var(--color-bg)] group rounded-xl overflow-hidden border border-[var(--color-border)] relative">
                    <div className="aspect-[3/4] overflow-hidden">
                      <img src={char.image} alt={char.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="p-2 text-center">
                      <p className="text-[9px] font-black text-[var(--color-text-bright)] uppercase tracking-tighter line-clamp-1">{char.name}</p>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500 gap-4">
                    <Ghost className="w-12 h-12 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhum personagem favorito ainda</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-[var(--color-card)] p-8 rounded-xl border border-[var(--color-border)] shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[var(--color-text-bright)] uppercase tracking-widest flex items-center gap-2">
                <Medal className="w-4 h-4 text-brand" /> Conquistas Avalon
              </h3>
              <button 
                onClick={() => setShowAllAchievements(true)}
                className="text-[9px] font-black uppercase tracking-[0.2em] text-brand hover:underline transition-all"
              >
                Ver Todas
              </button>
            </div>
            
            <div className="grid grid-cols-4 md:grid-cols-6 gap-6">
              {Object.values(ACHIEVEMENTS).map(ach => {
                const unlocked = hasAchievement(ach.id);
                // Reveal details for admin even if locked, only hide for regular users if locked
                const shouldHide = ach.secret && !unlocked && !isAdminUser;
                
                if (shouldHide) {
                  return (
                    <div key={ach.id} className="flex flex-col items-center gap-2 group relative text-center grayscale opacity-20">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-zinc-700 bg-zinc-800 text-zinc-600">
                        <Ghost size={24} />
                      </div>
                      <p className="text-[8px] font-black uppercase tracking-tighter text-zinc-600 mt-1">[???]</p>
                    </div>
                  );
                }

                return (
                  <div key={ach.id} className={cn(
                    "flex flex-col items-center gap-2 group relative text-center transition-all",
                    !unlocked && "grayscale opacity-30"
                  )}>
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all group-hover:scale-110 shadow-lg",
                      ach.rarity === 'COMUM' ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500 shadow-emerald-500/10" :
                      ach.rarity === 'RARO' ? "bg-blue-500/10 border-blue-500/50 text-blue-500 shadow-blue-500/10" :
                      ach.rarity === 'EPICO' ? "bg-purple-500/10 border-purple-500/50 text-purple-500 shadow-purple-500/10" :
                      "bg-yellow-500/10 border-yellow-500/50 text-yellow-500 shadow-yellow-500/10"
                    )}>
                      {(ach.secret && !unlocked && !isAdminUser) ? <Ghost className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
                    </div>
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-tighter line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4 bg-[var(--color-bg)] px-2 py-0.5 rounded border border-[var(--color-border)] z-10 whitespace-nowrap">
                      {ach.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Encyclopedia Modal */}
      {showAllAchievements && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-card)] w-full max-w-3xl rounded-[32px] shadow-2xl border border-[var(--color-border)] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-[var(--color-border)] flex items-center justify-between bg-gradient-to-r from-[var(--color-bg)] to-transparent">
              <div>
                <h2 className="text-2xl font-black text-[var(--color-text-bright)] uppercase tracking-widest italic leading-none">Enciclopédia de Conquistas</h2>
                <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-1 italic">Coleção Completa do App</p>
              </div>
              <button 
                onClick={() => setShowAllAchievements(false)} 
                className="w-10 h-10 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center transition-colors text-gray-400 border border-[var(--color-border)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              {Object.values(ACHIEVEMENTS).map(ach => {
                const unlocked = hasAchievement(ach.id);
                const isSecret = ach.secret && !unlocked && !isAdminUser;

                return (
                  <div key={ach.id} className={cn(
                    "flex gap-5 p-5 rounded-3xl border-2 transition-all relative group",
                    unlocked ? "bg-white/5 border-brand/20 shadow-lg shadow-brand/5" : "bg-zinc-900/50 border-zinc-800 grayscale cursor-not-allowed"
                  )}>
                    <div className={cn(
                      "w-16 h-16 rounded-[20px] flex items-center justify-center border-2 shrink-0 transition-transform group-hover:rotate-6",
                      isSecret ? "bg-zinc-800 border-zinc-700 text-zinc-600" :
                      ach.rarity === 'COMUM' ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" :
                      ach.rarity === 'RARO' ? "bg-blue-500/10 border-blue-500 text-blue-500" :
                      ach.rarity === 'EPICO' ? "bg-purple-500/10 border-purple-500 text-purple-500" :
                      "bg-yellow-500/10 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                    )}>
                      {isSecret ? <Ghost size={32} /> : <Trophy size={32} />}
                    </div>

                    <div className="flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                          ach.rarity === 'COMUM' ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10" :
                          ach.rarity === 'RARO' ? "text-blue-500 border-blue-500/30 bg-blue-500/10" :
                          ach.rarity === 'EPICO' ? "text-purple-500 border-purple-500/30 bg-purple-500/10" :
                          "text-yellow-500 border-yellow-500/30 bg-yellow-500/10"
                        )}>{ach.rarity}</span>
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">+{ach.points} PO</span>
                      </div>
                      <h4 className="font-black text-sm uppercase italic tracking-tight text-[var(--color-text-bright)] truncate">
                        {isSecret ? '[ RESTRITO ]' : ach.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-medium leading-normal italic mt-1 line-clamp-2">
                        {isSecret ? 'Esta conquista é um segredo guardado pelas sombras do multiverso...' : ach.description}
                      </p>
                    </div>

                    {unlocked && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-brand w-2 h-2 rounded-full shadow-[0_0_8px_var(--color-brand)] animate-pulse" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="p-8 bg-zinc-900/50 border-t border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Medal className="text-zinc-500" size={20} />
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
                  Progresso: {unlockedCount} / {Object.keys(ACHIEVEMENTS).length}
                </span>
              </div>
              <p className="text-[10px] font-bold text-zinc-600 uppercase italic">Conquistas secretas são reveladas apenas para quem as conquista.</p>
            </div>
          </div>
        </div>
      )}
      {isEditing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-card)] w-full max-w-lg rounded-2xl shadow-2xl border border-[var(--color-border)] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 className="text-xl font-black text-[var(--color-text-bright)] uppercase tracking-widest italic">Editar Perfil</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-[var(--color-bg)] rounded-full transition-colors text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-4">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                  ⚠️ Aviso de Segurança
                </p>
                <p className="text-[9px] text-orange-400 font-bold uppercase mt-1 leading-tight">
                  IMAGENS +18 SÃO ESTRITAMENTE PROIBIDAS NO BANNER OU PERFIL. O DESCUMPRIMENTO RESULTARÁ EM BANIMENTO IMEDIATO SEM DIREITO A RECURSO.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Link do Avatar</label>
                  <input 
                    type="url" 
                    placeholder="https://sua-foto.png"
                    value={editedPhotoURL}
                    onChange={e => setEditedPhotoURL(e.target.value)}
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Link do Banner</label>
                  <input 
                    type="url" 
                    placeholder="https://seu-banner.png"
                    value={editedBannerURL}
                    onChange={e => setEditedBannerURL(e.target.value)}
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nome de Usuário</label>
                <input 
                  type="text" 
                  value={editedProfile.username}
                  onChange={e => setEditedProfile({...editedProfile, username: e.target.value})}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Bio</label>
                <textarea 
                  value={editedProfile.bio}
                  onChange={e => setEditedProfile({...editedProfile, bio: e.target.value})}
                  rows={3}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:ring-1 focus:ring-brand resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Localização (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Onde você está no multiverso?"
                  value={editedProfile.location}
                  onChange={e => setEditedProfile({...editedProfile, location: e.target.value})}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:ring-1 focus:ring-brand placeholder:opacity-50"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Anime Favorito</label>
                <input 
                  type="text" 
                  value={editedProfile.favoriteAnime}
                  onChange={e => setEditedProfile({...editedProfile, favoriteAnime: e.target.value})}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <div className="p-6 bg-[var(--color-bg)] flex gap-4">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-3 border border-[var(--color-border)] rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-white transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 px-4 py-3 bg-brand text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
