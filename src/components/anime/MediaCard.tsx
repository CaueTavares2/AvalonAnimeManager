import React from 'react';
import { Star, MessageCircle, Play } from 'lucide-react';
import { motion } from 'motion/react';
import type { Media } from '../../types';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

interface MediaCardProps {
  media: Media;
}

const isMobileDevice = typeof window !== 'undefined' && (
  /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
  window.innerWidth < 1024
);

const MediaCard = React.memo(({ media }: MediaCardProps) => {
  return (
    <Link to={`/${media.type.toLowerCase()}/${media.id}`} className="group relative cursor-pointer block">
      {/* Cover Image */}
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 mb-3 shadow-2xl border border-white/5 group-hover:border-brand/50 transition-all duration-500">
        <img 
          src={media.image} 
          alt={media.title}
          className="w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-110 opacity-90 group-hover:opacity-100"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
        
        {/* Detail Overlay on Hover */}
        {!isMobileDevice && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
            <div className="absolute inset-0 bg-brand/10 backdrop-blur-[4px]" />
            <div className="absolute inset-0 p-5 flex flex-col justify-end">
              <div className="space-y-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className="flex flex-wrap gap-1.5">
                  {media.genres.slice(0, 3).map(genre => (
                    <span key={genre} className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-[7px] font-black rounded-full uppercase tracking-widest text-white border border-white/10">
                      {genre}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-[10px] font-black text-white">{media.score}%</span>
                   </div>
                   <div className="w-1 h-1 rounded-full bg-white/30" />
                   <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">{media.format}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Score/Badge */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          <div className="px-2 py-1 bg-brand/90 backdrop-blur-md text-white text-[9px] font-black rounded-lg shadow-[0_0_15px_rgba(var(--color-brand-rgb),0.3)] uppercase tracking-tighter border border-white/10">
            {media.type}
          </div>
          {media.score >= 80 && (
            <div className="px-2 py-1 bg-yellow-500/90 backdrop-blur-md text-black text-[7px] font-black rounded-md shadow-lg uppercase tracking-widest border border-yellow-400/20">
              PREMIUM
            </div>
          )}
        </div>

        {/* Play Icon Placeholder for Anime */}
        {media.type === 'ANIME' && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-brand/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 shadow-xl">
             <Play className="w-4 h-4 text-white fill-white ml-0.5" />
           </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1.5 px-1 pb-1">
        <h3 className="text-[13px] font-black text-[var(--color-text-bright)] line-clamp-2 leading-tight group-hover:text-brand transition-colors duration-300 uppercase tracking-tight italic">
          {media.title}
        </h3>
        <div className="flex items-center justify-between gap-2">
           <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{media.year || '2024'}</p>
           <span className="text-[8px] font-black text-brand/60 uppercase tracking-tighter">HD • DUB/SUB</span>
        </div>
      </div>
    </Link>
  );
});

MediaCard.displayName = 'MediaCard';

export default MediaCard;
