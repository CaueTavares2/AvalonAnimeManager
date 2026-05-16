import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ShieldCheck, Zap, Crown, Flame, Star, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ACHIEVEMENTS, Achievement } from '../../services/rankingService';

// We'll listen to a custom event for local testing and also firestore (optional, but custom event is best for the Test button)
export const AchievementNotification: React.FC = () => {
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [current, setCurrent] = useState<Achievement | null>(null);

  useEffect(() => {
    const handleTestEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Achievement>;
      setQueue((prev) => [...prev, customEvent.detail]);
    };

    window.addEventListener('TEST_ACHIEVEMENT', handleTestEvent);
    window.addEventListener('ACHIEVEMENT_UNLOCKED', handleTestEvent);

    return () => {
      window.removeEventListener('TEST_ACHIEVEMENT', handleTestEvent);
      window.removeEventListener('ACHIEVEMENT_UNLOCKED', handleTestEvent);
    };
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [queue, current]);

  useEffect(() => {
    if (current) {
      const timer = setTimeout(() => {
        setCurrent(null);
      }, 5000); // 5 seconds display
      return () => clearTimeout(timer);
    }
  }, [current]);

  if (!current) return null;

  const getRarityConfig = (rarity: string) => {
    switch (rarity) {
      case 'COMUM':
        return {
          bg: 'bg-zinc-800/90',
          border: 'border-zinc-500/50',
          text: 'text-zinc-300',
          icon: <ShieldCheck className="w-8 h-8 text-zinc-400" />,
          animation: {
            initial: { opacity: 0, y: 50 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: 50, scale: 0.9 },
            transition: { type: 'spring', bounce: 0.4, duration: 0.6 }
          },
          label: 'COMUM'
        };
      case 'RARO':
        return {
          bg: 'bg-blue-900/90',
          border: 'border-blue-500/50',
          text: 'text-blue-100',
          icon: <Star className="w-8 h-8 text-blue-400" />,
          animation: {
            initial: { opacity: 0, x: -50, scale: 0.8 },
            animate: { opacity: 1, x: 0, scale: 1 },
            exit: { opacity: 0, x: 50, scale: 0.8 },
            transition: { type: 'spring', bounce: 0.5, duration: 0.6 }
          },
          label: 'RARO'
        };
      case 'EPICO':
        return {
          bg: 'bg-purple-900/90',
          border: 'border-purple-500/50',
          text: 'text-purple-100',
          icon: <Zap className="w-8 h-8 text-purple-400" />,
          animation: {
            initial: { opacity: 0, scale: 0.5, rotate: -15 },
            animate: { opacity: 1, scale: 1, rotate: 0 },
            exit: { opacity: 0, scale: 0.5, rotate: 15 },
            transition: { type: 'spring', stiffness: 200, damping: 15 }
          },
          label: 'ÉPICO'
        };
      case 'LENDARIO':
      default:
        return {
          bg: 'bg-yellow-900/90',
          border: 'border-yellow-500/50',
          text: 'text-yellow-100',
          icon: <Crown className="w-8 h-8 text-yellow-400" />,
          animation: {
            initial: { opacity: 0, y: -50, scale: 1.2 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, scale: 0, y: 50 },
            transition: { type: 'spring', bounce: 0.6, duration: 0.8 }
          },
          label: 'LENDÁRIO'
        };
    }
  };

  const config = getRarityConfig(current.rarity);

  return (
    <AnimatePresence>
      <motion.div
        key={current.id}
        initial={config.animation.initial}
        animate={config.animation.animate}
        exit={config.animation.exit}
        transition={config.animation.transition}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
      >
        <div className={cn(
          "relative overflow-hidden backdrop-blur-xl border-2 rounded-2xl p-4 shadow-2xl flex items-center gap-4",
          config.bg, config.border
        )}>
          {/* Animated glow background for Epic & Legendary */}
          {(current.rarity === 'EPICO' || current.rarity === 'LENDARIO') && (
            <div className="absolute inset-0 w-full h-full animate-spin opacity-20 pointer-events-none duration-[3000ms]"
                 style={{ background: 'conic-gradient(from 0deg, transparent, currentColor, transparent)' }} />
          )}

          <div className="relative shrink-0 flex items-center justify-center bg-black/30 rounded-full p-3">
             {config.icon}
          </div>

          <div className="flex-1 min-w-0 relative">
             <div className="flex items-center gap-2 mb-1">
               <span className={cn(
                 "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/40",
                 config.text
               )}>
                 {config.label}
               </span>
               <span className="text-[10px] text-white/70 font-bold">+{current.points} PO</span>
             </div>
             <h4 className="text-white font-black uppercase italic tracking-tighter truncate text-sm">
               {current.title}
             </h4>
             <p className="text-white/70 text-[10px] uppercase font-bold leading-tight mt-1 line-clamp-2">
               {current.description}
             </p>
          </div>

          <button onClick={() => setCurrent(null)} className="absolute top-2 right-2 text-white/50 hover:text-white transition-colors">
             <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
