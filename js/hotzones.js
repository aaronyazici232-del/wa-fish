// WA Fish — golden hot-zone engine. Given a lake body and a target fish, score
// each in-lake zone by habitat preference × water temp (proxied by air temp) ×
// windward-shore bait boost, then return them normalized so the best zone reads
// brightest. This is a transparent heuristic — depth/season/weather, not sonar.
window.WF = window.WF || {};

WF.hotzones = (function () {

  // base habitat weight per species, by zone type
  var HAB = {
    yellowperch: { weed: 0.92, flat: 0.75, dropoff: 0.70, dock: 0.66, inlet: 0.50, point: 0.45, deep: 0.30 },
    smallmouth:  { point: 0.92, dropoff: 0.82, dock: 0.70, flat: 0.50, inlet: 0.45, weed: 0.35, deep: 0.30 },
    largemouth:  { weed: 0.95, dock: 0.82, flat: 0.62, inlet: 0.60, point: 0.35, dropoff: 0.32, deep: 0.15 },
    bass:        { weed: 0.80, dock: 0.76, point: 0.62, flat: 0.56, dropoff: 0.52, inlet: 0.50, deep: 0.22 },
    cutthroat:   { inlet: 0.78, point: 0.70, dropoff: 0.66, deep: 0.60, flat: 0.46, dock: 0.46, weed: 0.36 },
    kokanee:     { deep: 0.95, dropoff: 0.52, inlet: 0.36, point: 0.22, flat: 0.20, weed: 0.12, dock: 0.12 },
    sockeye:     { deep: 0.92, dropoff: 0.44, inlet: 0.50, point: 0.20, flat: 0.20, weed: 0.12, dock: 0.12 },
    rainbow:     { flat: 0.72, inlet: 0.66, dock: 0.62, deep: 0.52, point: 0.46, dropoff: 0.46, weed: 0.42 },
    walleye:     { dropoff: 0.90, point: 0.80, flat: 0.62, deep: 0.60, inlet: 0.50, dock: 0.48, weed: 0.40 },
    crappie:     { dock: 0.90, weed: 0.85, inlet: 0.60, dropoff: 0.55, flat: 0.50, point: 0.40, deep: 0.35 },
    mackinaw:    { deep: 0.95, dropoff: 0.70, point: 0.35, inlet: 0.30, flat: 0.20, weed: 0.12, dock: 0.12 },
    bulltrout:   { inlet: 0.82, deep: 0.62, dropoff: 0.60, point: 0.55, flat: 0.35, dock: 0.30, weed: 0.20 },
    catfish:     { flat: 0.80, weed: 0.72, inlet: 0.66, dock: 0.60, dropoff: 0.46, deep: 0.40, point: 0.30 }
  };
  var WARMWATER = { yellowperch: 1, smallmouth: 1, largemouth: 1, bass: 1, crappie: 1, catfish: 1 };

  function weight(spId, type) {
    var w = HAB[spId];
    if (!w) return 0.45; // unknown species: neutral
    return w[type] != null ? w[type] : 0.30;
  }

  function tempMod(spId, type, tempF) {
    if (tempF == null) return 1;
    var shallow = (type === "weed" || type === "flat" || type === "dock");
    var deepish = (type === "deep" || type === "dropoff");
    if (WARMWATER[spId]) {
      if (tempF > 66) return shallow ? 1.18 : (deepish ? 0.80 : 1);
      if (tempF < 50) return deepish ? 1.20 : (shallow ? 0.70 : 1);
    } else { // coldwater: trout / kokanee / sockeye
      if (tempF > 66) return deepish ? 1.15 : (shallow ? 0.82 : 1);
      if (tempF < 50) return (shallow || type === "inlet") ? 1.15 : (deepish ? 0.92 : 1);
    }
    return 1;
  }

  function windMod(zone, wx) {
    if (!zone.wind || !wx || wx.dir == null) return 1;
    return WF.cond.compass8(wx.dir) === zone.wind ? 1.15 : 1;
  }

  // auto-zones from a lake's real polygon when not hand-curated
  function autoZones(body) {
    var shape = WF.WATER_SHAPES && WF.WATER_SHAPES[body.id];
    if (!shape) return [];
    var ring;
    if (shape.type === "Polygon") ring = shape.coordinates[0];
    else if (shape.type === "MultiPolygon") {
      ring = shape.coordinates.map(function (p) { return p[0]; })
        .sort(function (a, b) { return b.length - a.length; })[0]; // largest body
    } else return [];
    var cx = 0, cy = 0, minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    ring.forEach(function (p) {
      cx += p[0]; cy += p[1];
      minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]);
      miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]);
    });
    cx /= ring.length; cy /= ring.length;
    var r = Math.max(120, Math.min(300, (maxy - miny) * 111000 * 0.18));
    function z(name, type, lng, lat) {
      return { name: name, type: type, lat: cy + (lat - cy) * 0.55, lng: cx + (lng - cx) * 0.55, r: r };
    }
    return [
      { name: "Open basin", type: "deep", lat: cy, lng: cx, r: r },
      z("North end", "flat", cx, maxy),
      z("South end", "weed", cx, miny),
      z("East shore", "dock", maxx, cy),
      z("West shore", "point", minx, cy)
    ];
  }

  function zonesFor(body) {
    var curated = WF.LAKE_ZONES && WF.LAKE_ZONES[body.id];
    return (curated && curated.length) ? curated : autoZones(body);
  }

  // returns [{zone, raw, heat}] sorted hottest-first; heat is 0..1 (relative)
  function score(body, spId) {
    var d = WF.cond.get();
    var wx = d && d.weather && body.spots[0] && d.weather[body.spots[0].id];
    var tempF = wx ? wx.tempF : null;
    var zones = zonesFor(body).map(function (z) {
      var raw = weight(spId, z.type) * tempMod(spId, z.type, tempF) * windMod(z, wx);
      return { zone: z, raw: raw };
    });
    var max = zones.reduce(function (m, z) { return Math.max(m, z.raw); }, 0) || 1;
    zones.forEach(function (z) { z.heat = z.raw / max; });
    zones.sort(function (a, b) { return b.heat - a.heat; });
    return zones;
  }

  return { score: score, zonesFor: zonesFor };
})();
