import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc, 
  doc, 
  getDocs,
  getDoc,
  serverTimestamp,
  or,
  and,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, handleFirestoreError, OperationType } from './AuthContext';

export interface Friend {
  uid: string;
  username: string;
  avatar: string;
  customId: string;
  numericId?: number;
  status: 'ONLINE' | 'OFFLINE' | 'MARATONANDO';
  currentActivity?: string;
  rank: string;
  otakuPoints: number;
}

export interface FriendRequest {
  id: string;
  from: string;
  fromUsername: string;
  to: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

interface SocialContextType {
  friends: Friend[];
  requests: FriendRequest[];
  sentRequests: FriendRequest[];
  sendRequest: (toId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  calculateAffinity: (otherUserId: string) => Promise<number>;
  sendSalvationPill: (toUserId: string) => Promise<void>;
  activeChatFriendId: string | null;
  setActiveChatFriendId: (id: string | null) => void;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [activeChatFriendId, setActiveChatFriendId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setFriends([]);
      setRequests([]);
      setSentRequests([]);
      return;
    }

    // Listen to friend requests
    const qRequests = query(
      collection(db, 'friendRequests'),
      where('to', '==', user.uid),
      where('status', '==', 'PENDING')
    );

    const unsubRequests = onSnapshot(qRequests, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'friendRequests');
    });

    const qSentRequests = query(
      collection(db, 'friendRequests'),
      where('from', '==', user.uid),
      where('status', '==', 'PENDING')
    );

