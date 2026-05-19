const https = require('https');

https.get('https://api.jikan.moe/v4/anime/20/videos', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data.substring(0, 1000)));
});
