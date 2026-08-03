import urllib.request
import urllib.parse
import json
import base64

API_KEY = "46a9042db91e422898eb3efd5025cb03"
SECRET = "0a629008d53546bfbc30bcd449381c5a"

queries = ["audit", "creative", "audience", "budget", "funnel", "competitor"]

# Create Basic Auth header
auth_str = f"{API_KEY}:{SECRET}"
auth_bytes = auth_str.encode('utf-8')
auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')

for q in queries:
    # URL encode query
    q_encoded = urllib.parse.quote(q)
    # Using v2 endpoint
    url = f"https://api.thenounproject.com/v2/icon?query={q_encoded}&limit=3"
    
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Basic {auth_b64}")
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                print(f"\n--- Search results for '{q}': ---")
                icons = data.get("icons", [])
                for idx, icon in enumerate(icons):
                    print(f"Icon {idx+1}: {icon.get('name')} (ID: {icon.get('id')})")
                    print(f"  Thumbnail: {icon.get('thumbnail_url')}")
            else:
                print(f"Failed for '{q}': status {response.status}")
    except Exception as e:
         print(f"Error for '{q}': {e}")
