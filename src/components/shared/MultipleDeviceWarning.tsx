import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, setDoc, onSnapshot, collection, serverTimestamp, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { MonitorSmartphone, X } from 'lucide-react';

export const MultipleDeviceWarning: React.FC = () => {
  const { user } = useAuth();
  const [multipleDevices, setMultipleDevices] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Generate or get device ID
    let deviceId = localStorage.getItem('avalon_device_id');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('avalon_device_id', deviceId);
    }

    const deviceRef = doc(db, 'users', user.uid, 'activeDevices', deviceId);

    // Heartbeat function
    const heartbeat = async () => {
      try {
        await setDoc(deviceRef, {
          lastActive: serverTimestamp(),
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        }, { merge: true });
      } catch (e) {
        console.error("Device heartbeat error", e);
      }
    };

    // Initial heartbeat
    heartbeat();

    // Heartbeat every 2 minutes
    const interval = setInterval(heartbeat, 120000);

    // Monitor active devices
    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'activeDevices'), (snapshot) => {
      const now = Date.now();
      let activeCount = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.lastActive) {
          // If Firestore returns a Timestamp, convert it. If it's local (serverTimestamp pending), we skip or assume now
          const lastActive = data.lastActive.toMillis ? data.lastActive.toMillis() : Date.now();
          // Active if within the last 5 minutes
          if (now - lastActive < 300000) {
            activeCount++;
          }
        }
      });

      if (activeCount > 1) {
        setMultipleDevices(true);
        import('../../services/rankingService').then(m => {
          m.rankingService.grantAchievement(user.uid, 'MULTI_DISPOSITIVO');
        });
      } else {
        setMultipleDevices(false);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [user]);

  if (!multipleDevices || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-50 bg-red-900 border border-red-500 rounded-2xl p-4 shadow-2xl shadow-red-900/50 flex items-start gap-4 max-w-sm"
      >
        <div className="bg-red-500/20 p-2 rounded-xl text-red-400 shrink-0">
          <MonitorSmartphone className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="font-black text-white text-xs uppercase tracking-widest mb-1">Múltiplos Dispositivos</h4>
          <p className="text-xs text-red-200 leading-relaxed font-medium">Detectamos que sua conta está ativa em mais de um dispositivo simultaneamente.</p>
        </div>
        <button 
          onClick={() => setDismissed(true)}
          className="text-red-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
