import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Coins, Sparkles, Star, Zap, Image as ImageIcon, Briefcase, ChevronRight } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { cn } from '../lib/utils';
import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: any;
  category: 'COSMETIC' | 'BADGE' | 'BOOST' | 'PROTECTION';
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'premium_banner_pack', name: 'Pack de Banners', description: '10 banners exclusivos.', price: 500, icon: ImageIcon, category: 'COSMETIC', rarity: 'RARE' },
  { id: 'otaku_badge_gold', name: 'Selo Ouro', description: 'Brilho eterno no perfil.', price: 1500, icon: Star, category: 'BADGE', rarity: 'EPIC' },
  { id: 'multiplier_2x', name: 'Boost de PO 2x', description: 'Duplique seus ganhos por 24h.', price: 300, icon: Zap, category: 'BOOST', rarity: 'COMMON' },
  { id: 'streak_saver', name: 'Pena da Imortalidade', description: 'Protege seu streak de quebrar.', price: 450, icon: Sparkles, category: 'PROTECTION', rarity: 'EPIC' }
];

const RARITY_COLORS = {
  COMMON: "text-zinc-400 border-zinc-800",
  RARE: "text-blue-400 border-blue-900/50",
  EPIC: "text-purple-400 border-purple-900/50",
  LEGENDARY: "text-orange-400 border-orange-900/50"
};

export default function Shop() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const [tab, setTab] = useState<'SHOP' | 'INVENTORY'>('SHOP');

  const buyItem = async (item: ShopItem) => {
    if (!user || profile.availablePoints < item.price) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const { icon, ...itemToStore } = item;
      await updateDoc(userRef, {
        availablePoints: increment(-item.price),
        inventory: arrayUnion({ ...itemToStore, purchasedAt: new Date().toISOString() })
      });
    } catch (e) {
      console.error("Compra falhou", e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="flex gap-4">
        <button onClick={() => setTab('SHOP')} className={cn("px-6 py-2 rounded-full font-black uppercase text-xs", tab === 'SHOP' ? "bg-brand text-white" : "text-zinc-500")}>Loja</button>
        <button onClick={() => setTab('INVENTORY')} className={cn("px-6 py-2 rounded-full font-black uppercase text-xs", tab === 'INVENTORY' ? "bg-brand text-white" : "text-zinc-500")}>Inventário</button>
      </div>

      {tab === 'SHOP' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SHOP_ITEMS.map((item) => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <item.icon className="w-10 h-10 text-brand mb-4" />
              <h3 className="font-black text-white">{item.name}</h3>
              <p className="text-xs text-zinc-500 italic mb-4">{item.description}</p>
              <button 
                onClick={() => buyItem(item)}
                className="w-full bg-zinc-800 text-white py-2 rounded-lg font-black text-xs hover:bg-brand transition-colors"
              >
                Comprar {item.price} PO
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
           <h2 className="text-xl font-black text-white mb-6">Seus Itens</h2>
           {profile.inventory?.length ? (
             Object.entries(profile.inventory.reduce((acc: any, item: any) => {
               (acc[item.category] = acc[item.category] || []).push(item);
               return acc;
             }, {})).map(([category, items]: [string, any]) => (
               <div key={category} className="mb-6">
                 <h4 className="text-brand font-black text-xs uppercase mb-3 tracking-widest">{category}</h4>
                 <div className="grid grid-cols-2 gap-4">
                   {items.map((item: any, i: number) => {
                     const itemDef = SHOP_ITEMS.find(s => s.id === item.id);
                     const IconComponent = itemDef?.icon || Briefcase;
                     return (
                       <div key={i} className="flex items-center gap-4 p-4 bg-zinc-800 rounded-xl">
                         <div className="p-2 bg-zinc-700 rounded-lg"><IconComponent className="w-5 h-5"/></div>
                         <div>
                           <p className="font-bold text-white text-sm">{item.name}</p>
                           <p className="text-[10px] text-zinc-400">{item.category}</p>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
             ))
           ) : <p className="text-zinc-500 italic">Vazio...</p>}
        </div>
      )}
    </motion.div>
  );
}
