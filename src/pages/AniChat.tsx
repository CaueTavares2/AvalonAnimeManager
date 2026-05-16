import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Smile, 
  Image as ImageIcon, 
  AlertTriangle, 
  ChevronLeft,
  X,
  Share2,
  Lock,
  MessageSquare,
  User
} from 'lucide-react';
import { useAuth, handleFirestoreError, OperationType } from '../context/AuthContext';
import { useSocial, Friend } from '../context/SocialContext';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  where,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';

const STICKERS = [
  "😮", "😡", "😭", "😂", "✨", "🔥", "🌸", "🍥"
];

interface Message {
  id: string;
  senderId: string;
  text: string;
  type: 'TEXT' | 'MEDIA' | 'STICKER';
  isSpoiler: boolean;
  sticker?: string;
  createdAt: any;
}

export default function AniChat() {
  const { user } = useAuth();
  const { friends, activeChatFriendId, setActiveChatFriendId } = useSocial();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeFriendId = activeChatFriendId || searchParams.get('friend');
  
  useEffect(() => {
    // If we loaded from URL directly, set it in context
    if (searchParams.get('friend') && !activeChatFriendId) {
       setActiveChatFriendId(searchParams.get('friend'));
    }
  }, [searchParams, activeChatFriendId, setActiveChatFriendId]);
  
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeFriend = friends.find(f => f.uid === activeFriendId);

  useEffect(() => {
    if (!user || !activeFriendId) return;

    // Find or create chat document ID (consistently sorted)
    const chatId = [user.uid, activeFriendId].sort().join('_');
    setActiveChatId(chatId);

    // Update last read status for current user
    const updateReadStatus = async () => {
      try {
        await setDoc(doc(db, 'chats', chatId), {
          lastRead: {
            [user.uid]: serverTimestamp()
          }
        }, { merge: true });
      } catch (err) {
        console.error("Error updating read status:", err);
      }
    };
    updateReadStatus();

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
    });

    return () => unsub();
  }, [user, activeFriendId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if ((!inputText.trim()) || !activeChatId || !user) return;

    try {
      const messageText = isSpoiler ? "SPOILER DETECTADO" : inputText;
      
      await Promise.all([
        addDoc(collection(db, 'chats', activeChatId, 'messages'), {
          senderId: user.uid,
          text: inputText,
          type: 'TEXT',
          isSpoiler,
          createdAt: serverTimestamp()
        }),
        setDoc(doc(db, 'chats', activeChatId), {
          lastMessage: messageText,
          lastMessageAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastRead: {
            [user.uid]: serverTimestamp()
          }
        }, { merge: true })
      ]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${activeChatId}/messages`);
    }

    setInputText('');
    setIsSpoiler(false);
  };

  const sendSticker = async (sticker: string) => {
    if (!activeChatId || !user) return;
    try {
      await Promise.all([
        addDoc(collection(db, 'chats', activeChatId, 'messages'), {
          senderId: user.uid,
          text: '',
          type: 'STICKER',
          sticker,
          isSpoiler: false,
          createdAt: serverTimestamp()
        }),
        setDoc(doc(db, 'chats', activeChatId), {
          lastMessage: "Enviou um sticker",
          lastMessageAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastRead: {
            [user.uid]: serverTimestamp()
          }
        }, { merge: true })
      ]);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chats/${activeChatId}/messages`);
    }
    setShowStickers(false);
  };

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <div className="p-8 bg-[var(--color-card)] border-2 border-dashed border-[var(--color-border)] rounded-full animate-pulse">
           <MessageSquare className="w-16 h-16 text-gray-500 opacity-40" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">Nenhum Amigo Encontrado</h2>
          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-2">Visite o Social Hub para adicionar amigos</p>
          <Link to="/social" className="inline-block mt-4 px-6 py-2 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
             Ir para Social Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6">
      {/* Sidebar: Friends List */}
      <div className={cn(
        "bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] shadow-2xl flex-col w-full lg:w-80 flex-shrink-0 animate-in fade-in slide-in-from-left-4 duration-500 overflow-hidden",
        !activeFriendId ? "flex" : "hidden lg:flex"
      )}>
         <div className="p-6 border-b border-[var(--color-border)] space-y-1">
           <h2 className="text-xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">AniChat</h2>
           <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Suas Conversas</p>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
            {friends.map(friend => (
               <button
                 key={friend.uid}
                 onClick={() => {
                   setActiveChatFriendId(friend.uid);
                   navigate(`/chat?friend=${friend.uid}`);
                 }}
                 className={cn(
                   "w-full flex items-center gap-4 p-3 rounded-2xl border transition-all text-left group",
                   activeFriendId === friend.uid 
                     ? "bg-brand/10 border-brand" 
                     : "bg-transparent border-transparent hover:bg-white/5"
                 )}
               >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-[var(--color-border)]">
                      <img src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.uid}`} alt={friend.username} className="w-full h-full object-cover" />
                    </div>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[var(--color-card)]",
                      friend.status === 'ONLINE' ? 'bg-emerald-500' : friend.status === 'MARATONANDO' ? 'bg-brand' : 'bg-gray-500'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-tight truncate flex justify-between">
                       {friend.username}
                       {(friend as any).hasUnread && <span className="w-2 h-2 bg-brand rounded-full mt-1 flex-shrink-0" />}
                    </h3>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate mt-0.5">
                       {friend.status === 'MARATONANDO' ? 'Maratonando' : friend.status.toLowerCase()}
                    </p>
                  </div>
               </button>
            ))}
         </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex-col bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500",
        activeFriendId ? "flex" : "hidden lg:flex"
      )}>
        {!activeFriendId ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="p-8 bg-brand/5 border-2 border-dashed border-brand/20 rounded-full animate-pulse">
               <MessageSquare className="w-16 h-16 text-brand opacity-40" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">Selecione um Amigo</h2>
              <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-2">Inicie uma conversa tematizada</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 bg-white/5 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    setActiveChatFriendId(null);
                    navigate('/chat');
                  }}
                  className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                   <div className="w-10 h-10 rounded-xl overflow-hidden border border-[var(--color-border)]">
                      <img src={activeFriend?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeFriendId}`} alt="Avatar" className="w-full h-full object-cover" />
                   </div>
                   <div className={cn(
                     "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[var(--color-card)]",
                     activeFriend?.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-gray-500'
                   )} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-widest italic truncate max-w-[150px] sm:max-w-xs">{activeFriend?.username}</h3>
                  <p className="text-[9px] font-bold text-brand uppercase tracking-widest">{activeFriend?.status === 'MARATONANDO' ? 'Maratonando' : activeFriend?.status?.toLowerCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <Link 
                   to={`/profile/${activeFriendId}`} 
                   className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg)] hover:bg-brand/10 border border-[var(--color-border)] hover:border-brand/30 rounded-xl text-gray-400 hover:text-brand transition-all text-[10px] font-black uppercase tracking-widest group"
                   title="Ver Perfil"
                 >
                    <User className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Ver Perfil</span>
                 </Link>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide flex flex-col">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    msg.senderId === user?.uid ? "ml-auto items-end" : "items-start"
                  )}
                >
                  {msg.type === 'TEXT' && (
                    <div className={cn(
                      "p-4 rounded-2xl text-[11px] font-medium leading-relaxed relative overflow-hidden group",
                      msg.senderId === user?.uid 
                        ? "bg-brand text-white shadow-lg shadow-brand/10 rounded-tr-none" 
                        : "bg-[var(--color-bg)] text-[var(--color-text-bright)] border border-[var(--color-border)] rounded-tl-none"
                    )}>
                       {msg.isSpoiler ? (
                         <SpoilerMessage text={msg.text} />
                       ) : msg.text}
                    </div>
                  )}
                  {msg.type === 'STICKER' && (
                    <div className="text-4xl animate-bounce duration-1000 mt-2">
                      {msg.sticker}
                    </div>
                  )}
                  <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1 opacity-60">
                    {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer / Input */}
            <div className="p-6 bg-white/5 border-t border-[var(--color-border)] space-y-4">
              {showStickers && (
                <div className="flex flex-wrap gap-2 p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl mb-4 animate-in slide-in-from-bottom-4 duration-300">
                   {STICKERS.map(s => (
                     <button 
                      key={s} 
                      onClick={() => sendSticker(s)}
                      className="text-2xl hover:scale-125 transition-transform p-2"
                     >
                       {s}
                     </button>
                   ))}
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowStickers(!showStickers)}
                    className={cn("p-2 rounded-xl transition-all", showStickers ? "bg-brand text-white" : "text-gray-500 hover:text-brand")}
                  >
                     <Smile className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsSpoiler(!isSpoiler)}
                    className={cn("p-2 rounded-xl transition-all", isSpoiler ? "bg-brand text-white" : "text-gray-500 hover:text-red-500")}
                    title="Marcar como Spoiler"
                  >
                     <AlertTriangle className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 relative">
                  <input 
                    type="text"
                    placeholder="Digite sua mensagem..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="w-full bg-[var(--color-bg)] h-12 pl-4 pr-12 rounded-2xl border border-[var(--color-border)] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand shadow-inner"
                  />
                  <button 
                    onClick={sendMessage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SpoilerMessage({ text }: { text: string }) {
  const [revealed, setRevealed] = useState(false);
  
  if (!revealed) {
    return (
      <button 
        onClick={() => setRevealed(true)}
        className="bg-black/80 backdrop-blur-md px-3 py-1 rounded border border-white/20 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-all italic"
      >
        <Lock className="w-3 h-3" /> Spoiler Detected - Click to Reveal
      </button>
    );
  }
  
  return (
    <span className="animate-in fade-in duration-500">{text}</span>
  );
}
