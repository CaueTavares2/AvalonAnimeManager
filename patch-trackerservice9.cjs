const fs = require('fs');
let content = fs.readFileSync('src/services/trackerService.ts', 'utf8');
content = content.replace(
  "message: \`Simulado: Sincronizado com AniList (${username}). Status: ${mappedStatus}, Progresso: ${progress}, Nota: ${score || 'N/A'}.\`,\n        translatedScore: score\n      };",
  "message: \`Simulado: Sincronizado com AniList (${username}). Status: ${mappedStatus}, Progresso: ${progress}, Nota: ${score || 'N/A'}.\`,\n        score\n      };"
);
fs.writeFileSync('src/services/trackerService.ts', content);
