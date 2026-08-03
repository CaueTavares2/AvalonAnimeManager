const fs = require('fs');
let content = fs.readFileSync('src/services/trackerService.ts', 'utf8');

content = content.replace(
  "async syncToAniList(\n    username: string, \n    token: string | null, \n    malId: number, \n    status: string, \n    progress: number, \n    score?: number\n  )",
  "async syncToAniList(\n    username: string, \n    token: string | null, \n    malId: number, \n    status: string, \n    progress: number, \n    score?: number,\n    type: 'ANIME' | 'MANGA' = 'ANIME'\n  )"
);

content = content.replace(
  "query ($idMal: Int) {\n          Media (idMal: $idMal) {\n            id\n          }\n        }",
  "query ($idMal: Int, $type: MediaType) {\n          Media (idMal: $idMal, type: $type) {\n            id\n          }\n        }"
);

content = content.replace(
  "variables: { idMal: malId }",
  "variables: { idMal: malId, type: type }"
);

content = content.replace(
  "async syncToAllActive(malId: number, status: string, progress: number, score?: number): Promise<TrackerSyncResult[]> {",
  "async syncToAllActive(malId: number, status: string, progress: number, score?: number, type: 'ANIME' | 'MANGA' = 'ANIME'): Promise<TrackerSyncResult[]> {"
);

content = content.replace(
  "const res = await this.syncToAniList(anilistUser, anilistToken, malId, status, progress, score);",
  "const res = await this.syncToAniList(anilistUser, anilistToken, malId, status, progress, score, type);"
);

fs.writeFileSync('src/services/trackerService.ts', content);
