import { useEffect, useState } from 'react';

export function FallingSakura() {
  const [petals, setPetals] = useState<{ id: number; left: number; duration: number; delay: number; size: number; }[]>([]);

  useEffect(() => {
    // Generate petals
    const petalCount = window.innerWidth < 768 ? 12 : 35; // Less on mobile to preserve performance
    
    const generated = Array.from({ length: petalCount }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // starting position %
      duration: Math.random() * 15 + 10, // 10s to 25s for slow elegant fall
      delay: Math.random() * -20, // Start offset
      size: Math.random() * 8 + 6, // size in px
    }));
    
    setPetals(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <style>
        {`
          @keyframes sakura-fall {
            0% { transform: translateY(-5vh) rotate(0deg) translateX(0); opacity: 0; }
            10% { opacity: 0.8; }
            90% { opacity: 0.8; }
            100% { transform: translateY(105vh) rotate(360deg) translateX(15vw); opacity: 0; }
          }
        `}
      </style>
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="absolute text-brand/40 drop-shadow-sm pointer-events-none select-none"
          style={{ 
            left: `${petal.left}vw`,
            top: '-20px',
            fontSize: petal.size, 
            filter: 'blur(0.5px)',
            animation: `sakura-fall ${petal.duration}s linear ${petal.delay}s infinite`,
            willChange: 'transform'
          }}
        >
          🌸
        </div>
      ))}
    </div>
  );
}
