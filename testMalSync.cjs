const https = require('https');

https.get('https://api.malsync.moe/mal/anime/20', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data.substring(0, 1000)));
});
