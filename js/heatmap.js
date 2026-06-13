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
    var img = ctx.createImageData(W, H), data = img.data;
    var maxA = opts.maxAlpha != null ? opts.maxAlpha : 0.58;

    for (var y = 0; y < H; y++) {
      var lat = north - (y + 0.5) / H * (north - south);
      for (var x = 0; x < W; x++) {
        var lng = west + (x + 0.5) / W * (east - west);
        var idx = (y * W + x) * 4;
        if (!inGeom(lng, lat, geom)) { data[idx + 3] = 0; continue; }
        var prod = 1;
        for (var si = 0; si < sources.length; si++) {
          var s = sources[si];
          var dx = (lng - s.lng) * 111000 * cosL, dy = (lat - s.lat) * 111000;
          var rr = (dx * dx + dy * dy) / (s.radius * s.radius);
          if (rr > 9) continue;
          var g = s.heat * Math.exp(-rr);
          prod *= (1 - (g > 0.985 ? 0.985 : g));
        }
        var heat = 1 - prod;
        if (heat <= 0.05) { data[idx + 3] = 0; continue; }
        data[idx] = 255; data[idx + 1] = 207; data[idx + 2] = 58;
        data[idx + 3] = Math.round((heat > 1 ? 1 : heat) * maxA * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
    return { url: canvas.toDataURL(), bounds: [[south, west], [north, east]] };
  }

  return { build: build, inGeom: inGeom };
})();
