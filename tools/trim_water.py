"""Shrink data/water_shapes.js in place by simplifying geometry further
(~70 m tolerance) — invisible at phone-map zoom, no network needed."""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, "data", "water_shapes.js")

with open(P, encoding="utf-8") as f:
    src = f.read()
start = src.index("WF.WATER_SHAPES = ") + len("WF.WATER_SHAPES = ")
end = src.rindex(";")
shapes = json.loads(src[start:end])

TOL = 0.0006  # ~70 m


def decim(coords):
    out = []
    for c in coords:
        if not out:
            out.append(c); continue
        dx, dy = c[0] - out[-1][0], c[1] - out[-1][1]
        if dx * dx + dy * dy >= TOL * TOL:
            out.append(c)
    if out[-1] != coords[-1]:
        out.append(coords[-1])
    return out


def ring(r):
    return decim(r) if len(r) > 8 else r


before = os.path.getsize(P)
for k, g in shapes.items():
    if g["type"] == "Polygon":
        g["coordinates"] = [ring(r) for r in g["coordinates"]]
    elif g["type"] == "MultiPolygon":
        g["coordinates"] = [[ring(r) for r in poly] for poly in g["coordinates"]]
    elif g["type"] == "MultiLineString":
        g["coordinates"] = [decim(l) for l in g["coordinates"]]

with open(P, "w", encoding="utf-8") as f:
    f.write("// WA Fish - real lake/river geometry from OpenStreetMap (Overpass), baked\n")
    f.write("// for offline use. Keyed by water-body id. Regenerate: tools/fetch_water.py\n")
    f.write("window.WF = window.WF || {};\nWF.WATER_SHAPES = ")
    f.write(json.dumps(shapes, separators=(",", ":")))
    f.write(";\n")
print("trimmed %d KB -> %d KB" % (before // 1024, os.path.getsize(P) // 1024))
