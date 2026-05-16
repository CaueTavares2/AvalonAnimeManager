import React, { useState, useEffect } from 'react';
import { Search, User as UserIcon, Star, TrendingUp, Users as UsersIcon, ChevronRight } from 'lucide-react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { handleFirestoreError, OperationType } from '../context/AuthContext';

interface CommunityUser {
  uid: string;
  username: string;
  numericId?: number;
  photoURL?: string;
  bio?: string;
  joinedDate: string;
  stats?: {
    total: number;
    completed: number;
  };
}

export default function Community() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<CommunityUser[]>([]);

  useEffect(() => {
    const fetchRecentUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('createdAt', 'desc'), limit(12));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as CommunityUser[];
        setRecentUsers(fetched);
      } catch (error) {
        console.error("Error fetching users:", error);
        // Silently fail for recent users grid or show minimal toast
      } finally {
        setLoading(false);
      }
    };
    fetchRecentUsers();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('username', '>=', search), 
        where('username', '<=', search + '\uf8ff'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as CommunityUser[];
      setUsers(fetched);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[var(--color-border)] pb-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-brand" /> {t('community.title')}
            </h1>
            <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">{t('community.subtitle')}</p>
          </div>

          <form onSubmit={handleSearch} className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder={t('community.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:ring-2 focus:ring-brand shadow-sm"
            />
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-12">
            {users.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-4">Resultados da Busca</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {users.map(user => (
                    <UserCard key={user.uid} user={user} />
                  ))}
                </div>
              </div>
            ) : search ? (
              <div className="text-center py-20 bg-[var(--color-card)]/30 rounded-3xl border-2 border-dashed border-[var(--color-border)]">
                <p className="text-gray-400 font-bold uppercase tracking-widest">Nenhum usuário encontrado com "{search}"</p>
              </div>
            ) : null}

            <div className="space-y-6">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-4">Membros Recentes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recentUsers.map(user => (
                  <UserCard key={user.uid} user={user} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const UserCard = React.memo(({ user }: { user: CommunityUser }) => {
  return (
    <Link 
      to={`/profile/${user.uid}`}
      className="group bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-border)] hover:border-brand/30 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand/5 flex flex-col items-center text-center space-y-4"
    >
      <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-white/10 group-hover:rotate-3 transition-transform">
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.username} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[var(--color-bg)] flex items-center justify-center text-gray-300">
            <UserIcon className="w-10 h-10" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="font-black text-[var(--color-text-bright)] uppercase tracking-tight group-hover:text-brand transition-colors line-clamp-1">
          {user.username} <span className="text-brand not-italic opacity-40 ml-1">#{user.numericId || '??'}</span>
        </h3>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">Membro desde {user.joinedDate || '2026'}</p>
      </div>

      {user.bio && (
        <p className="text-[11px] text-gray-500 line-clamp-2 italic min-h-[32px] leading-relaxed">"{user.bio}"</p>
      )}

      <div className="w-full pt-4 border-t border-[var(--color-border)] flex justify-between items-center">
        <div className="flex flex-col items-start">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Lista</span>
          <span className="text-sm font-black text-[var(--color-text-bright)] italic">{user.stats?.total || 0}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">Nota Média</span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-black text-[var(--color-text-bright)] italic">--</span>
          </div>
        </div>
      </div>

      <div className="w-full pt-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
        <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-brand">
          Ver Perfil <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );
});
