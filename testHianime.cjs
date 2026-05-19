const https = require('https');

https.get('https://api-aniwatch.onrender.com/api/v2/hianime/search?q=naruto', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data.substring(0, 500)));
});
