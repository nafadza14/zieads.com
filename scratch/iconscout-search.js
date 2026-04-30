async function searchIconscout() {
  try {
    const res = await fetch('https://api.iconscout.com/v3/search?asset=icon&query=robot&sort=popular', {
      headers: {
        'Client-ID': '175805725426389',
        'Client-Secret': 'SP3rgM8olvqgwDEKFeV2s6SVA7eLBJGo'
      }
    });

    if (!res.ok) {
        console.error("HTTP error:", res.status, res.statusText);
        const text = await res.text();
        console.error(text);
        return;
    }
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}
searchIconscout();