    const unsubSent = onSnapshot(qSentRequests, (snapshot) => {
      setSentRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'friendRequests');
    });

    // Listen to friendships
    const qFriends = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', user.uid),
      where('status', '==', 'ACCEPTED')
    );

    const unsubFriends = onSnapshot(qFriends, async (snapshot) => {
      const friendIds = snapshot.docs.map(doc => {
        const users = doc.data().users as string[];
        return users.find(id => id !== user.uid);
      }).filter(Boolean) as string[];

      if (friendIds.length === 0) {
        setFriends([]);
        return;
      }

      const uniqueFriendIds = Array.from(new Set(friendIds));
      
      // Batch lookup users (max 30 per 'in' query)
      const chunkedIds = [];
      for (let i = 0; i < uniqueFriendIds.length; i += 30) {
        chunkedIds.push(uniqueFriendIds.slice(i, i + 30));
      }

      try {
        const userSnaps = await Promise.all(
          chunkedIds.map(ids => 
            getDocs(query(collection(db, 'users'), where('uid', 'in', ids)))
          )
        );

        const usersMap = new Map();
        userSnaps.forEach(snap => {
          snap.forEach(doc => usersMap.set(doc.id, { uid: doc.id, ...doc.data() }));
        });

        const friendsData: Friend[] = [];
        for (const id of uniqueFriendIds) {
          const userData = usersMap.get(id);
          if (userData) {
            const chatId = [user.uid, id].sort().join('_');
            const chatDoc = await getDoc(doc(db, 'chats', chatId));
            const chatData = chatDoc.exists() ? chatDoc.data() : null;
            
            friendsData.push({
              ...userData,
              avatar: userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
              lastMessage: chatData?.lastMessage,
              hasUnread: chatData?.lastMessageAt?.toMillis() > (chatData?.lastRead?.[user.uid]?.toMillis() || 0)
            } as unknown as Friend);
          }
        }
        setFriends(friendsData);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'users');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'friendships');
    });

    return () => {
      unsubRequests();
      unsubSent();
      unsubFriends();
    };
  }, [user]);

  const STAFF_EMAILS = ['caue.nanda.tavares@gmail.com'];

  const sendRequest = async (toId: string) => {
    if (!user) return;
    
    // Find user by customId OR numericId OR @username
    let snap;
    try {
      const cleanId = toId.replace('#', '').replace('@', '');
      const numId = parseInt(cleanId);
      
      let q;
      if (toId.startsWith('@')) {
        q = query(collection(db, 'users'), where('username', '==', cleanId));
      } else if (!isNaN(numId) && cleanId === numId.toString()) {
        q = query(collection(db, 'users'), where('numericId', '==', numId));
      } else {
        q = query(collection(db, 'users'), where('customId', '==', toId.startsWith('#') ? toId : `#${toId}`));
      }
      
      snap = await getDocs(q);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
    }
    
    if (!snap || snap.empty) {
      throw new Error("Usuário não encontrado.");
    }

    const targetUser = snap.docs[0];
    const targetUserId = targetUser.id;

    if (targetUserId === user.uid) {
      throw new Error("Você não pode ser seu próprio amigo!");
    }

    // Check if there is already a PENDING request FROM them to me
    const qIncoming = query(
      collection(db, 'friendRequests'),
      where('from', '==', targetUserId),
      where('to', '==', user.uid),
      where('status', '==', 'PENDING')
    );
    const incomingSnap = await getDocs(qIncoming);
    if (!incomingSnap.empty) {
      throw new Error("Este usuário já te enviou um pedido! Verifique sua aba de Pedidos.");
    }

    // Check existing request
    let existingSnap;
    try {
      const qExisting = query(
        collection(db, 'friendRequests'),
        where('from', '==', user.uid),
        where('to', '==', targetUserId),
        where('status', '==', 'PENDING')
      );
      existingSnap = await getDocs(qExisting);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'friendRequests');
    }

    if (existingSnap && !existingSnap.empty) {
      throw new Error("Pedido de amizade já enviado.");
    }

    try {
      await addDoc(collection(db, 'friendRequests'), {
        from: user.uid,
        fromUsername: user.displayName || user.email?.split('@')[0],
        to: targetUserId,
        status: 'PENDING',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'friendRequests');
    }
  };

  const sendSalvationPill = async (toUserId: string) => {
    if (!user) return;
    const meRef = doc(db, 'users', user.uid);
    const friendRef = doc(db, 'users', toUserId);

    try {
      const [meSnap, friendSnap] = await Promise.all([
        getDoc(meRef),
        getDoc(friendRef)
      ]);

      if (!meSnap.exists() || !friendSnap.exists()) return;
      const meData = meSnap.data();
      const friendData = friendSnap.data();

      if ((meData.pillsCount || 0) <= 0) {
        throw new Error("Você já usou sua pílula semanal!");
      }

      if (!friendData.needsHelp) {
        throw new Error("Este amigo não precisa de uma pílula no momento.");
      }

      // Check receive limit: 2 per month
      const lastPillAt = friendData.lastPillReceivedAt ? (friendData.lastPillReceivedAt.toDate?.() || new Date(friendData.lastPillReceivedAt)) : new Date(0);
      const now = new Date();
      const isSameMonth = lastPillAt.getMonth() === now.getMonth() && lastPillAt.getFullYear() === now.getFullYear();
      
      if (isSameMonth && (friendData.receivablesPillsCount || 0) >= 2) {
        throw new Error("Este amigo já atingiu o limite de salvamentos do mês!");
      }

      // Perform salvation
      await Promise.all([
        updateDoc(meRef, {
          pillsCount: increment(-1),
          savedStreaksCount: increment(1),
          updatedAt: serverTimestamp()
        }),
        updateDoc(friendRef, {
          needsHelp: false,
          helpExpireAt: null,
          receivablesPillsCount: isSameMonth ? increment(1) : 1,
          lastPillReceivedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          streak: increment(0), // Trigger update
          lastStreakUpdate: serverTimestamp()
        }),
        addDoc(collection(db, 'activityFeed'), {
          type: 'STREAK_SALVATION',
          from: user.uid,
          to: toUserId,
          createdAt: serverTimestamp()
        })
      ]);

      // Check for achievements
      if ((meData.savedStreaksCount || 0) + 1 === 1) {
        import('../services/rankingService').then(({ rankingService }) => {
          rankingService.grantAchievement(user.uid, 'NINJA_MEDICO_JR');
        });
      } else if ((meData.savedStreaksCount || 0) + 1 === 10) {
        import('../services/rankingService').then(({ rankingService }) => {
          rankingService.grantAchievement(user.uid, 'SALVADOR_SHIZUME');
        });
      }

    } catch (err: any) {
      if (err.message) throw err;
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const acceptRequest = async (requestId: string) => {
    if (!user) return;
    try {
      const requestRef = doc(db, 'friendRequests', requestId);
      const snap = await getDoc(requestRef);
      if (!snap.exists()) return;
      
      const data = snap.data();
      const friendshipId = [data.from, data.to].sort().join('_');

      // Update both users' friends list automatically via the listener
      await updateDoc(requestRef, { status: 'ACCEPTED' });
      
      // Cleanup any other alternate pending requests between these two
      const qOther = query(
        collection(db, 'friendRequests'),
        where('from', '==', data.to),
        where('to', '==', data.from),
        where('status', '==', 'PENDING')
      );
      const otherSnap = await getDocs(qOther);
      for (const d of otherSnap.docs) {
        await updateDoc(doc(db, 'friendRequests', d.id), { status: 'CLEANED' });
      }

      await setDoc(doc(db, 'friendships', friendshipId), {
        users: [data.from, data.to],
        since: serverTimestamp(),
        status: 'ACCEPTED'
      }, { merge: true });

      // Create/Update chat document to ensure participants array exists for rules
      await setDoc(doc(db, 'chats', friendshipId), {
        participants: [data.from, data.to],
        lastMessage: "Nova amizade iniciada!",
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Check for GOSTOS_OPOSTOS achievement
      const affinity = await calculateAffinity(data.from);
      if (affinity === 0) {
        import('../services/rankingService').then(({ rankingService }) => {
          rankingService.grantAchievement(user.uid, 'GOSTOS_OPOSTOS');
        });
      }

      // LEGADO_KAISER ACHIEVEMENT Logic
      // If ANY of the participants is staff, the OTHER gets the achievement
      const fromUserRef = doc(db, 'users', data.from);
      const toUserRef = doc(db, 'users', data.to);
      const [fromSnap, toSnap] = await Promise.all([getDoc(fromUserRef), getDoc(toUserRef)]);
      
      if (fromSnap.exists() && STAFF_EMAILS.includes(fromSnap.data().email)) {
        // Staff accepted or sent. recipient (data.to) gets achievement
        import('../services/rankingService').then(({ rankingService }) => {
          rankingService.grantAchievement(data.to, 'LEGADO_KAISER');
        });
      }
      if (toSnap.exists() && STAFF_EMAILS.includes(toSnap.data().email)) {
        // Staff is the recipient. sender (data.from) gets achievement
        import('../services/rankingService').then(({ rankingService }) => {
          rankingService.grantAchievement(data.from, 'LEGADO_KAISER');
        });
      }
      
      // Create activity event
      await addDoc(collection(db, 'activityFeed'), {
        type: 'FRIEND_ADDED',
        users: [data.from, data.to],
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `friendRequests/${requestId}`);
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `friendRequests/${requestId}`);
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'friendRequests', requestId), { status: 'REJECTED' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `friendRequests/${requestId}`);
    }
  };

  const calculateAffinity = async (otherUserId: string) => {
    if (!user) return 0;
    
    // Fetch both users' lists
    let myListSnap, otherListSnap;
    try {
      [myListSnap, otherListSnap] = await Promise.all([
        getDocs(collection(db, 'users', user.uid, 'list')),
        getDocs(collection(db, 'users', otherUserId, 'list'))
      ]);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/list`);
    }

    if (!myListSnap || !otherListSnap) return 0;

    const myItems = myListSnap.docs.map(d => d.data());
    const otherItems = otherListSnap.docs.map(d => d.data());

    if (myItems.length === 0 || otherItems.length === 0) return 0;

    // Compare genres and high-scored items
    const myGenres = new Set(myItems.flatMap(i => i.genres || []));
    const otherGenres = new Set(otherItems.flatMap(i => i.genres || []));

    const commonGenres = [...myGenres].filter(g => otherGenres.has(g));
    const genreScore = commonGenres.length / Math.max(myGenres.size, otherGenres.size);

    // Common items with similar scores
    const myIds = new Map<number, number>(myItems.map(i => [i.mediaId as number, i.score as number]));
    const otherIds = new Map<number, number>(otherItems.map(i => [i.mediaId as number, i.score as number]));

    let commonItemsCount = 0;
    let scoreSync = 0;

    for (const [id, score] of myIds) {
      if (otherIds.has(id)) {
        commonItemsCount++;
        const otherScore = otherIds.get(id) || 0;
        if (Math.abs((score || 0) - otherScore) <= 20) { // Score sync for 10-point scale or 100-point scale
           scoreSync++;
        }
      }
    }

    const itemAffinity = commonItemsCount / Math.max(myItems.length, otherItems.length);
    const totalAffinity = (genreScore * 0.4) + (itemAffinity * 0.6);

    return Math.round(totalAffinity * 100);
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return;
    const friendshipId = [user.uid, friendId].sort().join('_');
    try {
      // Find all requests between these two to clear them
      const q1 = query(collection(db, 'friendRequests'), where('from', '==', user.uid), where('to', '==', friendId));
      const q2 = query(collection(db, 'friendRequests'), where('from', '==', friendId), where('to', '==', user.uid));
      
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const deleteReqs = [...snap1.docs, ...snap2.docs].map(d => deleteDoc(doc(db, 'friendRequests', d.id)));

      await Promise.all([
        deleteDoc(doc(db, 'friendships', friendshipId)),
        deleteDoc(doc(db, 'chats', friendshipId)),
        ...deleteReqs
      ]);
      // Update local state immediately for better UX
      setFriends(prev => prev.filter(f => f.uid !== friendId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `friendships/${friendshipId}`);
    }
  };

  return (
    <SocialContext.Provider value={{ friends, requests, sentRequests, sendRequest, acceptRequest, rejectRequest, cancelRequest, removeFriend, calculateAffinity, sendSalvationPill, activeChatFriendId, setActiveChatFriendId }}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (context === undefined) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
}
