import requests
from requests_oauthlib import OAuth1

API_KEY = "46a9042db91e422898eb3efd5025cb03"
SECRET = "0a629008d53546bfbc30bcd449381c5a"

icon_ids = ["6418273", "8362702", "8029438", "8280321", "8318926", "5854890"]

auth = OAuth1(API_KEY, SECRET)

for icon_id in icon_ids:
    url = f"https://api.thenounproject.com/v2/icon/{icon_id}"
    try:
        response = requests.get(url, auth=auth)
        if response.status_code == 200:
            data = response.json()
            icon = data.get("icon", {})
            print(f"\n--- Icon {icon_id} details: ---")
            print(f"Name: {icon.get('name')}")
            # Check for SVG fields
            print(f"Thumbnail URL: {icon.get('thumbnail_url')}")
            print(f"Preview URL: {icon.get('preview_url')}")
            print(f"Icon URL: {icon.get('icon_url')}")
            print(f"SVG URL: {icon.get('svg_url')}")
            # List all keys to see what is returned
            print(f"Available keys: {list(icon.keys())}")
        else:
            print(f"Failed for {icon_id}: {response.status_code} {response.text}")
    except Exception as e:
        print(f"Error for {icon_id}: {e}")
