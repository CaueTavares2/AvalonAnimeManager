import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../hooks/useDevice';
import { motion, AnimatePresence } from 'motion/react';

// Lazy loaded pages
const Home = lazy(() => import('../pages/Home'));
const AnimeDetails = lazy(() => import('../pages/AnimeDetails'));
const AnimePlayer = lazy(() => import('../pages/AnimePlayer'));
const MyList = lazy(() => import('../pages/MyList'));
const Community = lazy(() => import('../pages/Community'));
const Rankings = lazy(() => import('../pages/Rankings'));
const Profile = lazy(() => import('../pages/Profile'));
const PublicProfile = lazy(() => import('../pages/PublicProfile'));
const Settings = lazy(() => import('../pages/Settings'));
const Login = lazy(() => import('../pages/Login'));
const Analytics = lazy(() => import('../pages/Analytics'));
const Social = lazy(() => import('../pages/Social'));
const AniChat = lazy(() => import('../pages/AniChat'));
const Shop = lazy(() => import('../pages/Shop'));
const Admin = lazy(() => import('../pages/Admin'));
const AnimesByYear = lazy(() => import('../pages/AnimesByYear'));
const Feedback = lazy(() => import('../pages/Feedback'));
const SearchResults = lazy(() => import('../pages/SearchResults'));
const MangaReader = lazy(() => import('../pages/MangaReader'));

export default function AppRoutes() {
  const { loading } = useAuth();
  const location = useLocation();
  const { isMobile } = useDevice();

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
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 border-t-2 border-brand rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">Carregando Módulo...</p>
      </div>
    }>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
            <Route path="/" element={
            isMobile ? (
              <Home />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <Home />
              </motion.div>
            )
          } />
          <Route path="/:type/:id" element={<AnimeDetails />} />
          <Route path="/anime/:id/watch" element={<AnimePlayer />} />
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
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/login" element={<Login />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/animes-by-year" element={<AnimesByYear />} />
          <Route path="/search" element={<SearchResults />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
