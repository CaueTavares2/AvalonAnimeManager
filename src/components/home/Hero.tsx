import { Play, Info } from 'lucide-react';
import { motion } from 'motion/react';
import type { Media } from '../../types';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

interface HeroProps {
  media: Media;
}

export default function Hero({ media }: HeroProps) {
  const { formatTitle } = useLanguage();
  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden mb-12">
      {/* Background Banner */}
      <img 
        src={media.banner || media.image} 
        alt={formatTitle(media)}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full max-w-4xl space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-brand text-white text-[10px] font-bold rounded uppercase">
              #1 Trending
            </span>
            <span className="text-white/70 text-xs font-semibold uppercase">
              {media.season} {media.year}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
            {formatTitle(media)}
          </h1>
          
          <p className="text-white/80 text-sm md:text-base line-clamp-2 md:line-clamp-3 max-w-2xl leading-relaxed">
            In a futuristic city where technology and magic coexist, one young hero must rise to challenge the corrupt corporations that rule the neon-lit streets...
          </p>
        </motion.div>
        
        <div className="flex items-center gap-4">
          <Link to={`/${media.type.toLowerCase()}/${media.id}`} className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-6 py-2.5 rounded-md font-bold transition-all transform hover:scale-105">
            <Play className="w-4 h-4 fill-current" /> Play Now
          </Link>
          <Link to={`/${media.type.toLowerCase()}/${media.id}`} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-2.5 rounded-md font-bold transition-all">
            <Info className="w-4 h-4" /> View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
