import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PartyPopper, Star, X, Trophy, Quote } from 'lucide-react';
import { cn } from '../lib/utils';

const ANIME_QUOTES = [
  { text: "Não é sobre o quanto você pode bater, é sobre o quanto você pode apanhar e continuar seguindo em frente.", author: "Rocky (Vibe Anime)" },
  { text: "Se você não gosta do seu destino, não o aceite. Em vez disso, tenha a coragem para mudá-lo do jeito que você quer.", author: "Naruto Uzumaki" },
  { text: "Aqueles que rompem as regras são lixo, é verdade. Mas aqueles que abandonam seus amigos são piores que lixo.", author: "Kakashi Hatake" },
  { text: "O mundo não é perfeito. Mas ele está lá para nós, fazendo o melhor que pode... isso é o que o torna tão bonito.", author: "Roy Mustang" },
  { text: "Viver não é apenas respirar, é ter coragem para lutar pelo que você acredita.", author: "Lelouch Vi Britannia" },
  { text: "Não importa o quão forte você seja, nunca tente carregar tudo sozinho.", author: "Itachi Uchiha" }
];

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeTitle: string;
  onRate: (score: number) => void;
}

export default function CompletionModal({ isOpen, onClose, animeTitle, onRate }: CompletionModalProps) {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedScore, setSelectedScore] = useState(0);
  const [quote, setQuote] = useState(ANIME_QUOTES[0]);

  useEffect(() => {
    if (isOpen) {
      setQuote(ANIME_QUOTES[Math.floor(Math.random() * ANIME_QUOTES.length)]);
      setSelectedScore(0);
    }
  }, [isOpen]);

  const handleRate = (score: number) => {
    setSelectedScore(score);
    onRate(score);
    // Auto close after a brief delay to show the selected rating
    setTimeout(onClose, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-[var(--color-card)] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/10"
          >
            {/* Top Celebration Header */}
            <div className="h-32 bg-gradient-to-br from-brand via-brand-dark to-yellow-600 flex items-center justify-center relative">
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 200, opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                    className="absolute w-1 h-1 bg-white/40 rounded-full"
                    style={{ left: `${Math.random() * 100}%`, top: `-5%` }}
                  />
                ))}
              </div>
              <motion.div 
                initial={{ rotate: -20, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm"
              >
                <Trophy className="w-12 h-12 text-white" />
              </motion.div>
            </div>

            <div className="p-8 text-center space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em]">Jornada Concluída</p>
                <h2 className="text-2xl font-black text-[var(--color-text-bright)] tracking-tighter leading-tight">
                  {animeTitle}
                </h2>
              </div>

              <div className="relative py-4 px-6 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-border)] italic">
                <Quote className="absolute -top-2 -left-2 w-6 h-6 text-brand/20" />
                <p className="text-sm font-medium text-[var(--color-text)] leading-relaxed">
                  "{quote.text}"
                </p>
                <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-widest">— {quote.author}</p>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-widest">Sua Avaliação</p>
                <div className="flex justify-center gap-2">
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
                          "w-6 h-6 transition-colors",
                          (hoveredStar || selectedScore) >= star ? "fill-brand text-brand" : "text-gray-300 dark:text-gray-700"
                        )} 
                      />
                    </button>
                  ))}
                </div>
                <p className="text-lg font-black text-brand italic">
                  {hoveredStar || selectedScore || '?'}<span className="text-[10px] text-gray-400 not-italic ml-1">/ 10</span>
                </p>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-[var(--color-text-bright)] transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
