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
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-gray-200 mb-2 shadow-sm border border-black/5 dark:border-white/5">
        <img 
          src={media.image} 
          alt={media.title}
          className="w-full h-full object-cover transition-transform duration-500 md:group-hover:scale-110"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        
        {/* Detail Overlay on Hover - Completely omitted on mobile to prevent DOM strain and garbage collection overhead */}
        {!isMobileDevice && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
            <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {media.genres.slice(0, 2).map(genre => (
                    <span key={genre} className="px-1.5 py-0.5 bg-brand text-[8px] font-black rounded uppercase tracking-wider">
                      {genre}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] font-bold opacity-90 leading-tight flex items-center gap-1.5">
                  <span className="text-brand">★</span> {media.score}% • {media.format}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Score/Badge */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          <div className="px-1.5 py-0.5 bg-brand text-white text-[10px] font-black rounded shadow-lg">
            {Math.round(media.score)}%
          </div>
          <div className="px-1.5 py-0.5 bg-black/60 text-white text-[8px] font-black rounded uppercase tracking-widest border border-white/10">
            {media.type}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-0.5 px-0.5">
        <h3 className="text-sm font-bold text-[var(--color-text-bright)] line-clamp-2 leading-tight group-hover:text-brand transition-colors duration-200">
          {media.title}
        </h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{media.year || 'TBA'}</p>
      </div>
    </Link>
  );
});

MediaCard.displayName = 'MediaCard';

export default MediaCard;
