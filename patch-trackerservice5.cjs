const fs = require('fs');
let content = fs.readFileSync('src/services/trackerService.ts', 'utf8');

content = content.replace(
  "message: \`Sucesso: Sincronizado em tempo real com AniList para ${username}!\`,\n        translatedScore\n      };",
  "message: \`Sucesso: Sincronizado em tempo real com AniList para ${username}!\`,\n        translatedScore: score\n      };"
);

fs.writeFileSync('src/services/trackerService.ts', content);
