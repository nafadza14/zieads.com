"""Run: python3 scripts/brand/og.py, then screenshot og.html at 1200x630 (2x) into public/og-image.png.
Link preview banner (1200 x 630) for zieads.com: logo, Zie the AI agent, and every connectable network."""
import re, base64, os, subprocess

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
marks_ts = open(f"{REPO}/src/components/v3/brandMarks.ts").read()
MARKS = {m[0]: {"viewBox": m[1], "hex": m[2], "path": m[3]} for m in re.findall(r"  (\w+): \{ viewBox: '([^']+)', hex: '([^']+)', path: '([^']+)' \}", marks_ts)}

# The networks a user can connect today, in the Connections order
NETS = ["instagram", "facebook", "threads", "tiktok", "linkedin", "youtube", "pinterest", "telegram", "discord", "bluesky", "mastodon"]
NAMES = {"instagram": "Instagram", "facebook": "Facebook", "threads": "Threads", "tiktok": "TikTok", "linkedin": "LinkedIn", "youtube": "YouTube", "pinterest": "Pinterest", "telegram": "Telegram", "discord": "Discord", "bluesky": "Bluesky", "mastodon": "Mastodon"}


def tile(key, size):
    """Same construction as SocialIcon variant 'tile'."""
    m = MARKS[key]
    s = float(m["viewBox"].split()[2])
    pad = s * 0.22
    full = s + pad * 2
    r = full * 0.24
    vb = f"{-pad} {-pad} {full} {full}"
    bg = f'<rect x="{-pad}" y="{-pad}" width="{full}" height="{full}" rx="{r}" fill="{m["hex"]}"/>'
    glyph = f'<path d="{m["path"]}" fill="#fff"/>'
    defs = ""
    if key == "instagram":
        defs = '<defs><radialGradient id="ig" cx="30%" cy="107%" r="150%"><stop offset="0" stop-color="#fdf497"/><stop offset="0.05" stop-color="#fdf497"/><stop offset="0.45" stop-color="#fd5949"/><stop offset="0.6" stop-color="#d6249f"/><stop offset="0.9" stop-color="#285AEB"/></radialGradient></defs>'
        bg = f'<rect x="{-pad}" y="{-pad}" width="{full}" height="{full}" rx="{r}" fill="url(#ig)"/>'
    if key == "tiktok":
        bg = f'<rect x="{-pad}" y="{-pad}" width="{full}" height="{full}" rx="{r}" fill="#000"/>'
        glyph = (f'<path d="{m["path"]}" fill="#25F4EE" transform="translate({-s*0.035} {-s*0.03})"/>'
                 f'<path d="{m["path"]}" fill="#FE2C55" transform="translate({s*0.035} {s*0.03})"/>'
                 f'<path d="{m["path"]}" fill="#fff"/>')
    if key in ("linkedin", "facebook"):
        bg = f'<rect x="{-pad}" y="{-pad}" width="{full}" height="{full}" rx="{r}" fill="#fff" stroke="rgba(0,0,0,0.08)" stroke-width="{s*0.03}"/>'
        glyph = f'<path d="{m["path"]}" fill="{m["hex"]}"/>'
    return f'<svg width="{size}" height="{size}" viewBox="{vb}" xmlns="http://www.w3.org/2000/svg">{defs}{bg}{glyph}</svg>'


logo = open(f"{REPO}/public/brand/zieads-logo.svg").read()
logo = re.sub(r'width="\d+" height="\d+"', 'height="58"', logo, count=1)
symbol_small = open(f"{REPO}/public/brand/zieads-symbol.svg").read()
zie = base64.b64encode(open(f"{REPO}/public/zie/zie.webp", "rb").read()).decode()

tiles = "".join(f'<span class="net" title="{NAMES[k]}">{tile(k, 46)}</span>' for k in NETS)

html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{ width: 1200px; height: 630px; background: #f6f5f3; font-family: Inter, sans-serif; color: #111; overflow: hidden; }}
.wrap {{ position: relative; width: 1200px; height: 630px; padding: 56px 64px; }}
.left {{ position: absolute; left: 64px; top: 56px; width: 640px; }}
.logo {{ display: block; height: 58px; }}
h1 {{ margin-top: 44px; font-size: 56px; line-height: 1.05; letter-spacing: -0.035em; font-weight: 800; }}
h1 em {{ font-style: normal; color: #F26522; }}
.sub {{ margin-top: 22px; font-size: 24px; line-height: 1.4; color: #505050; letter-spacing: -0.01em; max-width: 600px; }}
.sub b {{ color: #111; font-weight: 700; }}
.nets {{ position: absolute; left: 64px; bottom: 52px; }}
.nets-label {{ font-size: 16px; font-weight: 600; color: #8a8a8a; margin-bottom: 14px; }}
.row {{ display: flex; gap: 10px; }}
.net svg {{ display: block; border-radius: 11px; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }}
.card {{ position: absolute; right: 56px; top: 64px; width: 390px; height: 392px; background: #fff; border-radius: 28px; box-shadow: 0 18px 50px rgba(17,17,17,0.10); overflow: hidden; }}
.zie {{ position: absolute; left: 50%; top: 18px; width: 230px; height: 230px; transform: translateX(-50%); }}
.tag {{ position: absolute; left: 24px; right: 24px; bottom: 24px; }}
.who {{ display: flex; align-items: center; gap: 10px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }}
.who span {{ font-size: 14px; font-weight: 600; color: #505050; border: 1px solid #e7e7e7; border-radius: 999px; padding: 4px 10px; letter-spacing: 0; }}
.say {{ margin-top: 10px; font-size: 17px; line-height: 1.4; color: #505050; }}
.todo {{ position: absolute; right: 56px; top: 472px; width: 390px; display: flex; flex-direction: column; gap: 8px; }}
.todo div {{ display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #e7e7e7; border-radius: 12px; padding: 9px 14px; font-size: 16px; font-weight: 600; }}
.todo i {{ width: 8px; height: 8px; border-radius: 50%; background: #F26522; flex-shrink: 0; }}
.url {{ position: absolute; right: 58px; bottom: 22px; font-size: 15px; font-weight: 600; color: #8a8a8a; }}
</style></head><body><div class="wrap">
  <div class="left">
    <div class="logo">{logo}</div>
    <h1>The social media tool that tells you <em>what to do next</em></h1>
    <p class="sub"><b>Zie</b>, your AI agent, reads every account each morning, drafts the posts and replies, and waits for your OK.</p>
  </div>
  <div class="nets"><div class="nets-label">Connect 11 networks</div><div class="row">{tiles}</div></div>
  <div class="card">
    <img class="zie" src="data:image/webp;base64,{zie}" alt="">
    <div class="tag">
      <div class="who">Zie <span>AI Agent</span></div>
      <p class="say">"Good morning! Here are 3 things to do today."</p>
    </div>
  </div>
  <div class="url">www.zieads.com</div>
  <div class="todo">
    <div><i></i>Reply to 4 buying questions</div>
    <div><i></i>Post the Reel at 19:00</div>
  </div>
</div></body></html>"""

out = os.path.join(os.path.dirname(__file__), "og.html")
open(out, "w").write(html)
print(out)
