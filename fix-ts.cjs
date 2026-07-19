const fs = require('fs');

// Fix stremioExtension.ts
let ext = fs.readFileSync('src/services/stremioExtension.ts', 'utf8');
ext = ext.replace(/const items = await jikanService.search\(query\);\n\s*return items.map/g, "const items = await jikanService.search(query);\n      return items.data.map");
fs.writeFileSync('src/services/stremioExtension.ts', ext);

// Fix GachaRecommendation.tsx
let gacha = fs.readFileSync('src/components/home/GachaRecommendation.tsx', 'utf8');
gacha = gacha.replace(/jikanService\.getTopRated\('anime', randomPage\)/g, "jikanService.getTopRated('anime')");
fs.writeFileSync('src/components/home/GachaRecommendation.tsx', gacha);

console.log("Done");
