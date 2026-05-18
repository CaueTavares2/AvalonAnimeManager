import https from 'node:https';
async function run() {
  const r = await fetch('https://api.comick.app/v1.0/search?q=naruto');
  console.log(r.status);
}
run();
