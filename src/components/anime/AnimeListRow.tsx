import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserAnime, AnimeStatus } from '../../hooks/useAnimeList';
import { useLanguage } from '../../context/LanguageContext';

interface AnimeListRowProps {
  anime: UserAnime;
  updateAnime: (id: number, data: Partial<UserAnime>) => void;
  removeAnime: (id: number) => void;
  onStatusChange: (id: number, status: AnimeStatus) => void;
  onProgressUpdate: (id: number, increment: boolean) => void;
}

const AnimeListRow = memo(({ 
  anime, 
  updateAnime, 
  removeAnime, 
  onStatusChange, 
  onProgressUpdate 
}: AnimeListRowProps) => {
  const { formatTitle } = useLanguage();
  return (
    <tr className="group hover:bg-[var(--color-card)]/30 transition-colors border-b border-[var(--color-border)] last:border-0">
      <td className="px-4 py-3">
        <Link to={`/${anime.type.toLowerCase()}/${anime.id}`}>
          <img src={anime.image} className="w-10 h-14 object-cover rounded shadow-lg border border-black/10" alt={formatTitle(anime)} />
        </Link>
      </td>
      <td className="px-4 py-3">
        <Link to={`/${anime.type.toLowerCase()}/${anime.id}`} className="font-bold text-[var(--color-text-bright)] hover:text-brand transition-colors block truncate max-w-md text-sm tracking-tight mb-1">
          {formatTitle(anime)}
        </Link>
        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest opacity-70">
          {anime.type} • {anime.updatedAt ? new Date(anime.updatedAt).toLocaleDateString('pt-BR') : 'RECENTEMENTE'}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="relative inline-block group/score">
          <span className="font-black text-brand text-base italic cursor-pointer flex items-center justify-center gap-1">
            {anime.score > 0 ? anime.score : '--'}<span className="text-[10px] text-gray-400 not-italic">/10</span>
          </span>
          
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[var(--color-card)] shadow-2xl border border-[var(--color-border)] rounded-xl p-2 z-50 opacity-0 invisible group-focus-within/score:visible group-focus-within/score:opacity-100 group-hover/score:visible group-hover/score:opacity-100 transition-all scale-95 origin-top group-hover/score:scale-100">
            <div className="flex gap-1">
              {[2, 4, 6, 8, 10].map(s => (
                <button 
                  key={s}
                  onClick={() => updateAnime(anime.id, { score: s })}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all",
                    anime.score === s ? "bg-brand text-white" : "bg-[var(--color-bg)] text-gray-400 hover:bg-brand/10 hover:text-brand"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <select 
          value={anime.status}
          onChange={(e) => onStatusChange(anime.id, e.target.value as AnimeStatus)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest focus:outline-none cursor-pointer transition-all hover:scale-105 shadow-sm",
            anime.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
            (anime.status === 'WATCHING' || anime.status === 'READING') ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
            "bg-gray-500/10 text-gray-400 border border-gray-500/20"
          )}
        >
          {anime.type === 'ANIME' ? <option value="WATCHING">Watching</option> : <option value="READING">Reading</option>}
          <option value="COMPLETED">Completed</option>
          <option value="PLANNING">Planning</option>
          <option value="DROPPED">Dropped</option>
        </select>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex flex-col items-center justify-center gap-1 group/progress">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onProgressUpdate(anime.id, false)}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-gray-400 hover:text-brand hover:border-brand transition-all active:scale-90"
            >
              -
            </button>
            <div className="flex items-center gap-1.5 min-w-[60px] justify-center">
              <span className="font-black text-[var(--color-text-bright)] text-base italic">{anime.progress}</span>
              <span className="text-gray-400 font-bold text-xs">/</span>
              <span className="text-gray-500 font-bold text-base">{anime.totalProgress || '?'}</span>
            </div>
            <button 
              onClick={() => onProgressUpdate(anime.id, true)}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-gray-400 hover:text-brand hover:border-brand transition-all active:scale-90"
            >
              +
            </button>
          </div>
          <div className="w-20 h-1 bg-[var(--color-bg)] rounded-full overflow-hidden mt-1">
            <div 
              className="h-full bg-brand transition-all duration-500"
              style={{ width: `${anime.totalProgress ? (anime.progress / anime.totalProgress) * 100 : 0}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          <button 
            onClick={() => removeAnime(anime.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 bg-[var(--color-bg)] rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});

AnimeListRow.displayName = 'AnimeListRow';

export default AnimeListRow;
