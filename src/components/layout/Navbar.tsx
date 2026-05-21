import { User, Settings as SettingsIcon, ChevronDown, Trophy, ShoppingBag, Radio, MessageCircle, BarChart3, AlertCircle, Menu, X, Play, LayoutGrid, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logoLight from '../../assets/images/logo-light.jpeg';
import logoDark from '../../assets/images/logo-dark.jpeg';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useSocial } from '../../context/SocialContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { requests } = useSocial();
  const [search, setSearch] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const isListView = location.pathname === '/list';

  return (
    <nav className="sticky top-0 left-0 right-0 h-14 bg-[var(--color-card)]/80 backdrop-blur-xl text-[var(--color-text-bright)] z-[100] flex items-center px-4 shadow-sm border-b border-[var(--color-border)]/50">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
        
        {/* Logo & Menu Section */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <img src={logoLight} alt="Avalon" className="h-8 w-8 object-cover rounded-lg group-hover:rotate-6 transition-transform shadow-md block dark:hidden" />
            <img src={logoDark} alt="Avalon" className="h-8 w-8 object-cover rounded-lg group-hover:rotate-6 transition-transform shadow-md hidden dark:block" />
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

        {/* Search Section - Hidden on List View */}
        {!isListView && (
          <div className="flex-1 max-w-sm relative hidden sm:block">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 group-focus-within:text-brand transition-colors" />
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && search.trim()) {
                    navigate(`/search?q=${encodeURIComponent(search.trim())}`);
                    setSearch('');
                  }
                }}
                placeholder="Pesquisar animes ou mangás..."
                className="w-full h-9 bg-[var(--color-bg)]/50 border border-[var(--color-border)] rounded-xl pl-10 pr-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-bright)] focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all placeholder:text-gray-500/50"
              />
            </div>
          </div>
        )}

        {/* Gap filler when search is hidden or on small screens */}
        {isListView && <div className="flex-1 hidden sm:block" />}
        {!isListView && <div className="flex-1 sm:hidden" />}

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

