const MANGADEX = 'https://api.mangadex.org/manga?title=Naruto&limit=5&order[relevance]=desc';

async function t() {
  const r = await fetch(MANGADEX);
  const j = await r.json();
  console.log('MD', j.data.map(d => d.attributes.title));
}
t();
