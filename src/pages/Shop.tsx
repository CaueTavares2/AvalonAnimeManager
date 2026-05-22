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
    bg: "bg-emerald-500/5",
    text: "text-emerald-400",
    border: "border-emerald-500/10",
    glow: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    badgeBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
  },
  RARE: {
    bg: "bg-blue-500/5",
    text: "text-blue-400",
    border: "border-blue-500/10",
    glow: "group-hover:shadow-[0_0_20px_rgba(59,130,246,0.18)]",
    badgeBg: "bg-blue-500/10 border-blue-500/20 text-blue-400"
  },
  EPIC: {
    bg: "bg-purple-500/5",
    text: "text-purple-400",
    border: "border-purple-500/10",
    glow: "group-hover:shadow-[0_0_20px_rgba(168,85,247,0.22)]",
    badgeBg: "bg-purple-500/10 border-purple-500/20 text-purple-400"
  },
  LEGENDARY: {
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    border: "border-amber-500/10",
    glow: "group-hover:shadow-[0_0_25px_rgba(245,158,11,0.28)]",
    badgeBg: "bg-amber-500/10 border-amber-500/20 text-amber-405 text-amber-400"
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
      className="max-w-6xl mx-auto space-y-8 px-4 md:px-0"
    >
      {/* Dynamic Toast Feedback Overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -45, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-md max-w-sm font-semibold text-xs uppercase tracking-wider text-center",
              toast.type === 'success' 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : toast.type === 'error'
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-blue-500/10 border-blue-500/30 text-blue-400"
            )}
          >
            {toast.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <Info className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel with Stats & Balance */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand/5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand">
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand bg-brand/15 px-3 py-1 rounded-full border border-brand/20">
              Mercado do Avalon Sagas
            </span>
          </div>
          <h1 className="text-2xl md:text-3.5xl font-black text-[var(--color-text-bright)] uppercase tracking-tight italic">
            Loja & Inventário
          </h1>
          <p className="text-xs md:text-sm text-gray-500 font-medium max-w-xl">
            Aprimore seu perfil com insígnias exclusivas, mude sua aparência ou compre proteção essencial para o seu streak de leitor.
          </p>
        </div>

        {/* PO Score Badge */}
        <div className="flex flex-wrap md:flex-nowrap gap-4 items-stretch w-full md:w-auto relative z-10">
          <div className="flex-1 md:flex-initial bg-[var(--color-bg)]/80 backdrop-blur-md px-6 py-4 rounded-xl border border-[var(--color-border)] flex items-center justify-between md:justify-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Coins className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">Seu Saldo</p>
              <p className="text-xl font-black text-[var(--color-text-bright)] italic">
                {profile?.availablePoints ?? 0} <span className="text-brand text-sm tracking-tight">PO</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Indicators (Active Boosts / Protections) */}
      {(timeText || (profile?.streakProtections ?? 0) > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {timeText && (
            <div className="bg-gradient-to-r from-amber-500/10 to-brand/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                  <Zap className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-wide">Multiplicador x2 Ativo</h4>
                  <p className="text-[10px] text-gray-400">Você está recebendo o dobro de recompensas em PO do sistema!</p>
                </div>
              </div>
              <div className="bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-black text-amber-400 font-mono">
                {timeText}
              </div>
            </div>
          )}

          {profile?.streakProtections && profile.streakProtections > 0 ? (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-wide">Streak Blindado</h4>
                  <p className="text-[10px] text-gray-400">A Pena da Imortalidade previne quebras repentinas de atividade.</p>
                </div>
              </div>
              <div className="bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-black text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>{profile.streakProtections} {profile.streakProtections === 1 ? 'PENA' : 'PENAS'}</span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[var(--color-border)] gap-6 pb-px">
        <button 
          onClick={() => setTab('SHOP')} 
          className={cn(
            "pb-3 text-xs md:text-sm font-black uppercase tracking-wider relative transition-colors duration-200", 
            tab === 'SHOP' ? "text-brand" : "text-gray-500 hover:text-gray-200"
          )}
        >
          {tab === 'SHOP' && (
            <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
          )}
          Loja de Itens
        </button>
        <button 
          onClick={() => setTab('INVENTORY')} 
          className={cn(
            "pb-3 text-xs md:text-sm font-black uppercase tracking-wider relative transition-colors duration-200", 
            tab === 'INVENTORY' ? "text-brand" : "text-gray-500 hover:text-gray-200"
          )}
        >
          {tab === 'INVENTORY' && (
            <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
          )}
          Seu Inventário
        </button>
      </div>

      {/* Main Tab Render */}
      {tab === 'SHOP' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {SHOP_ITEMS.map((item) => {
            const style = RARITY_STYLING[item.rarity];
            const pointsBalance = profile?.availablePoints ?? 0;
            const canAfford = pointsBalance >= item.price;
            
            return (
              <div 
                key={item.id} 
                className={cn(
                  "bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group", 
                  style.glow
                )}
              >
                {/* Rarity & Category Header Tags */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 px-2 py-1 bg-[var(--color-bg)] rounded-md">
                    {CATEGORY_NAMES[item.category]}
                  </span>
                  <span className={cn("text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border", style.badgeBg)}>
                    {item.rarity}
                  </span>
                </div>

                {/* Main Icon & Glow Accent */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn("p-3.5 rounded-2xl border bg-gradient-to-b relative", style.border, style.bg)}>
                    <div className="absolute inset-0 bg-white/20 rounded-2xl scale-75 opacity-0 group-hover:opacity-100 transition-opacity blur" />
                    <item.icon className={cn("w-6 h-6", style.text)} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm md:text-base text-[var(--color-text-bright)] tracking-tight">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 italic mt-0.5">
                      Avalon Premium Co.
                    </p>
                  </div>
                </div>

                {/* Description Text */}
                <p className="text-xs text-gray-400 font-medium leading-relaxed mb-6 flex-1 min-h-[40px]">
                  {item.description}
                </p>

                {/* Horizontal Divider */}
                <div className="h-px bg-[var(--color-border)] w-full mb-5" />

                {/* Price tag & Interactive Buy Button */}
                <div className="flex items-center justify-between gap-3 mt-auto">
                  <div>
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Preço</span>
                    <span className="text-base font-black text-amber-500 italic flex items-center gap-1">
                      <Coins className="w-4 h-4" /> {item.price} <span className="text-[10.5px] font-bold text-gray-500 uppercase italic">PO</span>
                    </span>
                  </div>

                  <button 
                    disabled={!canAfford}
                    onClick={() => buyItem(item)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 relative border shadow-sm touch-manipulation group/btn",
                      canAfford 
                        ? "bg-brand/20 border-brand/30 text-brand hover:bg-brand hover:text-white" 
                        : "bg-red-500/10 border-red-500/10 text-red-500/60 cursor-not-allowed"
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
        <div className="bg-[var(--color-card)] rounded-2xl p-6 md:p-8 border border-[var(--color-border)] shadow-xl">
           <div className="flex items-center justify-between mb-8">
             <div>
               <h2 className="text-lg md:text-xl font-black text-[var(--color-text-bright)] uppercase tracking-tight italic">
                 Seus Itens Comprados
               </h2>
               <p className="text-xs text-gray-500">Ative multiplicadores, mude o estilo do perfil ou prepare blindagens adquiridas.</p>
             </div>
             <span className="text-[9px] font-black uppercase tracking-widest text-[#cf7d1c] bg-[#cf7d1c]/10 px-3 py-1 rounded-full border border-[#cf7d1c]/20">
               Ego Chest
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
                  <h4 className="text-brand font-black text-xs uppercase tracking-widest flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
                    <span className="w-1.5 h-1.5 bg-brand rounded-full animate-ping" />
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
                            "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-[var(--color-bg)]/60 rounded-xl relative overflow-hidden group border border-[var(--color-border)]/80 hover:border-[var(--color-border)]/10 transition-all",
                            (isEquipped || isCosmeticActive) && "border-brand/40 bg-brand/5"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-3 rounded-xl border", 
                              rarityStyle ? rarityStyle.border : "border-[var(--color-border)]",
                              rarityStyle ? rarityStyle.bg : "bg-[var(--color-card)]"
                            )}>
                              <IconComponent className={cn("w-5 h-5", rarityStyle ? rarityStyle.text : "text-brand")} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-[var(--color-text-bright)] text-sm">{item.name}</p>
                                {item.rarity && (
                                  <span className={cn("text-[7.5px] font-black px-1.5 py-0.5 rounded uppercase border", rarityStyle?.badgeBg)}>
                                    {item.rarity}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-500 mt-0.5">{item.description}</p>
                            </div>
                          </div>
                          
                          {/* Item specific actions */}
                          {item.category === 'BADGE' ? (
                            <button 
                              onClick={() => useOrEquipItem(item)}
                              className={cn(
                                "w-full sm:w-auto px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border",
                                isEquipped 
                                  ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white" 
                                  : "bg-brand/20 border-brand/20 text-brand hover:bg-brand hover:text-white"
                              )}
                            >
                              {isEquipped ? "Desequipar" : "Equipar"}
                            </button>
                          ) : (
                            <button 
                              onClick={() => useOrEquipItem(item)}
                              className={cn(
                                "w-full sm:w-auto px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border",
                                item.category === 'COSMETIC'
                                  ? (isCosmeticActive 
                                      ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white" 
                                      : "bg-brand/20 border-brand/20 text-brand hover:bg-brand tracking-widest hover:text-white")
                                  : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                              )}
                            >
                              {item.category === 'COSMETIC' ? cosmeticActionText : "Consumir / Usar"}
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
             <div className="py-16 flex flex-col items-center justify-center text-gray-500 gap-4 border border-dashed border-[var(--color-border)] rounded-2xl">
               <div className="p-4 bg-[var(--color-bg)] rounded-full text-zinc-500">
                 <Trophy className="w-8 h-8 opacity-40 animate-pulse" />
               </div>
               <div className="text-center space-y-1">
                 <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-bright)]">Baú de Equipamentos Vazio</p>
                 <p className="text-[10px] text-gray-600 max-w-sm">Você ainda não adquiriu nenhum item de status lendário. Visite a nossa aba de ofertas!</p>
               </div>
               <button 
                 onClick={() => setTab('SHOP')}
                 className="mt-2 px-5 py-2.5 bg-brand/10 border border-brand/30 hover:bg-brand text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md shadow-brand/10"
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
