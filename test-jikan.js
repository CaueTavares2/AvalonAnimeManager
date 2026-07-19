const axios = require('axios');
axios.get('https://api.jikan.moe/v4/anime?q=naruto&page=1&limit=20&order_by=popularity&sort=desc&sfw=true')
  .then(res => console.log(res.data.data.length))
  .catch(err => console.log(err.message));
