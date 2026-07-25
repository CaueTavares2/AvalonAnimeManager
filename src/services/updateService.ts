import { getDocs, collection, query, where, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface GithubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
}

export const updateService = {
  // Replace with actual repository details
  REPO_OWNER: 'caue-nanda', 
  REPO_NAME: 'avalon-anime-list',

  async checkForUpdates(currentSha?: string): Promise<{ hasUpdate: boolean; latestSha: string; message: string } | null> {
    try {
      // In a real environment, you'd fetch from GitHub API
      // For this demo, we simulate a check. 
      // If we had a locally stored VERSION or SHA, we'd compare it.
      
      const response = await fetch(`https://api.github.com/repos/${this.REPO_OWNER}/${this.REPO_NAME}/commits/main`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) return null;

      const data: GithubCommit = await response.json();
      
      const lastCheckedSha = localStorage.getItem('avalon_last_sha') || currentSha;
      
      if (lastCheckedSha && data.sha !== lastCheckedSha) {
        return {
          hasUpdate: true,
          latestSha: data.sha,
          message: data.commit.message
        };
      }

      localStorage.setItem('avalon_last_sha', data.sha);
      return { hasUpdate: false, latestSha: data.sha, message: data.commit.message };
    } catch (error) {
      console.error('Update check failed:', error);
      return null;
    }
  },

  async applyUpdate(newSha: string) {
    // In a web app, "updating" usually means refreshing to get new assets
    // or triggering a rebuild if running locally.
    localStorage.setItem('avalon_last_sha', newSha);
    window.location.reload();
  }
};
