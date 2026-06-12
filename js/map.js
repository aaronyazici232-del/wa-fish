// WA Fish — Leaflet map view. Color-coded markers by fishery, filter chips
// (including a kayak filter), tap a marker to open the spot detail sheet.
window.WF = window.WF || {};

WF.map = (function () {
  var map = null;
  var markers = {};
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
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);
    render();
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

  return { init: init, render: render, setFilter: setFilter, focus: focus, invalidate: invalidate, getFilter: function () { return filter; } };
})();
