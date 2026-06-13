// WA Fish — two-level map. Top level: a rated "big bubble" per water body, plus
// the real water outline (Marine Area polygons, lake polygons, river lines) you
// can tap. Selecting a body shows its spot sub-bubbles; picking a fish lights up
// golden probability hot-zones inside lakes (and tints rivers) for that species.
window.WF = window.WF || {};

WF.map = (function () {
  var map = null;
  var maLayer = null;       // WDFW Marine Area polygons
  var shapeLayer = null;    // lake polygons + river lines
  var goldLayer = null;     // golden hot-zones (selected lake + fish)
  var lakePolys = {};       // bodyId -> polygon
  var riverLines = {};      // bodyId -> polyline
  var outlinesOn = true;
  var bodyMarkers = {};
  var spotMarkers = {};
  var selected = null;
  var speciesFilter = null;
  var filter = "all";

  var COLORS = { salt: "#4da3ff", coast: "#2dd4bf", river: "#7ddf64", lake: "#c084fc" };
  var GOLD = "#ffcf3a";

  function bodyColor(body) {
    if (body.kind === "lake") return COLORS.lake;
    if (body.kind === "river") return COLORS.river;
    var coastal = ["1", "2", "2-1", "2-2", "3", "4"].indexOf(body.areaName) >= 0;
    return coastal ? COLORS.coast : COLORS.salt;
  }

  function bodyPasses(body) {
    if (filter === "all") return true;
    var f = WF.bodies.fisheriesIn(body);
    return !!f[filter];
  }

  function spotPasses(spot) {
    if (!speciesFilter) return true;
    return WF.speciesForSpot(spot).indexOf(speciesFilter) >= 0;
  }

  function init() {
    if (map) return;
    map = L.map("map", { zoomControl: false, attributionControl: true })
      .setView([47.6, -122.9], 7);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 17, attribution: "&copy; OpenStreetMap | bounds: WDFW · water: OSM"
    }).addTo(map);
    goldLayer = L.layerGroup().addTo(map);
    initMarineAreas();
    initWaterShapes();
    render();
  }

  // WDFW Marine Area polygons — clickable water
  function initMarineAreas() {
    if (!WF.MARINE_AREAS) return;
    maLayer = L.geoJSON(WF.MARINE_AREAS, {
      style: { color: "#4da3ff", weight: 1.4, opacity: 0.7, fillColor: "#4da3ff", fillOpacity: 0.1 },
      onEachFeature: function (f, layer) {
        layer.on("click", function () { select("ma-" + f.properties.AreaName); });
      }
    }).addTo(map);
  }

  // real lake polygons & river lines from OSM — clickable, shaped like the water
  function initWaterShapes() {
    shapeLayer = L.layerGroup().addTo(map);
    WF.bodies.all().forEach(function (body) {
      if (body.kind !== "lake" && body.kind !== "river") return;
      var col = bodyColor(body);
      var shape = WF.WATER_SHAPES && WF.WATER_SHAPES[body.id];
      var layer = null;
      if (shape && (shape.type === "Polygon" || shape.type === "MultiPolygon")) {
        layer = L.geoJSON(shape, { style: { color: col, weight: 1.5, opacity: 0.85, fillColor: col, fillOpacity: 0.22 } });
        lakePolys[body.id] = layer;
      } else if (shape && shape.type === "MultiLineString") {
        layer = L.geoJSON(shape, { style: { color: col, weight: 3.5, opacity: 0.85 } });
        riverLines[body.id] = layer;
      } else {
        // fallback: a circle if OSM had no shape
        layer = L.circle(body.center, { radius: body.kind === "lake" ? 1400 : 1100, color: col, weight: 1.4, opacity: 0.8, fillColor: col, fillOpacity: 0.18 });
      }
      layer.on("click", function () { select(body.id); });
      shapeLayer.addLayer(layer);
    });
  }

  function toggleOutlines() {
    outlinesOn = !outlinesOn;
    [maLayer, shapeLayer].forEach(function (l) {
      if (!l) return;
      if (outlinesOn) l.addTo(map); else map.removeLayer(l);
    });
    var chip = document.getElementById("ma-toggle");
    if (chip) chip.classList.toggle("on", outlinesOn);
  }

  // ---- big bubbles ----
  function bodyHtml(body) {
    var r = WF.bodies.rating(body);
    var cls = r >= 70 ? "good" : r >= 45 ? "mid" : "low";
    var fish = WF.bodies.bestFish(body, 1);
    var fishTxt = fish.length ? fish[0].name.split(" (")[0] : "";
    return "<div class='bb' style='--bb:" + bodyColor(body) + "'>" +
      "<div class='bb-score " + cls + "'>" + (body.spots.length ? r : "·") + "</div>" +
      "<div class='bb-name'>" + body.short + (fishTxt ? "<span>" + fishTxt + "</span>" : "") + "</div></div>";
  }

  function render() {
    if (!map) return;
    WF.bodies.all().forEach(function (body) {
      var show = !selected && bodyPasses(body);
      var m = bodyMarkers[body.id];
      if (show) {
        var icon = L.divIcon({ className: "bb-wrap", html: bodyHtml(body), iconSize: [76, 54], iconAnchor: [38, 27] });
        if (!m) {
          m = L.marker(body.center, { icon: icon, zIndexOffset: 500 });
          m.on("click", function () { select(body.id); });
          m.addTo(map);
          bodyMarkers[body.id] = m;
        } else { m.setIcon(icon); }
      } else if (m) {
        map.removeLayer(m); delete bodyMarkers[body.id];
      }
    });
    renderSpots();
  }

  // ---- sub-bubbles ----
  function spotHtml(spot, score, hot, best) {
    var c = COLORS[spot.fishery] || "#999";
    return "<div class='pin" + (hot ? " hot" : "") + "'>" +
      (best ? "<div class='mk-flame'>🔥</div>" : "") +
      "<div class='mk' style='--mk:" + c + "'><span class='mk-score'>" + score + "</span></div>" +
      "</div>";
  }

  function renderSpots() {
    var body = selected && WF.bodies.get(selected);
    var want = {};
    if (body) body.spots.forEach(function (s) { if (spotPasses(s)) want[s.id] = s; });
    Object.keys(spotMarkers).forEach(function (id) {
      if (!want[id]) { map.removeLayer(spotMarkers[id]); delete spotMarkers[id]; }
    });
    var scored = Object.keys(want).map(function (id) {
      var s = want[id];
      var r = speciesFilter ? WF.score.spotForSpecies(s, speciesFilter) : WF.score.spot(s);
      return { s: s, score: r.score };
    }).sort(function (a, b) { return b.score - a.score; });
    var top = scored.length ? scored[0].score : 0;
    scored.forEach(function (row, i) {
      var s = row.s;
      var hot = !!speciesFilter && row.score >= 50 && row.score >= top - 6;
      var best = !!speciesFilter && i === 0 && row.score >= 40;
      var icon = L.divIcon({ className: "mk-wrap", html: spotHtml(s, row.score, hot, best), iconSize: [34, 34], iconAnchor: [17, 17] });
      if (spotMarkers[s.id]) spotMarkers[s.id].setIcon(icon);
      else {
        var m = L.marker([s.lat, s.lng], { icon: icon, zIndexOffset: best ? 1000 : 800 });
        m.on("click", function () { WF.ui.showDetail(s.id, true); });
        m.addTo(map);
        spotMarkers[s.id] = m;
      }
    });
    renderHotzones();
  }

  // ---- golden hot-zones (lakes) + river gold tint ----
  function renderHotzones() {
    if (goldLayer) goldLayer.clearLayers();
    var body = selected && WF.bodies.get(selected);
    // reset any tinted river line first
    Object.keys(riverLines).forEach(function (id) {
      riverLines[id].setStyle({ color: COLORS.river, weight: 3.5, opacity: 0.85 });
    });
    if (!body || !speciesFilter) return;

    if (body.kind === "river") {
      var line = riverLines[body.id];
      if (line) {
        var r = WF.score.spotForSpecies(body.spots[0], speciesFilter);
        var col = (r.fishIn && r.score >= 55) ? GOLD : (r.score >= 40 ? "#e0a23a" : "#7a8a93");
        var w = (r.fishIn && r.score >= 55) ? 6 : 4;
        line.setStyle({ color: col, weight: w, opacity: 0.95 });
        line.bringToFront();
      }
      return;
    }
    if (body.kind !== "lake") return;

    var zones = WF.hotzones.score(body, speciesFilter);
    zones.forEach(function (z, i) {
      if (z.heat < 0.45) return; // only show the meaningfully hotter water
      var op = 0.14 + 0.46 * z.heat;
      // soft glow: faint outer blob + brighter core
      L.circle([z.zone.lat, z.zone.lng], { radius: z.zone.r * 1.7, color: GOLD, weight: 0, fillColor: GOLD, fillOpacity: op * 0.45, interactive: false }).addTo(goldLayer);
      var core = L.circle([z.zone.lat, z.zone.lng], { radius: z.zone.r, color: "#ffe08a", weight: i === 0 ? 1.5 : 0, fillColor: GOLD, fillOpacity: op, interactive: true }).addTo(goldLayer);
      var sp = WF.speciesById(speciesFilter);
      core.bindTooltip((i === 0 ? "🔥 " : "") + z.zone.name + " — " + Math.round(z.heat * 100) + "%", { direction: "top", className: "zone-tip" });
    });
  }

  // ---- selection ----
  function select(bodyId) {
    var body = WF.bodies.get(bodyId);
    if (!body) return;
    if (selected === bodyId) { WF.ui.showBody(bodyId); return; }
    selected = bodyId;
    speciesFilter = null;
    render();
    if (lakePolys[bodyId] || riverLines[bodyId]) {
      map.fitBounds((lakePolys[bodyId] || riverLines[bodyId]).getBounds(), { padding: [30, 30] });
    } else if (body.feature) {
      map.fitBounds(L.geoJSON(body.feature).getBounds(), { padding: [16, 16] });
    } else {
      map.setView(body.center, 12);
    }
    document.getElementById("map-back").classList.add("show");
    WF.ui.showBody(bodyId);
  }

  function deselect() {
    selected = null;
    speciesFilter = null;
    if (goldLayer) goldLayer.clearLayers();
    renderHotzones(); // resets river tints
    WF.ui.closeSheet();
    document.getElementById("map-back").classList.remove("show");
    render();
    map.setView([47.6, -122.9], 7);
  }

  function setSpeciesFilter(id) {
    speciesFilter = id;
    renderSpots();
  }

  function setFilter(f) {
    filter = f;
    document.querySelectorAll("#map-filters .chip[data-f]").forEach(function (el) {
      el.classList.toggle("on", el.dataset.f === f);
    });
    render();
  }

  function focus(spot) { if (map) map.setView([spot.lat, spot.lng], 13); }
  function invalidate() { if (map) setTimeout(function () { map.invalidateSize(); }, 60); }

  return {
    init: init, render: render, setFilter: setFilter, focus: focus,
    invalidate: invalidate, toggleMA: toggleOutlines,
    select: select, deselect: deselect, setSpeciesFilter: setSpeciesFilter,
    getFilter: function () { return filter; },
    getSelected: function () { return selected; },
    getSpeciesFilter: function () { return speciesFilter; }
  };
})();
