"""Move every lake's coordinate (which sets its map-bubble position) onto the
actual water. For lakes with a real OSM polygon, compute a robust interior
point; for the circle-fallback lakes, apply hand-checked OSM coordinates.
Patches data/spots.js in place."""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHAPES_P = os.path.join(ROOT, "data", "water_shapes.js")
SPOTS_P = os.path.join(ROOT, "data", "spots.js")

s = open(SHAPES_P, encoding="utf-8").read()
m = "WF.WATER_SHAPES = "
SHAPES = json.loads(s[s.index(m) + len(m):s.rindex(";")])

# circle-fallback lakes (no polygon) — coordinates verified against OSM features
CIRCLE_FIX = {
    "beaver-lake": (47.5850, -122.0095),       # beside Beaver Lake Park, Sammamish
    "long-lake-kitsap": (47.4256, -122.6564),  # Long Lake County Park, Port Orchard
    "sprague-lake": (47.2350, -118.1000),       # at Sprague Lake dam, off I-90
}


def inside(x, y, geom):
    def inring(r):
        c = False; n = len(r); j = n - 1
        for i in range(n):
            xi, yi = r[i]; xj, yj = r[j]
            if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
                c = not c
            j = i
        return c
    def inpoly(p):
        if not inring(p[0]):
            return False
        return not any(inring(h) for h in p[1:])
    if geom["type"] == "Polygon":
        return inpoly(geom["coordinates"])
    return any(inpoly(p) for p in geom["coordinates"])


def interior(geom):
    minx = miny = 1e9; maxx = maxy = -1e9
    polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
    for p in polys:
        for q in p[0]:
            minx = min(minx, q[0]); maxx = max(maxx, q[0])
            miny = min(miny, q[1]); maxy = max(maxy, q[1])
    N = 30; pts = []
    for i in range(N):
        for j in range(N):
            x = minx + (i + 0.5) / N * (maxx - minx)
            y = miny + (j + 0.5) / N * (maxy - miny)
            if inside(x, y, geom):
                pts.append((x, y))
    if not pts:
        return ((miny + maxy) / 2, (minx + maxx) / 2)
    ax = sum(p[0] for p in pts) / len(pts)
    ay = sum(p[1] for p in pts) / len(pts)
    if inside(ax, ay, geom):
        return (ay, ax)
    best = min(pts, key=lambda p: (p[0] - ax) ** 2 + (p[1] - ay) ** 2)
    return (best[1], best[0])


src = open(SPOTS_P, encoding="utf-8").read()
lake_ids = re.findall(r'id: "([^"]+)", name: "[^"]*", fishery: "lake"', src)
changes = 0
for lid in lake_ids:
    if lid in CIRCLE_FIX:
        nlat, nlng = CIRCLE_FIX[lid]
    else:
        g = SHAPES.get("wb-" + lid)
        if not g:
            continue
        nlat, nlng = interior(g)
    pat = re.compile(r'(id: "%s",[\s\S]{0,220}?lat: )(-?[\d.]+)(, lng: )(-?[\d.]+)' % re.escape(lid))
    mobj = pat.search(src)
    if not mobj:
        print("  !! no coord match for", lid); continue
    olat, olng = float(mobj.group(2)), float(mobj.group(4))
    if abs(olat - nlat) + abs(olng - nlng) < 0.0015:
        continue  # already good
    src = pat.sub(lambda mm: "%s%.4f%s%.4f" % (mm.group(1), nlat, mm.group(3), nlng), src, count=1)
    print("  moved %-22s [%.4f,%.4f] -> [%.4f,%.4f]" % (lid, olat, olng, nlat, nlng))
    changes += 1

open(SPOTS_P, "w", encoding="utf-8").write(src)
print("updated %d lake coordinates" % changes)
