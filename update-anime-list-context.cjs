const fs = require('fs');
let content = fs.readFileSync('src/context/AnimeListContext.tsx', 'utf8');

// Add import for trackerService if it does not exist
if (!content.includes('trackerService')) {
  content = content.replace("import { rankingService } from '../services/rankingService';", "import { rankingService } from '../services/rankingService';\nimport { trackerService } from '../services/trackerService';");
}

// Update addAnime
content = content.replace(
  "await rankingService.addPoints(user.uid, 50, `Concluiu: ${anime.title}`);\n        }",
  "await rankingService.addPoints(user.uid, 50, `Concluiu: ${anime.title}`);\n        }\n\n        // Sync out to AniList/MAL\n        trackerService.syncToAllActive(anime.id, anime.status, anime.progress, anime.score);"
);

// We should also do it for local storage user:
content = content.replace(
  "localStorage.setItem('avalon_anime_list', JSON.stringify(updated));\n        return updated;\n      });\n    }\n  }, [user]);",
  "localStorage.setItem('avalon_anime_list', JSON.stringify(updated));\n        return updated;\n      });\n      // Sync out to AniList/MAL\n      trackerService.syncToAllActive(anime.id, anime.status, anime.progress, anime.score);\n    }\n  }, [user]);"
);

// Note: updateAnime doesn't explicitly have a single place to add, let's just do it at the end of the user branch and non-user branch

// Instead of manual string replace, let's replace by block
