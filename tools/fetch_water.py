"""Fetch real lake polygons & river centerlines from OpenStreetMap (Overpass)
and bake them into data/water_shapes.js, keyed by water-body id. Run once;
offline thereafter. Falls back gracefully per-body if Overpass misses one."""
import json, os, time, urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OVERPASS = "https://overpass-api.de/api/interpreter"

# body id -> (osm name, center lat, lng, bbox half-size deg, exact-name?)
LAKES = [
    ("wb-lake-washington", "Lake Washington", 47.62, -122.26, 0.16, True),
    ("wb-lake-sammamish", "Lake Sammamish", 47.59, -122.08, 0.09, True),
    ("wb-green-lake", "Green Lake", 47.68, -122.33, 0.03, True),
    ("wb-angle-lake", "Angle Lake", 47.431, -122.289, 0.02, True),
    ("wb-lake-meridian", "Lake Meridian", 47.366, -122.143, 0.02, True),
    ("wb-baker-lake", "Baker Lake", 48.70, -121.66, 0.12, True),
    ("wb-lake-stevens", "Lake Stevens", 48.015, -122.064, 0.04, True),
    ("wb-american-lake", "American Lake", 47.123, -122.566, 0.04, True),
    ("wb-lake-cushman", "Lake Cushman", 47.50, -123.22, 0.10, True),
]
RIVERS = [
    ("wb-green-river", "Green River", 47.30, -122.22, 0.10),
    ("wb-puyallup-river", "Puyallup River", 47.21, -122.30, 0.10),
    ("wb-skagit-river", "Skagit River", 48.44, -122.34, 0.12),
    ("wb-snohomish-river", "Snohomish River", 47.92, -122.10, 0.10),
    ("wb-skykomish-river", "Skykomish River", 47.84, -121.77, 0.12),
    ("wb-nf-stilly", "Stillaguamish", 48.20, -122.13, 0.12),
    ("wb-samish-river", "Samish River", 48.55, -122.34, 0.08),
    ("wb-nisqually-river", "Nisqually River", 47.08, -122.70, 0.10),
    ("wb-sol-duc", "Sol Duc River", 47.95, -124.40, 0.14),
    ("wb-hoh-river", "Hoh River", 47.81, -124.25, 0.14),
    ("wb-bogachiel", "Bogachiel River", 47.89, -124.40, 0.12),
    ("wb-dungeness-river", "Dungeness River", 48.05, -123.13, 0.10),
    ("wb-chehalis-river", "Chehalis River", 46.95, -123.30, 0.14),
    ("wb-cowlitz-river", "Cowlitz River", 46.52, -122.60, 0.14),
]


def overpass(query):
    data = urllib.parse.urlencode({"data": query}).encode()
    for attempt in range(4):
        try:
            req = urllib.request.Request(OVERPASS, data=data, headers={"User-Agent": "wa-fish/1.0"})
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r)
        except Exception as e:
            print("   overpass retry", attempt + 1, e)
            time.sleep(5 + attempt * 5)
    return None


def decimate(coords, min_deg=0.0003):
    out = []
    for c in coords:
        if not out:
            out.append(c)
            continue
        dx = c[0] - out[-1][0]
        dy = c[1] - out[-1][1]
        if dx * dx + dy * dy >= min_deg * min_deg:
            out.append(c)
    if out[-1] != coords[-1]:
        out.append(coords[-1])
    return out


def r5(coords):
    return [[round(x, 5), round(y, 5)] for x, y in coords]


def near(a, b, tol=2e-4):
    return abs(a[0] - b[0]) < tol and abs(a[1] - b[1]) < tol


def stitch(ways):
    ways = [list(w) for w in ways if len(w) > 1]
    rings = []
    while ways:
        ring = ways.pop(0)
        changed = True
        while changed and not near(ring[0], ring[-1]):
            changed = False
            for i, w in enumerate(ways):
                if near(ring[-1], w[0]):
                    ring += w[1:]; ways.pop(i); changed = True; break
                if near(ring[-1], w[-1]):
                    ring += list(reversed(w))[1:]; ways.pop(i); changed = True; break
                if near(ring[0], w[-1]):
                    ring = w[:-1] + ring; ways.pop(i); changed = True; break
                if near(ring[0], w[0]):
                    ring = list(reversed(w))[1:] + ring; ways.pop(i); changed = True; break
        if len(ring) >= 4:
            rings.append(ring)
    return rings


