// WA Fish — two-level map. Top level: one "big bubble" per water body
// (Marine Area / lake / river) centered on the water, showing its live rating.
// Tap a bubble or the water itself to select the body: the map zooms in,
// that body's spot "sub-bubbles" appear, and the body sheet opens.
window.WF = window.WF || {};

WF.map = (function () {
  var map = null;
  var maLayer = null;
  var waterLayer = null;  // clickable highlight circles for lakes/rivers
  var maOn = true;
  var bodyMarkers = {};   // bodyId -> big bubble marker
  var spotMarkers = {};   // spotId -> sub-bubble marker (selected body only)
  var selected = null;    // selected body id
  var speciesFilter = null; // species id filtering sub-bubbles
  var filter = "all";     // all | salt | coast | river | lake | kayak

  var COLORS = { salt: "#4da3ff", coast: "#2dd4bf", river: "#7ddf64", lake: "#c084fc" };

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
      maxZoom: 17,
      attribution: "&copy; OpenStreetMap | MA bounds: WDFW"
    }).addTo(map);
    initMarineAreas();
    initWaterCircles();
    render();
  }

  // Lakes & rivers have no polygon, so give each a clickable highlighted
  // circle of water — tap it (or its bubble) to open the body.
  function initWaterCircles() {
    waterLayer = L.layerGroup();
    WF.bodies.all().forEach(function (body) {
      if (body.kind !== "lake" && body.kind !== "river") return;
      var col = body.kind === "lake" ? COLORS.lake : COLORS.river;
      var c = L.circle(body.center, {
        radius: body.kind === "lake" ? 1500 : 1200,
        color: col, weight: 1.4, opacity: 0.8, fillColor: col, fillOpacity: 0.18
      });
      c.on("click", function () { select(body.id); });
      waterLayer.addLayer(c);
    });
    waterLayer.addTo(map);
  }

  // WDFW Marine Area polygons — the clickable water
  function initMarineAreas() {
    if (!WF.MARINE_AREAS) return;
    maLayer = L.geoJSON(WF.MARINE_AREAS, {
      style: {
        color: "#4da3ff", weight: 1.4, opacity: 0.75,
        fillColor: "#4da3ff", fillOpacity: 0.12
      },
      onEachFeature: function (f, layer) {
        layer.on("click", function () { select("ma-" + f.properties.AreaName); });
      }
    });
    if (maOn) maLayer.addTo(map);
  }

  function toggleMA() {
    if (!maLayer) return;
    maOn = !maOn;
    if (maOn) maLayer.addTo(map); else map.removeLayer(maLayer);
    var chip = document.getElementById("ma-toggle");
    if (chip) chip.classList.toggle("on", maOn);
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
    // big bubbles (hidden while a body is selected)
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

  // ---- sub-bubbles (spots of the selected body) ----
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
    if (body) {
      body.spots.forEach(function (s) { if (spotPasses(s)) want[s.id] = s; });
    }
    Object.keys(spotMarkers).forEach(function (id) {
      if (!want[id]) { map.removeLayer(spotMarkers[id]); delete spotMarkers[id]; }
    });
    // score every shown spot — for the picked fish if one is selected
    var scored = Object.keys(want).map(function (id) {
      var s = want[id];
      var r = speciesFilter ? WF.score.spotForSpecies(s, speciesFilter) : WF.score.spot(s);
      return { s: s, score: r.score };
    }).sort(function (a, b) { return b.score - a.score; });
    var top = scored.length ? scored[0].score : 0;
    scored.forEach(function (row, i) {
      var s = row.s;
      // when a fish is picked, light up the best in-form spots
      var hot = !!speciesFilter && row.score >= 50 && row.score >= top - 6;
      var best = !!speciesFilter && i === 0 && row.score >= 40;
      var icon = L.divIcon({ className: "mk-wrap", html: spotHtml(s, row.score, hot, best), iconSize: [34, 34], iconAnchor: [17, 17] });
      if (spotMarkers[s.id]) { spotMarkers[s.id].setIcon(icon); }
      else {
        var m = L.marker([s.lat, s.lng], { icon: icon, zIndexOffset: best ? 1000 : 800 });
        m.on("click", function () { WF.ui.showDetail(s.id, true); });
        m.addTo(map);
        spotMarkers[s.id] = m;
      }
    });
  }

  function select(bodyId) {
    var body = WF.bodies.get(bodyId);
    if (!body) return;
    selected = bodyId;
    speciesFilter = null;
    if (waterLayer) map.removeLayer(waterLayer);
    render();
    if (body.feature) {
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
    WF.ui.closeSheet();
    document.getElementById("map-back").classList.remove("show");
    if (waterLayer) waterLayer.addTo(map);
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

  function focus(spot) {
    if (!map) return;
    map.setView([spot.lat, spot.lng], 13);
  }

  function invalidate() { if (map) setTimeout(function () { map.invalidateSize(); }, 60); }

  return {
    init: init, render: render, setFilter: setFilter, focus: focus,
    invalidate: invalidate, toggleMA: toggleMA,
    select: select, deselect: deselect, setSpeciesFilter: setSpeciesFilter,
    getFilter: function () { return filter; },
    getSelected: function () { return selected; },
    getSpeciesFilter: function () { return speciesFilter; }
  };
})();
