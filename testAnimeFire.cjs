const https = require('https');

const options = {
  hostname: 'animefire.plus',
  path: '/pesquisar/naruto',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data.substring(0, 1000)));
});

req.on('error', e => console.error(e));
req.end();
