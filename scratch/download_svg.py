import urllib.request

urls = [
    "https://static.thenounproject.com/svg/6418273.svg",
    "https://static.thenounproject.com/svg/6418273_200.svg",
    "https://static.thenounproject.com/svg/6418273-200.svg"
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp:
            print(f"URL: {url} - Status: {resp.status}")
            # Try to read the beginning of the file to see if it's XML/SVG
            snippet = resp.read(100)
            print(f"  Snippet: {snippet}")
    except Exception as e:
        print(f"URL: {url} - Error: {e}")
