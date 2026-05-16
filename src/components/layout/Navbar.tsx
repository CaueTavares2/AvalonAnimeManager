import { Search, User, MoreHorizontal, Settings as SettingsIcon, LogIn, PieChart, Users, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jikanService, JikanAnime } from '../../services/jikanService';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useSocial } from '../../context/SocialContext';

export default function Navbar() {
  const { t } = useLanguage();
  const { user, logout, mediaType } = useAuth();
  const { requests } = useSocial();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<JikanAnime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [failedSearches, setFailedSearches] = useState(0);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.trim().length > 2) {
        try {
          const data = await jikanService.search(search, mediaType);
          setResults(data);
          setIsSearching(true);
          
          if (data.length === 0) {
            const newFailed = failedSearches + 1;
            setFailedSearches(newFailed);
            if (newFailed >= 5 && user) {
              const { rankingService } = await import('../../services/rankingService');
              await rankingService.grantAchievement(user.uid, 'SEARCH_ONE_PIECE');
              setFailedSearches(0);
            }
          }
        } catch (error) {
          console.error("Search failed:", error);
        }
      } else {
        setResults([]);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, mediaType, user, failedSearches]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: number) => {
    setSearch('');
    setIsSearching(false);
    navigate(`/${mediaType}/${id}`);
  };

  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = async (e: React.MouseEvent) => {
    if (user) {
      const newClicks = logoClicks + 1;
      setLogoClicks(newClicks);
      if (newClicks === 10) {
        const { rankingService } = await import('../../services/rankingService');
        await rankingService.grantAchievement(user.uid, 'GENJUTSU');
        setLogoClicks(0);
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-[var(--color-card)]/95 backdrop-blur-md text-[var(--color-text-bright)] z-[100] flex items-center px-4 md:px-8 shadow-lg border-b border-[var(--color-border)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 cursor-pointer group">
            <div className="text-brand font-black text-2xl tracking-tighter uppercase italic group-hover:scale-110 transition-transform duration-300">Avalon</div>
          </Link>

          <div className="hidden lg:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
            <Link to="/" className="text-gray-400 hover:text-brand transition-colors">{t('nav.browse')}</Link>
            <Link to="/list" className="text-gray-400 hover:text-brand transition-colors">{t('nav.list')}</Link>
            <Link to="/ranking" className="text-gray-400 hover:text-brand transition-colors">Ranking</Link>
            <Link to="/shop" className="text-gray-400 hover:text-brand transition-colors">Loja</Link>
            <Link to="/social" className="text-gray-400 hover:text-brand transition-colors flex items-center gap-1.5">
              Social
              {requests.length > 0 && (
                <span className="w-2 h-2 bg-brand rounded-full animate-pulse" />
              )}
            </Link>
            <Link to="/chat" className="text-gray-400 hover:text-brand transition-colors">AniChat</Link>
            <Link to="/analytics" className="text-gray-400 hover:text-brand transition-colors">Analytics</Link>
            <Link to="/settings" className="text-gray-400 hover:text-brand transition-colors hover:scale-105 active:scale-95 transition-transform"><SettingsIcon className="w-4 h-4" /></Link>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative hidden md:block" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => search.length > 1 && setIsSearching(true)}
              className="bg-[var(--color-bg)] rounded-md py-2 pl-9 pr-4 text-xs w-48 focus:w-64 transition-all focus:outline-none focus:ring-1 focus:ring-brand border border-transparent focus:border-brand/50"
            />

            {/* Search Results Dropdown */}
            {isSearching && results.length > 0 && (
              <div className="absolute top-12 left-0 right-0 bg-[var(--color-card)] rounded-lg shadow-2xl border border-[var(--color-border)] overflow-hidden text-[var(--color-text)]">
                {results.map(anime => (
                  <div 
                    key={anime.mal_id}
                    onClick={() => handleSelect(anime.mal_id)}
                    className="flex items-center gap-3 p-3 hover:bg-[var(--color-bg)] cursor-pointer border-b border-[var(--color-border)] last:border-0"
                  >
                    <img src={anime.images.webp.image_url} className="w-8 h-12 object-cover rounded shadow-sm border border-black/5" />
                    <div>
                      <p className="text-[11px] font-bold line-clamp-1">{anime.title}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{anime.status} • {anime.year || '?'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/analytics" className="p-2 hover:bg-[var(--color-bg)] rounded-md transition-colors relative group">
                  <PieChart className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:text-brand" />
                </Link>
                <Link to="/profile" className="p-2 hover:bg-[var(--color-bg)] rounded-md transition-colors relative group overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} className="w-6 h-6 rounded-full" alt="Profile" />
                  ) : (
                    <User className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:text-brand" />
                  )}
                </Link>
                <button 
                  onClick={() => logout()}
                  className="hidden md:block p-2 hover:bg-[var(--color-bg)] rounded-md transition-colors text-xs font-black uppercase tracking-widest text-gray-400 hover:text-red-500"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="flex items-center gap-2 px-4 py-2 bg-brand/10 text-brand border border-brand/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

