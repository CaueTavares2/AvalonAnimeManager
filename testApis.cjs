const https = require('https');

const urls = [
  'https://api.amvstr.me/api/v2/search?q=naruto',
  'https://hianime-api-ten.vercel.app/anime/search?q=naruto',
  'https://anify.eltik.cc/search?query=naruto',
  'https://torrentio.strem.fun/manifest.json',
  'https://raw.githubusercontent.com/fribbels/anime-lists/master/anime-list-full.json'
];

console.log('--- Avalon API & Sources Connectivity Test ---');

urls.forEach(url => {
  const start = Date.now();
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const duration = Date.now() - start;
      console.log(`[${res.statusCode}] ${duration}ms | ${url.split('/').slice(0, 3).join('/')}...`);
      if (res.statusCode !== 200) {
        console.warn(`  ⚠️ Issue detected with source. Response: ${data.substring(0, 50)}`);
      }
    });
  }).on('error', (e) => console.log(`[ERROR] ${url}: ${e.message}`));
});
