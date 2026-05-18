import https from 'node:https';

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MangaApp/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  })
}
async function test() {
  const url = `https://api.comick.app/v1.0/search?q=naruto&limit=3`;
  try {
     const res = await fetchJson(url);
     console.log(res.slice(0,1));
  } catch(e) {
     console.log(e);
  }
}
test();
