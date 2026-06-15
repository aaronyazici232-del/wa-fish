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
    catfish:     { flat: 0.80, weed: 0.72, inlet: 0.66, dock: 0.60, dropoff: 0.46, deep: 0.40, point: 0.30 },
    musky:       { weed: 0.92, dock: 0.62, point: 0.60, dropoff: 0.52, flat: 0.50, inlet: 0.50, deep: 0.30 },
    sturgeon:    { deep: 0.90, dropoff: 0.62, inlet: 0.55, flat: 0.55, dock: 0.35, point: 0.30, weed: 0.25 },
    brown:       { dropoff: 0.72, inlet: 0.70, point: 0.68, deep: 0.55, dock: 0.55, flat: 0.50, weed: 0.45 }
  };
  var WARMWATER = { yellowperch: 1, smallmouth: 1, largemouth: 1, bass: 1, crappie: 1, catfish: 1, musky: 1 };

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

  // ==========================================================================
  // DATA-DRIVEN CONTINUOUS FIELD (lakes). Instead of a few preset zone blobs,
  // build a per-pixel fish-probability surface from the REAL lake shape + live
  // conditions + species biology, with the curated zones/spots folded in as
  // small nudges. Geometry-only fields are cached per body (built once on open);
  // each fish tap only does the cheap combine. Honest heuristic — depth is a
  // planform proxy (distance to shore), not bathymetry.
  // ==========================================================================

  var FIELD_CACHE = {}, CACHE_ORDER = [], CACHE_MAX = 6;

  function allRingsOf(geom) {
    var rs = [];
    if (geom.type === "Polygon") { for (var i = 0; i < geom.coordinates.length; i++) rs.push(geom.coordinates[i]); }
    else if (geom.type === "MultiPolygon") {
      for (var p = 0; p < geom.coordinates.length; p++)
        for (var k = 0; k < geom.coordinates[p].length; k++) rs.push(geom.coordinates[p][k]);
    }
    return rs;
  }

  function gridFrame(geom, maxDim) {
    var b = WF.heatmap.geomBBox(geom); // [w,s,e,n]
    var west = b[0], south = b[1], east = b[2], north = b[3];
    var midLat = (south + north) / 2, cosL = Math.cos(midLat * Math.PI / 180) || 1;
    var wM = (east - west) * 111000 * cosL, hM = (north - south) * 111000, W, H;
    if (wM >= hM) { W = maxDim; H = Math.max(8, Math.round(maxDim * hM / wM)); }
    else { H = maxDim; W = Math.max(8, Math.round(maxDim * wM / hM)); }
    return { W: W, H: H, west: west, south: south, east: east, north: north,
             cosL: cosL, mPerPxX: wM / W, mPerPxY: hM / H };
  }

  // distance (meters at midLat) from a point to a segment
  function segDistM(px, py, ax, ay, bx, by, cosL) {
    var APx = (px - ax) * 111000 * cosL, APy = (py - ay) * 111000;
    var ABx = (bx - ax) * 111000 * cosL, ABy = (by - ay) * 111000;
    var ab2 = ABx * ABx + ABy * ABy;
    var t = ab2 > 0 ? (APx * ABx + APy * ABy) / ab2 : 0;
    if (t < 0) t = 0; else if (t > 1) t = 1;
    var dx = APx - ABx * t, dy = APy - ABy * t;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // river-line endpoints inside this lake = optional inlet corroboration (honest:
  // could be inlet OR outlet; only nudges, never invents a name).
  function inletMouths(body, geom) {
    var out = [], WS = WF.WATER_SHAPES || {}, kk, sh, lines, li, ln, e2, ep, ends;
    for (kk in WS) {
      if (kk === body.id || !WS.hasOwnProperty(kk)) continue;
      sh = WS[kk];
      if (!sh || (sh.type !== "MultiLineString" && sh.type !== "LineString")) continue;
      lines = sh.type === "LineString" ? [sh.coordinates] : sh.coordinates;
      for (li = 0; li < lines.length; li++) {
        ln = lines[li]; if (!ln.length) continue;
        ends = [ln[0], ln[ln.length - 1]];
        for (e2 = 0; e2 < 2; e2++) {
          ep = ends[e2];
          if (WF.heatmap.inGeom(ep[0], ep[1], geom)) out.push({ lng: ep[0], lat: ep[1] });
        }
      }
    }
    return out;
  }

  // Build the cached geometry-only fields for a body. The one ring-length pass
  // (mask) is made cheap with a per-row edge bucket; everything else is O(cells).
  function buildFieldBase(body, geom, maxDim) {
    var key = body.id + "@" + maxDim;
    if (FIELD_CACHE[key]) return FIELD_CACHE[key];
    var g = gridFrame(geom, maxDim), W = g.W, H = g.H, n = W * H;
    var west = g.west, south = g.south, east = g.east, north = g.north, cosL = g.cosL;
    var rings = allRingsOf(geom);

    // bucket every edge into the grid rows it spans (cheap, ring-length once)
    var rowEdges = new Array(H), r;
    for (r = 0; r < H; r++) rowEdges[r] = [];
    var ri, rg, i, j, ax, ay, bx, by, y0, y1, r0, r1, rr, nn;
    for (ri = 0; ri < rings.length; ri++) {
      rg = rings[ri]; nn = rg.length;
      for (i = 0, j = nn - 1; i < nn; j = i++) {
        ax = rg[j][0]; ay = rg[j][1]; bx = rg[i][0]; by = rg[i][1];
        y0 = ay < by ? ay : by; y1 = ay > by ? ay : by;
        r0 = ((north - y1) / (north - south) * H) | 0; r1 = ((north - y0) / (north - south) * H) | 0;
        r0 -= 1; r1 += 1; if (r0 < 0) r0 = 0; if (r1 > H - 1) r1 = H - 1;
        for (rr = r0; rr <= r1; rr++) rowEdges[rr].push(ax, ay, bx, by);
      }
    }

    // mask via scanline XOR fill (holes/islands handled)
    var mask = new Uint8Array(n), x, y, p, es, e, lat, lng, xs, xa, xb, cxa, cxb, cx, Ax, Ay, Bx, By;
    var dLng = (east - west) / W;
    for (y = 0; y < H; y++) {
      lat = north - (y + 0.5) / H * (north - south);
      es = rowEdges[y]; xs = [];
      for (e = 0; e < es.length; e += 4) {
        Ax = es[e]; Ay = es[e + 1]; Bx = es[e + 2]; By = es[e + 3];
        if ((Ay > lat) !== (By > lat)) xs.push((Bx - Ax) * (lat - Ay) / (By - Ay) + Ax);
      }
      xs.sort(function (a, b) { return a - b; });
      for (i = 0; i + 1 < xs.length; i += 2) {
        xa = xs[i]; xb = xs[i + 1];
        cxa = Math.ceil((xa - west) / dLng - 0.5); cxb = Math.floor((xb - west) / dLng - 0.5);
        if (cxa < 0) cxa = 0; if (cxb > W - 1) cxb = W - 1;
        for (cx = cxa; cx <= cxb; cx++) mask[y * W + cx] ^= 1;
      }
    }

    // TRUE distance-to-shore in meters per water cell (row-bucketed edges)
    var dist = new Float32Array(n), best, k4, dval;
    for (y = 0; y < H; y++) {
      lat = north - (y + 0.5) / H * (north - south);
      es = rowEdges[y];
      for (x = 0; x < W; x++) {
        p = y * W + x; if (!mask[p]) continue;
        lng = west + (x + 0.5) / W * (east - west); best = 1e12;
        for (k4 = 0; k4 < es.length; k4 += 4) {
          dval = segDistM(lng, lat, es[k4], es[k4 + 1], es[k4 + 2], es[k4 + 3], cosL);
          if (dval < best) best = dval;
        }
        dist[p] = best;
      }
    }

    // structure: convex point (+) vs concave bay (-). Only meaningful AT the
    // shore ring (~1.5 cells); beyond that a cell sees mostly water regardless,
    // so a narrow lake's open middle would falsely read as a "point". Then
    // RECENTER per-lake: subtract the mean so a straight/uniform shore reads
    // neutral and only genuine points/bays deviate (kills the all-point bias).
    var cellM = (g.mPerPxX + g.mPerPxY) / 2, shoreBandM = cellM * 1.5;
    var struc = new Float32Array(n), R = 2, wf, tot, xx, yy, nx2, ny2;
    var shoreIdx = [], sSum = 0, raw;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      p = y * W + x; if (!mask[p] || dist[p] > shoreBandM) continue;
      wf = 0; tot = 0;
      for (yy = -R; yy <= R; yy++) for (xx = -R; xx <= R; xx++) {
        nx2 = x + xx; ny2 = y + yy; if (nx2 < 0 || ny2 < 0 || nx2 >= W || ny2 >= H) continue;
        tot++; wf += mask[ny2 * W + nx2];
      }
      raw = tot ? wf / tot : 0.5; struc[p] = raw; shoreIdx.push(p); sSum += raw;
    }
    if (shoreIdx.length) {
      var sMean = sSum / shoreIdx.length, sj, v;
      for (sj = 0; sj < shoreIdx.length; sj++) {
        v = (struc[shoreIdx[sj]] - sMean) * 3.2;       // recenter + amplify deviations
        struc[shoreIdx[sj]] = v > 1 ? 1 : (v < -1 ? -1 : v); // -1 bay .. +1 point
      }
    }

    // gradient of dist (points toward deeper water) for the windward shore normal
    var gx = new Float32Array(n), gy = new Float32Array(n);
    for (y = 1; y < H - 1; y++) for (x = 1; x < W - 1; x++) {
      p = y * W + x; if (!mask[p]) continue;
      gx[p] = dist[p + 1] - dist[p - 1];
      gy[p] = dist[p - W] - dist[p + W]; // +gy = north
    }

    var f = { key: key, W: W, H: H, g: g, mask: mask, dist: dist, struc: struc,
              gx: gx, gy: gy, inlets: inletMouths(body, geom),
              bounds: [[south, west], [north, east]] };
    FIELD_CACHE[key] = f; CACHE_ORDER.push(key);
    while (CACHE_ORDER.length > CACHE_MAX) delete FIELD_CACHE[CACHE_ORDER.shift()];
    return f;
  }

  // per-species structure affinities, read from the existing HAB table
  function bandAffinity(spId) {
    var w = HAB[spId] || {};
    function gv(kk) { return w[kk] != null ? w[kk] : 0.30; }
    return { point: gv("point"), dropoff: gv("dropoff"), weed: gv("weed"), flat: gv("flat") };
  }

  // per-species target depth band in ABSOLUTE METERS-from-shore, shifted by temp
  // (warmwater fish go shallow when warm / deep when cold; coldwater the reverse)
  // and by spawn season. This is the depth-proxy biology, continuous with tempMod.
  function depthBandM(spId, tempF, month) {
    var deepSp = { kokanee: 1, sockeye: 1, mackinaw: 1, sturgeon: 1 };
    var shallowSp = { largemouth: 1, yellowperch: 1, crappie: 1, catfish: 1, musky: 1 };
    var lo, hi;
    if (deepSp[spId]) { lo = 700; hi = 99999; }
    else if (shallowSp[spId]) { lo = 0; hi = 150; }
    else { lo = 120; hi = 450; } // smallmouth/walleye/trout transition
    var warm = !!WARMWATER[spId];
    if (tempF != null) {
      if (warm) { if (tempF > 66) { lo *= 0.6; hi *= 0.6; } else if (tempF < 50) { lo += 200; hi += 200; } }
      else { if (tempF > 66) { lo += 250; hi += 250; } else if (tempF < 50) { lo *= 0.6; hi *= 0.6; } }
    }
    var sp = WF.speciesById && WF.speciesById(spId);
    if (warm && sp && sp.months && sp.months.indexOf(month) >= 0) { lo *= 0.7; hi *= 0.7; }
    return [lo, hi];
  }

  // borrow a real sub-area name only from CURATED zones (the body's single spot
  // is named after the whole lake, so it makes a useless "Green Lake" label).
  function nearestNamed(body, spId, lat, lng, maxM) {
    var cosL = Math.cos(lat * Math.PI / 180) || 1, best = null, bd = maxM * maxM;
    var zs = (WF.LAKE_ZONES && WF.LAKE_ZONES[body.id]) || [], i, zz, dx, dy, m;
    for (i = 0; i < zs.length; i++) {
      zz = zs[i]; if (zz.lat == null) continue;
      if (zz.type && weight(spId, zz.type) < 0.45) continue; // only species-relevant zones
      dx = (zz.lng - lng) * 111000 * cosL; dy = (zz.lat - lat) * 111000; m = dx * dx + dy * dy;
      if (m < bd) { bd = m; best = zz.name; }
    }
    return best;
  }

  // name the peak by the dominant factor AT the peak (borrow a real nearby
  // curated/spot name if one coincides) -> name always matches its position
  function peakName(body, f, peak, spId, tempF, wx, pLat, pLng) {
    var named = nearestNamed(body, spId, pLat, pLng, 1200);
    if (named) return named;
    var dd = f.dist[peak], s = f.struc[peak];
    var windward = (wx && wx.dir != null && wx.wind != null && wx.wind >= 6 && dd < 140);
    if (windward) return "Windward " + (s > 0.15 ? "point" : "shore");
    if (s > 0.2) return "Rocky point";
    if (s < -0.2) return "Weedy bay";
    if (dd > 320) return "Main-lake deep";
    if (dd < 150) return "Shoreline flat";
    return "Drop-off edge";
  }

  // MAIN: continuous per-pixel field for a body + species + live conditions.
  // Returns { field, W, H, mask, bounds, peak:{lat,lng,name} } or null.
  function field(body, geom, spId, maxDim) {
    var f = buildFieldBase(body, geom, maxDim || 320);
    var W = f.W, H = f.H, n = W * H, g = f.g;
    var d = WF.cond.get();
    var wx = d && d.weather && body.spots[0] && d.weather[body.spots[0].id];
    var tempF = wx ? wx.tempF : null;
    var month = new Date().getMonth() + 1;
    var band = depthBandM(spId, tempF, month);
    var capHi = Math.min(band[1], 1600);
    var bMid = (band[0] + capHi) / 2, bHalf = Math.max(120, (capHi - band[0]) / 2);
    var b = bandAffinity(spId);

    // windward downwind vector (dir is FROM-direction -> bait blows toward dir+180)
    var windVec = null, windAmp = 0;
    if (wx && wx.dir != null && wx.wind != null && wx.wind >= 5) {
      var tr = (wx.dir + 180) * Math.PI / 180;
      windVec = { x: Math.sin(tr), y: Math.cos(tr) }; // (east, north)
      windAmp = Math.min(0.5, (wx.wind - 5) / 14);
      if (spId === "kokanee" || spId === "sockeye" || spId === "mackinaw" || spId === "sturgeon") windAmp = 0;
    }

    var out = new Float32Array(n), x, y, p, dd, t, base, s, gxv, gyv, gl, nx, ny, dot, peak = 0, mx = -1;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      p = y * W + x; if (!f.mask[p]) { out[p] = 0; continue; }
      dd = f.dist[p];
      t = (dd - bMid) / bHalf; base = Math.exp(-t * t); // depth-band closeness
      s = f.struc[p];
      if (s > 0) base *= (1 + b.point * 0.6 * s + b.dropoff * 0.4 * s);
      else if (s < 0) base *= (1 + b.weed * 0.6 * (-s) + b.flat * 0.4 * (-s));
      if (windVec && windAmp > 0 && dd < 140) {
        gxv = f.gx[p]; gyv = f.gy[p]; gl = Math.sqrt(gxv * gxv + gyv * gyv);
        if (gl > 0) {
          nx = -gxv / gl; ny = -gyv / gl; // outward shore normal
          dot = windVec.x * nx + windVec.y * ny;
          if (dot > 0) base *= (1 + windAmp * dot * (1 - dd / 140));
        }
      }
      out[p] = base;
    }

    // small all-data point nudges (never dominating)
    function addNudge(lng, lat, rM, amp) {
      var cx = (lng - g.west) / (g.east - g.west) * W, cy = (g.north - lat) / (g.north - g.south) * H;
      var rpx = rM / ((g.mPerPxX + g.mPerPxY) / 2), r2 = rpx * rpx || 1;
      var x0 = Math.max(0, Math.floor(cx - rpx * 2)), x1 = Math.min(W - 1, Math.ceil(cx + rpx * 2));
      var y0 = Math.max(0, Math.floor(cy - rpx * 2)), y1 = Math.min(H - 1, Math.ceil(cy + rpx * 2));
      var xx, yy, q, ddx, ddy, rr2;
      for (yy = y0; yy <= y1; yy++) for (xx = x0; xx <= x1; xx++) {
        q = yy * W + xx; if (!f.mask[q]) continue;
        ddx = xx - cx; ddy = yy - cy; rr2 = (ddx * ddx + ddy * ddy) / r2;
        if (rr2 > 6) continue;
        out[q] += amp * Math.exp(-rr2);
      }
    }
    var zones = zonesFor(body), zi, z, zw;
    for (zi = 0; zi < zones.length; zi++) {
      z = zones[zi];
      zw = weight(spId, z.type) * tempMod(spId, z.type, tempF) * windMod(z, wx);
      if (zw > 0.45) addNudge(z.lng, z.lat, z.r || 280, (zw - 0.45) * 0.5);
    }
    if (body.spots[0]) {
      var rs = WF.score.spotForSpecies(body.spots[0], spId);
      if (rs.score >= 30) addNudge(body.spots[0].lng, body.spots[0].lat, 260, (rs.score / 100) * 0.25);
    }
    var inAmp = weight(spId, "inlet"); if (tempF != null && tempF < 52) inAmp *= 1.4;
    if (inAmp > 0.4) for (var ii = 0; ii < f.inlets.length; ii++)
      addNudge(f.inlets[ii].lng, f.inlets[ii].lat, 280, (inAmp - 0.4) * 0.4);

    // normalize so peak = 1; the hottest pixel IS the derived hot spot
    for (p = 0; p < n; p++) if (out[p] > mx) { mx = out[p]; peak = p; }
    if (mx <= 0) return null;
    for (p = 0; p < n; p++) out[p] /= mx;
    var px = peak % W, py = (peak / W) | 0;
    var pLng = g.west + (px + 0.5) / W * (g.east - g.west);
    var pLat = g.north - (py + 0.5) / H * (g.north - g.south);
    // name from the TRUE peak (the feature itself)
    var nm = peakName(body, f, peak, spId, tempF, wx, pLat, pLng);

    // Seat the label ON that feature: if the peak sits right against the shore
    // (e.g. a weedy bay), nudge it just off the waterline into the SAME feature's
    // water for legibility, climbing the distance-to-shore gradient. Hard-capped
    // at ~250 m so it can NEVER drift to the lake's open middle (the old bug:
    // the label averaged to the pole 5 km from a near-shore bay).
    var labP = peak, guard = 0, cellMm = (g.mPerPxX + g.mPerPxY) / 2;
    while (f.dist[labP] < 120 && guard++ < 40) {
      var lx = labP % W, ly = (labP / W) | 0, bN = -1, bD = f.dist[labP], ddx, ddy, qx, qy, qq;
      for (ddy = -1; ddy <= 1; ddy++) for (ddx = -1; ddx <= 1; ddx++) {
        if (!ddx && !ddy) continue;
        qx = lx + ddx; qy = ly + ddy; if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue;
        qq = qy * W + qx; if (!f.mask[qq]) continue;
        if (f.dist[qq] > bD) { bD = f.dist[qq]; bN = qq; }
      }
      if (bN < 0) break;
      var dxp = (bN % W) - px, dyp = ((bN / W) | 0) - py;
      if (Math.sqrt(dxp * dxp + dyp * dyp) * cellMm > 250) break; // stay at the feature
      labP = bN;
    }
    var lpx = labP % W, lpy = (labP / W) | 0;
    return { field: out, W: W, H: H, mask: f.mask, bounds: f.bounds,
             peak: { lat: g.north - (lpy + 0.5) / H * (g.north - g.south),
                     lng: g.west + (lpx + 0.5) / W * (g.east - g.west), name: nm } };
  }

  return { score: score, zonesFor: zonesFor, field: field,
           fieldFor: function (body, geom) { return buildFieldBase(body, geom, 320); } };
})();
