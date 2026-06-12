// WA Fish — Leaflet map view. Color-coded markers by fishery, filter chips
// (including a kayak filter), tap a marker to open the spot detail sheet.
window.WF = window.WF || {};

WF.map = (function () {
  var map = null;
  var markers = {};
  var maLayer = null;
  var maOn = true;
  var filter = "all"; // all | salt | coast | river | lake | kayak

  var COLORS = { salt: "#4da3ff", coast: "#2dd4bf", river: "#7ddf64", lake: "#c084fc" };

  function passes(spot) {
    if (filter === "all") return true;
    if (filter === "kayak") return spot.access && spot.access.indexOf("kayak") >= 0;
    return spot.fishery === filter;
  }

  function markerHtml(spot, score) {
    var c = COLORS[spot.fishery] || "#999";
    var badge = score != null ? "<span class='mk-score'>" + score + "</span>" : "";
    return "<div class='mk' style='--mk:" + c + "'>" + badge + "</div>";
  }

  function init() {
    if (map) return;
    map = L.map("map", { zoomControl: false, attributionControl: true })
      .setView([47.6, -122.6], 8);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 17,
      attribution: "&copy; OpenStreetMap | MA bounds: WDFW"
    }).addTo(map);
    initMarineAreas();
    render();
  }

  // WDFW Marine Area polygons — highlighted water regions with labels.
  function initMarineAreas() {
    if (!WF.MARINE_AREAS) return;
    maLayer = L.geoJSON(WF.MARINE_AREAS, {
      style: {
        color: "#4da3ff", weight: 1.4, opacity: 0.75,
        fillColor: "#4da3ff", fillOpacity: 0.12
      },
      onEachFeature: function (f, layer) {
        var p = f.properties;
        layer.bindTooltip("MA " + p.AreaName, {
          permanent: true, direction: "center", className: "ma-label"
        });
        layer.bindPopup(
          "<div class='ma-pop'><b>Marine Area " + p.AreaName + "</b><br>" + p.AreaTitle +
          "<br><a href='#' onclick=\"WF.app.showTab('regs');return false;\">Open regs ↗</a></div>"
        );
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

  function render() {
    if (!map) return;
    var scores = {};
    try {
      WF.score.rankAll().forEach(function (r) { scores[r.spot.id] = r.score; });
    } catch (e) {}
    WF.SPOTS.forEach(function (spot) {
      var show = passes(spot);
      var m = markers[spot.id];
      if (show && !m) {
        m = L.marker([spot.lat, spot.lng], {
          icon: L.divIcon({ className: "mk-wrap", html: markerHtml(spot, scores[spot.id]), iconSize: [34, 34], iconAnchor: [17, 17] })
        });
        m.on("click", function () { WF.ui.showDetail(spot.id); });
        m.addTo(map);
        markers[spot.id] = m;
      } else if (show && m) {
        m.setIcon(L.divIcon({ className: "mk-wrap", html: markerHtml(spot, scores[spot.id]), iconSize: [34, 34], iconAnchor: [17, 17] }));
      } else if (!show && m) {
        map.removeLayer(m);
        delete markers[spot.id];
      }
    });
  }

  function setFilter(f) {
    filter = f;
    document.querySelectorAll("#map-filters .chip").forEach(function (el) {
      el.classList.toggle("on", el.dataset.f === f);
    });
    render();
  }

  function focus(spot) {
    if (!map) return;
    map.setView([spot.lat, spot.lng], 12);
  }

  function invalidate() { if (map) setTimeout(function () { map.invalidateSize(); }, 60); }

  return { init: init, render: render, setFilter: setFilter, focus: focus, invalidate: invalidate, toggleMA: toggleMA, getFilter: function () { return filter; } };
})();
