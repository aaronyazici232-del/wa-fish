// WA Fish — water-clipped heat renderer. Paints soft golden "probability" heat
// from a set of point sources, but ONLY inside a water polygon (lake or Marine
// Area, holes/islands excluded), so gold takes the true shape of the water and
// never lands on shore. Output is one image overlay — cheap to pan/zoom.
window.WF = window.WF || {};

WF.heatmap = (function () {

  function inRing(lng, lat, r) {
    var inside = false, n = r.length, j = n - 1;
    for (var i = 0; i < n; i++) {
      var xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1];
      if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
      j = i;
    }
    return inside;
  }
  function inPoly(lng, lat, poly) {
    if (!inRing(lng, lat, poly[0])) return false;
    for (var k = 1; k < poly.length; k++) if (inRing(lng, lat, poly[k])) return false; // holes = land
    return true;
  }
  function inGeom(lng, lat, geom) {
    if (geom.type === "Polygon") return inPoly(lng, lat, geom.coordinates);
    if (geom.type === "MultiPolygon") {
      for (var i = 0; i < geom.coordinates.length; i++) if (inPoly(lng, lat, geom.coordinates[i])) return true;
    }
    return false;
  }
  function geomBBox(geom) {
    var b = [1e9, 1e9, -1e9, -1e9];
    function scan(poly) {
      poly[0].forEach(function (p) {
        b[0] = Math.min(b[0], p[0]); b[2] = Math.max(b[2], p[0]);
        b[1] = Math.min(b[1], p[1]); b[3] = Math.max(b[3], p[1]);
      });
    }
    if (geom.type === "Polygon") scan(geom.coordinates);
    else geom.coordinates.forEach(scan);
    return b;
  }

  // ---- on-water label placement (used by the map's zone label) ----

  // every ring (outer + holes) of a Polygon/MultiPolygon as a flat list
  function allRings(geom) {
    var rings = [];
    if (geom.type === "Polygon") {
      for (var i = 0; i < geom.coordinates.length; i++) rings.push(geom.coordinates[i]);
    } else if (geom.type === "MultiPolygon") {
      for (var p = 0; p < geom.coordinates.length; p++)
        for (var k = 0; k < geom.coordinates[p].length; k++) rings.push(geom.coordinates[p][k]);
    }
    return rings;
  }

  // distance (scaled meters at midLat) from a point to one ring edge segment
  function segDistM(px, py, ax, ay, bx, by, cosL) {
    var APx = (px - ax) * 111000 * cosL, APy = (py - ay) * 111000;
    var ABx = (bx - ax) * 111000 * cosL, ABy = (by - ay) * 111000;
    var ab2 = ABx * ABx + ABy * ABy;
    var t = ab2 > 0 ? (APx * ABx + APy * ABy) / ab2 : 0;
    if (t < 0) t = 0; else if (t > 1) t = 1;
    var dx = APx - ABx * t, dy = APy - ABy * t;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // min clearance (meters) from an interior point to the NEAREST shore edge
  function clearanceM(lng, lat, rings, cosL) {
    var best = 1e12;
    for (var ri = 0; ri < rings.length; ri++) {
      var r = rings[ri], n = r.length;
      for (var i = 0, j = n - 1; i < n; j = i++) {
        var d = segDistM(lng, lat, r[j][0], r[j][1], r[i][0], r[i][1], cosL);
        if (d < best) best = d;
      }
    }
    return best;
  }

  // Pole of inaccessibility: the interior point farthest from any shore.
  // Coarse grid -> keep the widest cells -> local hill-climb refine. Returns
  // { lat, lng, cosL, candidates:[{lng,lat,c} widest-first] } or null.
  function poleOfInaccessibility(geom, opts) {
    opts = opts || {};
    if (!geom) return null;
    var bb = geomBBox(geom); // [w, s, e, n]
    var west = bb[0], south = bb[1], east = bb[2], north = bb[3];
    if (east <= west || north <= south) return null;
    var midLat = (south + north) / 2, cosL = Math.cos(midLat * Math.PI / 180) || 1;
    var rings = allRings(geom);
    if (!rings.length) return null;

    var cells = opts.cells || 24, keep = opts.keep || 5, passes = opts.passes || 4;
    var dLng = (east - west) / cells, dLat = (north - south) / cells;
    var cands = [];
    for (var gy = 0; gy < cells; gy++) {
      var lat = south + (gy + 0.5) * dLat;
      for (var gx = 0; gx < cells; gx++) {
        var lng = west + (gx + 0.5) * dLng;
        if (!inGeom(lng, lat, geom)) continue;
        cands.push({ lng: lng, lat: lat, c: clearanceM(lng, lat, rings, cosL) });
      }
    }
    if (!cands.length) return null;
    cands.sort(function (a, b) { return b.c - a.c; });
    var pool = cands.slice(0, keep);

    for (var pi = 0; pi < pool.length; pi++) {
      var cur = pool[pi], step = Math.max(dLng, dLat) * 0.5;
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (var pass = 0; pass < passes; pass++) {
        var improved = false;
        for (var di = 0; di < dirs.length; di++) {
          var nlng = cur.lng + dirs[di][0] * step;
          var nlat = cur.lat + dirs[di][1] * step / cosL; // keep step ~isotropic
          if (!inGeom(nlng, nlat, geom)) continue;
          var nc = clearanceM(nlng, nlat, rings, cosL);
          if (nc > cur.c) { cur = { lng: nlng, lat: nlat, c: nc }; improved = true; }
        }
        if (!improved) step *= 0.5;
      }
      pool[pi] = cur;
    }
    pool.sort(function (a, b) { return b.c - a.c; });
    var best = pool[0];
    return { lat: best.lat, lng: best.lng, cosL: cosL, candidates: pool };
  }

  // Width-aware label point. Given the pole result plus the label's half-width
  // and half-height in METERS, return a candidate whose LEFT and RIGHT endpoints
  // stay over water across the label's vertical band (mid/top/bottom rows). When
  // `prefer` {lng,lat} is given, pick the fitting candidate NEAREST to it, so the
  // name seats near the hottest zone (its gold), not just the widest water.
  // Returns { lat, lng, fits }; fits=false means the caller should compact.
  function labelPoint(geom, pole, halfWidthM, halfHeightM, prefer) {
    if (!pole) return null;
    var cosL = pole.cosL;
    var list = (pole.candidates || [{ lat: pole.lat, lng: pole.lng }]).slice();
    // With a preferred point (the hot zone), also try points stepping from it
    // toward the pole, so the label can seat ON the gold when the water there is
    // wide enough — and only fall back to the widest water when it isn't.
    if (prefer) {
      for (var t = 0; t <= 6; t++) {
        var f = t / 8; // 0 (hot zone) .. 0.75 (toward the pole)
        list.push({ lat: prefer.lat + (pole.lat - prefer.lat) * f,
                    lng: prefer.lng + (pole.lng - prefer.lng) * f });
      }
    }
    var dLatHalf = halfHeightM / 111000;
    var dLngHalf = halfWidthM / (111000 * cosL);
    var best = null, bestD = Infinity;
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (!inGeom(p.lng, p.lat, geom)) continue; // anchor itself must be on water
      var rows = [p.lat, p.lat + dLatHalf, p.lat - dLatHalf]; // mid, top, bottom
      var ok = true;
      for (var rIdx = 0; rIdx < rows.length && ok; rIdx++) {
        var ry = rows[rIdx];
        if (!inGeom(p.lng - dLngHalf, ry, geom) || !inGeom(p.lng + dLngHalf, ry, geom)) ok = false;
      }
      if (ok) {
        if (!prefer) return { lat: p.lat, lng: p.lng, fits: true }; // widest-first
        var dx = (p.lng - prefer.lng) * cosL, dy = p.lat - prefer.lat;
        var d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = p; }
      }
    }
    if (best) return { lat: best.lat, lng: best.lng, fits: true };
    return { lat: pole.lat, lng: pole.lng, fits: false };
  }

  // sources: [{lat,lng,heat(0..1),radius(meters)}]
  // returns { url, bounds:[[s,w],[n,e]] } or null
  function build(geom, sources, opts) {
    opts = opts || {};
    if (!sources.length) return null;
    var gb = geomBBox(geom);
    var sb = [1e9, 1e9, -1e9, -1e9];
    sources.forEach(function (s) {
      var padLng = (s.radius * 2.2) / (111000 * Math.cos(s.lat * Math.PI / 180));
      var padLat = (s.radius * 2.2) / 111000;
      sb[0] = Math.min(sb[0], s.lng - padLng); sb[2] = Math.max(sb[2], s.lng + padLng);
      sb[1] = Math.min(sb[1], s.lat - padLat); sb[3] = Math.max(sb[3], s.lat + padLat);
    });
    var west = Math.max(gb[0], sb[0]), east = Math.min(gb[2], sb[2]);
    var south = Math.max(gb[1], sb[1]), north = Math.min(gb[3], sb[3]);
    if (east <= west || north <= south) return null;

    var midLat = (south + north) / 2, cosL = Math.cos(midLat * Math.PI / 180);
    var wM = (east - west) * 111000 * cosL, hM = (north - south) * 111000;
    var maxDim = opts.maxDim || 320, W, H;
    if (wM >= hM) { W = maxDim; H = Math.max(8, Math.round(maxDim * hM / wM)); }
    else { H = maxDim; W = Math.max(8, Math.round(maxDim * wM / hM)); }

    var canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext("2d");
    var maxA = opts.maxAlpha != null ? opts.maxAlpha : 0.82; // brighter default

    // pass 1: raw heat field (0..1) + in-water mask into flat buffers
    var nPix = W * H;
    var core = new Float32Array(nPix); // combined source heat per pixel
    var mask = new Uint8Array(nPix);   // 1 = pixel inside the water polygon
    var p = 0;
    for (var y = 0; y < H; y++) {
      var lat = north - (y + 0.5) / H * (north - south);
      for (var x = 0; x < W; x++, p++) {
        var lng = west + (x + 0.5) / W * (east - west);
        if (!inGeom(lng, lat, geom)) { mask[p] = 0; core[p] = 0; continue; }
        mask[p] = 1;
        var prod = 1;
        for (var si = 0; si < sources.length; si++) {
          var s = sources[si];
          var dx = (lng - s.lng) * 111000 * cosL, dy = (lat - s.lat) * 111000;
          var rr = (dx * dx + dy * dy) / (s.radius * s.radius);
          if (rr > 9) continue;
          var gg = s.heat * Math.exp(-rr);
          prod *= (1 - (gg > 0.985 ? 0.985 : gg));
        }
        core[p] = 1 - prod;
      }
    }

    // pass 2: outer glow = separable box-blur of the core field. Over-land
    // cells are 0, so the halo bleeds outward; the mask (pass 3) clips it back
    // to water, so it can never paint shore.
    function boxBlur(src, w, h, rad) {
      var tmp = new Float32Array(w * h), out = new Float32Array(w * h);
      var win = rad * 2 + 1, i, j, acc, o, add, sub;
      for (j = 0; j < h; j++) { // horizontal
        o = j * w; acc = 0;
        for (i = -rad; i <= rad; i++) acc += src[o + Math.max(0, Math.min(w - 1, i))];
        for (i = 0; i < w; i++) {
          tmp[o + i] = acc / win;
          add = src[o + Math.min(w - 1, i + rad + 1)];
          sub = src[o + Math.max(0, i - rad)];
          acc += add - sub;
        }
      }
      for (i = 0; i < w; i++) { // vertical
        acc = 0;
        for (j = -rad; j <= rad; j++) acc += tmp[i + Math.max(0, Math.min(h - 1, j)) * w];
        for (j = 0; j < h; j++) {
          out[i + j * w] = acc / win;
          add = tmp[i + Math.min(h - 1, j + rad + 1) * w];
          sub = tmp[i + Math.max(0, j - rad) * w];
          acc += add - sub;
        }
      }
      return out;
    }
    var rad = Math.max(2, Math.round(Math.min(W, H) * 0.07)); // ~7% of short side
    var glow = boxBlur(core, W, H, rad);

    // pass 3: composite through a brighter multi-stop ramp, masked to water.
    // ramp: deep amber -> signature gold -> warm bright core (stays gold, not
    // white, so the hottest pixel still reads as gold).
    var ramp0 = [230, 150, 30];   // deep amber (low heat)
    var ramp1 = [255, 207, 58];   // signature gold (mid)
    var ramp2 = [255, 232, 150];  // warm bright core (hot)
    function ramp(t, out) {
      var u, a, b;
      if (t < 0.45) { u = t / 0.45; a = ramp0; b = ramp1; }
      else { u = (t - 0.45) / 0.55; if (u > 1) u = 1; a = ramp1; b = ramp2; }
      out[0] = (a[0] + (b[0] - a[0]) * u) | 0;
      out[1] = (a[1] + (b[1] - a[1]) * u) | 0;
      out[2] = (a[2] + (b[2] - a[2]) * u) | 0;
    }

    var img = ctx.createImageData(W, H), data = img.data;
    var col = [0, 0, 0]; // reused per pixel (no per-pixel allocation)
    for (p = 0; p < nPix; p++) {
      var idx = p * 4;
      if (!mask[p]) { data[idx + 3] = 0; continue; } // HARD water clip (glow incl.)
      var h2 = core[p] + glow[p] * 0.85; // glow lifts the field outward
      if (h2 > 1) h2 = 1;
      if (h2 <= 0.05) { data[idx + 3] = 0; continue; }
      ramp(h2, col);
      data[idx] = col[0]; data[idx + 1] = col[1]; data[idx + 2] = col[2];
      var aa = Math.pow(h2, 0.72) * maxA; // gamma-lift so mid heat reads strongly
      if (aa > 0.96) aa = 0.96;
      data[idx + 3] = Math.round(aa * 255);
    }
    ctx.putImageData(img, 0, 0);
    return { url: canvas.toDataURL(), bounds: [[south, west], [north, east]] };
  }

  return {
    build: build, inGeom: inGeom,
    poleOfInaccessibility: poleOfInaccessibility, labelPoint: labelPoint
  };
})();
