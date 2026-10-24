import urllib.request
import re
import json

url = "https://drive.google.com/drive/folders/1f-kGBY-djNnaCztj5-p704g1zxOnztOW?usp=sharing"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
html = urllib.request.urlopen(req).read().decode("utf-8", errors="ignore")

title_match = re.search(r"<title>(.*?)</title>", html)
print("Folder Title:", title_match.group(1) if title_match else "Unknown")

pattern = r'\[\[null,"([a-zA-Z0-9_-]{28,})"\].*?"([^"]+?\.(?:png|jpg|jpeg|zip|pdf|exe|wasm|wad|txt|iso))"'
matches = re.findall(pattern, html)
print(f"Total Matches: {len(matches)}")

seen = set()
for file_id, file_name in matches:
    if (file_id, file_name) not in seen:
        seen.add((file_id, file_name))
        print(f"File ID: {file_id} | Name: {file_name}")
