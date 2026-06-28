import "dotenv/config";
import https from "https";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const apikey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !apikey) {
  console.error("Missing supabaseUrl or apikey");
  process.exit(1);
}

const url = `${supabaseUrl}/rest/v1/`;

console.log("Fetching url:", url);
console.log("Using apikey preview:", apikey.slice(0, 20) + "...");

https.get(url, { headers: { apikey } }, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Status Code:", res.statusCode);
    try {
      const json = JSON.parse(data);
      if (json.paths) {
        const paths = Object.keys(json.paths).filter(p => !p.includes('{id}')).map(p => p.slice(1));
        console.log("Exposed Paths/Tables:", paths);
      } else {
        console.log("Response JSON:", json);
      }
    } catch (e) {
      console.log("Response text (not JSON):", data.slice(0, 1000));
    }
  });
}).on("error", err => {
  console.error("HTTP Request Error:", err.message);
});
