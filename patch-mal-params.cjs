const fs = require('fs');
let content = fs.readFileSync('src/services/trackerService.ts', 'utf8');

const replacement = `const params = new URLSearchParams();
      params.append('status', mappedStatus);
      if (type === 'ANIME') params.append('num_watched_episodes', progress.toString());
      if (type === 'MANGA') params.append('num_chapters_read', progress.toString());
      if (score) params.append('score', score.toString());
      
      await axios.put(\`https://api.myanimelist.net/v2/\${type.toLowerCase()}/\${malId}/my_list_status\`, 
         params.toString(), {`;

content = content.replace(
  /new URLSearchParams\(\{[\s\S]*?\}\)\.toString\(\), \{/,
  replacement
);

fs.writeFileSync('src/services/trackerService.ts', content);
