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
import { useLanguage } from '../context/LanguageContext';

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
  const { formatTitle } = useLanguage();
  const navigate = useNavigate();
  const { addAnime, updateAnime, list } = useAnimeList();
  const { addCharacter, removeCharacter, isFavorite } = useFavorites();
  const [anime, setAnime] = useState<Media | null>(null);
  const [characters, setCharacters] = useState<MediaCharacter[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [addStatus, setAddStatus] = useState<AnimeStatus>('PLANNING');
  const [airingSchedule, setAiringSchedule] = useState<any>(null);
  
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

      // Handle external extension IDs (e.g., tv:12345 or movie:12345)
      // These don't belong in the MAL-based details page, redirect to player
      if (id.includes(':')) {
        console.log('External extension ID detected, redirecting to player:', id);
        navigate(`/anime/${id}/watch`, { replace: true });
        return;
      }
      
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
          title_english: data.title_english,
          title_japanese: data.title_japanese,
          image: data.images.webp.large_image_url,
          type: finalType,
          status: data.status || 'Finished Airing',
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

        // Fetch airing schedule from AniList
        if (finalType === 'ANIME') {
          try {
            const schedule = await aniListService.getAiringScheduleByMalId(Number(id), 'ANIME');
            if (schedule) {
              setAiringSchedule(schedule);
            }
          } catch (e) {
            console.error("Failed to fetch airing schedule:", e);
          }
        }

        // Fetch characters
        try {
          const charResp = await fetch(`https://api.jikan.moe/v4/${finalType.toLowerCase()}/${id}/characters`);
          const charData = await charResp.json();
          const mainCharacters = charData.data?.filter((c: MediaCharacter) => c.role === 'Main') || [];
          
          // Deduplicate by mal_id to prevent key collisions
          const uniqueChars: MediaCharacter[] = [];
          const seenCharIds = new Set<number>();
          
          for (const char of mainCharacters) {
            if (!seenCharIds.has(char.character.mal_id)) {
              uniqueChars.push(char);
              seenCharIds.add(char.character.mal_id);
            }
          }
          
          setCharacters(uniqueChars.slice(0, 12));
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

        // Fetch stats
        try {
          const statsData = await aniListService.getStatsByMalId(Number(id), finalType);
          setStats(statsData);
        } catch (e) {
          console.error("Failed to fetch stats:", e);
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
      title_english: anime.title_english,
      title_japanese: anime.title_japanese,
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
          <div className="w-full md:w-64 shrink-0 space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="aspect-[2/3] rounded-lg overflow-hidden shadow-xl border-2 border-[var(--color-border)]"
            >
              <img src={anime.image} alt={formatTitle(anime)} className="w-full h-full object-cover" />
            </motion.div>

            {anime.type === 'MANGA' ? (
              <button 
                onClick={() => navigate(`/manga/${anime.id}/read`)}
                className="w-full bg-brand text-white font-black uppercase tracking-widest py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-brand-dark transition-all transform hover:scale-[1.02] shadow-md shadow-brand/20 active:scale-95 text-xs"
              >
                <BookOpen className="w-4 h-4" />
                Ler Mangá
              </button>
            ) : (
              <button 
                onClick={() => navigate(`/anime/${anime.id}/watch`)}
                className="w-full bg-brand text-white font-black uppercase tracking-widest py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-brand-dark transition-all transform hover:scale-[1.02] shadow-md shadow-brand/20 active:scale-95 text-xs"
              >
                <Play className="w-4 h-4 fill-current" />
                Assistir
              </button>
            )}

            <div className="flex flex-col gap-2">
              {inList ? (
                <div className="space-y-2">
                  <div className="bg-[var(--color-card)] p-3 rounded-lg border border-[var(--color-border)] space-y-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Status na Lista</p>
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
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] text-brand text-center py-1.5 rounded font-black text-[10px] uppercase tracking-widest outline-none focus:ring-1 focus:ring-brand"
                    >
                      {anime.type === 'ANIME' ? <option value="WATCHING">Watching</option> : <option value="READING">Reading</option>}
                      <option value="COMPLETED">Completed</option>
                      <option value="PLANNING">Planning</option>
                      <option value="DROPPED">Dropped</option>
                    </select>
                  </div>
                  
                  <div className={cn(
                    "bg-[var(--color-card)] p-3 rounded-lg border space-y-2 transition-all duration-500",
                    inList.status === 'COMPLETED' && !inList.score ? "border-brand shadow-[0_0_10px_var(--color-brand)]/15 animate-pulse" : "border-[var(--color-border)]"
                  )}>
                    <p className={cn(
                        "text-[9px] font-black uppercase tracking-[0.2em] text-center",
                        inList.status === 'COMPLETED' && !inList.score ? "text-brand" : "text-gray-400"
                    )}>
                        Sua Nota {inList.status === 'COMPLETED' && !inList.score && "(Obrigatório)"}
                    </p>
                    <div className="flex justify-center gap-1 scale-90 origin-center">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(0)}
                          onClick={() => handleRate(star)}
                          className="transition-transform hover:scale-125"
                        >
                          <Star 
                            strokeWidth={3}
                            className={cn(
                              "w-3 h-3 transition-colors",
                              (hoveredStar || inList.score) >= star ? "fill-brand text-brand" : "text-gray-300 dark:text-gray-700"
                            )} 
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-sm font-black text-brand italic text-center">
                      {inList.score || '?'}<span className="text-[10px] text-gray-400 not-italic ml-1">/ 10</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <select 
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value as AnimeStatus)}
                    className="w-full bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-bright)] text-center py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest outline-none focus:ring-1 focus:ring-brand"
                  >
                    {anime.type === 'ANIME' ? <option value="WATCHING">Watching</option> : <option value="READING">Reading</option>}
                    <option value="COMPLETED">Completed</option>
                    <option value="PLANNING">Planning</option>
                    <option value="DROPPED">Dropped</option>
                  </select>
                  <button 
                    onClick={handleAdd}
                    className="w-full bg-brand hover:bg-brand-dark text-white py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all transform hover:scale-[1.02] shadow-md shadow-brand/20"
                  >
                    <Plus className="w-4 h-4 text-[12px]" /> Adicionar à Lista
                  </button>
                </div>
              )}
            </div>

            <div className="bg-[var(--color-card)] p-3 rounded-lg shadow-sm border border-[var(--color-border)] space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 font-bold uppercase tracking-wider">Format</span>
                <span className="text-[var(--color-text)] font-bold">{anime.format}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 font-bold uppercase tracking-wider">
                  {anime.type === 'ANIME' ? 'Episodes' : 'Chapters'}
                </span>
                <span className="text-[var(--color-text)] font-bold">
                  {anime.type === 'ANIME' ? anime.episodes : anime.chapters || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 font-bold uppercase tracking-wider">Status</span>
                <span className={cn(
                  "font-bold px-1.5 py-0.5 rounded text-[10px]",
                  anime.status.toLowerCase().includes('currently') || anime.status.toLowerCase().includes('releasing')
                    ? "text-brand bg-brand/10 border border-brand/10"
                    : "text-[var(--color-text)]"
                )}>
                  {(() => {
                    const s = anime.status.toLowerCase();
                    if (s.includes('currently airing') || s.includes('releasing')) return 'Em Lançamento';
                    if (s.includes('finished')) return 'Finalizado';
                    if (s.includes('not yet') || s.includes('upcoming')) return 'A Estrear';
                    if (s.includes('hiatus')) return 'Em Pausa';
                    return anime.status;
                  })()}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 font-bold uppercase tracking-wider">Season</span>
                <span className="text-[var(--color-text)] font-bold">{anime.season} {anime.year}</span>
              </div>
            </div>

            {/* Next Episode Release Airtime Card */}
            {airingSchedule && airingSchedule.nextAiringEpisode && (
              <div className="bg-brand/5 border border-brand/20 p-4 rounded-2xl space-y-2.5 shadow-sm animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand">Próxima Transmissão</span>
                </div>
                
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-black text-[var(--color-text-bright)]">Episódio {airingSchedule.nextAiringEpisode.episode}</span>
                  <span className="text-[9px] font-bold text-gray-400">
                    {new Date(airingSchedule.nextAiringEpisode.airingAt * 1000).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px]">
                  <span className="text-gray-500 uppercase font-black tracking-widest">Contagem Regressiva</span>
                  <span className="font-mono text-brand font-black bg-brand/10 px-2 py-0.5 rounded">
                    {(() => {
                      const seconds = airingSchedule.nextAiringEpisode.timeUntilAiring;
                      if (seconds <= 0) return "Disponível!";
                      const days = Math.floor(seconds / (24 * 3600));
                      const hours = Math.floor((seconds % (24 * 3600)) / 3600);
                      const minutes = Math.floor((seconds % 3600) / 60);
                      return days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`;
                    })()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Info Column */}
          <div className="flex-1 space-y-6 overflow-hidden">
            <div className="space-y-3">
              <h1 className="text-3xl font-black text-[var(--color-text-bright)] leading-tight">{formatTitle(anime)}</h1>
              <div className="flex flex-wrap gap-1.5">
                {anime.genres.map(genre => (
                  <span key={genre} className="px-2 py-0.5 bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-gray-400 leading-relaxed text-sm max-w-4xl">
              {anime.synopsis || "No synopsis available for this title."}
            </p>

            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              <div className="bg-[var(--color-card)] p-3 rounded-lg border border-[var(--color-border)] flex flex-col items-center justify-center gap-1 shadow-sm">
                <Star className="w-4 h-4 text-brand fill-current" />
                <span className="text-base font-black text-[var(--color-text-bright)]">{Math.round(anime.score)}%</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest text-center">Score</span>
              </div>
              <div className="bg-[var(--color-card)] p-3 rounded-lg border border-[var(--color-border)] flex flex-col items-center justify-center gap-1 shadow-sm">
                <Play className="w-4 h-4 text-brand" />
                <span className="text-base font-black text-[var(--color-text-bright)]">#{anime.rank || '--'}</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest text-center">Rank</span>
              </div>
              <div className="bg-[var(--color-card)] p-3 rounded-lg border border-[var(--color-border)] flex flex-col items-center justify-center gap-1 shadow-sm">
                <BookOpen className="w-4 h-4 text-brand" />
                <span className="text-base font-black text-[var(--color-text-bright)]">{anime.members ? (anime.members / 1000).toFixed(1) + 'k' : '--'}</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest text-center">Members</span>
              </div>
              <div className="bg-[var(--color-card)] p-3 rounded-lg border border-[var(--color-border)] flex flex-col items-center justify-center gap-1 shadow-sm">
                <Calendar className="w-4 h-4 text-brand" />
                <span className="text-base font-black text-[var(--color-text-bright)]">{anime.year}</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest text-center">Year</span>
              </div>
            </div>

            {stats && stats.statusDistribution && stats.scoreDistribution && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Status Distribution</h3>
                  <div className="bg-[var(--color-card)] p-3 rounded-lg border border-[var(--color-border)] shadow-sm flex flex-col justify-between h-24">
                    <div className="flex gap-1.5">
                      {stats.statusDistribution.filter((s: any) => s.status !== 'DROPPED').slice(0, 4).map((s: any) => {
                        const colors: any = { COMPLETED: "#68d639", PLANNING: "#02a9ff", CURRENT: "#9256f3", PAUSED: "#f779a4" };
                        return (
                          <div key={s.status} className="flex-1 flex flex-col items-center">
                            <div className="w-full text-center rounded text-white text-[9px] py-1 px-1 font-bold truncate" style={{ backgroundColor: colors[s.status] || '#555' }}>
                              {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                            </div>
                            <div className="text-[9px] text-center mt-1.5 text-gray-500 whitespace-nowrap">
                              <span style={{ color: colors[s.status] }} className="font-bold">{s.amount > 999 ? (s.amount/1000).toFixed(1)+'k' : s.amount}</span> <span className="hidden sm:inline">Users</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex w-full h-1.5 rounded-full overflow-hidden opacity-90">
                      {stats.statusDistribution.filter((s: any) => s.status !== 'DROPPED').map((s: any) => {
                        const colors: any = { COMPLETED: "#68d639", PLANNING: "#02a9ff", CURRENT: "#9256f3", PAUSED: "#f779a4" };
                        const total = stats.statusDistribution.filter((s: any) => s.status !== 'DROPPED').reduce((acc: number, curr: any) => acc + curr.amount, 0);
                        return (
                          <div key={s.status} style={{ width: `${(s.amount / total) * 100}%`, backgroundColor: colors[s.status] || '#555' }} />
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Score Distribution</h3>
                  <div className="bg-[var(--color-card)] p-3 rounded-lg border border-[var(--color-border)] shadow-sm h-24 flex items-end justify-between gap-1 overflow-hidden py-3 px-4">
                    {(() => {
                      const maxScore = Math.max(...stats.scoreDistribution.map((s: any) => s.amount));
                      return stats.scoreDistribution.map((s: any) => {
                        const percentage = s.amount / maxScore;
                        const score = s.score;
                        let color = '#e85d75'; // default red
                        if (score >= 90) color = '#68d639';
                        else if (score >= 70) color = '#c3e14a';
                        else if (score >= 50) color = '#f7d046';
                        else if (score >= 30) color = '#f79346';

                        return (
                          <div key={s.score} className="flex-1 flex justify-center group relative h-full items-end tooltip-wrap">
                            <div className="w-full max-w-[8px] rounded-full transition-all hover:brightness-125" style={{ height: `${percentage * 100}%`, minHeight: '4px', backgroundColor: color }} />
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}

            {relations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-black text-[var(--color-text-bright)] uppercase tracking-widest">Relações</h3>
                <div className="flex overflow-x-auto gap-3 pb-4 snap-x select-none custom-scrollbar pb-2">
                  {relations.filter(rel => rel.node.idMal).map((rel, index) => (
                    <Link
                      key={`${rel.node.idMal}-${index}`}
                      to={`/${rel.node.type.toLowerCase()}/${rel.node.idMal}`}
                      className="shrink-0 w-[90px] md:w-[110px] rounded-lg overflow-hidden border border-[var(--color-border)] group relative snap-start shadow-md hover:shadow-lg transition-all hover:-translate-y-1 bg-black"
                    >
                      <div className="aspect-[2/3] relative">
                        <img 
                          src={rel.node.coverImage.large} 
                          alt={rel.node.title.romaji || rel.node.title.english} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 text-center z-10 pt-6">
                          <p className="text-[9px] font-bold text-gray-200 capitalize tracking-wider truncate">
                            {rel.relationType.replace(/_/g, ' ').toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-lg font-black text-[var(--color-text-bright)] uppercase tracking-widest">Personagens Principais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {characters.map((char) => (
                  <div key={char.character.mal_id} translate="no" className="bg-[var(--color-card)]/50 rounded-lg overflow-hidden border border-[var(--color-border)] group flex items-center pr-3 gap-3 h-16">
                    <div className="w-12 h-full relative shrink-0">
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
                          "absolute top-1 left-1 p-1 rounded-full backdrop-blur-md transition-all scale-100",
                          isFavorite(char.character.mal_id) ? "bg-brand text-white" : "bg-black/50 text-white hover:bg-brand/80 opacity-0 group-hover:opacity-100"
                        )}
                      >
                        <Heart className={cn("w-3 h-3", isFavorite(char.character.mal_id) && "fill-current")} />
                      </button>
                    </div>
                    <div className="flex-1 py-1 min-w-0">
                      <p className="text-[10px] font-black text-[var(--color-text-bright)] uppercase tracking-tight truncate pb-0.5">{char.character.name}</p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate">{char.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-[var(--color-border)]">
              <h3 className="text-sm font-black text-[var(--color-text-bright)] uppercase tracking-widest pl-1">Mais Informações</h3>
              <div className="bg-[var(--color-card)]/30 p-4 rounded-xl border border-dashed border-[var(--color-border)]">
                <p className="text-gray-500 italic text-center text-xs">Review detalhado em breve na próxima atualização da saga Avalon.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
