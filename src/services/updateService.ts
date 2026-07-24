import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UpdateInfo {
  hasUpdate: boolean;
  latestSha: string;
  message: string;
  date: string;
}

const COLLECTION = 'updates';
const DOCUMENT = 'latest';
const LOCAL_KEY = 'avalon_last_sha';

export const updateService = {
  REPO_OWNER: 'caue-nanda',
  REPO_NAME: 'avalon-anime-list',

  async getCurrent(): Promise<UpdateInfo | null> {
    try {
      const ref = doc(db, COLLECTION, DOCUMENT);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const data = snap.data() as { sha: string; message: string; date: string };
      const lastSha = localStorage.getItem(LOCAL_KEY);
      return {
        hasUpdate: !!lastSha && data.sha !== lastSha,
        latestSha: data.sha,
        message: data.message,
        date: data.date,
      };
    } catch {
      return null;
    }
  },

  subscribe(callback: (info: UpdateInfo | null) => void) {
    const ref = doc(db, COLLECTION, DOCUMENT);
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      const data = snap.data() as { sha: string; message: string; date: string };
      const lastSha = localStorage.getItem(LOCAL_KEY);
      callback({
        hasUpdate: !!lastSha && data.sha !== lastSha,
        latestSha: data.sha,
        message: data.message,
        date: data.date,
      });
    });
  },

  markAsRead(sha: string) {
    localStorage.setItem(LOCAL_KEY, sha);
  },

  async applyUpdate(sha: string) {
    this.markAsRead(sha);
    window.location.reload();
  },
};