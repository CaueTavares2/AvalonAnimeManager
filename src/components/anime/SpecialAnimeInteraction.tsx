import React from 'react';
import { motion } from 'motion/react';
import { Circle, Skull, BookOpen, Sword } from 'lucide-react';

export const SpecialAnimeInteraction: React.FC<{ theme: 'dragon-ball' | 'one-piece' | 'death-note' | 'attack-on-titan' }> = ({ theme }) => {
  switch (theme) {
    case 'dragon-ball':
      return (
        <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 2 }}>
          <Circle className="text-orange-500 fill-orange-400" size={32} />
        </motion.div>
      );
    case 'one-piece':
      return (
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <Skull className="text-white" size={32} />
        </motion.div>
      );
    case 'death-note':
      return (
        <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
          <BookOpen className="text-zinc-600" size={32} />
        </motion.div>
      );
    case 'attack-on-titan':
      return (
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
          <Sword className="text-slate-400" size={32} />
        </motion.div>
      );
    default:
      return null;
  }
};
