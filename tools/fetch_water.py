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
    ("wb-lake-tapps", "Lake Tapps", 47.233, -122.178, 0.05, True),
    ("wb-lake-sawyer", "Lake Sawyer", 47.345, -122.044, 0.03, True),
    ("wb-lake-goodwin", "Lake Goodwin", 48.132, -122.290, 0.03, True),
    ("wb-silver-lake-cowlitz", "Silver Lake", 46.317, -122.820, 0.06, True),
    ("wb-lake-whatcom", "Lake Whatcom", 48.71, -122.33, 0.10, True),
    ("wb-lake-padden", "Lake Padden", 48.701, -122.435, 0.02, True),
    ("wb-lake-crescent", "Lake Crescent", 48.07, -123.80, 0.10, True),
    ("wb-lake-wenatchee", "Lake Wenatchee", 47.81, -120.78, 0.07, True),
    ("wb-moses-lake", "Moses Lake", 47.13, -119.29, 0.14, True),
    ("wb-potholes-reservoir", "Potholes Reservoir", 46.98, -119.33, 0.14, True),
    ("wb-banks-lake", "Banks Lake", 47.85, -119.18, 0.22, True),
    ("wb-lake-chelan", "Lake Chelan", 48.05, -120.30, 0.45, True),
    ("wb-pine-lake", "Pine Lake", 47.587, -122.047, 0.02, True),
    ("wb-beaver-lake", "Beaver Lake", 47.564, -122.064, 0.02, True),
    ("wb-cottage-lake", "Cottage Lake", 47.748, -122.082, 0.02, True),
    ("wb-lake-wilderness", "Lake Wilderness", 47.376, -122.043, 0.02, True),
    ("wb-phantom-lake", "Phantom Lake", 47.584, -122.130, 0.02, True),
    ("wb-lake-ballinger", "Lake Ballinger", 47.787, -122.323, 0.02, True),
    ("wb-martha-lake", "Martha Lake", 47.854, -122.237, 0.02, True),
    ("wb-silver-lake-everett", "Silver Lake", 47.887, -122.236, 0.03, True),
    ("wb-lake-roesiger", "Lake Roesiger", 48.026, -121.880, 0.04, True),
    ("wb-lake-cassidy", "Lake Cassidy", 48.056, -122.101, 0.02, True),
    ("wb-kitsap-lake", "Kitsap Lake", 47.578, -122.717, 0.02, True),
    ("wb-long-lake-kitsap", "Long Lake", 47.436, -122.644, 0.03, True),
    ("wb-spanaway-lake", "Spanaway Lake", 47.101, -122.433, 0.03, True),
    ("wb-lake-kapowsin", "Lake Kapowsin", 47.008, -122.230, 0.04, True),
    ("wb-tanwax-lake", "Tanwax Lake", 46.923, -122.221, 0.02, True),
    ("wb-ohop-lake", "Ohop Lake", 46.887, -122.236, 0.03, True),
    ("wb-mineral-lake", "Mineral Lake", 46.718, -122.174, 0.03, True),
    ("wb-riffe-lake", "Riffe Lake", 46.530, -122.40, 0.16, True),
    ("wb-mayfield-lake", "Mayfield Lake", 46.506, -122.58, 0.10, True),
    ("wb-lacamas-lake", "Lacamas Lake", 45.621, -122.406, 0.03, True),
    ("wb-battle-ground-lake", "Battle Ground Lake", 45.801, -122.492, 0.02, True),
    ("wb-lake-sacajawea", "Lake Sacajawea", 46.145, -122.945, 0.02, True),
    ("wb-lake-samish", "Lake Samish", 48.672, -122.404, 0.05, True),
    ("wb-lake-terrell", "Lake Terrell", 48.852, -122.690, 0.03, True),
    ("wb-fazon-lake", "Fazon Lake", 48.847, -122.387, 0.02, True),
    ("wb-lake-sutherland", "Lake Sutherland", 48.084, -123.670, 0.03, True),
    ("wb-lake-roosevelt", "Roosevelt", 47.943, -118.982, 0.30, False),
    ("wb-sprague-lake", "Sprague Lake", 47.170, -118.000, 0.06, True),
    ("wb-lake-lenore", "Lake Lenore", 47.500, -119.520, 0.06, True),
    ("wb-newman-lake", "Newman Lake", 47.760, -117.050, 0.04, True),
    ("wb-rimrock-lake", "Rimrock Lake", 46.650, -121.130, 0.08, True),
    ("wb-curlew-lake", "Curlew Lake", 48.740, -118.670, 0.05, True),
    ("wb-liberty-lake", "Liberty Lake", 47.640, -117.080, 0.03, True),
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
    ("wb-snoqualmie-river", "Snoqualmie River", 47.65, -121.91, 0.14),
    ("wb-cedar-river", "Cedar River", 47.46, -122.12, 0.10),
    ("wb-sauk-river", "Sauk River", 48.42, -121.57, 0.14),
    ("wb-nooksack-river", "Nooksack River", 48.78, -122.45, 0.16),
    ("wb-wynoochee-river", "Wynoochee River", 47.10, -123.59, 0.12),
    ("wb-satsop-river", "Satsop River", 47.00, -123.49, 0.10),
    ("wb-humptulips-river", "Humptulips River", 47.23, -123.96, 0.14),
    ("wb-queets-river", "Queets River", 47.54, -124.30, 0.16),
    ("wb-elwha-river", "Elwha River", 48.10, -123.56, 0.10),
    ("wb-methow-river", "Methow River", 48.36, -120.12, 0.18),
    ("wb-yakima-river", "Yakima River", 47.00, -120.55, 0.22),
    ("wb-klickitat-river", "Klickitat River", 45.85, -121.18, 0.18),
    ("wb-nf-lewis-river", "Lewis River", 45.98, -122.55, 0.14),
    ("wb-wenatchee-river", "Wenatchee River", 47.52, -120.49, 0.18),
    ("wb-spokane-river", "Spokane River", 47.70, -117.28, 0.27),
    ("wb-grande-ronde", "Grande Ronde River", 46.05, -117.10, 0.20),
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


