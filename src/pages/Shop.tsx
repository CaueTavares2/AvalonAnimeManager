import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Coins, Sparkles, Star, Zap, Image as ImageIcon, 
  Briefcase, ChevronRight, Crown, Trophy, Shield, Clock, Heart, Award, Check, Info, ArrowRight, ShieldCheck, HelpCircle
} from 'lucide-react';
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
  icon: React.ComponentType<any>;
  category: 'COSMETIC' | 'BADGE' | 'BOOST' | 'PROTECTION';
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'premium_banner_pack', name: 'Santuário de Sakura', description: 'Um banner panorâmico das cerejeiras para o cabeçalho do seu perfil.', price: 500, icon: ImageIcon, category: 'COSMETIC', rarity: 'RARE' },
  { id: 'banner_vintage_future', name: 'Hack Overlord Cyberpunk', description: 'O visual definitivo do submundo hacker de Neo-Tokyo. Néon cianeto, arquitetura brutalista industrial e códigos criptografados brutais.', price: 800, icon: ImageIcon, category: 'COSMETIC', rarity: 'LEGENDARY' },
  { id: 'otaku_badge_gold', name: 'Selo do Imperador', description: 'Exiba a prestigiosa insígnia de ouro brilhante em seu perfil.', price: 1500, icon: Star, category: 'BADGE', rarity: 'EPIC' },
  { id: 'otaku_badge_legendary', name: 'Insígnia Sagrada Avalon', description: 'O selo supremo que consagra você como uma lenda viva do reino Avalon.', price: 3000, icon: Crown, category: 'BADGE', rarity: 'LEGENDARY' },
  { id: 'multiplier_2x', name: 'Boost de PO x2', description: 'Duplica absolutamente todos os seus ganhos de PO pelas próximas 24h.', price: 300, icon: Zap, category: 'BOOST', rarity: 'COMMON' },
  { id: 'streak_saver', name: 'Pena da Imortalidade', description: 'Protege e blinda seu streak diário contra quebras de inatividade por um dia.', price: 450, icon: Sparkles, category: 'PROTECTION', rarity: 'EPIC' }
];

const RARITY_STYLING = {
  COMMON: {
    bg: "bg-cyan-500/5",
    text: "text-cyan-400",
    border: "border-cyan-500/25",
    glow: "hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]",
    badgeBg: "bg-cyan-950/40 border-cyan-500/35 text-cyan-400 font-mono"
  },
  RARE: {
    bg: "bg-blue-500/5",
    text: "text-blue-400",
    border: "border-blue-500/25",
    glow: "hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]",
    badgeBg: "bg-blue-950/40 border-blue-500/35 text-blue-400 font-mono"
  },
  EPIC: {
    bg: "bg-fuchsia-500/5",
    text: "text-fuchsia-400",
    border: "border-fuchsia-500/25",
    glow: "hover:border-fuchsia-400 hover:shadow-[0_0_20px_rgba(217,70,239,0.3)]",
    badgeBg: "bg-fuchsia-950/40 border-fuchsia-500/35 text-fuchsia-400 font-mono"
  },
  LEGENDARY: {
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    border: "border-amber-500/25",
    glow: "hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.35)]",
    badgeBg: "bg-amber-950/40 border-amber-500/35 text-amber-400 font-mono"
  }
};

const CATEGORY_NAMES = {
  COSMETIC: "Cosmético",
  BADGE: "Emblema",
  BOOST: "Amplificador",
  PROTECTION: "Blindagem"
};

