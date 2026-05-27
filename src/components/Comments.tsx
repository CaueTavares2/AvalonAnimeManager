import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, OperationType, handleFirestoreError } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { MessageSquare, Send, ThumbsUp, Crown, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Comment {
  id: string;
  mediaId: string;
  userId: string;
  username: string;
  photoURL: string;
  content: string;
  likes: number;
  likedBy: string[];
  createdAt: any;
  userRank: string;
}

export function Comments({ mediaId, mediaType }: { mediaId: string, mediaType: 'ANIME' | 'MANGA' }) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('mediaId', '==', `${mediaType}_${mediaId}`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'comments');
    });

    return () => unsubscribe();
  }, [mediaId, mediaType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || loading) return;

    setLoading(true);
    try {
      // Add comment
      await addDoc(collection(db, 'comments'), {
        mediaId: `${mediaType}_${mediaId}`,
        userId: user.uid,
        username: profile.username || 'Desconhecido',
        photoURL: profile.photoURL || '',
        content: newComment.trim(),
        likes: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
        userRank: profile.rank || 'FERRO'
      });

      setNewComment('');

      // Gamification: Give points for commenting
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        otakuPoints: increment(10),
        availablePoints: increment(10)
      });
      // Optionally trigger local XP visual effect here if needed.

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (commentId: string, likedBy: string[]) => {
    if (!user) return;
    try {
      const commentRef = doc(db, 'comments', commentId);
      const isLiked = likedBy.includes(user.uid);

      if (isLiked) {
        await updateDoc(commentRef, {
          likes: increment(-1),
          likedBy: likedBy.filter(id => id !== user.uid)
        });
      } else {
        await updateDoc(commentRef, {
          likes: increment(1),
          likedBy: [...likedBy, user.uid]
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'AVALON': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'DIAMANTE': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'PLATINA': return 'text-sky-400 bg-sky-400/10 border-sky-400/20';
      case 'OURO': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'PRATA': return 'text-zinc-300 bg-zinc-300/10 border-zinc-300/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6 mt-8 border-t border-[var(--color-border)] pt-8">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-brand" />
        <h3 className="text-xl font-black text-[var(--color-text-bright)] uppercase tracking-widest">
          Comentários <span className="text-sm text-gray-500">({comments.length})</span>
        </h3>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Deixe uma review ou comentário. Ganhe +10 PO por interagir!"
            className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 pr-16 text-[var(--color-text-bright)] placeholder-gray-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none min-h-[100px] shadow-inner text-sm"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || loading}
            className="absolute bottom-3 right-3 p-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-md shadow-brand/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            )}
          </button>
        </form>
      ) : (
        <div className="bg-[var(--color-card)]/50 border border-[var(--color-border)] rounded-xl p-6 text-center shadow-sm">
          <p className="text-gray-400 text-sm font-bold">Faça login para comentar e ganhar pontos na guilda.</p>
        </div>
      )}

      <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 pb-4">
        <AnimatePresence>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--color-card)]/40 border border-[var(--color-border)] hover:border-brand/30 rounded-xl p-4 transition-colors group shadow-sm flex gap-4"
            >
              <div className="shrink-0 pt-1">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[var(--color-border)] group-hover:border-brand transition-colors bg-black shadow-inner shadow-black/50">
                  {comment.photoURL ? (
                    <img src={comment.photoURL} alt={comment.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <Star className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[var(--color-text-bright)] text-sm">{comment.username}</span>
                    <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border", getRankColor(comment.userRank))}>
                      {comment.userRank}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    {comment.createdAt?.toDate ? new Date(comment.createdAt.toDate()).toLocaleDateString('pt-BR') : 'Agora'}
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap pt-2">
                  {comment.content}
                </p>
                <div className="flex items-center gap-4 pt-3">
                  <button
                    onClick={() => handleLike(comment.id, comment.likedBy || [])}
                    className={cn(
                      "flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest transition-colors",
                      user && comment.likedBy?.includes(user.uid) ? "text-brand" : "text-gray-500 hover:text-brand"
                    )}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> 
                    {comment.likes > 0 && comment.likes}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {comments.length === 0 && (
          <div className="text-center py-12 text-gray-500 border-2 border-dashed border-[var(--color-border)] rounded-xl shadow-inner">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-bold">Nenhum comentário ainda. Seja o primeiro!</p>
          </div>
        )}
      </div>
    </div>
  );
}
