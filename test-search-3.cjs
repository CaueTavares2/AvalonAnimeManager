const axios = require('axios');

async function search() {
  const query = "naruto";
  const type = "anime";
  const page = 1;
  const JIKAN_API_BASE = 'https://api.jikan.moe/v4';
  
      const anilistQuery = `
      query ($search: String, $page: Int, $type: MediaType) {
        Page (page: $page, perPage: 20) {
          pageInfo {
            lastPage
          }
          media (search: $search, type: $type, sort: POPULARITY_DESC) {
            idMal
            title { romaji, english, native }
            coverImage { large }
            averageScore
            episodes
            chapters
            volumes
            description
            genres
            seasonYear
            season
            status
            format
          }
        }
      }`;
      try {
        const response = await axios.post('https://graphql.anilist.co', {
          query: anilistQuery,
          variables: { search: query, page: page, type: type.toUpperCase() }
        });
        const anilistData = response.data.data.Page;
        const mappedData = anilistData.media.filter(m => m.idMal).map(m => ({
          mal_id: m.idMal,
          title: m.title.romaji || m.title.english || m.title.native,
          type: m.format === 'TV_SHORT' ? 'TV' : m.format
        }));
        
        console.log("Anilist Success", mappedData.length);
        console.log(mappedData[0]);
      } catch (err) {
        console.error("AniList fallback also failed", err);
      }
}
search();
