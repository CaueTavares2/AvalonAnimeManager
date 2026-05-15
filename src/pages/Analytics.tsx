import React, { useMemo } from 'react';
import { useAnimeList } from '../hooks/useAnimeList';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Clock, Star, Play, Library, BookOpen } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

import { cn } from '../lib/utils';

export default function Analytics() {
  const { list } = useAnimeList();
  const { t } = useLanguage();
  const [mediaType, setMediaType] = React.useState<'ALL' | 'ANIME' | 'MANGA'>('ALL');

  const stats = useMemo(() => {
    const filteredList = mediaType === 'ALL' ? list : list.filter(a => a.type === mediaType);
    const total = filteredList.length;
    const animeCount = filteredList.filter(a => a.type === 'ANIME').length;
    const mangaCount = filteredList.filter(a => a.type === 'MANGA').length;
    
    // Genre count
    const genres: Record<string, number> = {};
    filteredList.forEach(item => {
      item.genres?.forEach(g => {
        genres[g] = (genres[g] || 0) + 1;
      });
    });
    
    const topGenres = Object.entries(genres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    // Status distribution
    const statusData = [
      { name: 'Watching/Reading', value: filteredList.filter(a => a.status === 'WATCHING' || a.status === 'READING').length, color: '#f59e0b' },
      { name: 'Completed', value: filteredList.filter(a => a.status === 'COMPLETED').length, color: '#10b981' },
      { name: 'Planning', value: filteredList.filter(a => a.status === 'PLANNING').length, color: '#3b82f6' },
      { name: 'Dropped', value: filteredList.filter(a => a.status === 'DROPPED').length, color: '#ef4444' },
    ].filter(s => s.value > 0);

    // Score calculation (excluding unrated)
    const ratedItems = filteredList.filter(a => (a.score || 0) > 0);
    const averageScore = ratedItems.length > 0 
      ? (ratedItems.reduce((acc, curr) => acc + (curr.score || 0), 0) / ratedItems.length).toFixed(1)
      : 'N/A';

    return { total, animeCount, mangaCount, topGenres, statusData, averageScore };
  }, [list, mediaType]);

  const cards = [
    { label: 'Total Media', value: stats.total, icon: Library, color: 'text-brand' },
    { label: 'Animes', value: stats.animeCount, icon: Play, color: 'text-blue-500' },
    { label: 'Mangás', value: stats.mangaCount, icon: BookOpen, color: 'text-emerald-500' },
    { label: 'Score Médio', value: stats.averageScore, icon: Star, color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[var(--color-border)] pb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">Analytics 2026</h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-[0.2em]">Sua jornada traduzida em dados</p>
        </div>

        <div className="flex bg-[var(--color-card)] p-1 rounded-xl border border-[var(--color-border)]">
          {(['ALL', 'ANIME', 'MANGA'] as const).map(type => (
            <button
              key={type}
              onClick={() => setMediaType(type)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                mediaType === type ? "bg-brand text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
              )}
            >
              {type === 'ALL' ? 'Geral' : type === 'ANIME' ? 'Animes' : 'Mangás'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-[var(--color-card)] p-8 rounded-3xl border border-[var(--color-border)] shadow-xl group hover:border-brand/30 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{card.label}</p>
                <p className="text-3xl font-black text-[var(--color-text-bright)]">{card.value}</p>
              </div>
              <div className={cn("p-3 bg-[var(--color-bg)] rounded-2xl", card.color)}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distrib */}
        <div className="bg-[var(--color-card)] p-8 rounded-3xl border border-[var(--color-border)] shadow-xl">
          <h3 className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-widest mb-8 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand" /> Distribuição de Status
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {stats.statusData.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Genres */}
        <div className="bg-[var(--color-card)] p-8 rounded-3xl border border-[var(--color-border)] shadow-xl">
          <h3 className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-widest mb-8 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand" /> Top Gêneros
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topGenres} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#888', textTransform: 'uppercase' }}
                  width={100}
                />
                <Tooltip 
                   cursor={{ fill: 'transparent' }}
                   contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px' }}
                />
                <Bar dataKey="value" fill="var(--color-brand)" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
