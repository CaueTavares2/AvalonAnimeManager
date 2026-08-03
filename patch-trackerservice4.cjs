const fs = require('fs');
let content = fs.readFileSync('src/services/trackerService.ts', 'utf8');

content = content.replace(
  "async syncToMAL(\n    username: string, \n    token: string | null, \n    malId: number, \n    status: string, \n    progress: number, \n    score?: number\n  )",
  "async syncToMAL(\n    username: string, \n    token: string | null, \n    malId: number, \n    status: string, \n    progress: number, \n    score?: number,\n    type: 'ANIME' | 'MANGA' = 'ANIME'\n  )"
);

content = content.replace(
  "https://api.myanimelist.net/v2/anime/${malId}/my_list_status",
  "https://api.myanimelist.net/v2/${type.toLowerCase()}/${malId}/my_list_status"
);

content = content.replace(
  "const res = await this.syncToMAL(malUser, malToken, malId, status, progress, score);",
  "const res = await this.syncToMAL(malUser, malToken, malId, status, progress, score, type);"
);

content = content.replace(
  "num_watched_episodes: progress.toString(),",
  "num_watched_episodes: type === 'ANIME' ? progress.toString() : undefined,\n          num_chapters_read: type === 'MANGA' ? progress.toString() : undefined,"
);

fs.writeFileSync('src/services/trackerService.ts', content);
