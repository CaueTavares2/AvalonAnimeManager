import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  QrCode, 
  UserPlus, 
  Check, 
  X, 
  Activity, 
  Flame,
  MessageSquare,
  TrendingUp,
  Award,
  ShieldCheck
} from 'lucide-react';
import { useSocial, Friend } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Social() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { friends, requests, sentRequests, sendRequest, acceptRequest, rejectRequest, cancelRequest, removeFriend, setActiveChatFriendId } = useSocial();
  const navigate = useNavigate();
  
  const [searchId, setSearchId] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState<'FRIENDS' | 'FEED' | 'REQUESTS'>('FRIENDS');
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Listen to activity feed
    const q = query(collection(db, 'activityFeed'), orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snapshot) => {
      setActivityFeed(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await sendRequest(searchId.startsWith('#') ? searchId : `#${searchId}`);
      setSuccess("Pedido enviado com sucesso!");
      setSearchId('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOpenChat = (friendId: string) => {
    setActiveChatFriendId(friendId);
    navigate(`/chat?friend=${friendId}`);
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[var(--color-border)] pb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">Social Hub</h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-[0.2em]">Conecte-se com outros Otakus</p>
        </div>

        <div className="flex bg-[var(--color-card)] p-1 rounded-xl border border-[var(--color-border)]">
          {(['FRIENDS', 'FEED', 'REQUESTS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all relative",
                activeTab === tab ? "bg-brand text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
              )}
            >
              {tab === 'FRIENDS' ? 'Amigos' : tab === 'FEED' ? 'Atividade' : 'Pedidos'}
              {tab === 'REQUESTS' && requests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand text-[7px] font-black flex items-center justify-center rounded-full border-2 border-[var(--color-bg)]">
                  {requests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Search & Profile */}
        <div className="space-y-8">
          <div className="bg-[var(--color-card)] p-6 rounded-3xl border border-[var(--color-border)] shadow-xl space-y-6">
            <h3 className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-widest flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-brand" /> Adicionar Amigo
            </h3>
            
            <form onSubmit={handleAddFriend} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input 
                  type="text"
                  placeholder="ID Ex: #1 ou #Otaku1234"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="w-full bg-[var(--color-bg)] h-10 pl-10 pr-4 rounded-xl border border-[var(--color-border)] text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-brand shadow-inner"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-brand text-white h-10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-brand/20"
              >
                Enviar Pedido
              </button>
              {error && <p className="text-[9px] text-red-500 font-bold uppercase text-center">{error}</p>}
              {success && <p className="text-[9px] text-emerald-500 font-bold uppercase text-center">{success}</p>}
            </form>

            <div className="pt-4 border-t border-[var(--color-border)]">
              <button 
                onClick={() => setShowQR(!showQR)}
                className="w-full flex items-center justify-center gap-2 text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-[var(--color-text-bright)] transition-colors"
              >
                <QrCode className="w-4 h-4" /> 
                {showQR ? "Ocultar meu QR Code" : "Mostrar meu QR Code"}
              </button>
              
              {showQR && (
                <div className="mt-6 flex flex-col items-center space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="p-3 bg-white rounded-2xl shadow-2xl">
                    <QRCode value={profile.numericId?.toString() || profile.customId || "AVALON"} size={120} />
                  </div>
                  <p className="text-[10px] font-black text-[var(--color-text-bright)] tracking-widest uppercase">
                    SEU ID: <span className="text-brand">#{profile.numericId || '??'}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'FRIENDS' && (
            <div className="space-y-6">
              {friends.length === 0 ? (
                <div className="bg-[var(--color-card)] p-20 rounded-3xl border border-[var(--color-border)] text-center space-y-4">
                  <Users className="w-12 h-12 text-gray-700 mx-auto opacity-20" />
                  <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Sua lista de amigos está vazia.</p>
                  <p className="text-gray-600 text-[10px] italic">"O real tesouro são os nakamas que fazemos no caminho."</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friends.map(friend => (
                    <div key={friend.uid} className="bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)] flex items-center justify-between group hover:border-brand/30 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="relative">
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-[var(--color-border)]">
                              <img src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} className="w-full h-full object-cover" />
                            </div>
                            <div className={cn(
                              "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-card)] shadow-sm",
                              friend.status === 'ONLINE' ? "bg-emerald-500" : friend.status === 'MARATONANDO' ? "bg-brand animate-pulse" : "bg-gray-500"
                            )} />
                         </div>
                         <div>
                            <Link to={`/profile/${friend.uid}`} className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-tight italic hover:text-brand transition-colors flex items-center gap-1.5">
                              {friend.username} 
                              {['caue.nanda.tavares@gmail.com'].includes((friend as any).email) && (
                                <ShieldCheck className="w-3 h-3 text-brand fill-brand/20" />
                              )}
                              <span className="text-brand not-italic ml-1 opacity-60">#{friend.numericId || '??'}</span>
                            </Link>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                              {friend.status === 'MARATONANDO' ? `Maratonando ${friend.currentActivity}` : friend.status.toLowerCase()}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[8px] font-black px-1.5 py-0.5 bg-brand/10 text-brand rounded uppercase">{friend.rank}</span>
                              <span className="text-[8px] font-black text-gray-500 italic">{friend.otakuPoints} PO</span>
                            </div>
                            {(friend as any).lastMessage && (
                              <p className="text-[9px] text-gray-400 mt-1 line-clamp-1 italic max-w-[150px]">
                                {(friend as any).lastMessage}
                              </p>
                            )}
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenChat(friend.uid)}
                          className="p-2 bg-[var(--color-bg)] rounded-xl text-gray-500 hover:text-brand hover:bg-brand/5 transition-all relative"
                          title="Chat"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {(friend as any).hasUnread && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand rounded-full border-2 border-[var(--color-card)]" />
                          )}
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Remover ${friend.username} da lista de amigos?`)) {
                              removeFriend(friend.uid);
                            }
                          }}
                          className="p-2 bg-[var(--color-bg)] rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/5 transition-all"
                          title="Remover Amigo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'FEED' && (
            <div className="space-y-4">
              {activityFeed.map(event => (
                <div key={event.id} className="bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-border)] flex items-start gap-4">
                  <div className="p-2 bg-brand/10 rounded-xl">
                    {event.type === 'ACHIEVEMENT_UNLOCKED' ? <Award className="w-5 h-5 text-brand" /> : <Flame className="w-5 h-5 text-brand" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[var(--color-text-bright)]">
                       <Link to={`/profile/${event.userId || event.from}`} className="text-brand hover:underline">@{event.username || 'Usuário'}</Link>
                       {event.type === 'COMPLETED' ? ' concluiu ' : event.type === 'PROGRESS' ? ' atualizou o progresso de ' : ' desbloqueou a conquista '}
                       <span className="text-brand italic uppercase tracking-tighter">
                         {event.mediaTitle || event.achievementTitle}
                       </span>
                    </p>
                    <p className="text-[8px] font-bold text-gray-500 uppercase">{new Date(event.createdAt?.toDate()).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'REQUESTS' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Recebidos ({requests.length})
                </h3>
              {requests.length === 0 ? (
                <p className="text-center py-10 bg-[var(--color-bg)] rounded-2xl text-gray-500 text-[10px] font-bold uppercase tracking-widest border border-dashed border-[var(--color-border)]">Nenhum pedido pendente.</p>
              ) : (
                requests.map(req => (
                  <div key={req.id} className="bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)] flex items-center justify-between">
                    <Link to={`/profile/${req.from}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
                         <UserPlus className="w-5 h-5 text-brand" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[var(--color-text-bright)] uppercase tracking-widest">{req.fromUsername}</p>
                        <p className="text-[8px] text-gray-500 font-bold uppercase">Enviou um convite (Clique para ver perfil)</p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => acceptRequest(req.id)}
                        className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-lg"
                        title="Aceitar"
                       >
                         <Check className="w-4 h-4" />
                       </button>
                       <button 
                        onClick={() => rejectRequest(req.id)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                        title="Recusar"
                       >
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                ))
              )}
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Enviados ({sentRequests.length})
                </h3>
                {sentRequests.length === 0 ? (
                  <p className="text-center py-10 bg-[var(--color-bg)] rounded-2xl text-gray-500 text-[10px] font-bold uppercase tracking-widest border border-dashed border-[var(--color-border)]">Você não enviou convites recentemente.</p>
                ) : (
                  sentRequests.map(req => (
                    <div key={req.id} className="bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)] flex items-center justify-between opacity-80">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-500/10 rounded-lg flex items-center justify-center">
                           <Activity className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Aguardando Resposta...</p>
                          <p className="text-[8px] text-gray-400 font-bold uppercase">Pedido enviado</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => cancelRequest(req.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Cancelar Pedido"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
