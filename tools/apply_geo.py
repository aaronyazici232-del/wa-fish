"""One-shot geo pass: build data/marine_areas.js from the WDFW GeoJSON,
move spot markers onto the water, and point-in-polygon check each salt/coast
spot against its assigned Marine Area."""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(os.environ.get("TEMP", "/tmp"), "ma_raw.json")

# --- 1. marine_areas.js ---
with open(RAW, encoding="utf-8") as f:
    gj = json.load(f)

header = (
    "// WA Fish - WDFW Recreational Marine Areas (WAC 220-311-010 boundaries).\n"
    "// Source: WDFW public ArcGIS feature service, geometry simplified ~400 m.\n"
    "// Approximate for display - the WAC text is the legal boundary.\n"
    "window.WF = window.WF || {};\n"
    "WF.MARINE_AREAS = ")
out = os.path.join(ROOT, "data", "marine_areas.js")
with open(out, "w", encoding="utf-8") as f:
    f.write(header + json.dumps(gj, separators=(",", ":")) + ";\n")
print("marine_areas.js: %d KB, %d features" % (os.path.getsize(out) // 1024, len(gj["features"])))

# --- 2. nudge spot coords onto the water ---
COORDS = {
    "lincoln-park": (47.5305, -122.4040), "seacrest-cove2": (47.5890, -122.3760),
    "alki-point": (47.5775, -122.4250), "duwamish-head": (47.5995, -122.3880),
    "elliott-bay-pier86": (47.6255, -122.3790), "west-point": (47.6620, -122.4400),
    "golden-gardens": (47.6905, -122.4080), "richmond-beach": (47.7645, -122.3920),
    "jefferson-head": (47.7440, -122.4660), "point-no-point": (47.9135, -122.5230),
    "possession-bar": (47.8950, -122.3900), "point-defiance": (47.3130, -122.5480),
    "point-dalco": (47.3330, -122.5110), "point-robinson": (47.3885, -122.3700),
    "les-davis-pier": (47.2870, -122.4840), "dash-point-pier": (47.3230, -122.4130),
    "redondo-pier": (47.3490, -122.3270), "des-moines-pier": (47.4000, -122.3330),
    "three-tree-point": (47.4510, -122.3900), "browns-point": (47.3055, -122.4470),
    "edmonds-pier": (47.8090, -122.3950), "mukilteo": (47.9490, -122.3080),
    "picnic-point": (47.8800, -122.3350), "tulalip-bubble": (48.0620, -122.2980),
    "kayak-point": (48.1370, -122.3700), "bush-point": (48.0310, -122.6100),
    "fort-casey": (48.1570, -122.6830), "washington-park": (48.4895, -122.6950),
    "bellingham-bay": (48.7480, -122.5100), "point-fosdick": (47.2700, -122.5570),
    "fox-island": (47.2550, -122.6060), "johnson-point": (47.1780, -122.8090),
    "devils-head": (47.1580, -122.7650), "hoodsport": (47.4070, -123.1370),
    "seabeck": (47.6550, -122.8550), "ediz-hook": (48.1385, -123.4150),
    "freshwater-bay": (48.1520, -123.5950), "sekiu": (48.2680, -124.2950),
    "neah-bay": (48.3720, -124.6150), "la-push": (47.9050, -124.6650),
    "westport-jetty": (46.9080, -124.1700), "ocean-shores-surf": (46.9210, -124.1800),
    "willapa-bay": (46.6800, -123.9800), "buoy-10": (46.2550, -124.0300),
    "long-beach-surf": (46.3500, -124.0700),
    "lake-meridian": (47.3665, -122.1320), "american-lake": (47.1170, -122.5650),
}

spots_path = os.path.join(ROOT, "data", "spots.js")
with open(spots_path, encoding="utf-8") as f:
    src = f.read()

applied = 0
for sid, (lat, lng) in COORDS.items():
    pat = re.compile(r'(id: "%s",[\s\S]*?lat: )(-?[\d.]+)(, lng: )(-?[\d.]+)' % re.escape(sid))
    new, n = pat.subn(lambda m: "%s%.4f%s%.4f" % (m.group(1), lat, m.group(3), lng), src, count=1)
    if n:
        src = new; applied += 1
    else:
        print("  !! no match for", sid)
print("coords applied: %d / %d" % (applied, len(COORDS)))

with open(spots_path, "w", encoding="utf-8") as f:
    f.write(src)

# --- 3. point-in-polygon check ---
def in_ring(lng, lat, ring):
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > lat) != (yj > lat)) and (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside

def in_feature(lng, lat, geom):
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    for poly in polys:
        if in_ring(lng, lat, poly[0]):
            # subtract holes
            if not any(in_ring(lng, lat, hole) for hole in poly[1:]):
                return True
    return False

areas = {f["properties"]["AreaName"]: f["geometry"] for f in gj["features"]}

# pull id/area/lat/lng straight out of the updated spots.js
spot_pat = re.compile(r'id: "([^"]+)",[\s\S]{0,400}?area: "MA ([^"]+)"[\s\S]{0,200}?lat: (-?[\d.]+), lng: (-?[\d.]+)')
alt_pat = re.compile(r'id: "([^"]+)",[\s\S]{0,200}?area: "MA ([^"]+)", lat: (-?[\d.]+), lng: (-?[\d.]+)')
fails = []
checked = 0
for m in alt_pat.finditer(src):
    sid, area, lat, lng = m.group(1), m.group(2), float(m.group(3)), float(m.group(4))
    if area not in areas:
        fails.append((sid, area, "no such area")); continue
    checked += 1
    if not in_feature(lng, lat, areas[area]):
        hit = next((a for a, g in areas.items() if in_feature(lng, lat, g)), None)
        fails.append((sid, area, "outside (in: %s)" % hit))
print("checked: %d marine spots" % checked)
for f_ in fails:
    print("  MISS %-20s MA %-4s %s" % f_)
if not fails:
    print("all spots inside their assigned marine area")
