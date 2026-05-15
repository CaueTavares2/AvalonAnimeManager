/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AnimeDetails from './pages/AnimeDetails';
import MyList from './pages/MyList';
import Community from './pages/Community';
import Rankings from './pages/Rankings';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Analytics from './pages/Analytics';
import Social from './pages/Social';
import AniChat from './pages/AniChat';
import { Search, User, TrendingUp, Settings as SettingsIcon, BarChart as ChartIcon } from 'lucide-react';

import { ThemeProvider } from './context/ThemeContext';
import { ProfileProvider } from './context/ProfileContext';
import { LanguageProvider } from './context/LanguageContext';
import { AnimeListProvider } from './context/AnimeListContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { AuthProvider } from './context/AuthContext';
import { SocialProvider } from './context/SocialContext';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <SocialProvider>
            <AnimeListProvider>
              <FavoritesProvider>
                <ProfileProvider>
                  <BrowserRouter>
                    <div className="min-h-screen">
                      <Navbar />
                      
                      <main className="max-w-7xl mx-auto px-4 md:px-12 py-12">
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/anime/:id" element={<AnimeDetails />} />
                          <Route path="/list" element={<MyList />} />
                          <Route path="/community" element={<Community />} />
                          <Route path="/ranking" element={<Rankings />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/profile/:uid" element={<PublicProfile />} />
                          <Route path="/social" element={<Social />} />
                          <Route path="/chat" element={<AniChat />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/analytics" element={<Analytics />} />
                        </Routes>
                      </main>

                      <footer className="max-w-7xl mx-auto px-4 md:px-12 py-12 border-t border-[var(--color-border)] mt-12 mb-20 lg:mb-0">
                        {/* ... footer content ... */}
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
                          <TrendingUp className="w-5 h-5 text-brand" />
                          <span className="text-[10px] font-black uppercase tracking-tighter text-brand">Browse</span>
                        </Link>
                        <Link to="/list" className="flex-1 h-full flex flex-col items-center justify-center gap-1 group">
                          <Search className="w-5 h-5 text-gray-400 group-hover:text-brand transition-colors" />
                          <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400 group-hover:text-brand transition-colors">Lista</span>
                        </Link>
                        <Link to="/settings" className="flex-1 h-full flex flex-col items-center justify-center gap-1 group">
                          <SettingsIcon className="w-5 h-5 text-gray-400 group-hover:text-brand transition-colors" />
                          <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400 group-hover:text-brand transition-colors">Config</span>
                        </Link>
                        <Link to="/profile" className="flex-1 h-full flex flex-col items-center justify-center gap-1 group">
                          <User className="w-5 h-5 text-gray-400 group-hover:text-brand transition-colors" />
                          <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400 group-hover:text-brand transition-colors">Perfil</span>
                        </Link>
                      </div>
                    </div>
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


