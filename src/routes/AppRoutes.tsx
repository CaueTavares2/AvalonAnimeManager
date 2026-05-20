import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../hooks/useDevice';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-40 gap-4 text-center px-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-2" />
          <h2 className="text-xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter">Falha de Roteamento</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest max-w-sm mb-4">
            Houve uma falha ao carregar este módulo. Isso geralmente ocorre devido a atualizações em andamento ou cache.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-dark transition-colors"
          >
            <RefreshCw size={14} /> Recarregar Módulo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center py-40 gap-4">
    <div className="w-12 h-12 border-t-2 border-brand rounded-full animate-spin" />
    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">Carregando Módulo...</p>
  </div>
);

const SafeSuspense = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

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
  const navigate = useNavigate();
  const { isMobile } = useDevice();

  useEffect(() => {
    // Check if we are returning from AniList OAuth
    if (location.hash && location.hash.includes('access_token=')) {
      const hashParams = new URLSearchParams(location.hash.replace('#', '?'));
      const token = hashParams.get('access_token');
      if (token) {
        localStorage.setItem('avalon_anilist_token', token);
        // Clean up the URL
        navigate('/settings', { replace: true });
        // Optionally redirect to settings with a success state, but replacing the URL is enough
      }
    }
  }, [location.hash, navigate]);

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
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
            <Route path="/" element={
            isMobile ? (
              <SafeSuspense><Home /></SafeSuspense>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <SafeSuspense><Home /></SafeSuspense>
              </motion.div>
            )
          } />
          <Route path="/:type/:id" element={<SafeSuspense><AnimeDetails /></SafeSuspense>} />
          <Route path="/anime/:id/watch" element={<SafeSuspense><AnimePlayer /></SafeSuspense>} />
          <Route path="/manga/:id/read" element={<SafeSuspense><MangaReader /></SafeSuspense>} />
          <Route path="/list" element={<SafeSuspense><MyList /></SafeSuspense>} />
          <Route path="/community" element={<SafeSuspense><Community /></SafeSuspense>} />
          <Route path="/ranking" element={<SafeSuspense><Rankings /></SafeSuspense>} />
          <Route path="/profile" element={<SafeSuspense><Profile /></SafeSuspense>} />
          <Route path="/profile/:uid" element={<SafeSuspense><PublicProfile /></SafeSuspense>} />
          <Route path="/social" element={<SafeSuspense><Social /></SafeSuspense>} />
          <Route path="/chat" element={<SafeSuspense><AniChat /></SafeSuspense>} />
          <Route path="/shop" element={<SafeSuspense><Shop /></SafeSuspense>} />
          <Route path="/settings" element={<SafeSuspense><Settings /></SafeSuspense>} />
          <Route path="/feedback" element={<SafeSuspense><Feedback /></SafeSuspense>} />
          <Route path="/login" element={<SafeSuspense><Login /></SafeSuspense>} />
          <Route path="/analytics" element={<SafeSuspense><Analytics /></SafeSuspense>} />
          <Route path="/admin" element={<SafeSuspense><Admin /></SafeSuspense>} />
          <Route path="/animes-by-year" element={<SafeSuspense><AnimesByYear /></SafeSuspense>} />
          <Route path="/search" element={<SafeSuspense><SearchResults /></SafeSuspense>} />
        </Routes>
      </AnimatePresence>
  );
}
