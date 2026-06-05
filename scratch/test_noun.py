import os
import requests
from requests_oauthlib import OAuth1

API_KEY = "46a9042db91e422898eb3efd5025cb03"
SECRET = "0a629008d53546bfbc30bcd449381c5a"

queries = ["audit", "creative", "audience", "budget", "funnel", "competitor"]

auth = OAuth1(API_KEY, SECRET)

for q in queries:
    url = f"https://api.thenounproject.com/v2/icon?query={q}&limit=5"
    try:
        response = requests.get(url, auth=auth)
        if response.status_code == 200:
            data = response.json()
            print(f"\n--- Search results for '{q}': ---")
            icons = data.get("icons", [])
            for idx, icon in enumerate(icons):
                print(f"Icon {idx+1}: {icon.get('name')} (ID: {icon.get('id')})")
                # SVG URL is often in icon.get('thumbnail_url') or similar
                print(f"  Thumbnail: {icon.get('thumbnail_url')}")
                # Sometimes raw svg is only in public domain icons, let's check
                print(f"  Permalink: {icon.get('permalink')}")
        else:
            print(f"Failed to search for '{q}': {response.status_code} {response.text}")
    except Exception as e:
        print(f"Error searching for '{q}': {e}")
