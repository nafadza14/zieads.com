async function testIconscout() {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', '175805725426389');
    params.append('client_secret', 'SP3rgM8olvqgwDEKFeV2s6SVA7eLBJGo');

    const res = await fetch('https://api.iconscout.com/v3/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    
    if (!res.ok) {
        console.error("HTTP error:", res.status, res.statusText);
        const text = await res.text();
        console.error(text);
        return;
    }
    const data = await res.json();
    console.log("Token Response:", data);
  } catch(e) {
    console.error(e);
  }
}
testIconscout();
