import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Lock, Coins, Sparkles, Star, Zap, Image as ImageIcon, UserIcon } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { cn } from '../lib/utils';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: any;
  category: 'COSMETIC' | 'BADGE' | 'BOOST';
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'premium_banner_pack',
    name: 'Pack de Banners Exclusivos',
    description: 'Acesso a 10 banners cinematográficos em alta definição.',
    price: 500,
    icon: ImageIcon,
    category: 'COSMETIC',
    rarity: 'RARE'
  },
  {
    id: 'otaku_badge_gold',
    name: 'Selo de Apoiador Ouro',
    description: 'Um selo dourado brilhante ao lado do seu nome.',
    price: 1500,
    icon: Star,
    category: 'BADGE',
    rarity: 'EPIC'
  },
  {
    id: 'multiplier_2x',
    name: 'Multiplicador de XP 2x',
    description: 'Dobre seus ganhos de Otaku Points por 24 horas.',
    price: 300,
    icon: Zap,
    category: 'BOOST',
    rarity: 'COMMON'
  }
];

const RARITY_COLORS = {
  COMMON: "text-zinc-400 border-zinc-800",
  RARE: "text-blue-400 border-blue-900/50",
  EPIC: "text-purple-400 border-purple-900/50",
  LEGENDARY: "text-orange-400 border-orange-900/50"
};

export default function Shop() {
  const { profile } = useProfile();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="relative h-64 rounded-3xl overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&q=80&w=1200" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          alt="Shop Banner"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-brand/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-brand/30 mb-6"
          >
            <ShoppingBag className="w-10 h-10 text-brand" />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-2 drop-shadow-2xl">
            Mercado de <span className="text-brand">Avalon</span>
          </h1>
          <p className="text-zinc-400 text-xs font-black uppercase tracking-[0.3em] max-w-md">
            Troque seus Otaku Points por itens lendários e cosméticos únicos.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center border border-brand/20">
              <Coins className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Saldo Disponível</p>
              <p className="text-xl font-black text-white italic leading-none">{profile.availablePoints || 0} PO</p>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-800" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Total Conquistado</p>
              <p className="text-xl font-black text-white italic leading-none">{profile.otakuPoints || 0} PO</p>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-xl border border-zinc-700">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Loja Temporariamente fechada</span>
        </div>
      </div>

      {/* Items Grid (Disabled state) */}
      <div className="relative">
        {/* Overlay for "Closed" shop */}
        <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[2px] bg-zinc-950/20 rounded-3xl overflow-hidden border border-brand/10">
          <div className="bg-zinc-900/90 border border-brand/30 p-12 rounded-3xl text-center max-w-sm shadow-2xl shadow-brand/20 transform -rotate-1">
            <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand/30">
              <Lock className="w-10 h-10 text-brand" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Em Manutenção</h2>
            <p className="text-zinc-400 text-xs font-bold uppercase italic leading-relaxed mb-8">
              Nossos mercadores estão reestocando a loja com itens raros. Volte em breve para gastar seus pontos!
            </p>
            <div className="space-y-3">
               <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "30%" }}
                    animate={{ width: "85%" }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                    className="h-full bg-brand"
                  />
               </div>
               <p className="text-[10px] font-black text-brand uppercase tracking-widest">Estoque sendo atualizado... 85%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-40 grayscale pointer-events-none">
          {SHOP_ITEMS.map((item) => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group">
              <div className="h-40 bg-zinc-800 flex items-center justify-center relative overflow-hidden">
                 <item.icon className="w-16 h-16 text-zinc-700" />
                 <div className="absolute top-4 right-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.2em] border",
                      RARITY_COLORS[item.rarity]
                    )}>
                      {item.rarity}
                    </span>
                 </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">{item.name}</h3>
                  <p className="text-zinc-400 text-[10px] font-black tracking-widest">{item.category}</p>
                </div>
                <p className="text-xs text-zinc-500 font-bold italic mb-6">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins size={14} className="text-brand" />
                    <span className="text-lg font-black text-white italic">{item.price} PO</span>
                  </div>
                  <button className="bg-zinc-800 text-zinc-500 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    Comprar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-brand/5 border border-brand/20 p-8 rounded-3xl text-center">
         <p className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mb-4">Aviso Sugestivo</p>
         <p className="text-zinc-500 text-xs font-bold uppercase italic max-w-2xl mx-auto leading-relaxed">
            "Os pontos que você gasta aqui são o seu SALDO DISPONÍVEL. Sua pontuação no RANKING MUNDIAL não será afetada pelas compras. A glória é eterna, mas o estilo custa caro."
         </p>
      </div>
    </div>
  );
}
