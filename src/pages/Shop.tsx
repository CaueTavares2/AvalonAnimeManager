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
  COMMON: "text-gray-500 border-[var(--color-border)]",
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

  const equipItem = async (item: any) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      if (item.category === 'BADGE') {
        const currentBadges = profile.badges || [];
        if (currentBadges.find((b: any) => b.id === item.id)) {
            // Unequip
            await updateDoc(userRef, {
                badges: currentBadges.filter((b: any) => b.id !== item.id)
            });
        } else {
            // Equip (max 3 badges)
            const newBadges = [...currentBadges, item].slice(-3);
            await updateDoc(userRef, {
                badges: newBadges
            });
        }
      } else if (item.category === 'COSMETIC') {
         // handle banner or frame
         alert("Cosmético equipado! Vá ao seu perfil para ver.");
      }
    } catch (e) {
      console.error("Erro ao equipar", e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="flex gap-4">
        <button onClick={() => setTab('SHOP')} className={cn("px-6 py-2 rounded-full font-black uppercase text-xs", tab === 'SHOP' ? "bg-brand text-white" : "text-gray-500")}>Loja</button>
        <button onClick={() => setTab('INVENTORY')} className={cn("px-6 py-2 rounded-full font-black uppercase text-xs", tab === 'INVENTORY' ? "bg-brand text-white" : "text-gray-500")}>Inventário</button>
      </div>

      {tab === 'SHOP' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SHOP_ITEMS.map((item) => (
            <div key={item.id} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6">
              <item.icon className="w-10 h-10 text-brand mb-4" />
              <h3 className="font-black text-[var(--color-text-bright)]">{item.name}</h3>
              <p className="text-xs text-gray-500 italic mb-4">{item.description}</p>
              <button 
                onClick={() => buyItem(item)}
                className="w-full bg-[var(--color-bg)] text-[var(--color-text-bright)] py-2 rounded-lg font-black text-xs hover:bg-brand transition-colors"
              >
                Comprar {item.price} PO
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[var(--color-card)] rounded-2xl p-8 border border-[var(--color-border)]">
           <h2 className="text-xl font-black text-[var(--color-text-bright)] mb-6">Seus Itens</h2>
           {profile.inventory?.length ? (
             Object.entries(profile.inventory.reduce((acc: any, item: any) => {
               (acc[item.category] = acc[item.category] || []).push(item);
               return acc;
             }, {})).map(([category, items]: [string, any]) => (
               <div key={category} className="mb-6">
                 <h4 className="text-brand font-black text-xs uppercase mb-3 tracking-widest">{category}</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {items.map((item: any, i: number) => {
                     const itemDef = SHOP_ITEMS.find(s => s.id === item.id);
                     const IconComponent = itemDef?.icon || Briefcase;
                     const isEquipped = profile.badges?.some((b: any) => b.id === item.id);
                     
                     return (
                       <div key={i} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-[var(--color-bg)] rounded-xl relative overflow-hidden group">
                         <div className="flex items-center gap-4">
                           <div className="p-2 bg-[var(--color-bg)] rounded-lg"><IconComponent className="w-6 h-6 md:w-5 md:h-5"/></div>
                           <div>
                             <p className="font-bold text-[var(--color-text-bright)] text-base md:text-sm">{item.name}</p>
                             <p className="text-xs md:text-[10px] text-gray-500">{item.description}</p>
                           </div>
                         </div>
                         {item.category === 'BADGE' && (
                            <button 
                              onClick={() => equipItem(item)}
                              className={cn(
                                "w-full md:w-auto px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                                isEquipped ? "bg-red-500/20 text-red-500 hover:bg- hover:text-white" : "bg-brand/20 text-brand hover:bg- hover:text-white"
                              )}
                            >
                              {isEquipped ? "Remover" : "Equipar"}
                            </button>
                         )}
                       </div>
                     );
                   })}
                 </div>
               </div>
             ))
           ) : <p className="text-gray-500 italic">Vazio...</p>}
        </div>
      )}
    </motion.div>
  );
}
