async function test() {
  const url = 'https://api.comick.io/v1.0/search?q=Jujutsu%20Kaisen&limit=5';
  console.log('Fetching', url);
  try {
    const res = await fetch(url, { method: "OPTIONS" });
    console.log(res.status, res.headers.get("access-control-allow-origin"));
  } catch (e) {
    console.log(e);
  }
}
test();

