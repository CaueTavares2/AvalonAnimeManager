const https = require('https');

const urls = [
  'https://api.amvstr.me/api/v2/search?q=naruto',
  'https://hianime-api-ten.vercel.app/anime/search?q=naruto',
  'https://anify.eltik.cc/search?query=naruto'
];

urls.forEach(url => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(`[${url}] ${res.statusCode}: ${data.substring(0, 100)}`));
  }).on('error', (e) => console.log(`[${url}] Error: ${e.message}`));
});
