const c="https://graphql.anilist.co",l=new Map,h={searchManga:async n=>{var t,e;const r=`
      query ($search: String) {
        Page (page: 1, perPage: 10) {
          media (search: $search, type: MANGA) {
            id
            title {
              romaji
              english
              native
            }
            synonyms
            description
            coverImage {
              large
            }
          }
        }
      }
    `,s={search:n};try{return((e=(t=(await(await fetch(c,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({query:r,variables:s})})).json()).data)==null?void 0:t.Page)==null?void 0:e.media)||[]}catch(a){return console.error("AniList Search Error:",a),[]}},getMangaByTitle:async n=>{var t;const r=`
      query ($search: String) {
        Media (search: $search, type: MANGA) {
          id
          title {
            romaji
            english
            native
          }
          synonyms
          description
          coverImage {
            large
          }
        }
      }
    `,s={search:n};try{return((t=(await(await fetch(c,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({query:r,variables:s})})).json()).data)==null?void 0:t.Media)||null}catch(e){return console.error("AniList Fetch Error:",e),null}},getRelationsByMalId:async(n,r)=>{var e,a,i;const s=`
      query ($idMal: Int, $type: MediaType) {
        Media (idMal: $idMal, type: $type) {
          relations {
            edges {
              relationType
              node {
                idMal
                id
                title {
                  romaji
                  english
                }
                type
                coverImage {
                  large
                }
              }
            }
          }
        }
      }
    `,t={idMal:n,type:r};try{return((i=(a=(e=(await(await fetch(c,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({query:s,variables:t})})).json()).data)==null?void 0:e.Media)==null?void 0:a.relations)==null?void 0:i.edges)||[]}catch(o){return console.error("AniList Fetch Relations Error:",o),[]}},getStatsByMalId:async(n,r)=>{var e,a;const s=`
      query ($idMal: Int, $type: MediaType) {
        Media (idMal: $idMal, type: $type) {
          stats {
            statusDistribution {
              status
              amount
            }
            scoreDistribution {
              score
              amount
            }
          }
        }
      }
    `,t={idMal:n,type:r};try{return((a=(e=(await(await fetch(c,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({query:s,variables:t})})).json()).data)==null?void 0:e.Media)==null?void 0:a.stats)||null}catch(i){return console.error("AniList Fetch Stats Error:",i),null}},getAiringScheduleByMalId:async(n,r="ANIME")=>{var o;const s=`${r}-${n}`,t=l.get(s),e=Date.now();if(t&&e-t.timestamp<9e5)return t.data;const a=`
      query ($idMal: Int, $type: MediaType) {
        Media (idMal: $idMal, type: $type) {
          status
          nextAiringEpisode {
            airingAt
            timeUntilAiring
            episode
          }
        }
      }
    `,i={idMal:n,type:r};try{const p=((o=(await(await fetch(c,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({query:a,variables:i})})).json()).data)==null?void 0:o.Media)||null;return p&&l.set(s,{data:p,timestamp:e}),p}catch(d){return console.error("AniList Fetch Airing Schedule Error:",d),null}}};export{h as a};
