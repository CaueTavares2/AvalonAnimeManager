import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, LayoutGrid } from 'lucide-react';
import ReactPlayer from 'react-player';
import { useExtensions, AnimeExtension, Episode, StreamSource } from '../services/extensionService';
import { jikanService } from '../services/jikanService';

export default function AnimePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getInstalledExtensions } = useExtensions();
  
  const [extension, setExtension] = useState<AnimeExtension | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [stream, setStream] = useState<StreamSource | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize extension and episodes
  useEffect(() => {
    const init = async () => {
      if (!id) return;
      try {
        const exts = getInstalledExtensions();
        if (exts.length === 0) {
          setError("Nenhuma fonte (extensão) instalada. Por favor, adicione uma fonte nas configurações.");
          setLoading(false);
          return;
        }
        
        // Use the first installed extension for now
        const selectedExt = exts[0];
        setExtension(selectedExt);

        const eps = await selectedExt.getEpisodes(id);
        setEpisodes(eps);
        if (eps.length > 0) {
          setCurrentEpisode(eps[0]);
        }
      } catch (e: any) {
        setError("Erro ao carregar episódios da fonte selecionada.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  // Load stream when episode changes
  useEffect(() => {
    const loadStream = async () => {
      if (!extension || !currentEpisode) return;
      try {
        const streams = await extension.getStreams(currentEpisode.id);
        if (streams.length > 0) {
          setStream(streams[0]);
        } else {
          setStream(null);
          // Show error or something
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadStream();
  }, [currentEpisode, extension]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="pt-24 px-4 text-center max-w-lg mx-auto">
      <div className="bg-[var(--color-card)] p-6 rounded-xl border border-red-500/20">
        <h2 className="text-xl font-bold text-red-500 mb-2">Ops!</h2>
        <p className="text-[var(--color-text)] mb-6">{error}</p>
        <button onClick={() => {
          if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
          } else {
            navigate('/', { replace: true });
          }
        }} className="bg-brand text-white px-6 py-2 rounded-lg font-bold">Voltar</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-16 flex flex-col items-center bg-black">
      {/* Top Bar */}
      <div className="w-full max-w-6xl flex justify-between items-center p-4">
        <button 
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              navigate('/', { replace: true });
            }
          }}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" /> Voltar
        </button>
        <div className="text-center">
          <p className="text-brand font-black text-sm tracking-widest uppercase truncate max-w-[200px] md:max-w-md">
             {extension?.name}
          </p>
          <p className="text-white text-xs font-bold">
            Epi. {currentEpisode?.number} - {currentEpisode?.title || 'Sem título'}
          </p>
        </div>
        <div className="w-20" /> {/* Balancer */}
      </div>

      {/* Video Player Container */}
      <div className="w-full max-w-5xl aspect-video bg-gray-900 shadow-2xl relative">
        {stream ? (
          stream.type === 'iframe' ? (
             <iframe src={stream.url} className="w-full h-full border-0 absolute inset-0" allowFullScreen />
          ) : (
            <ReactPlayer 
              url={stream.url}
              controls
              width="100%"
              height="100%"
              playing
              config={{ file: { forceHLS: stream.type === 'hls' } }}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Episodes List Container */}
      <div className="w-full max-w-5xl p-4 mt-2 bg-[var(--color-bg)] flex-1 mb-8">
        <div className="flex items-center gap-2 mb-4 text-[var(--color-text-bright)]">
          <LayoutGrid className="w-4 h-4 text-brand" />
          <h2 className="text-[11px] font-black uppercase tracking-widest">Episódios</h2>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
          {episodes.map((ep) => (
            <button
              key={ep.id}
              onClick={() => setCurrentEpisode(ep)}
              className={`py-1.5 px-2 rounded border text-center font-bold text-xs transition-all focus:outline-none ${
                currentEpisode?.id === ep.id 
                  ? 'border-brand bg-brand/10 text-brand' 
                  : 'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] hover:border-brand/40'
              }`}
            >
              {ep.number}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
