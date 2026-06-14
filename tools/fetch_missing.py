"""Fetch the handful of lakes that didn't match a clean OSM polygon in the main
fetch and merge them into data/water_shapes.js in place. Two of them (Long Lake
in Kitsap, Sprague Lake) are pinned by OSM relation id because name+bbox search
collides with same-named lakes elsewhere; the rest match by regex name in a
corrected bbox. Prints each shape's centroid so spots.js can be aligned."""
import json, os, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
spec = importlib.util.spec_from_file_location("fw", os.path.join(HERE, "fetch_water.py"))
fw = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fw)

# Lakes matched by regex name + corrected bbox: (body id, regex name, lat, lng, bbox half)
BY_NAME = [
    ("wb-beaver-lake", "Beaver Lake", 47.585, -122.020, 0.04),
    ("wb-tanwax-lake", "Tanwax", 46.947, -122.270, 0.04),
]
# Lakes pinned by OSM relation id (name+bbox search is ambiguous for these):
BY_REL = [
    ("wb-long-lake-kitsap", 5292044),  # Long Lake, Kitsap Co. (SE of Port Orchard)
    ("wb-sprague-lake", 282935),       # Sprague Lake, Lincoln/Adams Co.
]


def build_relation(elements, rid):
    """Stitch a single relation's outer/inner ways into a (Multi)Polygon."""
    outer, inner = [], []
    for el in elements:
        if el.get("type") == "relation" and el.get("id") == rid:
            for m in el.get("members", []):
                if m.get("type") == "way" and "geometry" in m:
                    coords = [[p["lon"], p["lat"]] for p in m["geometry"]]
                    (inner if m.get("role") == "inner" else outer).append(coords)
    O = fw.stitch(outer)
    I = fw.stitch(inner)
    if not O:
        return None
    O.sort(key=len, reverse=True)
    polys = []
    for o in O:
        ring = fw.r5(fw.decimate(o))
        holes = [fw.r5(fw.decimate(h)) for h in I if len(h) > 6]
        polys.append([ring] + holes)
        I = []  # holes only on the largest outer
    if len(polys) == 1:
        return {"type": "Polygon", "coordinates": polys[0]}
    return {"type": "MultiPolygon", "coordinates": [[p[0]] for p in polys]}


def centroid(g):
    rings = [g["coordinates"][0]] if g["type"] == "Polygon" else [p[0] for p in g["coordinates"]]
    xs = [p[0] for r in rings for p in r]
    ys = [p[1] for r in rings for p in r]
    return sum(ys) / len(ys), sum(xs) / len(xs)


# one Overpass call: named ways/relations in their bboxes + the pinned relations
parts = []
for _id, name, lat, lng, h in BY_NAME:
    bbox = "%f,%f,%f,%f" % (lat - h, lng - h, lat + h, lng + h)
    nf = '["name"~"%s",i]' % name
    parts.append('way["natural"="water"]%s(%s);' % (nf, bbox))
    parts.append('relation["natural"="water"]%s(%s);' % (nf, bbox))
for _id, rid in BY_REL:
    parts.append("relation(%d);" % rid)
q = "[out:json][timeout:180];(" + "".join(parts) + ");out geom;"
res = fw.overpass(q)
if not res:
    raise SystemExit("overpass failed")

p = os.path.join(ROOT, "data", "water_shapes.js")
s = open(p, encoding="utf-8").read()
m = "WF.WATER_SHAPES = "
shapes = json.loads(s[s.index(m) + len(m):s.rindex(";")])

for _id, name, lat, lng, h in BY_NAME:
    g = fw.lake_geometry(res["elements"], name, (lat - h, lng - h, lat + h, lng + h), False)
    if g:
        shapes[_id] = g
        cy, cx = centroid(g)
        print("  ok  %-22s %-13s centroid=(%.4f, %.4f)" % (_id, g["type"], cy, cx))
    else:
        print("  --  %-22s still no shape" % _id)
for _id, rid in BY_REL:
    g = build_relation(res["elements"], rid)
    if g:
        shapes[_id] = g
        cy, cx = centroid(g)
        print("  ok  %-22s %-13s centroid=(%.4f, %.4f)" % (_id, g["type"], cy, cx))
    else:
        print("  --  %-22s relation %d had no shape" % (_id, rid))

with open(p, "w", encoding="utf-8") as f:
    f.write("// WA Fish - real lake/river geometry from OpenStreetMap (Overpass), baked\n")
    f.write("// for offline use. Keyed by water-body id. Regenerate: tools/fetch_water.py\n")
    f.write("window.WF = window.WF || {};\nWF.WATER_SHAPES = ")
    f.write(json.dumps(shapes, separators=(",", ":")))
    f.write(";\n")
print("shapes now: %d" % len(shapes))
