/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import { Search, User, TrendingUp, Settings as SettingsIcon, BarChart as ChartIcon, ShoppingBag } from 'lucide-react';
import { UpdateNotification } from './components/shared/UpdateNotification';
import { GlobalAnnouncement } from './components/shared/GlobalAnnouncement';
import { AchievementNotification } from './components/shared/AchievementNotification';
import { ChangelogModal } from './components/shared/ChangelogModal';
import { WelcomeModal } from './components/shared/WelcomeModal';
import { MultipleDeviceWarning } from './components/shared/MultipleDeviceWarning';
import Home from './pages/Home';
import AnimeDetails from './pages/AnimeDetails';
import MangaReader from './pages/MangaReader';
const MyList = lazy(() => import('./pages/MyList'));
const Community = lazy(() => import('./pages/Community'));
const Rankings = lazy(() => import('./pages/Rankings'));
const Profile = lazy(() => import('./pages/Profile'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Social = lazy(() => import('./pages/Social'));
const AniChat = lazy(() => import('./pages/AniChat'));
const Shop = lazy(() => import('./pages/Shop'));
const Admin = lazy(() => import('./pages/Admin'));
const AnimesByYear = lazy(() => import('./pages/AnimesByYear'));

import { ThemeProvider } from './context/ThemeContext';
import { ProfileProvider } from './context/ProfileContext';
import { LanguageProvider } from './context/LanguageContext';
import { AnimeListProvider } from './context/AnimeListContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { useAuth, AuthProvider } from './context/AuthContext';
import { SocialProvider } from './context/SocialContext';

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 border-t-4 border-brand rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-brand rounded-full animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-black text-[var(--color-text-bright)] uppercase italic tracking-tighter">Iniciando Avalon...</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">Sincronizando com a conta</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <GlobalAnnouncement />
      <Navbar />
      <UpdateNotification />
      <AchievementNotification />
      <ChangelogModal />
      <WelcomeModal />
      <MultipleDeviceWarning />
      
      <main className="max-w-7xl mx-auto px-4 md:px-12 py-6 md:py-12 pb-24 lg:pb-12">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-12 h-12 border-t-2 border-brand rounded-full animate-spin" />
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">Carregando Módulo...</p>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/:type/:id" element={<AnimeDetails />} />
            <Route path="/manga/:id/read" element={<MangaReader />} />
            <Route path="/list" element={<MyList />} />
            <Route path="/community" element={<Community />} />
            <Route path="/ranking" element={<Rankings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:uid" element={<PublicProfile />} />
            <Route path="/social" element={<Social />} />
            <Route path="/chat" element={<AniChat />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/login" element={<Login />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/animes-by-year" element={<AnimesByYear />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="max-w-7xl mx-auto px-4 md:px-12 py-12 border-t border-[var(--color-border)] mt-12 mb-16 lg:mb-0">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm rotate-45" />
            </div>
            <span className="text-lg font-black text-[var(--color-text-bright)] tracking-tight italic uppercase">Avalon</span>
          </div>
          <div className="flex gap-8 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <span className="opacity-50">© 2026 AVALON SAGA</span>
            <a href="#" className="hover:text-brand transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand transition-colors">Contact</a>
            <Link to="/list" className="hover:text-brand transition-colors">My List</Link>
          </div>
        </div>
      </footer>

      {/* Mobile Nav */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-[var(--color-card)]/98 backdrop-blur-md border-t border-[var(--color-border)] lg:hidden flex items-center justify-around z-50">
        <Link to="/" className="flex-1 h-full flex flex-col items-center justify-center gap-1 group">
          <TrendingUp className="w-5 h-5 text-gray-400 group-hover:text-brand transition-colors" />
          <span className="text-[9px] font-black uppercase tracking-tighter text-gray-400 group-hover:text-brand transition-colors">Home</span>
        </Link>
        <Link to="/list" className="flex-1 h-full flex flex-col items-center justify-center gap-1 group">
          <Search className="w-5 h-5 text-gray-400 group-hover:text-brand transition-colors" />
          <span className="text-[9px] font-black uppercase tracking-tighter text-gray-400 group-hover:text-brand transition-colors">Lista</span>
        </Link>
        <Link to="/shop" className="flex-1 h-full flex flex-col items-center justify-center gap-1 group">
          <ShoppingBag className="w-5 h-5 text-gray-400 group-hover:text-brand transition-colors" />
          <span className="text-[9px] font-black uppercase tracking-tighter text-gray-400 group-hover:text-brand transition-colors">Loja</span>
        </Link>
        <Link to="/profile" className="flex-1 h-full flex flex-col items-center justify-center gap-1 group">
          <User className="w-5 h-5 text-gray-400 group-hover:text-brand transition-colors" />
          <span className="text-[9px] font-black uppercase tracking-tighter text-gray-400 group-hover:text-brand transition-colors">Perfil</span>
        </Link>
      </div>
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
                  <BrowserRouter basename={import.meta.env.MODE === 'production' ? '/AvalonAnimeManager/' : '/'}>
                    <AppRoutes />
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


