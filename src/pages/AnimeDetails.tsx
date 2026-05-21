import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Plus, Star, Calendar, Play, BookOpen, Heart, User as UserIcon, Volume2, Zap, Sparkles, X, Flame, ShieldAlert, Award, Crown } from 'lucide-react';
import { useAnimeList } from '../hooks/useAnimeList';
import { useFavorites } from '../context/FavoritesContext';
import { useProfile } from '../context/ProfileContext';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { jikanService } from '../services/jikanService';
import { aniListService } from '../services/aniListService';
import { cn } from '../lib/utils';
import type { Media, AnimeStatus } from '../types';
import { SPECIAL_ANIMES } from '../constants/specialAnimes';
import { SpecialAnimeInteraction } from '../components/anime/SpecialAnimeInteraction';
import { useLanguage } from '../context/LanguageContext';
import { getCharacterData, playVoice } from '../utils/characterVoiceEngine';

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
  const { profile, updateProfile } = useProfile();
  
  const [anime, setAnime] = useState<Media | null>(null);
  const [characters, setCharacters] = useState<MediaCharacter[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [addStatus, setAddStatus] = useState<AnimeStatus>('PLANNING');
  const [airingSchedule, setAiringSchedule] = useState<any>(null);
  
  const [error, setError] = useState<string | null>(null);

  // RPG Character interactions states
  const [characterAuras, setCharacterAuras] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem('avalon_character_auras');
    return saved ? JSON.parse(saved) : {};
  });

  const [soulPacts, setSoulPacts] = useState<Record<number, any>>(() => {
    const saved = localStorage.getItem('avalon_soul_pacts');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeSubtitle, setActiveSubtitle] = useState<{
    name: string;
    phraseJa: string;
    phraseRomaji: string;
    translation: string;
  } | null>(null);

  const [pactCharacter, setPactCharacter] = useState<any | null>(null);
  const [pactStep, setPactStep] = useState<'idle' | 'aligning' | 'syncing' | 'weaving' | 'success'>('idle');
  const [pactProgress, setPactProgress] = useState(0);
  
  const inList = list.find(a => a.id === Number(id));
  const special = anime ? SPECIAL_ANIMES[anime.id] : null;

  const handleRate = (score: number) => {
    if (inList) {
      updateAnime(inList.id, { score });
    }
  };

  const handleAuraIncrease = (charId: number, charName: string) => {
    const current = characterAuras[charId] || 0;
    const next = current >= 5 ? 0 : current + 1;
    const newAuras = { ...characterAuras, [charId]: next };
    setCharacterAuras(newAuras);
    localStorage.setItem('avalon_character_auras', JSON.stringify(newAuras));

    // Audio synth keypress feedback
    try {
      if (next > 0) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150 + next * 90, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320 + next * 130, audioContext.currentTime + 0.35);
        
        gain.gain.setValueAtTime(0.04, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.35);
        
        osc.start();
        osc.stop(audioContext.currentTime + 0.35);
      }
    } catch (_) {}
  };

  const handlePlayVoice = (charName: string, role?: string) => {
    const vocalData = getCharacterData(charName, role, anime?.title);
    setActiveSubtitle({
      name: charName,
      phraseJa: vocalData.phraseJa,
      phraseRomaji: vocalData.phraseRomaji,
      translation: vocalData.translation
    });

    playVoice(vocalData.phraseJa, undefined, () => {
      // Audio playback completed
    });
  };

  const startPactRitual = (char: any) => {
    setPactCharacter(char);
    setPactStep('idle');
    setPactProgress(0);
  };

  const executePactRitual = () => {
    if (!pactCharacter) return;
    
    setPactStep('aligning');
    setPactProgress(15);
    
    const playBleep = (freq: number) => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);
        gain.gain.setValueAtTime(0.03, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
        osc.start();
        osc.stop(audioContext.currentTime + 0.15);
      } catch (_) {}
    };

    playBleep(350);

    setTimeout(() => {
      setPactStep('syncing');
      setPactProgress(50);
      playBleep(470);
      
      setTimeout(() => {
        setPactStep('weaving');
        setPactProgress(80);
        playBleep(590);
        
        setTimeout(() => {
          setPactStep('success');
          setPactProgress(100);
          playBleep(830);
          
          const vocalData = getCharacterData(pactCharacter.name, pactCharacter.role, anime?.title);
          
          const newPacts = {
            ...soulPacts,
            [pactCharacter.id]: {
              id: pactCharacter.id,
              name: pactCharacter.name,
              image: pactCharacter.image,
              title: vocalData.pactTitle,
              auraColor: vocalData.auraColor,
              date: new Date().toLocaleDateString('pt-BR'),
              animeTitle: anime?.title || 'Avalon'
            }
          };
          
          setSoulPacts(newPacts);
          localStorage.setItem('avalon_soul_pacts', JSON.stringify(newPacts));

          const updatedBadges = [...(profile.badges || [])];
          const newBadgeCode = `PACTO_${pactCharacter.id}`;
          if (!updatedBadges.includes(newBadgeCode)) {
            updatedBadges.push(newBadgeCode);
          }

          updateProfile({
            otakuPoints: (profile.otakuPoints || 0) + 55,
            availablePoints: (profile.availablePoints || 0) + 55,
            badges: updatedBadges
          });

        }, 1200);
      }, 1200);
    }, 1250);
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-[var(--color-text-bright)] uppercase tracking-widest flex items-center gap-2">
                  <Flame className="w-5 h-5 text-brand" /> Personagens Principais
                </h3>
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Combate e Afinidade</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {characters.map((char) => {
                  const charId = char.character.mal_id;
                  const auraLvl = characterAuras[charId] || 0;
                  const pact = soulPacts[charId];
                  const fav = isFavorite(charId);

                  // Set premium aura borders & glow rings
                  let auraClass = "border-[var(--color-border)] bg-[var(--color-card)]/40 hover:bg-[var(--color-card)]/60 hover:border-brand/40";
                  let auraTag = "";
                  if (auraLvl === 1) {
                    auraClass = "border-white/20 bg-slate-900/40 shadow-[0_0_12px_rgba(255,255,255,0.12)]";
                    auraTag = "Chakra Ativo";
                  } else if (auraLvl === 2) {
                    auraClass = "border-cyan-500/30 bg-cyan-950/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]";
                    auraTag = "Fluido Espiritual";
                  } else if (auraLvl === 3) {
                    auraClass = "border-orange-500/45 bg-orange-950/10 shadow-[0_0_20px_rgba(249,115,22,0.35)] animate-[pulse_2.5s_infinite]";
                    auraTag = "Aura do Caos";
                  } else if (auraLvl === 4) {
                    auraClass = "border-purple-500/60 bg-purple-950/15 shadow-[0_0_25px_rgba(168,85,247,0.45)] animate-[pulse_1.8s_infinite]";
                    auraTag = "Despertar Divino";
                  } else if (auraLvl === 5) {
                    auraClass = "border-yellow-400 bg-gradient-to-r from-yellow-500/10 via-amber-500/15 to-yellow-600/10 shadow-[0_0_35px_rgba(234,179,8,0.65)] border-2 animate-[pulse_2s_infinite]";
                    auraTag = "SUPREMO / LIMITLESS";
                  }

                  return (
                    <div 
                      key={charId} 
                      translate="no" 
                      className={cn(
                        "rounded-xl overflow-hidden border p-3 flex flex-col justify-between gap-3 relative transition-all duration-300 shadow-md group",
                        auraClass,
                        pact && "ring-1 ring-yellow-500/40"
                      )}
                    >
                      {/* Starry glitter overlay if Soul Pacted */}
                      {pact && (
                        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/5 via-transparent to-transparent opacity-100 z-0" />
                      )}

                      <div className="flex items-start gap-3 relative z-10">
                        {/* Avatar Column */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden relative shrink-0 border border-[var(--color-border)]/60">
                          <img src={char.character.images.webp.image_url} alt={char.character.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <button 
                            onClick={() => {
                              if (fav) {
                                removeCharacter(charId);
                              } else {
                                addCharacter({
                                  id: charId,
                                  name: char.character.name,
                                  image: char.character.images.webp.image_url,
                                  animeTitle: anime?.title || '',
                                  role: char.role
                                });
                              }
                            }}
                            className={cn(
                              "absolute top-1 left-1 p-0.5 rounded-full backdrop-blur-md transition-all scale-100",
                              fav ? "bg-brand text-white" : "bg-black/50 text-white hover:bg-brand/80 opacity-0 group-hover:opacity-100"
                            )}
                          >
                            <Heart className={cn("w-2.5 h-2.5", fav && "fill-current")} />
                          </button>
                        </div>

                        {/* Name and Meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[11px] font-black text-[var(--color-text-bright)] uppercase tracking-tight truncate">
                              {char.character.name.split(',').reverse().join(' ')}
                            </p>
                            {pact && (
                              <span className="bg-yellow-500/10 text-yellow-400 p-0.5 rounded-full" title="Pacto de Alma Consagrado!">
                                <Crown className="w-3 h-3 fill-current" />
                              </span>
                            )}
                          </div>
                          
                          {pact ? (
                            <p className="text-[8px] font-black text-yellow-400 uppercase tracking-widest mt-0.5 line-clamp-1 italic bg-yellow-500/5 px-1 py-0.5 rounded border border-yellow-500/10 inline-block">
                              ✦ {pact.title}
                            </p>
                          ) : (
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{char.role}</p>
                          )}

                          {auraLvl > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="flex h-1.5 w-1.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand"></span>
                              </span>
                              <span className="text-[8px] font-black text-brand tracking-widest uppercase">
                                KI Lvl {auraLvl} ({auraTag})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Controls Bar */}
                      <div className="flex items-center justify-between border-t border-[var(--color-border)]/40 pt-2.5 mt-1 gap-2 relative z-10">
                        {/* Audio Quote Button */}
                        <button 
                          onClick={() => handlePlayVoice(char.character.name, char.role)}
                          className="flex-1 py-1 px-2 rounded-md bg-[var(--color-bg)] hover:bg-white/5 border border-[var(--color-border)]/40 transition-all text-gray-400 hover:text-white flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider"
                          title="Falar Catchphrase Original em Japonês"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                          <span>Ouvir Voz</span>
                        </button>

                        {/* Power Aura Button */}
                        <button 
                          onClick={() => handleAuraIncrease(charId, char.character.name)}
                          className={cn(
                            "flex-1 py-1 px-2 rounded-md bg-[var(--color-bg)] hover:bg-white/5 border border-[var(--color-border)]/40 transition-all flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider",
                            auraLvl > 0 ? "text-amber-400 border-amber-500/20" : "text-gray-400 hover:text-amber-400"
                          )}
                          title="Aumentar Nível de Combate e Aura"
                        >
                          <Zap className={cn("w-3.5 h-3.5", auraLvl > 0 ? "text-amber-400 fill-current" : "text-amber-500")} />
                          <span>Aura {auraLvl > 0 ? `x${auraLvl}` : "Ki"}</span>
                        </button>

                        {/* Star Portal Alliance Contract Button */}
                        <button 
                          onClick={() => startPactRitual({
                            id: charId,
                            name: char.character.name,
                            image: char.character.images.webp.image_url,
                            role: char.role
                          })}
                          className={cn(
                            "py-1 px-2.5 rounded-md transition-all flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider",
                            pact 
                              ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 cursor-default" 
                              : "bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 hover:border-brand/40"
                          )}
                          disabled={!!pact}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{pact ? "Pactuado" : "Pacto"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
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

      {/* Floating Original Subtitles Overlay widget */}
      <AnimatePresence>
        {activeSubtitle && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className="fixed bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 md:w-[500px] bg-slate-950/95 border border-[var(--color-border)] rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 border-l-4 border-l-cyan-500"
          >
            <div className="flex-1">
              <p className="text-[8px] font-black tracking-widest text-cyan-400 uppercase mb-1">
                🗣️ {activeSubtitle.name.split(',').reverse().join(' ').trim()} • Voz em Japonês
              </p>
              <h4 className="text-sm font-bold text-white leading-normal tracking-wide mb-1" translate="no">
                "{activeSubtitle.phraseJa}"
              </h4>
              <p className="text-[10px] text-gray-400 font-mono italic mb-2 leading-relaxed" translate="no">
                {activeSubtitle.phraseRomaji}
              </p>
              <div className="h-px bg-zinc-800 w-full mb-1.5" />
              <p className="text-[11px] font-bold text-gray-300 leading-normal">
                "{activeSubtitle.translation}"
              </p>
            </div>
            <button 
              onClick={() => setActiveSubtitle(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all shrink-0 align-top"
              title="Fechar legenda"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔮 Sacred Astronomy Portal: Starry Constellation Ritual Modal */}
      <AnimatePresence>
        {pactCharacter && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-xl flex items-center justify-center overflow-y-auto p-4 md:p-8"
          >
            {/* Spinning background starlight field */}
            <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-transparent animate-[spin_50s_linear_infinite]" />
              {/* Twinkling CSS Stars */}
              <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-white rounded-full animate-ping duration-1000" />
              <div className="absolute top-1/3 left-3/4 w-1 h-1 bg-white rounded-full animate-ping duration-[3s]" />
              <div className="absolute top-2/3 left-1/5 w-1 h-1 bg-white rounded-full animate-ping duration-2000" />
              <div className="absolute top-4/5 left-2/3 w-1.5 h-1.5 bg-white rounded-full animate-ping duration-1500" />
            </div>

            <div className="relative w-full max-w-xl bg-slate-900/60 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl text-center overflow-hidden z-10">
              {/* Star-link Header */}
              <div className="space-y-1.5 mb-6">
                <span className="text-[10px] text-yellow-400 font-extrabold uppercase tracking-[0.2em] bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
                  ✦ Selo de Aliança Cósmica ✦
                </span>
                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight pt-2">
                  Portal do Pacto de Alma
                </h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Forje um elo de destino indelével com {pactCharacter.name.split(',').reverse().join(' ').trim()} através do alinhamento das constelações de Avalon.
                </p>
              </div>

              {/* 🌌 Constellation Star Alignment Orbit Centerpiece */}
              <div className="relative h-64 md:h-72 flex items-center justify-center my-6">
                {/* Thin Cosmic Astronomy Orbits */}
                <div className="absolute w-56 h-56 rounded-full border border-zinc-800/40 animate-[spin_40s_linear_infinite]" />
                <div className="absolute w-44 h-44 rounded-full border border-dashed border-zinc-800/60 animate-[spin_15s_linear_infinite]" />
                <div className="absolute w-32 h-32 rounded-full border border-zinc-700/40 animate-[spin_8s_linear_infinite]" />

                {/* Star constellation connecting matrix lines (pure responsive SVG) */}
                <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-85">
                  <defs>
                    <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#ec4899" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#eab308" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                  
                  {/* Glowing dynamic pathways connecting left-right and connecting nodes */}
                  {pactStep !== 'idle' && (
                    <>
                      {/* Left to center-left node */}
                      <line x1="20%" y1="50%" x2="40%" y2="30%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3" className="animate-[pulse_1s_infinite]" />
                      {/* Center-left to center-right node */}
                      <line x1="40%" y1="30%" x2="60%" y2="70%" stroke="#a855f7" strokeWidth="2" strokeDasharray={pactProgress > 40 ? "0" : "4"} className="transition-all" />
                      {/* Center-right to right */}
                      <line x1="60%" y1="70%" x2="80%" y2="50%" stroke="#eab308" strokeWidth="2" strokeDasharray={pactProgress > 75 ? "0" : "5"} />
                      
                      {/* Solid Laser Beam on Success */}
                      {pactStep === 'success' && (
                        <line x1="20%" y1="50%" x2="80%" y2="50%" stroke="url(#beamGradient)" strokeWidth="4" className="shadow-lg shadow-yellow-500/50 animate-pulse duration-100" />
                      )}
                    </>
                  )}
                </svg>

                {/* Node 1 - User Avatar */}
                <div className="absolute left-[8%] md:left-[15%] z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] overflow-hidden flex items-center justify-center p-0.5">
                    {profile.photoURL ? (
                      <img src={profile.photoURL} className="w-full h-full object-cover rounded-full" alt="Mestre" />
                    ) : (
                      <UserIcon className="w-8 h-8 text-blue-400" />
                    )}
                  </div>
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-2">{profile.username}</span>
                </div>

                {/* Node 2 - Character Avatar - Sould Bonded */}
                <div className="absolute right-[8%] md:right-[15%] z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] overflow-hidden p-0.5">
                    <img src={pactCharacter.image} className="w-full h-full object-cover rounded-full" alt={pactCharacter.name} />
                  </div>
                  <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest mt-2">
                    {pactCharacter.name.split(',').reverse().join(' ').trim()}
                  </span>
                </div>

                {/* Celestial Nodes during alignment */}
                {pactStep !== 'idle' && (
                  <>
                    <div className={cn(
                      "absolute top-[30%] left-[40%] text-[11px] h-3 w-3 rounded-full transition-all duration-500 z-10 shadow-[0_0_8px_white]",
                      pactProgress >= 15 ? "bg-blue-400 scale-125" : "bg-zinc-800"
                    )} />
                    <div className={cn(
                      "absolute bottom-[30%] left-[60%] text-[11px] h-3 w-3 rounded-full transition-all duration-500 z-10 shadow-[0_0_8px_white]",
                      pactProgress >= 80 ? "bg-emerald-400 scale-125" : "bg-zinc-800"
                    )} />
                  </>
                )}

                {/* Core Oracle Sigil center representation */}
                <div className="absolute z-10 bg-slate-950/90 rounded-full w-24 h-24 border border-zinc-700/60 shadow-inner flex flex-col items-center justify-center p-2">
                  {pactStep === 'idle' ? (
                    <Sparkles className="w-7 h-7 text-yellow-400 animate-spin duration-3000" />
                  ) : pactStep === 'success' ? (
                    <Award className="w-9 h-9 text-yellow-400 animate-[bounce_1s_infinite]" />
                  ) : (
                    <div className="text-center">
                      <div className="w-10 h-10 border-4 border-zinc-800 border-t-yellow-400 rounded-full animate-spin mx-auto mb-1" />
                      <span className="text-[9px] font-black text-white">{pactProgress}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Wizard Description */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-zinc-800 max-w-sm mx-auto mb-6">
                {pactStep === 'idle' && (
                  <p className="text-xs text-gray-300">
                    O pacto consagra a aliança eterna, recompensando você com <span className="text-yellow-400 font-bold">+55 Otaku Points</span> e sela o título honorífico do personagem em seu perfil.
                  </p>
                )}
                {pactStep === 'aligning' && (
                  <p className="text-xs text-blue-400 font-mono animate-pulse">
                    📡 ALINHANDO FREQUÊNCIA ESPIRITUAL CÓSMICA...
                  </p>
                )}
                {pactStep === 'syncing' && (
                  <p className="text-xs text-cyan-400 font-mono animate-pulse">
                    💫 SINCRONIZANDO MAPA CELESTE DE RITOS...
                  </p>
                )}
                {pactStep === 'weaving' && (
                  <p className="text-xs text-yellow-500 font-mono animate-pulse">
                    🌟 TECENDO OS FIOS DO DESTINO DE AVALON...
                  </p>
                )}
                {pactStep === 'success' && (
                  <div className="space-y-1.5 text-center">
                    <p className="text-xs text-emerald-400 font-black tracking-widest uppercase">
                      🎉 PACTO SELADO COM SUCESSO!
                    </p>
                    <p className="text-[10px] text-gray-300">
                      Você ganhou o título extraordinário:
                    </p>
                    <p className="text-xs font-black text-yellow-400 tracking-wider">
                      "{getCharacterData(pactCharacter.name, pactCharacter.role, anime?.title).pactTitle}"
                    </p>
                  </div>
                )}
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex gap-3 justify-center items-center">
                {pactStep === 'idle' ? (
                  <>
                    <button 
                      onClick={() => setPactCharacter(null)}
                      className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={executePactRitual}
                      className="px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-yellow-500/20 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Sincronizar Almas
                    </button>
                  </>
                ) : pactStep === 'success' ? (
                  <button 
                    onClick={() => {
                      // Trigger audio phrase as celebration!
                      handlePlayVoice(pactCharacter.name, pactCharacter.role);
                      setPactCharacter(null);
                    }}
                    className="w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-slate-950 text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
                  >
                    Consagrar e Retornar
                  </button>
                ) : (
                  <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                    Processando alinhamento estelar...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
