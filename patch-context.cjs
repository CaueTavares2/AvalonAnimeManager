const fs = require('fs');
let content = fs.readFileSync('src/context/AnimeListContext.tsx', 'utf8');

content = content.replace(
  "trackerService.syncToAllActive(anime.id, anime.status, anime.progress, anime.score);",
  "trackerService.syncToAllActive(anime.id, anime.status, anime.progress, anime.score, anime.type);"
);

content = content.replace(
  "trackerService.syncToAllActive(anime.id, anime.status, anime.progress, anime.score);",
  "trackerService.syncToAllActive(anime.id, anime.status, anime.progress, anime.score, anime.type);"
);

content = content.replace(
  "trackerService.syncToAllActive(id, data.status || existingItem.status, data.progress ?? existingItem.progress, data.score ?? existingItem.score);",
  "trackerService.syncToAllActive(id, data.status || existingItem.status, data.progress ?? existingItem.progress, data.score ?? existingItem.score, existingItem.type);"
);

fs.writeFileSync('src/context/AnimeListContext.tsx', content);
