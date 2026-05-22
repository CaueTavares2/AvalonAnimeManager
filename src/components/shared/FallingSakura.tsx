import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export function FallingSakura() {
  const [petals, setPetals] = useState<{ id: number; left: number; duration: number; delay: number; size: number; rotation: number }[]>([]);

  useEffect(() => {
    // Generate petals
    const petalCount = window.innerWidth < 768 ? 15 : 35; // Less on mobile to preserve performance
    
    const generated = Array.from({ length: petalCount }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // starting position %
      duration: Math.random() * 15 + 10, // 10s to 25s for slow elegant fall
      delay: Math.random() * -20, // Start offset
      size: Math.random() * 8 + 6, // size in px
      rotation: Math.random() * 360,
    }));
    
    setPetals(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          initial={{
            y: -20,
            x: `${petal.left}vw`,
            rotate: petal.rotation,
            opacity: 0.8
          }}
          animate={{
            y: '105vh',
            x: `${petal.left + (Math.random() * 20 - 10)}vw`,
            rotate: petal.rotation + 360,
          }}
          transition={{
            y: {
              duration: petal.duration,
              repeat: Infinity,
              ease: "linear",
              delay: petal.delay,
            },
            x: {
              duration: petal.duration * 0.8,
              repeat: Infinity,
              ease: "easeInOut",
              repeatType: "mirror",
              delay: petal.delay,
            },
            rotate: {
              duration: petal.duration * 0.6,
              repeat: Infinity,
              ease: "linear",
            }
          }}
          className="absolute text-brand/40 drop-shadow-sm pointer-events-none font-sans select-none"
          style={{ 
            fontSize: petal.size, 
            filter: 'blur(0.5px)' 
          }}
        >
          🌸
        </motion.div>
      ))}
    </div>
  );
}
