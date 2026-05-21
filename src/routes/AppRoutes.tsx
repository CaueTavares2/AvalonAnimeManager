import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../hooks/useDevice';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * High-performance lazy loading with automatic retry for chunk failures.
 * This prevents the "Routing Failure" (ChunkLoadError) when the app is updated.
 */
function lazyWithRetry(componentImport: () => Promise<any>) {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // Log to console for debugging
        console.warn('Chunk load failed, attempting automatic reload...', error);
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        return window.location.reload();
      }

      // If we already tried refreshing once and it still fails, bubble up to ErrorBoundary
      throw error;
    }
  });
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  
  resetError = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-40 gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center mb-2">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter">Falha de Roteamento</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest max-w-sm mb-4 leading-relaxed">
            Houve uma falha ao carregar este módulo. Isso geralmente ocorre devido a atualizações em andamento ou cache expirado.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={this.resetError}
              className="group flex items-center justify-center gap-2 px-8 py-3 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-dark transition-all shadow-lg shadow-brand/20"
            >
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> 
              Forçar Recarregamento
            </button>
            <button 
              onClick={() => window.location.href = '/AvalonAnimeManager'}
              className="px-8 py-3 bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-bright)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-border)] transition-all"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center py-40 gap-4">
    <div className="relative">
      <div className="w-12 h-12 border-t-2 border-brand rounded-full animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 bg-brand/20 rounded-full animate-pulse" />
      </div>
    </div>
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Sincronizando Módulo...</p>
  </div>
);

const SafeSuspense = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// Lazy loaded pages with retry logic
const Home = lazyWithRetry(() => import('../pages/Home'));
const AnimeDetails = lazyWithRetry(() => import('../pages/AnimeDetails'));
const AnimePlayer = lazyWithRetry(() => import('../pages/AnimePlayer'));
const MyList = lazyWithRetry(() => import('../pages/MyList'));
const Community = lazyWithRetry(() => import('../pages/Community'));
const Rankings = lazyWithRetry(() => import('../pages/Rankings'));
const Profile = lazyWithRetry(() => import('../pages/Profile'));
const PublicProfile = lazyWithRetry(() => import('../pages/PublicProfile'));
const Settings = lazyWithRetry(() => import('../pages/Settings'));
const Login = lazyWithRetry(() => import('../pages/Login'));
const Analytics = lazyWithRetry(() => import('../pages/Analytics'));
const Social = lazyWithRetry(() => import('../pages/Social'));
const AniChat = lazyWithRetry(() => import('../pages/AniChat'));
const Shop = lazyWithRetry(() => import('../pages/Shop'));
const Admin = lazyWithRetry(() => import('../pages/Admin'));
const AnimesByYear = lazyWithRetry(() => import('../pages/AnimesByYear'));
const Feedback = lazyWithRetry(() => import('../pages/Feedback'));
const SearchResults = lazyWithRetry(() => import('../pages/SearchResults'));
const MangaReader = lazyWithRetry(() => import('../pages/MangaReader'));

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const { isMobile } = useDevice();
  return (
    <motion.div
      initial={{ opacity: 0, y: isMobile ? 6 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: isMobile ? -6 : -12 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  );
};

export default function AppRoutes() {
  const { loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><SafeSuspense><Home /></SafeSuspense></PageTransition>} />
          <Route path="/:type/:id" element={<PageTransition><SafeSuspense><AnimeDetails /></SafeSuspense></PageTransition>} />
          <Route path="/anime/:id/watch" element={<PageTransition><SafeSuspense><AnimePlayer /></SafeSuspense></PageTransition>} />
          <Route path="/manga/:id/read" element={<PageTransition><SafeSuspense><MangaReader /></SafeSuspense></PageTransition>} />
          <Route path="/list" element={<PageTransition><SafeSuspense><MyList /></SafeSuspense></PageTransition>} />
          <Route path="/community" element={<PageTransition><SafeSuspense><Community /></SafeSuspense></PageTransition>} />
          <Route path="/ranking" element={<PageTransition><SafeSuspense><Rankings /></SafeSuspense></PageTransition>} />
          <Route path="/profile" element={<PageTransition><SafeSuspense><Profile /></SafeSuspense></PageTransition>} />
          <Route path="/profile/:uid" element={<PageTransition><SafeSuspense><PublicProfile /></SafeSuspense></PageTransition>} />
          <Route path="/social" element={<PageTransition><SafeSuspense><Social /></SafeSuspense></PageTransition>} />
          <Route path="/chat" element={<PageTransition><SafeSuspense><AniChat /></SafeSuspense></PageTransition>} />
          <Route path="/shop" element={<PageTransition><SafeSuspense><Shop /></SafeSuspense></PageTransition>} />
          <Route path="/settings" element={<PageTransition><SafeSuspense><Settings /></SafeSuspense></PageTransition>} />
          <Route path="/feedback" element={<PageTransition><SafeSuspense><Feedback /></SafeSuspense></PageTransition>} />
          <Route path="/login" element={<PageTransition><SafeSuspense><Login /></SafeSuspense></PageTransition>} />
          <Route path="/analytics" element={<PageTransition><SafeSuspense><Analytics /></SafeSuspense></PageTransition>} />
          <Route path="/admin" element={<PageTransition><SafeSuspense><Admin /></SafeSuspense></PageTransition>} />
          <Route path="/animes-by-year" element={<PageTransition><SafeSuspense><AnimesByYear /></SafeSuspense></PageTransition>} />
          <Route path="/search" element={<PageTransition><SafeSuspense><SearchResults /></SafeSuspense></PageTransition>} />
        </Routes>
      </AnimatePresence>
  );
}
