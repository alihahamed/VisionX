import urllib.request
import json
import time

t0 = time.time()
url = "https://api.github.com/repos/facebook/react/commits?per_page=100"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read())
        print(f"Fetched {len(data)} commits in {time.time() - t0:.2f}s")
except Exception as e:
    print(f"Error: {e}")
