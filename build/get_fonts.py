"""Downloads the page's Google Fonts once and writes fonts.css with them embedded (base64)."""
import base64, pathlib, re, urllib.request

URL = ("https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800"
       "&family=Barlow:wght@400;500;600&family=Cairo:wght@500&display=swap")
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"}
KEEP = {"latin", "arabic"}  # skip latin-ext / vietnamese subsets to keep the app small

css = urllib.request.urlopen(urllib.request.Request(URL, headers=UA)).read().decode()
out = []
for subset, block in re.findall(r"/\* ([\w-]+) \*/\s*(@font-face \{.*?\})", css, re.S):
    if subset not in KEEP:
        continue
    url = re.search(r"url\((https://[^)]+)\)", block).group(1)
    data = urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read()
    block = block.replace(url, "data:font/woff2;base64," + base64.b64encode(data).decode())
    out.append(block)
pathlib.Path(__file__).with_name("fonts.css").write_text("\n".join(out), encoding="utf-8")
print(len(out), "font faces,", sum(map(len, out)) // 1024, "KB")
