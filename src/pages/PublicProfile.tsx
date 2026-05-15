import { useParams, Link } from 'react-router-dom';
import { User as UserIcon, Calendar, MapPin, Grid, List as ListIcon, Star, TrendingUp, ChevronLeft, Heart, Zap, UserPlus, Check, MessageSquare } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { UserMedia, useAnimeList } from '../hooks/useAnimeList';
import { handleFirestoreError, OperationType, useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';

export default function PublicProfile() {
  const { uid } = useParams();
  const { user: currentUser } = useAuth();
  const { list: myOwnList } = useAnimeList();
  const { 
    friends, 
    requests, 
    sendRequest, 
    acceptRequest, 
    calculateAffinity, 
    sendSalvationPill 
  } = useSocial();
  
  const [profile, setProfile] = useState<any>(null);
  const [list, setList] = useState<UserMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaType, setMediaType] = useState<'ANIME' | 'MANGA' | 'COMMON'>('ANIME');
  const [affinity, setAffinity] = useState<number | null>(null);
  const [sendingPill, setSendingPill] = useState(false);
  const [pillStatus, setPillStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const isFriend = useMemo(() => friends.some(f => f.uid === uid), [friends, uid]);
  const hasPendingRequest = useMemo(() => requests.some(r => r.from === uid), [requests, uid]);

  const handleSendPill = async () => {
    if (!uid) return;
    setSendingPill(true);
    setPillStatus('idle');
    try {
      await sendSalvationPill(uid);
      setPillStatus('success');
      // Refresh profile data to clear "needsHelp"
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        setProfile(userDoc.data());
      }
    } catch (err: any) {
      setPillStatus('error');
      alert(err.message || 'Erro ao enviar pílula.');
    } finally {
      setSendingPill(false);
    }
  };

  const commonItems = useMemo(() => {
    const myIds = new Set(myOwnList.map(i => i.id));
    return list.filter(item => myIds.has(item.id));
  }, [myOwnList, list]);

  useEffect(() => {
    const fetchPublicData = async () => {
      if (!uid) return;
      try {
        // Fetch User Info
        const userRef = doc(db, 'users', uid);
        let userDoc;
        try {
          userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setProfile(userDoc.data());
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        }

        // Fetch User List
        const listRef = collection(db, 'users', uid, 'list');
        try {
          const snapshot = await getDocs(listRef);
          setList(snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.data().mediaId || doc.id,
          } as UserMedia)));
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, `users/${uid}/list`);
        }

        if (currentUser && uid !== currentUser.uid) {
          const score = await calculateAffinity(uid);
          setAffinity(score);
        }
      } catch (error) {
        console.error("Error fetching public data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, [uid, currentUser]);

  const stats = {
    completed: list.filter(a => a.status === 'COMPLETED').length,
    total: list.length,
    avgScore: list.filter(a => (a.score || 0) > 0).reduce((acc, curr) => acc + (curr.score || 0), 0) / (list.filter(a => (a.score || 0) > 0).length || 1)
  };

  const filteredList = mediaType === 'COMMON' ? commonItems : list.filter(a => a.type === mediaType);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 pt-8">
      <Link to="/social" className="flex items-center gap-2 text-gray-500 hover:text-brand transition-colors group text-xs font-bold uppercase tracking-widest">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Social Hub
      </Link>

      <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div className="h-48 relative overflow-hidden group/banner">
          <img 
            src={profile.bannerURL || 'https://images.unsplash.com/photo-1578632738908-48b4850ee98d?auto=format&fit=crop&q=80&w=1200'} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover/banner:scale-105" 
            alt="Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card)] to-transparent opacity-60" />
          
          {affinity !== null && (
            <div className="absolute top-4 right-8 flex flex-col items-end">
               <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 shadow-2xl">
                  <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
                  <div className="text-right">
                     <p className="text-[10px] font-black text-white/70 uppercase tracking-widest leading-none">Afinidade</p>
                     <p className="text-xl font-black text-white italic leading-none">{affinity}%</p>
                  </div>
               </div>
            </div>
          )}
        </div>
        <div className="px-8 pb-8 flex flex-col md:flex-row items-end justify-between gap-6 -translate-y-12">
          <div className="flex items-end gap-6">
            <div className="relative group/avatar">
              <div className="w-32 h-32 bg-[var(--color-card)] rounded-[32px] shadow-2xl border-8 border-[var(--color-card)] overflow-hidden shrink-0">
                <img src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} alt={profile.username} className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-500" />
              </div>
              <div className={cn(
                "absolute bottom-4 right-4 w-6 h-6 rounded-full border-4 border-[var(--color-card)] shadow-lg",
                profile.status === 'ONLINE' ? "bg-emerald-500 shadow-emerald-500/50" : profile.status === 'MARATONANDO' ? "bg-brand shadow-brand/50 animate-pulse" : "bg-gray-500"
              )} />
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic drop-shadow-sm">{profile.username}</h1>
                <span className="text-xs font-black text-brand italic">{profile.customId}</span>
              </div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                 {profile.rank || 'FERRO'} | {profile.otakuPoints || 0} PO
              </p>
              {profile.status === 'MARATONANDO' && (
                <p className="text-brand text-[9px] font-black uppercase tracking-widest mt-1 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 fill-brand" /> Maratonando agora: {profile.currentActivity || 'Algo Incrível'}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
             {isFriend && profile.needsHelp && (
               <button 
                onClick={handleSendPill}
                disabled={sendingPill}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all",
                  pillStatus === 'success' ? "bg-emerald-500 text-white" : 
                  "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 animate-pulse hover:animate-none"
                )}
               >
                 <Heart className="w-4 h-4 fill-white" /> {sendingPill ? 'Enviando...' : pillStatus === 'success' ? 'Streak Salvo!' : 'Salvar Streak'}
               </button>
             )}
             {!isFriend && uid !== currentUser?.uid && (
               <button 
                onClick={() => sendRequest(profile.customId)}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
               >
                 <UserPlus className="w-4 h-4" /> {hasPendingRequest ? 'Aguardando' : 'Add Amigo'}
               </button>
             )}
             {isFriend && (
               <Link 
                to={`/chat?friend=${uid}`}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
               >
                 <MessageSquare className="w-4 h-4" /> Chat
               </Link>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-6">
          <div className="bg-[var(--color-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resumo Otaku</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-widest">Total na Lista</span>
                <span className="text-[var(--color-text-bright)] font-black italic">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-widest">Completados</span>
                <span className="text-emerald-500 font-black italic">{stats.completed}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-widest">Nota Média</span>
                <span className="text-brand font-black italic">{stats.avgScore.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {profile.favoriteGenres && (
            <div className="bg-[var(--color-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gostos</h3>
              <div className="flex flex-wrap gap-2">
                {profile.favoriteGenres.map((g: string) => (
                  <span key={g} className="px-2 py-1 bg-[var(--color-bg)] rounded text-[9px] font-black text-gray-400 uppercase border border-[var(--color-border)]">{g}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4 overflow-x-auto">
            <div className="flex gap-8 whitespace-nowrap">
              {(['ANIME', 'MANGA', 'COMMON'] as const).map(type => (
                <button 
                  key={type}
                  onClick={() => setMediaType(type)}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] transition-all relative pb-2",
                    mediaType === type ? "text-brand" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  {type === 'ANIME' ? 'Anime List' : type === 'MANGA' ? 'Manga List' : 'Em Comum'}
                  {mediaType === type && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand animate-in slide-in-from-left duration-300" />}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredList.map(item => (
              <div key={item.id} className="group relative">
                <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-lg transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-2">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 flex flex-col justify-end">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-tight italic line-clamp-2">{item.title}</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-brand italic">{(item.score || 0) > 0 ? item.score : '--'}</span>
                        <span className="text-[8px] font-black px-1.5 py-0.5 bg-white/20 rounded-md text-white uppercase tracking-widest">{item.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredList.length === 0 && (
              <div className="col-span-full py-20 text-center animate-pulse">
                <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest italic opacity-50">Nada encontrado por aqui...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
