import urllib.request
import re

url = 'https://dezm0n.itch.io/nfs-most-wanted-web-port'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')

# Check game data
matches = re.findall(r'init_ViewHtmlGame\([^\)]+\)', html)
for m in matches:
    print(m)

matches2 = re.findall(r'init_HtmlEmbed\([^\)]+\)', html)
for m in matches2:
    print(m)
