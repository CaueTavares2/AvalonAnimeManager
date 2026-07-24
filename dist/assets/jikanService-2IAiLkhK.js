import{a as g}from"./index-BpjWgUVE.js";const p="https://api.jikan.moe/v4",y=e=>new Promise(i=>setTimeout(i,e)),f=900*1e3,$=1440*60*1e3;function v(e){try{if(e.includes("/full")||e.includes("/top")){const t=localStorage.getItem(`jikan_p_cache_${e}`);if(t){const{data:r,timestamp:o}=JSON.parse(t);if(Date.now()-o<$)return r}}const i=sessionStorage.getItem(`jikan_cache_${e}`);if(i){const{data:t,timestamp:r}=JSON.parse(i);if(Date.now()-r<f)return t}}catch(i){console.warn("Cache read error",i)}return null}function w(e,i){try{(e.includes("/full")||e.includes("/top"))&&localStorage.setItem(`jikan_p_cache_${e}`,JSON.stringify({data:i,timestamp:Date.now()})),sessionStorage.setItem(`jikan_cache_${e}`,JSON.stringify({data:i,timestamp:Date.now()}))}catch(t){console.warn("Cache write error",t)}}async function c(e,i=3,t=1e3){var o;const r=v(e);if(r)return r;try{const l=(await g.get(e,{timeout:8e3})).data;return w(e,l),l}catch(s){if(((o=s.response)==null?void 0:o.status)===429&&i>0)return console.warn(`Rate limit hit. Retrying in ${t}ms... (${i} left)`),await y(t),c(e,i-1,t*2);throw s}}async function h(e,i,t){const r=`
  query ($type: MediaType, $sort: [MediaSort], $perPage: Int) {
    Page (page: 1, perPage: $perPage) {
      media (type: $type, sort: $sort) {
        idMal
        title { romaji, english, native }
        coverImage { large }
        averageScore
        episodes
        chapters
        volumes
          popularity
        description
        genres
        seasonYear
        season
        status
        format
      }
    }
  }`;try{return(await g.post("https://graphql.anilist.co",{query:r,variables:{type:e.toUpperCase(),sort:[i],perPage:t},timeout:8e3})).data.data.Page.media.filter(s=>s.idMal).map(s=>{var l,a;return{mal_id:s.idMal,title:s.title.romaji||s.title.english||s.title.native,title_english:s.title.english,title_japanese:s.title.native,images:{webp:{image_url:s.coverImage.large,large_image_url:s.coverImage.large}},score:s.averageScore?s.averageScore/10:0,episodes:s.episodes,chapters:s.chapters,volumes:s.volumes,members:s.popularity||0,synopsis:((l=s.description)==null?void 0:l.replace(/<br\s*\/?>/gi,`
`).replace(/<[^>]*>?/gm,""))||"",genres:s.genres?s.genres.map(n=>({name:n})):[],year:s.seasonYear,season:(a=s.season)==null?void 0:a.toLowerCase(),status:s.status,rank:0,type:s.format==="TV_SHORT"?"TV":s.format}})}catch(o){return console.error("AniList list fallback failed",o),[]}}const b={getTrending:async(e="anime")=>{try{const r=await c(`${p}/top/${e}?filter=${e==="anime"?"airing":"publishing"}${e==="anime"?"&type=tv":""}&limit=12`);if(!r||!r.data||r.data.length===0)throw new Error("Empty");return(r==null?void 0:r.data)||[]}catch{return console.warn("Jikan getTrending failed, falling back to AniList..."),h(e,"TRENDING_DESC",12)}},getPopular:async(e="anime")=>{try{const t=await c(`${p}/top/${e}?filter=bypopularity${e==="anime"?"&type=tv":""}&limit=18`);if(!t||!t.data||t.data.length===0)throw new Error("Empty");return(t==null?void 0:t.data)||[]}catch{return console.warn("Jikan getPopular failed, falling back to AniList..."),h(e,"POPULARITY_DESC",18)}},getUpcoming:async(e="anime")=>{try{const r=await c(`${p}/top/${e}?filter=upcoming${e==="anime"?"&type=tv":""}&limit=12`);if(!r||!r.data||r.data.length===0)throw new Error("Empty");return(r==null?void 0:r.data)||[]}catch{return console.warn("Jikan getUpcoming failed, falling back to AniList..."),h(e,"POPULARITY_DESC",12)}},getTopRated:async(e="anime")=>{try{const t=await c(`${p}/top/${e}?limit=10${e==="anime"?"&type=tv":""}`);if(!t||!t.data||t.data.length===0)throw new Error("Empty");return(t==null?void 0:t.data)||[]}catch{return console.warn("Jikan getTopRated failed, falling back to AniList..."),h(e,"SCORE_DESC",10)}},getDetails:async(e,i="anime")=>{var t,r;try{const o=await c(`${p}/${i}/${e}/full`);if(o&&o.data)return o.data}catch(o){console.warn(`Jikan full details failed for ${i} ${e}, trying basic details fallback...`,o)}try{const o=await c(`${p}/${i}/${e}`);if(o&&o.data)return o.data}catch(o){console.warn("Jikan basic details also failed, falling back to AniList...",o);const s=`
      query ($idMal: Int, $type: MediaType) {
        Media (idMal: $idMal, type: $type) {
          idMal
          title { romaji, english, native }
          coverImage { large }
          averageScore
          episodes
          chapters
          volumes
          popularity
          description
          genres
          seasonYear
          season
          status
          format
        }
      }`;try{const a=(await g.post("https://graphql.anilist.co",{query:s,variables:{idMal:e,type:i.toUpperCase()},timeout:8e3})).data.data.Media;return a?{mal_id:a.idMal||e,title:a.title.romaji||a.title.english||a.title.native,title_english:a.title.english,title_japanese:a.title.native,images:{webp:{image_url:a.coverImage.large,large_image_url:a.coverImage.large}},score:a.averageScore?a.averageScore/10:0,episodes:a.episodes,chapters:a.chapters,volumes:a.volumes,members:a.popularity||0,synopsis:((t=a.description)==null?void 0:t.replace(/<br\s*\/?>/gi,`
`).replace(/<[^>]*>?/gm,""))||"",genres:a.genres?a.genres.map(n=>({name:n})):[],year:a.seasonYear,season:(r=a.season)==null?void 0:r.toLowerCase(),status:a.status,rank:0,type:a.format==="TV_SHORT"?"TV":a.format}:null}catch(l){return console.error("AniList details fallback also failed",l),null}}return null},search:async(e,i="anime",t=1)=>{try{const r=await c(`${p}/${i}?q=${encodeURIComponent(e)}&page=${t}&limit=20&order_by=popularity&sort=desc&sfw=true`);if(!r||!r.data||r.data.length===0)throw new Error("Empty Jikan search result");return i==="anime"?{data:((r==null?void 0:r.data)||[]).filter(l=>{var a;return["tv","movie","ova","ona"].includes((a=l.type)==null?void 0:a.toLowerCase())}),pagination:r==null?void 0:r.pagination}:{data:(r==null?void 0:r.data)||[],pagination:r==null?void 0:r.pagination}}catch(r){console.warn("Jikan search failed, falling back to AniList...",r);const o=`
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
          popularity
            description
            genres
            seasonYear
            season
            status
            format
          }
        }
      }`;try{const l=(await g.post("https://graphql.anilist.co",{query:o,variables:{search:e,page:t,type:i.toUpperCase()}})).data.data.Page;return{data:l.media.filter(n=>n.idMal).map(n=>{var d,u;return{mal_id:n.idMal,title:n.title.romaji||n.title.english||n.title.native,title_english:n.title.english,title_japanese:n.title.native,images:{webp:{image_url:n.coverImage.large,large_image_url:n.coverImage.large}},score:n.averageScore?n.averageScore/10:0,episodes:n.episodes,chapters:n.chapters,volumes:n.volumes,members:n.popularity||0,synopsis:((d=n.description)==null?void 0:d.replace(/<br\s*\/?>/gi,`
`).replace(/<[^>]*>?/gm,""))||"",genres:n.genres?n.genres.map(m=>({name:m})):[],year:n.seasonYear,season:(u=n.season)==null?void 0:u.toLowerCase(),status:n.status,rank:0,type:n.format==="TV_SHORT"?"TV":n.format}}),pagination:{last_visible_page:l.pageInfo.lastPage}}}catch(s){return console.error("AniList fallback also failed",s),{data:[],pagination:{last_visible_page:1}}}}},getByYear:async(e,i=1)=>{try{const t=await c(`${p}/anime?start_date=${e}-01-01&end_date=${e}-12-31&order_by=popularity&sort=desc&limit=25&page=${i}&type=tv`);if(!t||!t.data||t.data.length===0)throw new Error("Empty");return t}catch(t){console.warn("Jikan getByYear failed, falling back to AniList...",t);const r=`
      query ($year: Int, $page: Int) {
        Page (page: $page, perPage: 25) {
          pageInfo {
            lastPage
          }
          media (type: ANIME, seasonYear: $year, sort: POPULARITY_DESC) {
            idMal
            title { romaji, english, native }
            coverImage { large }
            averageScore
            episodes
            chapters
            volumes
          popularity
            description
            genres
            seasonYear
            season
            status
            format
          }
        }
      }`;try{const s=(await g.post("https://graphql.anilist.co",{query:r,variables:{year:e,page:i},timeout:8e3})).data.data.Page;return{data:s.media.filter(a=>a.idMal).map(a=>{var n,d;return{mal_id:a.idMal,title:a.title.romaji||a.title.english||a.title.native,title_english:a.title.english,title_japanese:a.title.native,images:{webp:{image_url:a.coverImage.large,large_image_url:a.coverImage.large}},score:a.averageScore?a.averageScore/10:0,episodes:a.episodes,chapters:a.chapters,volumes:a.volumes,members:a.popularity||0,synopsis:((n=a.description)==null?void 0:n.replace(/<br\s*\/?>/gi,`
`).replace(/<[^>]*>?/gm,""))||"",genres:a.genres?a.genres.map(u=>({name:u})):[],year:a.seasonYear,season:(d=a.season)==null?void 0:d.toLowerCase(),status:a.status,rank:0,type:a.format==="TV_SHORT"?"TV":a.format}}),pagination:{last_visible_page:s.pageInfo.lastPage}}}catch(o){return console.error("AniList fallback also failed",o),{data:[],pagination:{last_visible_page:1}}}}},getMediaCharacters:async(e,i="anime")=>{try{const t=await c(`${p}/${i}/${e}/characters`);if(!t||!t.data)throw new Error("Empty characters");return t.data}catch(t){console.warn(`Jikan characters failed for ${i} ${e}, falling back to AniList...`,t);const r=`
      query ($idMal: Int, $type: MediaType) {
        Media (idMal: $idMal, type: $type) {
          characters(sort: [ROLE, RELEVANCE, ID], page: 1, perPage: 25) {
            edges {
              role
              node {
                id
                name { full }
                image { large }
              }
            }
          }
        }
      }`;try{return(await g.post("https://graphql.anilist.co",{query:r,variables:{idMal:e,type:i.toUpperCase()},timeout:8e3})).data.data.Media.characters.edges.map(l=>({character:{mal_id:l.node.id,url:"",images:{webp:{image_url:l.node.image.large}},name:l.node.name.full},role:l.role==="MAIN"?"Main":"Supporting"}))}catch(o){return console.error("AniList characters fallback also failed",o),[]}}},searchCharacters:async e=>(await c(`${p}/characters?q=${e}&limit=12`)).data,getCharacterDetails:async e=>(await c(`${p}/characters/${e}/full`)).data,getExternalIds:async e=>(await c(`${p}/anime/${e}/external`)).data};export{b as j};
