import { User as UserIcon, Calendar, MapPin, Edit3, Save, X, LogOut, ShieldCheck, TrendingUp, Heart, Trophy, Medal, Star, Ghost } from 'lucide-react';
import { useAnimeList } from '../hooks/useAnimeList';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites, FavoriteCharacter } from '../context/FavoritesContext';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { doc, updateDoc, collection, query, getDocs } from 'firebase/firestore';
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
      await updateDoc(userRef, {
        username: editedProfile.username,
        bio: editedProfile.bio,
        location: editedProfile.location,
        favoriteAnime: editedProfile.favoriteAnime,
        updatedAt: new Date().toISOString()
      });
    }
    updateProfile(editedProfile);
    setIsEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Card */}
      <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-brand to-brand-dark" />
        <div className="px-8 pb-8 flex flex-col md:flex-row items-end justify-between gap-6 -translate-y-6">
          <div className="flex items-end gap-6">
            <div className="w-24 h-24 bg-[var(--color-card)] rounded-2xl shadow-lg border-4 border-[var(--color-card)] overflow-hidden shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[var(--color-bg)] flex items-center justify-center text-gray-300">
                  <UserIcon className="w-12 h-12" />
                </div>
              )}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">{profile.username}</h1>
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
                <span className="text-brand italic">{profile.otakuPoints || 0} PO</span>
                <span className="opacity-30">|</span>
                <Calendar className="w-3 h-3" /> Membro desde {profile.joinedDate}
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
            <h3 className="text-sm font-black text-[var(--color-text-bright)] uppercase tracking-widest flex items-center gap-2">
              <Medal className="w-4 h-4 text-brand" /> Conquistas Avalon
            </h3>
            
            <div className="grid grid-cols-4 md:grid-cols-6 gap-6">
              {achievements.length > 0 ? achievements.map(ach => (
                <div key={ach.id} className="flex flex-col items-center gap-2 group relative text-center">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all group-hover:scale-110 shadow-lg",
                    ach.rarity === 'LENDARIO' ? "bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-indigo-500/20" :
                    ach.rarity === 'EPICO' ? "bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-yellow-500/20" :
                    ach.rarity === 'RARO' ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-emerald-500/20" :
                    "bg-zinc-500/20 border-zinc-500 text-zinc-400 shadow-zinc-500/20"
                  )}>
                    <Trophy className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] text-zinc-400 font-black uppercase tracking-tighter line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4">{ach.title}</p>
                </div>
              )) : Object.values(ACHIEVEMENTS).map(ach => (
                <div key={ach.id} className="flex flex-col items-center gap-2 grayscale opacity-20 cursor-not-allowed">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-500">
                    <Trophy className="w-6 h-6" />
                  </div>
                </div>
              ))}
            </div>
            
            {achievements.length === 0 && (
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center italic mt-4">
                Você ainda não desbloqueou nenhuma conquista lendária. Programe sua lista para brilhar!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
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
