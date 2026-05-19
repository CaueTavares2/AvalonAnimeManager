const https = require('https');

https.get('https://consumet-api-clone.vercel.app/anime/gogoanime/naruto', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data.substring(0, 500)));
});
