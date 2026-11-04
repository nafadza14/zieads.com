"""Small geometry kit on top of skia: strokes expanded to outlines, booleans, SVG path output."""
import math
import skia

ROUND = dict(cap=skia.Paint.kRound_Cap, join=skia.Paint.kRound_Join)


def path():
    return skia.Path()


def stroke(p, width, cap="round", join="round"):
    paint = skia.Paint(
        Style=skia.Paint.kStroke_Style,
        StrokeWidth=width,
        StrokeCap={"round": skia.Paint.kRound_Cap, "butt": skia.Paint.kButt_Cap, "square": skia.Paint.kSquare_Cap}[cap],
        StrokeJoin={"round": skia.Paint.kRound_Join, "miter": skia.Paint.kMiter_Join}[join],
        AntiAlias=True,
    )
    out = skia.Path()
    paint.getFillPath(p, out)
    return simplify(out)


def simplify(p):
    r = skia.Simplify(p)
    return r if r is not None else p


def union(*ps):
    acc = ps[0]
    for p in ps[1:]:
        acc = skia.Op(acc, p, skia.PathOp.kUnion_PathOp)
    return acc


def diff(a, b):
    return skia.Op(a, b, skia.PathOp.kDifference_PathOp)


def inter(a, b):
    return skia.Op(a, b, skia.PathOp.kIntersect_PathOp)


def rrect(x, y, w, h, r):
    p = skia.Path()
    p.addRRect(skia.RRect.MakeRectXY(skia.Rect(x, y, x + w, y + h), r, r))
    return p


def squircle(x, y, w, h, r, k=0.82):
    """Rounded rect with smooth (continuous curvature) corners: corner starts 1.28 r before the corner."""
    s = r * 1.28
    c = s * k
    p = skia.Path()
    p.moveTo(x + s, y)
    p.lineTo(x + w - s, y)
    p.cubicTo(x + w - s + c, y, x + w, y + s - c, x + w, y + s)
    p.lineTo(x + w, y + h - s)
    p.cubicTo(x + w, y + h - s + c, x + w - s + c, y + h, x + w - s, y + h)
    p.lineTo(x + s, y + h)
    p.cubicTo(x + s - c, y + h, x, y + h - s + c, x, y + h - s)
    p.lineTo(x, y + s)
    p.cubicTo(x, y + s - c, x + s - c, y, x + s, y)
    p.close()
    return p


def circle(cx, cy, r):
    p = skia.Path()
    p.addCircle(cx, cy, r)
    return p


def capsule(cx, y0, y1, w, angle=0.0, pivot=None):
    """Vertical capsule centred on cx from y0 to y1, optionally rotated (degrees) around pivot."""
    p = rrect(cx - w / 2, y0, w, y1 - y0, w / 2)
    if angle:
        px, py = pivot or (cx, y1)
        m = skia.Matrix.RotateDeg(angle, skia.Point(px, py))
        p.transform(m)
    return p


def arc_stroke(cx, cy, r, a0, a1, width):
    """Stroked circular arc from angle a0 to a1 (degrees, y down), round caps."""
    p = skia.Path()
    p.addArc(skia.Rect(cx - r, cy - r, cx + r, cy + r), a0, a1 - a0)
    return stroke(p, width)


def polyline(pts, width, cap="round", join="round"):
    p = skia.Path()
    p.moveTo(*pts[0])
    for q in pts[1:]:
        p.lineTo(*q)
    return stroke(p, width, cap, join)


def ellipse(cx, cy, rx, ry, angle=0.0):
    p = skia.Path()
    p.addOval(skia.Rect(cx - rx, cy - ry, cx + rx, cy + ry))
    if angle:
        p.transform(skia.Matrix.RotateDeg(angle, skia.Point(cx, cy)))
    return p


def translate(p, dx, dy):
    q = skia.Path(p)
    q.offset(dx, dy)
    return q


def scale(p, s, ox=0, oy=0):
    q = skia.Path(p)
    q.transform(skia.Matrix.Scale(s, s) if not (ox or oy) else skia.Matrix().setScale(s, s, ox, oy))
    return q


def bounds(p):
    b = p.computeTightBounds()
    return b.left(), b.top(), b.right(), b.bottom()


def _f(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s == "-0" else s


def to_d(p):
    out = []
    it = skia.Path.Iter(p, False)
    while True:
        verb, pts = it.next()
        if verb == skia.Path.Verb.kDone_Verb:
            break
        if verb == skia.Path.Verb.kMove_Verb:
            out.append(f"M{_f(pts[0].x())} {_f(pts[0].y())}")
        elif verb == skia.Path.Verb.kLine_Verb:
            out.append(f"L{_f(pts[1].x())} {_f(pts[1].y())}")
        elif verb == skia.Path.Verb.kQuad_Verb:
            out.append(f"Q{_f(pts[1].x())} {_f(pts[1].y())} {_f(pts[2].x())} {_f(pts[2].y())}")
        elif verb == skia.Path.Verb.kCubic_Verb:
            out.append("C" + " ".join(f"{_f(q.x())} {_f(q.y())}" for q in pts[1:4]))
        elif verb == skia.Path.Verb.kConic_Verb:
            w = it.conicWeight()
            quads = skia.Path.ConvertConicToQuads(pts[0], pts[1], pts[2], w, 2)
            # quads = [p0, c1, p1, c2, p2, ...]
            for i in range(1, len(quads) - 1, 2):
                out.append(f"Q{_f(quads[i].x())} {_f(quads[i].y())} {_f(quads[i+1].x())} {_f(quads[i+1].y())}")
        elif verb == skia.Path.Verb.kClose_Verb:
            out.append("Z")
    return "".join(out)


def svg(layers, w=256, h=256, title="ZieAds logo"):
    """layers: list of (path, fill)"""
    def rule(p):
        return ' fill-rule="evenodd"' if p.getFillType() in (skia.PathFillType.kEvenOdd, skia.PathFillType.kInverseEvenOdd) else ""
    body = "\n".join(f'  <path fill="{fill}"{rule(p)} d="{to_d(p)}"/>' for p, fill in layers)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-labelledby="t">\n'
        f'  <title id="t">{title}</title>\n{body}\n</svg>\n'
    )
