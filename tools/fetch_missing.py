"""Retry the handful of lakes that didn't match a clean OSM polygon in the
main fetch — using regex (case-insensitive, name-order tolerant) matching and
corrected coordinates. Merges results into data/water_shapes.js in place."""
import json, os, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
spec = importlib.util.spec_from_file_location("fw", os.path.join(HERE, "fetch_water.py"))
fw = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fw)

# (body id, regex name, lat, lng, bbox half)
MISSING = [
    ("wb-beaver-lake", "Beaver Lake", 47.564, -122.064, 0.03),
    ("wb-long-lake-kitsap", "Long Lake", 47.436, -122.644, 0.04),
    ("wb-tanwax-lake", "Tanwax", 46.923, -122.221, 0.03),
    ("wb-fazon-lake", "Fazon", 48.847, -122.387, 0.03),
    ("wb-sprague-lake", "Sprague", 47.140, -118.045, 0.09),
    ("wb-lake-lenore", "Lenore", 47.490, -119.520, 0.09),
]

parts = []
for _id, name, lat, lng, h in MISSING:
    bbox = "%f,%f,%f,%f" % (lat - h, lng - h, lat + h, lng + h)
    nf = '["name"~"%s",i]' % name
    parts.append('way["natural"="water"]%s(%s);' % (nf, bbox))
    parts.append('relation["natural"="water"]%s(%s);' % (nf, bbox))
q = "[out:json][timeout:120];(" + "".join(parts) + ");out geom;"
res = fw.overpass(q)
if not res:
    raise SystemExit("overpass failed")

p = os.path.join(ROOT, "data", "water_shapes.js")
s = open(p, encoding="utf-8").read()
m = "WF.WATER_SHAPES = "
shapes = json.loads(s[s.index(m) + len(m):s.rindex(";")])

for _id, name, lat, lng, h in MISSING:
    g = fw.lake_geometry(res["elements"], name, (lat - h, lng - h, lat + h, lng + h), False)
    if g:
        shapes[_id] = g
        print("  ok  %-22s %s" % (_id, g["type"]))
    else:
        print("  --  %-22s still no shape" % _id)

with open(p, "w", encoding="utf-8") as f:
    f.write("// WA Fish - real lake/river geometry from OpenStreetMap (Overpass), baked\n")
    f.write("// for offline use. Keyed by water-body id. Regenerate: tools/fetch_water.py\n")
    f.write("window.WF = window.WF || {};\nWF.WATER_SHAPES = ")
    f.write(json.dumps(shapes, separators=(",", ":")))
    f.write(";\n")
print("shapes now: %d" % len(shapes))
