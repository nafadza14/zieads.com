const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load from current directory .env
dotenv.config();
console.log("Current directory VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL);

// Check if there is another .env in parent folders
let dir = __dirname;
while (dir !== path.dirname(dir)) {
  const file = path.join(dir, '.env');
  if (fs.existsSync(file)) {
    console.log(`Found .env at ${file}:`);
    const content = fs.readFileSync(file, 'utf8');
    const match = content.match(/VITE_SUPABASE_URL\s*=\s*(.*)/);
    if (match) console.log("URL is:", match[1]);
  }
  dir = path.dirname(dir);
}
