import urllib.request
import re

url = 'https://dezm0n.itch.io/nfs-most-wanted-web-port'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')

match = re.search(r'<div class="formatted_description user_formatted">(.*?)<div class="game_info_panel', html, re.DOTALL)
if match:
    text = re.sub(r'<[^>]+>', ' ', match.group(1))
    print(text.strip())
else:
    print('Not found')
