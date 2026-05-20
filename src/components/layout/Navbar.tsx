import { Search, User, Settings as SettingsIcon, LogIn, ChevronDown, Trophy, ShoppingBag, Radio, MessageCircle, BarChart3, AlertCircle, Menu, X, Play, LayoutGrid } from 'lucide-react';
import { cn } from '../../lib/utils';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jikanService, JikanAnime } from '../../services/jikanService';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useSocial } from '../../context/SocialContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { t } = useLanguage();
  const { user, logout, mediaType } = useAuth();
  const { requests } = useSocial();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<JikanAnime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.trim().length > 2) {
        setIsSearching(true);
        try {
          const data = await jikanService.search(search, 'anime');
          setResults(data.slice(0, 8));
        } catch (error) {
          console.error("Search failed:", error);
        }
      } else {
        setResults([]);
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearching(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: number) => {
    setSearch('');
    setIsSearching(false);
    navigate(`/anime/${id}`);
  };

  const menuItems = [
    { label: t('nav.browse') || 'Explorar', to: '/', icon: Play },
    { label: t('nav.list') || 'Minha Lista', to: '/list', icon: LayoutGrid },
    { label: 'Ranking', to: '/ranking', icon: Trophy },
    { label: 'Loja', to: '/shop', icon: ShoppingBag },
    { label: 'Social', to: '/social', icon: Radio, badge: (requests?.length || 0) > 0 },
    { label: 'AniChat', to: '/chat', icon: MessageCircle },
    { label: 'Analytics', to: '/analytics', icon: BarChart3 },
    { label: 'Feedback', to: '/feedback', icon: AlertCircle },
  ];

  return (
    <nav className="sticky top-0 left-0 right-0 h-14 bg-[var(--color-card)]/80 backdrop-blur-xl text-[var(--color-text-bright)] z-[100] flex items-center px-4 shadow-sm border-b border-[var(--color-border)]/50">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
        
        {/* Logo & Menu Section */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <img src={`${import.meta.env.BASE_URL}logo-light.jpeg`} alt="Avalon" className="h-8 w-8 object-cover rounded-lg group-hover:rotate-6 transition-transform shadow-md block dark:hidden" />
            <img src={`${import.meta.env.BASE_URL}logo-dark.jpeg`} alt="Avalon" className="h-8 w-8 object-cover rounded-lg group-hover:rotate-6 transition-transform shadow-md hidden dark:block" />
            <div className="text-brand font-black text-lg tracking-tighter uppercase italic hidden sm:block">Avalon</div>
          </Link>

          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all uppercase tracking-[0.1em] text-[9px] font-black",
                isMenuOpen ? "text-brand bg-brand/10" : "text-gray-500 hover:text-[var(--color-text-bright)] hover:bg-[var(--color-bg)]"
              )}
            >
              {isMenuOpen ? <X size={14} /> : <Menu size={14} />}
              <span className="hidden md:inline">Menu</span>
              <ChevronDown size={10} className={cn("transition-transform duration-300", isMenuOpen && "rotate-180")} />
              {(requests?.length || 0) > 0 && <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse ml-0.5" />}
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full left-0 mt-3 w-56 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-2 z-[110] backdrop-blur-xl"
                >
                  <div className="grid grid-cols-1 gap-1">
                    {menuItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 group relative",
                          location.pathname === item.to 
                            ? "bg-brand text-white" 
                            : "text-gray-400 hover:bg-[var(--color-bg)] hover:text-brand"
                        )}
                      >
                        <item.icon size={16} className={cn("transition-transform group-hover:scale-110", location.pathname === item.to ? "text-white" : "text-gray-500 group-hover:text-brand")} />
                        <span className="font-black text-[9px] uppercase tracking-wider">{item.label}</span>
                        {item.badge && location.pathname !== item.to && (
                          <span className="ml-auto w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
                        )}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-[var(--color-border)] mt-2 pt-2">
                     <Link
                      to="/settings"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 text-gray-400 hover:bg-[var(--color-bg)] hover:text-brand"
                    >
                      <SettingsIcon size={16} className="text-gray-500" />
                      <span className="font-black text-[9px] uppercase tracking-wider">Ajustes</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Search Section */}
        <div className="flex-1 max-w-md relative" ref={searchRef}>
          <div className="relative group">
            <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors", isSearching ? "text-brand" : "text-gray-500")} />
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsSearching(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search.trim()) {
                  setIsSearching(false);
                  navigate(`/search?q=${encodeURIComponent(search.trim())}`);
                }
              }}
              placeholder="Pesquisar..."
              className="w-full h-9 bg-[var(--color-bg)]/50 border border-[var(--color-border)] rounded-xl pl-10 pr-4 text-[11px] font-bold text-[var(--color-text-bright)] focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all placeholder:text-gray-500/50"
            />
            
            <AnimatePresence>
              {isSearching && results.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden z-[120] backdrop-blur-xl flex flex-col"
                >
                  <div className="p-2 space-y-1">
                    {results.map((item) => (
                      <button 
                        key={item.mal_id}
                        onClick={() => handleSelect(item.mal_id)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-brand/5 rounded-xl transition-all group text-left"
                      >
                        <img src={item.images.webp.image_url} className="w-8 h-12 rounded-lg object-cover shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-black text-[var(--color-text-bright)] leading-tight truncate uppercase tracking-tight">{item.title}</div>
                          <div className="text-[8px] text-gray-500 font-bold uppercase mt-0.5">{item.type} • {item.year || item.status}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      setIsSearching(false);
                      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
                    }}
                    className="w-full p-3 bg-[var(--color-bg)] border-t border-[var(--color-border)] text-brand text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-colors"
                  >
                    Ver todos os resultados
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* User Section */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-1 bg-[var(--color-bg)]/50 p-1 rounded-xl border border-[var(--color-border)]/50">
               <Link to="/profile" className="p-1 hover:bg-brand/10 rounded-lg transition-colors group">
                  {user.photoURL ? (
                    <img src={user.photoURL} className="w-7 h-7 rounded-md object-cover shadow-sm" alt="Profile" />
                  ) : (
                    <div className="w-7 h-7 bg-brand/20 text-brand rounded-md flex items-center justify-center font-black text-[10px] uppercase">
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}
                </Link>
                <div className="w-px h-4 bg-[var(--color-border)] mx-1" />
                <button 
                  onClick={() => logout()}
                  className="px-2 py-1 hover:text-red-500 transition-colors text-[9px] font-black uppercase tracking-widest text-gray-500"
                >
                  Sair
                </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="px-4 py-1.5 bg-brand text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand/20"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

