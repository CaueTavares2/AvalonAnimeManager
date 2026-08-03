const fs = require('fs');
let content = fs.readFileSync('src/services/trackerService.ts', 'utf8');

// Insert retry utility at the top
const retryUtility = `
// Exponencial backoff retry wrapper
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      
      // Don't retry on 401 Unauthorized or 403 Forbidden or 404 Not Found
      if (error.response && [401, 403, 404].includes(error.response.status)) {
        throw error;
      }
      
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(\`[TrackerService] Chamada falhou, tentando novamente em \${delay}ms (tentativa \${attempt}/\${maxRetries})...\`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}
`;

content = content.replace("export const trackerService =", retryUtility + "\nexport const trackerService =");

// Wrap AniList API call
content = content.replace(
  /const mediaResponse = await axios\.post\('https:\/\/graphql\.anilist\.co'/g,
  "const mediaResponse = await withRetry(() => axios.post('https://graphql.anilist.co'"
);
content = content.replace(
  /variables: { idMal: malId, type: type }\n      }\);/g,
  "variables: { idMal: malId, type: type }\n      }));"
);

content = content.replace(
  /await axios\.post\('https:\/\/graphql\.anilist\.co'/g,
  "await withRetry(() => axios.post('https://graphql.anilist.co'"
);
content = content.replace(
  /        }\n      \}\);/g,
  "        }\n      }));"
);

// Wrap MAL API call
content = content.replace(
  /await axios\.put\(\`https:\/\/api\.myanimelist\.net\/v2\/\$\{type\.toLowerCase\(\)\}\/\$\{malId\}\/my_list_status\`,\s*params\.toString\(\), \{/g,
  "await withRetry(() => axios.put(`https://api.myanimelist.net/v2/${type.toLowerCase()}/${malId}/my_list_status`,\n          params.toString(), {"
);
content = content.replace(
  /          'Content-Type': 'application\/x-www-form-urlencoded'\n        }\n      \}\);/g,
  "          'Content-Type': 'application/x-www-form-urlencoded'\n        }\n      }));"
);

fs.writeFileSync('src/services/trackerService.ts', content);
