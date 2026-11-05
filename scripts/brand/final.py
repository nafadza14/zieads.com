"""Run: pip install skia-python pillow; python3 scripts/brand/final.py (rsvg-convert needed).
Final ZieAds identity (direction B, Smiling Z): master SVGs, small-size cut, web icons, TS path module."""
import os, sys, subprocess, json
sys.path.insert(0, os.path.dirname(__file__))
from geo import *
import build as B

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PUB = os.path.join(REPO, "public")
BRAND = os.path.join(PUB, "brand")
os.makedirs(BRAND, exist_ok=True)
ORANGE, INK, WHITE = "#F26522", "#111111", "#FFFFFF"


def smiling_z(small=False):
    """The Z whose bottom stroke is the smile. Diagonal at exactly 45 degrees, round caps and joins.
    Centred a few units above the middle of the tile (optical centre). The small cut is bolder."""
    p = path()
    if not small:
        p.moveTo(82, 78)
        p.lineTo(176, 78)
        p.lineTo(88, 166)
        p.cubicTo(114, 190, 150, 190, 176, 166)
        return stroke(p, 30)
    p.moveTo(76, 76)
    p.lineTo(180, 76)
    p.lineTo(84, 172)
    p.cubicTo(112, 198, 152, 198, 180, 172)
    return stroke(p, 40)


def symbol(small=False):
    """Direction B, Smiling Z: an orange squircle tile with the Z cut out of it."""
    tile = squircle(16, 16, 224, 224, 60) if not small else squircle(8, 8, 240, 240, 62)
    return diff(tile, smiling_z(small))


def fit(p, box=256, pad=12):
    """Centre a path in the canvas; optical centre a touch above geometric."""
    l, t, r, b = bounds(p)
    s = (box - 2 * pad) / max(r - l, b - t)
    q = scale(p, s)
    l, t, r, b = bounds(q)
    return translate(q, (box - (r - l)) / 2 - l, (box - (b - t)) / 2 - t - 2)


def wordmark():
    w, _ = B.wordmark(False)
    l, t, r, b = bounds(w)
    return translate(w, -l, -t), (r - l), (b - t)


def save(name, text):
    with open(os.path.join(BRAND, name), "w") as f:
        f.write(text)


def rect_bg(w, h, fill, r=0):
    return f'  <rect width="{w}" height="{h}" rx="{r}" fill="{fill}"/>\n'


def with_bg(s, w, h, fill, r=0):
    return s.replace("  <title", rect_bg(w, h, fill, r) + "  <title", 1)


def png(svgfile, out, size, bg=None):
    cmd = ["rsvg-convert", "-w", str(size), "-h", str(size), "-a", svgfile, "-o", out]
    if bg:
        cmd[1:1] = ["-b", bg]
    subprocess.run(cmd, check=True)


if __name__ == "__main__":
    sym = fit(symbol(False))
    small = fit(symbol(True), pad=4)

    # Symbol masters
    for name, fill in [("zieads-symbol.svg", ORANGE), ("zieads-symbol-black.svg", INK), ("zieads-symbol-white.svg", WHITE)]:
        save(name, svg([(sym, fill)], title="ZieAds"))
    save("zieads-symbol-small.svg", svg([(small, ORANGE)], title="ZieAds"))

    # Wordmark and lockups: symbol height 1, x-height of the wordmark about 0.42 of it
    wm, ww, wh = wordmark()
    save("zieads-wordmark.svg", svg([(wm, INK)], int(ww + 1), int(wh + 1), "ZieAds"))
    save("zieads-wordmark-white.svg", svg([(wm, WHITE)], int(ww + 1), int(wh + 1), "ZieAds"))
    k = 132 / wh                     # wordmark 132 tall next to a 256 symbol
    wl = translate(scale(wm, k), 256 + 40, (256 - wh * k) / 2 + 14)
    LW = int(256 + 40 + ww * k + 8)
    save("zieads-logo.svg", svg([(sym, ORANGE), (wl, INK)], LW, 256, "ZieAds"))
    save("zieads-logo-white.svg", svg([(sym, ORANGE), (wl, WHITE)], LW, 256, "ZieAds"))
    save("zieads-logo-black.svg", svg([(sym, INK), (wl, INK)], LW, 256, "ZieAds"))

    # Favicon (small cut, transparent: the smile shows the tab colour)
    with open(os.path.join(PUB, "favicon.svg"), "w") as f:
        f.write(svg([(small, ORANGE)], title="ZieAds"))
    for s in (16, 32, 48):
        png(os.path.join(PUB, "favicon.svg"), os.path.join(PUB, f"favicon-{s}.png"), s)
    from PIL import Image
    ims = [Image.open(os.path.join(PUB, f"favicon-{s}.png")).convert("RGBA") for s in (16, 32, 48)]
    ims[2].save(os.path.join(PUB, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)], append_images=ims[:2])
    os.remove(os.path.join(PUB, "favicon-48.png"))

    # App icon: orange full bleed, white Zie, smile cut through to orange (platforms add their own mask)
    # App icon: the platform draws its own rounded tile, so it is the white Z on orange, full bleed
    icon_sym = fit(smiling_z(False), pad=64)
    app = with_bg(svg([(icon_sym, WHITE)], title="ZieAds"), 256, 256, ORANGE)
    save("zieads-app-icon.svg", app)
    tmp = os.path.join(BRAND, "zieads-app-icon.svg")
    png(tmp, os.path.join(PUB, "apple-touch-icon.png"), 180)
    png(tmp, os.path.join(PUB, "icon-192.png"), 192)
    png(tmp, os.path.join(PUB, "icon-512.png"), 512)
    # Maskable: more padding so circle masks never cut the ears
    mask_sym = fit(smiling_z(False), pad=80)
    save("zieads-app-icon-maskable.svg", with_bg(svg([(mask_sym, WHITE)], title="ZieAds"), 256, 256, ORANGE))
    png(os.path.join(BRAND, "zieads-app-icon-maskable.svg"), os.path.join(PUB, "icon-maskable-512.png"), 512)

    manifest = {
        "name": "ZieAds",
        "short_name": "ZieAds",
        "description": "The social media tool that tells you what to do next.",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#FFFFFF",
        "theme_color": ORANGE,
        "icons": [
            {"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    with open(os.path.join(PUB, "site.webmanifest"), "w") as f:
        json.dump(manifest, f, indent=2)

    # TypeScript module so React draws the same geometry everywhere
    def rule(p):
        return "evenodd" if p.getFillType() == skia.PathFillType.kEvenOdd else "nonzero"
    ts = f"""/*
  ZieAds logo geometry, generated from the master SVGs in public/brand (direction B, "Smiling Z":
  an orange tile with a Z cut out of it, whose bottom stroke is a smile). Do not edit by hand.
*/
export const ZIE_SYMBOL = {{ viewBox: '0 0 256 256', fillRule: '{rule(sym)}' as const, d: '{to_d(sym)}' }};
/** Thicker cut for 24 px and below */
export const ZIE_SYMBOL_SMALL = {{ viewBox: '0 0 256 256', fillRule: '{rule(small)}' as const, d: '{to_d(small)}' }};
export const ZIE_WORDMARK = {{ viewBox: '0 0 {int(ww + 1)} {int(wh + 1)}', width: {int(ww + 1)}, height: {int(wh + 1)}, fillRule: '{rule(wm)}' as const, d: '{to_d(wm)}' }};
export const ZIE_ORANGE = '{ORANGE}';
"""
    with open(os.path.join(REPO, "src/components/zieadsLogoPaths.ts"), "w") as f:
        f.write(ts)
    print("done", LW, ww, wh)