export default function Shop() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const [tab, setTab] = useState<'SHOP' | 'INVENTORY'>('SHOP');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [timeText, setTimeText] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // Clear toast on user interaction or timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Update boost timer live
  useEffect(() => {
    const updateTimer = () => {
      if (!profile?.poMultiplierUntil) {
        setTimeText(null);
        return;
      }
      const end = new Date(profile.poMultiplierUntil).getTime();
      const diff = end - Date.now();
      if (diff <= 0) {
        setTimeText(null);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeText(`${hours}h ${mins}m ${secs}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [profile?.poMultiplierUntil]);

  const buyItem = async (item: ShopItem) => {
    if (!user) {
      showToast("Você precisa estar logado para fazer compras!", "error");
      return;
    }
    
    if ((profile?.availablePoints ?? 0) < item.price) {
      showToast("Saldo de Otaku Points (PO) insuficiente!", "error");
      return;
    }
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const { icon, ...itemToStore } = item;
      
      await updateDoc(userRef, {
        availablePoints: increment(-item.price),
        inventory: arrayUnion({ ...itemToStore, purchasedAt: new Date().toISOString(), instanceId: Date.now().toString() })
      });
      showToast(`Você adquiriu "${item.name}" com sucesso! 🎉`, "success");
    } catch (e) {
      console.error("Compra falhou", e);
      showToast("Hubo um erro processando a compra.", "error");
    }
  };

  const useOrEquipItem = async (item: any) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      
      if (item.category === 'BADGE') {
        const currentBadges = profile.badges || [];
        if (currentBadges.some((b: any) => b.id === item.id)) {
            // Unequip
            await updateDoc(userRef, {
                badges: currentBadges.filter((b: any) => b.id !== item.id)
            });
            showToast(`Emblema "${item.name}" removido do perfil.`, "info");
        } else {
            // Equip (max 3 badges)
            const newBadges = [...currentBadges, item].slice(-3);
            await updateDoc(userRef, {
                badges: newBadges
            });
            showToast(`Emblema "${item.name}" destacado no seu perfil! 💫`, "success");
        }
      } else if (item.category === 'COSMETIC') {
         const bannerUrls: Record<string, string> = {
            'premium_banner_pack': 'https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&q=80&w=1200',
            'banner_vintage_future': 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=1200',
         };
         
         const newBanner = bannerUrls[item.id] || 'https://images.unsplash.com/photo-1578632738908-48b4850ee98d?auto=format&fit=crop&q=80&w=1200';
         
         if (profile.bannerURL === newBanner) {
            await updateDoc(userRef, { bannerURL: 'https://images.unsplash.com/photo-1578632738908-48b4850ee98d?auto=format&fit=crop&q=80&w=1200' });
            showToast("Banner restaurado para o padrão.", "info");
         } else {
            await updateDoc(userRef, { bannerURL: newBanner });
            showToast("Incrível! Novo banner cósmico equipado.", "success");
         }
      } else if (item.category === 'BOOST') {
          let currentEnd = Date.now();
          if (profile.poMultiplierUntil) {
             const existEnd = new Date(profile.poMultiplierUntil).getTime();
             if (existEnd > currentEnd) currentEnd = existEnd;
          }
          
          const multiplierEnd = new Date(currentEnd + 24 * 60 * 60 * 1000).toISOString();
          const newInventory = (profile.inventory || []).filter((i: any) => i.instanceId !== item.instanceId);
          await updateDoc(userRef, {
              poMultiplierUntil: multiplierEnd,
              inventory: newInventory
          });
          showToast(`Boost de PO x2 ATIVADO! Ganhos adicionais ativados por 24h! ⚡`, "success");
      } else if (item.category === 'PROTECTION') {
          const newInventory = (profile.inventory || []).filter((i: any) => i.instanceId !== item.instanceId);
          await updateDoc(userRef, {
              streakProtections: increment(1),
              inventory: newInventory
          });
          showToast(`Blindagem Ativada! Adicionada +1 Pena da Imortalidade ao seu escudo protecional. 🪶`, "success");
      }
    } catch (e) {
      console.error("Erro ao equipar/usar", e);
      showToast("Ocorreu um erro ao interagir com o item.", "error");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-6xl mx-auto space-y-8 px-5 py-6 md:py-8 bg-[#07090e] border border-zinc-800 rounded-3xl relative overflow-hidden text-gray-300 font-sans shadow-2xl shadow-black/90"
    >
      {/* Neo-Tokyo Holographic grid design pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(14,20,35,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(14,20,35,0.45)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
      <div className="absolute inset-0 bg-radial-at-t from-cyan-950/20 via-transparent to-transparent pointer-events-none" />

      {/* Dynamic Toast Feedback Overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -45, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-md max-w-sm font-semibold text-xs tracking-wider text-center font-mono",
              toast.type === 'success' 
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                : toast.type === 'error'
                ? "bg-red-950/90 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.35)]"
                : "bg-cyan-950/90 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.35)]"
            )}
          >
            {toast.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <Info className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cyber Panel with Stats & Balance */}
      <div className="bg-[#0b0f19]/80 border border-zinc-800/80 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
        <div className="space-y-3 z-10">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4.5 h-4.5 text-cyan-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-md border border-cyan-500/30 font-mono">
              [ AVALON_MARKET_v4.7 ]
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight italic font-mono flex items-center gap-2">
            Loja & Inventário
          </h1>
          <p className="text-xs md:text-[13px] text-gray-400 font-medium max-w-xl">
            Aprimore seu perfil com insígnias de elite, mude sua aparência com skins panorâmicas de Neo-Tokyo ou compre proteção vital para o seu streak de atividades diárias.
          </p>
        </div>

        {/* PO Score Badge */}
        <div className="flex flex-wrap md:flex-nowrap gap-4 items-stretch w-full md:w-auto relative z-10 shrink-0">
          <div className="flex-1 md:flex-initial bg-[#0e1322] px-6 py-4 rounded-xl border border-zinc-800 flex items-center justify-between md:justify-start gap-4 shadow-md shadow-black/50">
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Coins className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 font-mono">Saldo Disponível</p>
              <p className="text-xl font-black text-white italic font-mono">
                {profile?.availablePoints ?? 0} <span className="text-amber-400 text-sm tracking-tight font-sans">PO</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cyber Status Indicators (Active Boosts / Protections) */}
      {(timeText || (profile?.streakProtections ?? 0) > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {timeText && (
            <div className="bg-gradient-to-r from-amber-500/5 to-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/15 text-amber-400 rounded-lg border border-amber-500/20">
                  <Zap className="w-4.5 h-4.5 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wide font-mono">Multiplicador PO x2 Ativo</h4>
                  <p className="text-[10px] text-gray-400">Suas recompensas de leitura estão dobradas no Avalon!</p>
                </div>
              </div>
              <div className="bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-black text-amber-400 font-mono shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                {timeText}
              </div>
            </div>
          )}

          {profile?.streakProtections && profile.streakProtections > 0 ? (
            <div className="bg-gradient-to-r from-cyan-500/5 to-blue-500/10 border border-cyan-500/30 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/15 text-cyan-400 rounded-lg border border-cyan-500/20">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wide font-mono">Streak Blindado</h4>
                  <p className="text-[10px] text-gray-400">Penas de Imortalidade prontas para precaver furos de leitura.</p>
                </div>
              </div>
              <div className="bg-cyan-950/60 border border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs font-black text-cyan-400 flex items-center gap-1.5 font-mono shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>{profile.streakProtections} {profile.streakProtections === 1 ? 'PENA' : 'PENAS'}</span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Cyberpunk Navigation Tabs */}
      <div className="flex border-b border-zinc-800 gap-6 pb-px relative z-10">
        <button 
          onClick={() => setTab('SHOP')} 
          className={cn(
            "pb-3 text-xs md:text-sm font-black uppercase tracking-widest relative transition-colors duration-200 font-mono", 
            tab === 'SHOP' ? "text-cyan-400" : "text-gray-500 hover:text-gray-300"
          )}
        >
          {tab === 'SHOP' && (
            <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
          )}
          ⚡ LOJA DE ITENS
        </button>
        <button 
          onClick={() => setTab('INVENTORY')} 
          className={cn(
            "pb-3 text-xs md:text-sm font-black uppercase tracking-widest relative transition-colors duration-200 font-mono", 
            tab === 'INVENTORY' ? "text-cyan-400" : "text-gray-500 hover:text-gray-300"
          )}
        >
          {tab === 'INVENTORY' && (
            <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
          )}
          🎒 SEU INVENTÁRIO
        </button>
      </div>

      {/* Main Tab Render */}
      {tab === 'SHOP' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 relative z-10">
          {SHOP_ITEMS.map((item) => {
            const style = RARITY_STYLING[item.rarity];
            const pointsBalance = profile?.availablePoints ?? 0;
            const canAfford = pointsBalance >= item.price;
            
            return (
              <div 
                key={item.id} 
                className={cn(
                  "bg-[#0b0e14] border border-zinc-800 rounded-2xl p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group shadow-lg shadow-black/80 hover:scale-[1.02]", 
                  style.glow
                )}
              >
                {/* Visual Grid Scanline overlay on hover */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(244,244,244,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Rarity & Category Header Tags */}
                <div className="flex items-center justify-between mb-5 z-10">
                  <span className="text-[8px] font-black uppercase tracking-widest text-cyan-400 px-2 py-0.5 bg-cyan-950/40 rounded border border-cyan-500/20 font-mono">
                    {CATEGORY_NAMES[item.category]}
                  </span>
                  <span className={cn("text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border", style.badgeBg)}>
                    {item.rarity}
                  </span>
                </div>

                {/* Main Icon & Glow Accent */}
                <div className="flex items-center gap-4 mb-4 z-10">
                  <div className={cn("p-3.5 rounded-2xl border bg-gradient-to-b relative shrink-0", style.border, style.bg)}>
                    <div className="absolute inset-0 bg-white/20 rounded-2xl scale-75 opacity-0 group-hover:opacity-100 transition-opacity blur" />
                    <item.icon className={cn("w-6 h-6", style.text)} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm md:text-[15px] text-white tracking-tight group-hover:text-cyan-400 transition-colors font-sans">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 italic mt-0.5 font-mono">
                      // AVALON_STX_CORE
                    </p>
                  </div>
                </div>

                {/* Description Text */}
                <p className="text-xs text-gray-400 font-medium leading-relaxed mb-6 flex-1 min-h-[44px] z-10">
                  {item.description}
                </p>

                {/* Cyberpunk Dotted Divider */}
                <div className="w-full h-[1px] bg-zinc-800/80 mb-5 relative" />

                {/* Price tag & Interactive Buy Button */}
                <div className="flex items-center justify-between gap-3 mt-auto z-10">
                  <div>
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block font-mono">Custo</span>
                    <span className="text-base font-black text-amber-400 italic flex items-center gap-1 font-mono">
                      <Coins className="w-4 h-4 text-amber-400 shrink-0" /> {item.price} <span className="text-[10px] font-bold text-gray-500 uppercase italic font-sans">PO</span>
                    </span>
                  </div>

                  <button 
                    disabled={!canAfford}
                    onClick={() => buyItem(item)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 relative border shadow-sm touch-manipulation group/btn font-mono",
                      canAfford 
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-400 hover:text-[#07090e] hover:shadow-[0_0_12px_rgba(34,211,238,0.4)]" 
                        : "bg-red-500/5 border-red-500/10 text-red-500/40 cursor-not-allowed"
                    )}
                  >
                    {canAfford ? (
                      <>
                        <span>Adquirir</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                      </>
                    ) : (
                      <>
                        <span>Bloqueado</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#0b0f19]/80 rounded-2xl p-6 md:p-8 border border-zinc-800/80 shadow-xl relative z-10">
           <div className="flex items-center justify-between mb-8 pb-3 border-b border-zinc-800">
             <div>
               <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight italic font-mono flex items-center gap-2">
                 🎒 BAÚ DE EQUIPAMENTOS
               </h2>
               <p className="text-xs text-gray-400">Ative multiplicadores, mude o estilo de banner do perfil ou gerencie badges equipadas.</p>
             </div>
             <span className="text-[9px] font-black uppercase tracking-widest text-[#cf7d1c] bg-[#cf7d1c]/10 px-3 py-1 rounded-md border border-[#cf7d1c]/20 font-mono">
               SYS//DECRYPTED
             </span>
           </div>

           {/* Inventory grid render */}
           {profile.inventory?.length ? (
             <div className="space-y-8">
              {Object.entries(profile.inventory.reduce((acc: any, item: any) => {
                (acc[item.category] = acc[item.category] || []).push(item);
                return acc;
              }, {})).map(([category, items]: [string, any]) => (
                <div key={category} className="space-y-4">
                  <h4 className="text-cyan-400 font-black text-xs uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800/60 pb-2 font-mono">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
                    <span>{CATEGORY_NAMES[category]}s</span>
                    <span className="text-[9.5px] font-bold text-gray-500 font-mono">({items.length})</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item: any, i: number) => {
                      const itemDef = SHOP_ITEMS.find(s => s.id === item.id);
                      const IconComponent = itemDef?.icon || Briefcase;
                      const isEquipped = profile.badges?.some((b: any) => b.id === item.id);
                      const rarityStyle = item.rarity ? RARITY_STYLING[item.rarity as keyof typeof RARITY_STYLING] : null;

                      // Calculate states for cosmetics
                      let cosmeticActionText = "Equipar";
                      let isCosmeticActive = false;
                      if (item.category === 'COSMETIC') {
                        // determine if current equipped
                        const bannerUrls: Record<string, string> = {
                          'premium_banner_pack': 'https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&q=80&w=1200',
                          'banner_vintage_future': 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=1200',
                        };
                        const targetUrl = bannerUrls[item.id];
                        isCosmeticActive = profile.bannerURL === targetUrl;
                        cosmeticActionText = isCosmeticActive ? "Restaurar Padrão" : "Equipar";
                      }
                      
                      return (
                        <div 
                          key={item.instanceId || i} 
                          className={cn(
                            "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-[#0e121c] rounded-xl relative overflow-hidden group border border-zinc-800/60 transition-all",
                            (isEquipped || isCosmeticActive) && "border-cyan-500/30 bg-cyan-500/5 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-3 rounded-xl border relative shrink-0", 
                              rarityStyle ? rarityStyle.border : "border-zinc-800",
                              rarityStyle ? rarityStyle.bg : "bg-[#0b0e14]"
                            )}>
                              <IconComponent className={cn("w-5 h-5", rarityStyle ? rarityStyle.text : "text-cyan-400")} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-white text-sm tracking-tight">{item.name}</p>
                                {item.rarity && (
                                  <span className={cn("text-[7.5px] font-black px-1.5 py-0.5 rounded border leading-none", rarityStyle?.badgeBg)}>
                                    {item.rarity}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1">{item.description}</p>
                            </div>
                          </div>
                          
                          {/* Item specific actions */}
                          {item.category === 'BADGE' ? (
                            <button 
                              onClick={() => useOrEquipItem(item)}
                              className={cn(
                                "w-full sm:w-auto px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border font-mono",
                                isEquipped 
                                  ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:shadow-[0_0_10px_rgba(239,68,68,0.3)]" 
                                  : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-400 hover:text-[#07090e] hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                              )}
                            >
                              {isEquipped ? "Desequipar" : "Equipar"}
                            </button>
                          ) : (
                            <button 
                              onClick={() => useOrEquipItem(item)}
                              className={cn(
                                "w-full sm:w-auto px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border font-mono",
                                item.category === 'COSMETIC'
                                  ? (isCosmeticActive 
                                      ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white" 
                                      : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-400 hover:text-[#07090e] hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]")
                                  : "bg-emerald-500/10 border-emerald-500/35 text-emerald-400 hover:bg-emerald-400 hover:text-[#07090e] hover:shadow-[0_0_10px_rgba(16,185,129,0.35)]"
                              )}
                            >
                              {item.category === 'COSMETIC' ? cosmeticActionText : "Deflagrar Ampliador"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
             </div>
           ) : (
             <div className="py-16 flex flex-col items-center justify-center text-gray-500 gap-4 border border-dashed border-zinc-800 rounded-2xl">
               <div className="p-4 bg-[#0a0d14] border border-zinc-800 rounded-full text-zinc-600">
                 <Trophy className="w-8 h-8 opacity-40 animate-pulse" />
               </div>
               <div className="text-center space-y-1">
                 <p className="text-xs font-black uppercase tracking-widest text-white font-mono">Baú de Equipamentos Vazio</p>
                 <p className="text-[10px] text-gray-400 max-w-sm font-sans leading-relaxed">Você ainda não possui nenhum artefato ou modificador adquirido para ativação mística. Compre-os na aba de ofertas!</p>
               </div>
               <button 
                 onClick={() => setTab('SHOP')}
                 className="mt-2 px-5 py-2.5 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-400 hover:text-[#07090e] text-cyan-400 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md shadow-cyan-500/5 font-mono"
               >
                 Abrir Mercado de Ofertas
               </button>
             </div>
           )}
        </div>
      )}
    </motion.div>
  );
}
