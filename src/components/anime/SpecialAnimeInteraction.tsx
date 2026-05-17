import React from 'react';
import { motion } from 'motion/react';
import { Circle, Skull, BookOpen, Sword, PenTool } from 'lucide-react';

export const SpecialAnimeInteraction: React.FC<{ theme: 'dragon-ball' | 'one-piece' | 'death-note' | 'attack-on-titan' }> = ({ theme }) => {
  switch (theme) {
    case 'dragon-ball':
      return (
        <motion.div 
          className="relative flex items-center justify-center p-2"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }} 
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        >
          <Circle className="text-orange-400 fill-orange-500" size={48} />
          <div className="absolute font-black text-red-900 text-xl">★★★★</div>
        </motion.div>
      );
    case 'one-piece':
      return (
        <motion.div 
          animate={{ rotate: [0, -10, 10, 0], y: [0, -10, 0] }} 
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          <Skull className="text-white fill-zinc-800" size={48} />
        </motion.div>
      );
    case 'death-note':
      return (
        <motion.div 
          className="flex flex-col items-center"
          animate={{ opacity: [1, 0.4, 1] }} 
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <BookOpen className="text-red-900" size={40} />
          <PenTool className="text-white mt-1" size={20} />
        </motion.div>
      );
    case 'attack-on-titan':
      return (
        <motion.div 
          animate={{ rotate: [0, 45, 0], scale: [1, 1.2, 1] }} 
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <Sword className="text-slate-200 fill-slate-500" size={48} />
        </motion.div>
      );
    default:
      return null;
  }
};