def el_in_bbox(el, bbox):
    s, w, n, e = bbox
    def hit(geom):
        for p in geom:
            if s <= p["lat"] <= n and w <= p["lon"] <= e:
                return True
        return False
    if el.get("type") == "way" and "geometry" in el:
        return hit(el["geometry"])
    if el.get("type") == "relation":
        for m in el.get("members", []):
            if "geometry" in m and hit(m["geometry"]):
                return True
    return False


def name_match(nm, name, exact):
    return nm == name if exact else (name.lower() in nm.lower())


def lake_geometry(elements, name, bbox, exact):
    pad = 0.02
    pbox = (bbox[0] - pad, bbox[1] - pad, bbox[2] + pad, bbox[3] + pad)
    outer_ways, inner_ways, closed = [], [], []
    for el in elements:
        nm = el.get("tags", {}).get("name", "")
        if not name_match(nm, name, exact):
            continue
        if not el_in_bbox(el, pbox):  # pin duplicate-named lakes to their location
            continue
        if el["type"] == "way" and "geometry" in el:
            closed.append([[p["lon"], p["lat"]] for p in el["geometry"]])
        elif el["type"] == "relation":
            for m in el.get("members", []):
                if m.get("type") == "way" and "geometry" in m:
                    coords = [[p["lon"], p["lat"]] for p in m["geometry"]]
                    (inner_ways if m.get("role") == "inner" else outer_ways).append(coords)
    outer = stitch(outer_ways) + [c for c in closed if near(c[0], c[-1])]
    inner = stitch(inner_ways)
    if not outer:
        if closed:
            outer = [max(closed, key=len)]
        else:
            return None
    outer.sort(key=len, reverse=True)
    polys = []
    for o in outer:
        ring = r5(decimate(o))
        holes = [r5(decimate(hh)) for hh in inner if len(hh) > 6]
        polys.append([ring] + holes)
        inner = []  # holes only on the largest outer
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
    out = {}
    CH = 12
    for ci in range(0, len(LAKES), CH):
        chunk = LAKES[ci:ci + CH]
        parts = []
        for _id, name, lat, lng, h, exact in chunk:
            bbox = "%f,%f,%f,%f" % (lat - h, lng - h, lat + h, lng + h)
            nf = ('["name"="%s"]' % name) if exact else ('["name"~"%s",i]' % name)
            parts.append('way["natural"="water"]%s(%s);' % (nf, bbox))
            parts.append('relation["natural"="water"]%s(%s);' % (nf, bbox))
        q = "[out:json][timeout:180];(" + "".join(parts) + ");out geom;"
        print("fetching lakes %d-%d ..." % (ci + 1, ci + len(chunk)))
        res = overpass(q)
        if res:
            for _id, name, lat, lng, h, exact in chunk:
                bbox = (lat - h, lng - h, lat + h, lng + h)
                g = lake_geometry(res["elements"], name, bbox, exact)
                if g:
                    out[_id] = g
                    print("  ok  %-24s %s" % (name, g["type"]))
                else:
                    print("  --  %-24s (no shape)" % name)
        time.sleep(3)
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
