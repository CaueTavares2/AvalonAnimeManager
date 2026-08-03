const fs = require('fs');
let content = fs.readFileSync('src/services/trackerService.ts', 'utf8');

// Fix AniList Score Raw mapping
content = content.replace(
  "const translatedScore = score ? this.translateScoreToSmiley(score) : undefined;",
  ""
);
content = content.replace(
  "Nota recomendada: ${translatedScore || 'N/A'}",
  "Nota: ${score || 'N/A'}"
);
content = content.replace(
  "translatedScore\n      };",
  "score\n      };"
);

content = content.replace(
  "// Translate Smiley score to raw score if needed\n      let scoreRaw = 0;\n      if (translatedScore === 'SMILE') scoreRaw = 3; // Smiley ratings are typically internally mapped in AniList\n      else if (translatedScore === 'NEUTRAL') scoreRaw = 2;\n      else if (translatedScore === 'SAD') scoreRaw = 1;",
  "// AniList stores all scores internally as a 100-point integer\n      const scoreRaw = score ? score * 10 : undefined;"
);
content = content.replace(
  "scoreRaw: scoreRaw > 0 ? scoreRaw : undefined",
  "scoreRaw: scoreRaw"
);

// Fix Auto Sync defaulting to true
content = content.replace(
  "const isAutoSync = localStorage.getItem('avalon_auto_sync_trackers') === 'true';\n    if (!isAutoSync) return [];",
  "const isAutoSync = localStorage.getItem('avalon_auto_sync_trackers');\n    if (isAutoSync === 'false') return [];"
);

fs.writeFileSync('src/services/trackerService.ts', content);
