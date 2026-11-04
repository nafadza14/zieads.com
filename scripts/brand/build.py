"""ZieAds logo concepts. Every shape is constructed from primitives and expanded to outlines (no live text)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from geo import *

OUT = os.path.join(os.path.dirname(__file__), "concepts")
os.makedirs(OUT, exist_ok=True)
INK = "#111111"
ORANGE = "#F26522"

# ── Wordmark: monoline rounded lowercase, weight 28 on a 256 high canvas ──
W = 28
TOP, BOT = 106, 182          # centrelines of x-height and baseline (outer 92 to 196)
ASC = 66                     # ascender centreline (outer 52)
CY = (TOP + BOT) / 2         # 144
R = (BOT - TOP) / 2          # 38


def g_z(x):
    return polyline([(x + 14, TOP), (x + 80, TOP), (x + 14, BOT), (x + 82, BOT)], W)


def g_i(x, ears=False):
    stem = polyline([(x + 14, TOP), (x + 14, BOT)], W)
    if not ears:
        return union(stem, circle(x + 14, ASC - 4, 15))
    # Two small ears instead of the dot: Zie peeking over the line
    e1 = capsule(x + 5, 28, 76, 16, angle=-15, pivot=(x + 5, 76))
    e2 = capsule(x + 23, 28, 76, 16, angle=15, pivot=(x + 23, 76))
    return union(stem, e1, e2)


def g_e(x):
    cx = x + 14 + R
    bar = polyline([(cx - R, CY), (cx + R, CY)], W)
    p = path()
    p.addArc(skia.Rect(cx - R, CY - R, cx + R, CY + R), 0, -285)
    return union(bar, stroke(p, W))


def g_a(x, asc=False):
    cx = x + 14 + R
    bowl = stroke(circle(cx, CY, R), W)
    stem = polyline([(cx + R, ASC if asc else TOP), (cx + R, BOT)], W)
    return union(bowl, stem)


def g_s(x):
    p = path()
    p.moveTo(x + 66, TOP + 11)
    p.cubicTo(x + 60, TOP + 3, x + 50, TOP, x + 40, TOP)
    p.cubicTo(x + 25, TOP, x + 14, TOP + 8, x + 14, TOP + 19)
    p.cubicTo(x + 14, CY - 6, x + 27, CY - 3, x + 40, CY)
    p.cubicTo(x + 54, CY + 3, x + 67, CY + 7, x + 67, BOT - 18)
    p.cubicTo(x + 67, BOT - 7, x + 55, BOT, x + 40, BOT)
    p.cubicTo(x + 28, BOT, x + 17, BOT - 4, x + 11, BOT - 13)
    return stroke(p, W)


def wordmark(ears=False, x0=0):
    """'zieads' with optical spacing: straight sides get more room than round ones."""
    parts, x = [], x0
    seq = [("z", g_z, 96, 10), ("i", lambda x: g_i(x, ears), 28, 12), ("e", g_e, 104, 8), ("a", g_a, 104, 8),
           ("d", lambda x: g_a(x, True), 104, 10), ("s", g_s, 81, 0)]
    for name, fn, adv, gap in seq:
        parts.append(fn(x))
        x += adv + gap
    return union(*parts), x


def write(name, layers, w=256, h=256):
    with open(os.path.join(OUT, name), "w") as f:
        f.write(svg(layers, w, h))


# ── A: Zie tile. The orange squircle grows Zie's ears; the smile stays as a cut out ──
def concept_a(tilt=15):
    body = squircle(24, 96, 208, 144, 64)
    # Ears lean outward, tops apart, bases sunk into the head
    e1 = ellipse(88, 80, 26, 66, angle=-tilt)
    e2 = ellipse(168, 80, 26, 66, angle=tilt)
    smile = arc_stroke(128, 132, 56, 55, 125, 18)
    return diff(union(body, e1, e2), smile)


# ── B: The smiling Z. A Z whose bottom stroke is the smile, cut out of the squircle ──
def concept_b():
    tile = squircle(16, 16, 224, 224, 60)
    p = path()
    p.moveTo(82, 84)
    p.lineTo(176, 84)
    p.lineTo(88, 172)
    p.cubicTo(114, 196, 150, 196, 176, 172)
    z = stroke(p, 30)
    return diff(tile, z), z


# ── C: Peeking i. Wordmark first; the i's dot is two ears. Symbol: the ear i in a tile ──
def concept_c_symbol():
    tile = squircle(16, 16, 224, 224, 60)
    i = scale(g_i(0, ears=True), 1.25)
    l, t, r, b = bounds(i)
    i = translate(i, 128 - (l + r) / 2, 128 - (t + b) / 2 - 4)
    return diff(tile, i)


if __name__ == "__main__":
    a = concept_a(8)
    write("a-symbol-v1.svg", [(a, INK)])
    a2 = concept_a(15)
    write("a-symbol-v2.svg", [(a2, INK)])
    b, bz = concept_b()
    write("b-symbol.svg", [(b, INK)])
    write("c-symbol.svg", [(concept_c_symbol(), INK)])

    plain, wmw = wordmark(False)
    ears, _ = wordmark(True)
    write("wordmark-plain.svg", [(plain, INK)], int(wmw) + 4, 256)
    write("c-wordmark.svg", [(ears, INK)], int(wmw) + 4, 256)

    # Lockups: symbol at 256 tall, gap 40, wordmark scaled so x-height matches ~45% of symbol
    def lockup(sym, word, name):
        s = 0.8
        w2 = scale(word, s)
        l, t, r, b = bounds(w2)
        w2 = translate(w2, 256 + 36 - l, 128 - (t + b) / 2 + 6)
        write(name, [(sym, INK), (w2, INK)], int(256 + 36 + (r - l)) + 8, 256)

    lockup(a2, plain, "a-lockup.svg")
    lockup(b, plain, "b-lockup.svg")
    write("c-lockup.svg", [(ears, INK)], int(wmw) + 4, 256)
    print("ok", wmw)
