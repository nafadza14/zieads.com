async function fetchIcon() {
  try {
    const res = await fetch('https://api.iconscout.com/v3/search?asset=icon&query=robot&sort=popular', {
      headers: {
        'Client-ID': '175805725426389',
        'Client-Secret': 'SP3rgM8olvqgwDEKFeV2s6SVA7eLBJGo'
      }
    });
    
    const data = await res.json();
    const item = data.response.items.data[0];
    
    console.log("Found item:", item.urls);
    if(item.urls.svg) {
       console.log("SVG URL:", item.urls.svg);
    } else {
       console.log("No SVG URL in search results, checking item details endpoint...");
       const detailRes = await fetch(`https://api.iconscout.com/v3/items/${item.id}`, {
          headers: {
            'Client-ID': '175805725426389',
            'Client-Secret': 'SP3rgM8olvqgwDEKFeV2s6SVA7eLBJGo'
          }
       });
       const detailData = await detailRes.json();
       console.log(JSON.stringify(detailData, null, 2));
    }
  } catch(e) {
    console.error(e);
  }
}
fetchIcon();
