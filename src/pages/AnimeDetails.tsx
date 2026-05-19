import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Plus, Star, Calendar, Play, BookOpen, Heart, User as UserIcon } from 'lucide-react';
import { useAnimeList } from '../hooks/useAnimeList';
import { useFavorites } from '../context/FavoritesContext';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { jikanService } from '../services/jikanService';
import { aniListService } from '../services/aniListService';
import { cn } from '../lib/utils';
import type { Media, AnimeStatus } from '../types';
import { SPECIAL_ANIMES } from '../constants/specialAnimes';
import { SpecialAnimeInteraction } from '../components/anime/SpecialAnimeInteraction';

interface MediaCharacter {
  character: {
    mal_id: number;
    url: string;
    images: {
      webp: { image_url: string };
    };
    name: string;
  };
  role: string;
}

interface Relation {
  relationType: string;
  node: {
    idMal: number;
    id: number;
    title: { romaji: string; english: string };
    type: string;
    coverImage: { large: string };
  };
}

export default function AnimeDetails() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { addAnime, updateAnime, list } = useAnimeList();
  const { addCharacter, removeCharacter, isFavorite } = useFavorites();
  const [anime, setAnime] = useState<Media | null>(null);
  const [characters, setCharacters] = useState<MediaCharacter[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [addStatus, setAddStatus] = useState<AnimeStatus>('PLANNING');
  
  const [error, setError] = useState<string | null>(null);
  
  const inList = list.find(a => a.id === Number(id));
  const special = anime ? SPECIAL_ANIMES[anime.id] : null;

  const handleRate = (score: number) => {
    if (inList) {
      updateAnime(inList.id, { score });
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id || !type) return;
      try {
        const finalType = (type.toUpperCase() as 'ANIME' | 'MANGA');
        const data = await jikanService.getDetails(Number(id), type.toLowerCase() as 'anime' | 'manga');

        if (!data) {
          setError("Informações não encontradas.");
          setLoading(false);
          return;
        }

        setAnime({
          id: data.mal_id,
          title: data.title,
          image: data.images.webp.large_image_url,
          type: finalType,
          status: 'TRENDING',
          genres: data.genres.map((g: any) => g.name),
          score: Math.round(data.score * 10),
          format: data.type,
          episodes: data.episodes,
          chapters: data.chapters,
          volumes: data.volumes,
          season: data.season,
          year: data.year || data.published?.prop?.from?.year,
          banner: data.images.webp.large_image_url,
          synopsis: data.synopsis,
          rank: data.rank,
          members: data.members
        });

        // Fetch characters
        try {
          const charResp = await fetch(`https://api.jikan.moe/v4/${finalType.toLowerCase()}/${id}/characters`);
          const charData = await charResp.json();
          const mainCharacters = charData.data?.filter((c: MediaCharacter) => c.role === 'Main') || [];
          setCharacters(mainCharacters.slice(0, 12));
        } catch (e) {
          console.error("Failed to fetch characters:", e);
        }

        // Fetch relations
        try {
          const rels = await aniListService.getRelationsByMalId(Number(id), finalType);
          setRelations(rels);
        } catch (e) {
          console.error("Failed to fetch relations:", e);
        }
      } catch (error) {
        console.error("Failed to fetch media details:", error);
        setError("Não foi possível carregar as informações desta obra. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error || !anime) return <div className="pt-32 text-center text-gray-500">{error || "Obra não encontrada"}</div>;

  const handleAdd = () => {
    const total = anime.type === 'ANIME' ? anime.episodes : anime.chapters;
    addAnime({
      id: anime.id,
      title: anime.title,
      image: anime.image,
      type: anime.type,
      status: addStatus,
      score: 0,
      progress: addStatus === 'COMPLETED' ? (total || 0) : 0,
      totalProgress: total,
      genres: anime.genres
    });
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8 relative">
        {special && (
          <div className="absolute top-4 right-4 z-10 p-4 bg-black/50 rounded-2xl backdrop-blur">
            <SpecialAnimeInteraction theme={special.theme} />
          </div>
        )}
        <button 
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              navigate('/', { replace: true });
            }
          }}
          className="flex items-center gap-2 text-gray-500 hover:text-brand transition-colors mb-8 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Cover Column */}
          <div className="w-full md:w-72 shrink-0 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border-4 border-white/50"
            >
              <img src={anime.image} alt={anime.title} className="w-full h-full object-cover" />
            </motion.div>

            {anime.type === 'MANGA' ? (
              <button 
                onClick={() => navigate(`/manga/${anime.id}/read`)}
                className="w-full bg-brand text-white font-black uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-dark transition-all transform hover:scale-[1.02] shadow-lg shadow-brand/20 active:scale-95"
              >
                <BookOpen className="w-5 h-5" />
                Ler Mangá
              </button>
            ) : (
              <button 
                onClick={() => navigate(`/anime/${anime.id}/watch`)}
                className="w-full bg-brand text-white font-black uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-dark transition-all transform hover:scale-[1.02] shadow-lg shadow-brand/20 active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                Assistir
              </button>
            )}

            <div className="flex flex-col gap-3">
              {inList ? (
                <div className="space-y-4">
                  <div className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-border)] space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Status na Lista</p>
                    <select 
                      value={inList.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as AnimeStatus;
                        const updates: any = { status: newStatus };
                        if (newStatus === 'COMPLETED') {
                          updates.progress = inList.totalProgress;
                        }
                        updateAnime(inList.id, updates);
                      }}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] text-brand text-center py-2 rounded-md font-black text-[10px] uppercase tracking-widest outline-none focus:ring-1 focus:ring-brand"
                    >
                      {anime.type === 'ANIME' ? <option value="WATCHING">Watching</option> : <option value="READING">Reading</option>}
                      <option value="COMPLETED">Completed</option>
                      <option value="PLANNING">Planning</option>
                      <option value="DROPPED">Dropped</option>
                    </select>
                  </div>
                  
                  <div className={cn(
                    "bg-[var(--color-card)] p-4 rounded-xl border space-y-3 transition-all duration-500",
                    inList.status === 'COMPLETED' && !inList.score ? "border-brand shadow-[0_0_15px_rgba(255,107,0,0.2)] animate-pulse" : "border-[var(--color-border)]"
                  )}>
                    <p className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em] text-center",
                        inList.status === 'COMPLETED' && !inList.score ? "text-brand" : "text-gray-400"
                    )}>
                        Sua Nota {inList.status === 'COMPLETED' && !inList.score && "(Obrigatório)"}
                    </p>
                    <div className="flex justify-center gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(0)}
                          onClick={() => handleRate(star)}
                          className="transition-transform hover:scale-125"
                        >
                          <Star 
                            className={cn(
                              "w-4 h-4 transition-colors",
                              (hoveredStar || inList.score) >= star ? "fill-brand text-brand" : "text-gray-300 dark:text-gray-700"
                            )} 
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-xl font-black text-brand italic text-center">
                      {inList.score || '?'}<span className="text-[10px] text-gray-400 not-italic ml-1">/ 10</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <select 
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value as AnimeStatus)}
                    className="w-full bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-bright)] text-center py-2 rounded-xl font-black text-[10px] uppercase tracking-widest outline-none focus:ring-1 focus:ring-brand"
                  >
                    {anime.type === 'ANIME' ? <option value="WATCHING">Watching</option> : <option value="READING">Reading</option>}
                    <option value="COMPLETED">Completed</option>
                    <option value="PLANNING">Planning</option>
                    <option value="DROPPED">Dropped</option>
                  </select>
                  <button 
                    onClick={handleAdd}
                    className="w-full bg-brand hover:bg-brand-dark text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg shadow-brand/20"
                  >
                    <Plus className="w-4 h-4" /> Adicionar à Lista
                  </button>
                </div>
              )}
            </div>

            <div className="bg-[var(--color-card)] p-4 rounded-lg shadow-sm border border-[var(--color-border)] space-y-4">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Format</span>
                <span className="text-[var(--color-text)] font-bold">{anime.format}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-wider">
                  {anime.type === 'ANIME' ? 'Episodes' : 'Chapters'}
                </span>
                <span className="text-[var(--color-text)] font-bold">
                  {anime.type === 'ANIME' ? anime.episodes : anime.chapters || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Status</span>
                <span className="text-[var(--color-text)] font-bold">Finished Airing</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Season</span>
                <span className="text-[var(--color-text)] font-bold">{anime.season} {anime.year}</span>
              </div>
            </div>
          </div>

          {/* Info Column */}
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-[var(--color-text-bright)] leading-tight">{anime.title}</h1>
              <div className="flex flex-wrap gap-2">
                {anime.genres.map(genre => (
                  <span key={genre} className="px-3 py-1 bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-bold rounded-full">
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-[var(--color-text)] leading-relaxed text-sm max-w-4xl bg-[var(--color-card)]/30 backdrop-blur-sm p-6 rounded-xl border border-[var(--color-border)]">
              {anime.synopsis || "No synopsis available for this title."}
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-border)] flex flex-col items-center justify-center gap-1 shadow-sm">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-lg font-black text-[var(--color-text-bright)]">{Math.round(anime.score)}%</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">Score</span>
              </div>
              <div className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-border)] flex flex-col items-center justify-center gap-1 shadow-sm">
                <Play className="w-5 h-5 text-brand" />
                <span className="text-lg font-black text-[var(--color-text-bright)]">#{anime.rank || '--'}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">Rank</span>
              </div>
              <div className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-border)] flex flex-col items-center justify-center gap-1 shadow-sm">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                <span className="text-lg font-black text-[var(--color-text-bright)]">{anime.members ? (anime.members / 1000).toFixed(1) + 'k' : '--'}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">Members</span>
              </div>
              <div className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-border)] flex flex-col items-center justify-center gap-1 shadow-sm">
                <Calendar className="w-5 h-5 text-orange-400" />
                <span className="text-lg font-black text-[var(--color-text-bright)]">{anime.year}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">Year</span>
              </div>
            </div>

            {relations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-black text-[var(--color-text-bright)] uppercase tracking-widest">Relações</h3>
                <div className="flex overflow-x-auto gap-4 pb-4 snap-x select-none custom-scrollbar pb-2">
                  {relations.filter(rel => rel.node.idMal).map((rel, index) => (
                    <Link
                      key={`${rel.node.idMal}-${index}`}
                      to={`/${rel.node.type.toLowerCase()}/${rel.node.idMal}`}
                      className="shrink-0 w-[110px] md:w-[140px] rounded-lg overflow-hidden border border-[var(--color-border)] group relative snap-start shadow-md hover:shadow-lg transition-all hover:-translate-y-1 bg-black"
                    >
                      <div className="aspect-[2/3] relative">
                        <img 
                          src={rel.node.coverImage.large} 
                          alt={rel.node.title.romaji || rel.node.title.english} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-center backdrop-blur-sm z-10">
                          <p className="text-[10px] font-bold text-[var(--color-text-bright)] capitalize tracking-wider truncate">
                            {rel.relationType.replace(/_/g, ' ').toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-black text-[var(--color-text-bright)] uppercase tracking-widest">Personagens Principais</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {characters.map((char) => (
                  <div key={char.character.mal_id} translate="no" className="bg-[var(--color-card)]/50 rounded-xl overflow-hidden border border-[var(--color-border)] group relative">
                    <div className="aspect-square relative">
                      <img src={char.character.images.webp.image_url} alt={char.character.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <button 
                        onClick={() => {
                          if (isFavorite(char.character.mal_id)) {
                            removeCharacter(char.character.mal_id);
                          } else {
                            addCharacter({
                              id: char.character.mal_id,
                              name: char.character.name,
                              image: char.character.images.webp.image_url,
                              animeTitle: anime.title,
                              role: char.role
                            });
                          }
                        }}
                        className={cn(
                          "absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all scale-0 group-hover:scale-100",
                          isFavorite(char.character.mal_id) ? "bg-brand text-white scale-100" : "bg-black/20 text-white hover:bg-brand/80"
                        )}
                      >
                        <Heart className={cn("w-3 h-3", isFavorite(char.character.mal_id) && "fill-current")} />
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] font-black text-[var(--color-text-bright)] uppercase tracking-tight line-clamp-1">{char.character.name}</p>
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{char.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-black text-[var(--color-text-bright)] uppercase tracking-widest">Mais Informações</h3>
              <div className="bg-[var(--color-card)]/50 p-6 rounded-xl border-2 border-dashed border-[var(--color-border)]">
                <p className="text-gray-500 italic text-center text-sm">Review detalhado em breve na próxima atualização da saga Avalon.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
