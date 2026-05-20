/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Link, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import { cn } from './lib/utils';
import { Search, User, TrendingUp, Settings as SettingsIcon, BarChart as ChartIcon, ShoppingBag } from 'lucide-react';
import { UpdateNotification } from './components/shared/UpdateNotification';
import { GlobalAnnouncement } from './components/shared/GlobalAnnouncement';
import { AchievementNotification } from './components/shared/AchievementNotification';
import { ChangelogModal } from './components/shared/ChangelogModal';
import { WelcomeModal } from './components/shared/WelcomeModal';
import { MultipleDeviceWarning } from './components/shared/MultipleDeviceWarning';
import TrackerSyncToast from './components/shared/TrackerSyncToast';
import logoLight from './assets/images/logo-light.jpeg';
import logoDark from './assets/images/logo-dark.jpeg';
import AppRoutes from './routes/AppRoutes';

import { ThemeProvider } from './context/ThemeContext';
import { ProfileProvider } from './context/ProfileContext';
import { LanguageProvider } from './context/LanguageContext';
import { AnimeListProvider } from './context/AnimeListContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { AuthProvider } from './context/AuthContext';
import { SocialProvider } from './context/SocialContext';

function MobileNav() {
  const location = useLocation();
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[calc(4.2rem+env(safe-area-inset-bottom))] bg-[var(--color-card)]/98 backdrop-blur-md border-t border-[var(--color-border)] lg:hidden flex items-center justify-around z-50 pb-[env(safe-area-inset-bottom)] px-2">
      <Link to="/" className="flex-1 h-full flex flex-col items-center justify-center gap-1 group touch-manipulation">
        <TrendingUp className={cn("w-5 h-5 transition-all duration-200", isActive('/') ? "text-brand scale-110" : "text-gray-400 group-hover:text-brand")} />
        <span className={cn("text-[8px] font-black uppercase tracking-tighter transition-colors duration-200", isActive('/') ? "text-brand" : "text-gray-400 group-hover:text-brand")}>Home</span>
      </Link>
      <Link to="/list" className="flex-1 h-full flex flex-col items-center justify-center gap-1 group touch-manipulation">
        <Search className={cn("w-5 h-5 transition-all duration-200", isActive('/list') ? "text-brand scale-110" : "text-gray-400 group-hover:text-brand")} />
        <span className={cn("text-[8px] font-black uppercase tracking-tighter transition-colors duration-200", isActive('/list') ? "text-brand" : "text-gray-400 group-hover:text-brand")}>Lista</span>
      </Link>
      <Link to="/shop" className="flex-1 h-full flex flex-col items-center justify-center gap-1 group touch-manipulation">
        <ShoppingBag className={cn("w-5 h-5 transition-all duration-200", isActive('/shop') ? "text-brand scale-110" : "text-gray-400 group-hover:text-brand")} />
        <span className={cn("text-[8px] font-black uppercase tracking-tighter transition-colors duration-200", isActive('/shop') ? "text-brand" : "text-gray-400 group-hover:text-brand")}>Loja</span>
      </Link>
      <Link to="/profile" className="flex-1 h-full flex flex-col items-center justify-center gap-1 group touch-manipulation">
        <User className={cn("w-5 h-5 transition-all duration-200", isActive('/profile') ? "text-brand scale-110" : "text-gray-400 group-hover:text-brand")} />
        <span className={cn("text-[8px] font-black uppercase tracking-tighter transition-colors duration-200", isActive('/profile') ? "text-brand" : "text-gray-400 group-hover:text-brand")}>Perfil</span>
      </Link>
    </div>
  );
}

function MainLayout() {
  return (
    <div className="min-h-screen">
      <GlobalAnnouncement />
      <Navbar />
      <UpdateNotification />
      <AchievementNotification />
      <ChangelogModal />
      <WelcomeModal />
      <MultipleDeviceWarning />
      <TrackerSyncToast />
      
      <main className="max-w-7xl mx-auto px-4 md:px-12 py-6 md:py-12 pb-28 md:pb-24 lg:pb-12">
        <AppRoutes />
      </main>

      <footer className="max-w-7xl mx-auto px-4 md:px-12 py-12 border-t border-[var(--color-border)] mt-12 mb-20 lg:mb-0">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 overflow-hidden rounded-full border border-[var(--color-border)]">
            <img src={logoLight} alt="Avalon" className="h-8 w-8 object-cover rounded-full block dark:hidden w-8 h-8 pointer-events-none" />
            <img src={logoDark} alt="Avalon" className="h-8 w-8 object-cover rounded-full hidden dark:block w-8 h-8 pointer-events-none" />
          </div>
          <div className="flex gap-8 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <span className="opacity-50">© 2026 AVALON SAGA</span>
            <a href="#" className="hover:text-brand transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand transition-colors">Contact</a>
            <Link to="/list" className="hover:text-brand transition-colors">My List</Link>
          </div>
        </div>
      </footer>

      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <SocialProvider>
            <AnimeListProvider>
              <FavoritesProvider>
                <ProfileProvider>
                    <BrowserRouter basename="/AvalonAnimeManager">
                      <MainLayout />
                    </BrowserRouter>
                </ProfileProvider>
              </FavoritesProvider>
            </AnimeListProvider>
          </SocialProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}