def lake_geometry(elements, name):
    outer_ways, inner_ways, closed = [], [], []
    for el in elements:
        nm = el.get("tags", {}).get("name", "")
        if el["type"] == "way" and "geometry" in el:
            coords = [[p["lon"], p["lat"]] for p in el["geometry"]]
            if nm == name:
                closed.append(coords)
        elif el["type"] == "relation" and nm == name:
            for m in el.get("members", []):
                if m.get("type") == "way" and "geometry" in m:
                    coords = [[p["lon"], p["lat"]] for p in m["geometry"]]
                    (inner_ways if m.get("role") == "inner" else outer_ways).append(coords)
    outer = stitch(outer_ways) + [c for c in closed if near(c[0], c[-1])]
    inner = stitch(inner_ways)
    if not outer:
        # last resort: biggest closed way regardless of name match
        if closed:
            outer = [max(closed, key=len)]
        else:
            return None
    outer.sort(key=len, reverse=True)
    polys = []
    for o in outer:
        ring = r5(decimate(o))
        holes = [r5(decimate(h)) for h in inner if len(h) > 6]
        polys.append([ring] + holes)
        holes = []  # holes only on the largest outer
    if len(polys) == 1:
        return {"type": "Polygon", "coordinates": polys[0]}
    return {"type": "MultiPolygon", "coordinates": [[p[0]] for p in polys]}


def river_geometry(elements, name, bbox):
    s, w, n, e = bbox
    lines = []
    for el in elements:
        if el["type"] != "way" or "geometry" not in el:
            continue
        nm = el.get("tags", {}).get("name", "")
        if name.lower() not in nm.lower():
            continue
        seg = []
        for p in el["geometry"]:
            inside = (s <= p["lat"] <= n) and (w <= p["lon"] <= e)
            if inside:
                seg.append([p["lon"], p["lat"]])
            elif len(seg) > 1:
                lines.append(seg); seg = []
            else:
                seg = []
        if len(seg) > 1:
            lines.append(seg)
    lines = [r5(decimate(l)) for l in lines if len(l) > 1]
    if not lines:
        return None
    return {"type": "MultiLineString", "coordinates": lines}


def fetch_lakes():
    parts = []
    for _id, name, lat, lng, h, _ in LAKES:
        bbox = "%f,%f,%f,%f" % (lat - h, lng - h, lat + h, lng + h)
        parts.append('way["natural"="water"]["name"="%s"](%s);' % (name, bbox))
        parts.append('relation["natural"="water"]["name"="%s"](%s);' % (name, bbox))
    q = "[out:json][timeout:180];(" + "".join(parts) + ");out geom;"
    print("fetching %d lakes..." % len(LAKES))
    res = overpass(q)
    out = {}
    if not res:
        return out
    for _id, name, lat, lng, h, _ in LAKES:
        g = lake_geometry(res["elements"], name)
        if g:
            out[_id] = g
            print("  ok  %-22s %s" % (name, g["type"]))
        else:
            print("  --  %-22s (no shape)" % name)
    return out


def fetch_rivers():
    out = {}
    for _id, name, lat, lng, h in RIVERS:
        bbox = (lat - h, lng - h, lat + h, lng + h)
        bs = "%f,%f,%f,%f" % bbox
        q = '[out:json][timeout:120];(way["waterway"="river"]["name"~"%s",i](%s);way["waterway"="stream"]["name"~"%s",i](%s););out geom;' % (name, bs, name, bs)
        res = overpass(q)
        time.sleep(1.5)
        if not res:
            print("  --  %-22s (overpass fail)" % name); continue
        g = river_geometry(res["elements"], name, bbox)
        if g:
            out[_id] = g
            n = sum(len(l) for l in g["coordinates"])
            print("  ok  %-22s %d segs, %d pts" % (name, len(g["coordinates"]), n))
        else:
            print("  --  %-22s (no line)" % name)
    return out


if __name__ == "__main__":
    shapes = {}
    shapes.update(fetch_lakes())
    time.sleep(2)
    print("fetching %d rivers..." % len(RIVERS))
    shapes.update(fetch_rivers())
    out = os.path.join(ROOT, "data", "water_shapes.js")
    with open(out, "w", encoding="utf-8") as f:
        f.write("// WA Fish - real lake/river geometry from OpenStreetMap (Overpass), baked\n")
        f.write("// for offline use. Keyed by water-body id. Regenerate: tools/fetch_water.py\n")
        f.write("window.WF = window.WF || {};\nWF.WATER_SHAPES = ")
        f.write(json.dumps(shapes, separators=(",", ":")))
        f.write(";\n")
    print("\nwrote %s : %d shapes, %d KB" % (out, len(shapes), os.path.getsize(out) // 1024))
