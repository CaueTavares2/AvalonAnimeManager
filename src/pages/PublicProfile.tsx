import { useParams, Link } from 'react-router-dom';
import { User as UserIcon, Calendar, MapPin, Grid, List as ListIcon, Star, TrendingUp, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { UserMedia } from '../hooks/useAnimeList';
import { handleFirestoreError, OperationType } from '../context/AuthContext';

export default function PublicProfile() {
  const { uid } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [list, setList] = useState<UserMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaType, setMediaType] = useState<'ANIME' | 'MANGA'>('ANIME');

  useEffect(() => {
    const fetchPublicData = async () => {
      if (!uid) return;
      try {
        // Fetch User Info
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }

        // Fetch User List
        const listRef = collection(db, 'users', uid, 'list');
        const q = query(listRef, orderBy('updatedAt', 'desc'));
        const snapshot = await getDocs(q);
        setList(snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: data.mediaId || data.id,
          } as UserMedia;
        }));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, [uid]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="pt-32 text-center text-gray-500">
      <p className="font-bold uppercase tracking-widest">Usuário não encontrado</p>
      <Link to="/community" className="text-brand text-sm font-bold hover:underline mt-4 block">Voltar para Comunidade</Link>
    </div>
  );

  const filteredList = list.filter(a => a.type === mediaType);
  const stats = {
    completed: list.filter(a => a.status === 'COMPLETED').length,
    total: list.length,
    avgScore: list.filter(a => a.score > 0).reduce((acc, curr) => acc + curr.score, 0) / (list.filter(a => a.score > 0).length || 1)
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 pt-8">
      <Link to="/community" className="flex items-center gap-2 text-gray-500 hover:text-brand transition-colors group text-xs font-bold uppercase tracking-widest">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar
      </Link>

      <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-brand/80 to-brand" />
        <div className="px-8 pb-8 flex flex-col md:flex-row items-end justify-between gap-6 -translate-y-6">
          <div className="flex items-end gap-6">
            <div className="w-24 h-24 bg-[var(--color-card)] rounded-2xl shadow-lg border-4 border-[var(--color-card)] overflow-hidden shrink-0">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[var(--color-bg)] flex items-center justify-center text-gray-300">
                  <UserIcon className="w-12 h-12" />
                </div>
              )}
            </div>
            <div className="flex-1 pb-1">
              <h1 className="text-2xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">{profile.username}</h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                {profile.location && <><MapPin className="w-3 h-3" /> {profile.location} | </>}
                <Calendar className="w-3 h-3" /> Membro desde {profile.joinedDate || '2026'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-6">
          <div className="bg-[var(--color-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resumo</h3>
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

          <div className="bg-[var(--color-card)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sobre</h3>
            <p className="text-[var(--color-text)] text-xs leading-relaxed italic line-clamp-6">
              {profile.bio || "Este usuário ainda não escreveu uma bio."}
            </p>
          </div>
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
            <div className="flex gap-6">
              <button 
                onClick={() => setMediaType('ANIME')}
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                  mediaType === 'ANIME' ? "text-brand" : "text-gray-500 hover:text-gray-300"
                )}
              >
                Anime List ({list.filter(a => a.type === 'ANIME').length})
              </button>
              <button 
                onClick={() => setMediaType('MANGA')}
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                  mediaType === 'MANGA' ? "text-brand" : "text-gray-500 hover:text-gray-300"
                )}
              >
                Manga List ({list.filter(a => a.type === 'MANGA').length})
              </button>
            </div>
          </div>

          {filteredList.length === 0 ? (
            <div className="py-20 text-center bg-[var(--color-card)]/20 rounded-2xl border-2 border-dashed border-[var(--color-border)]">
              <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Nenhum título encontrado nesta categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredList.map(item => (
                <div key={item.id} className="bg-[var(--color-card)] rounded-xl overflow-hidden border border-[var(--color-border)] group hover:scale-105 transition-all">
                  <div className="aspect-[2/3] relative">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-white italic">{item.score > 0 ? item.score : '--'}/10</span>
                        <span className="text-[8px] font-black text-brand uppercase tracking-widest px-1.5 py-0.5 bg-white/10 rounded-sm">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-[11px] font-black text-[var(--color-text-bright)] line-clamp-1 uppercase tracking-tight">{item.title}</h4>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                      {item.progress} / {item.totalProgress || '?'} {mediaType === 'ANIME' ? 'Eps' : 'Chs'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
