// WA Fish — water bodies: the "big bubbles". One per WDFW Marine Area (built
// from the official polygons) plus one per lake and river. Each body knows its
// spots, computes a live rating (best spot score), and its best fish right now.
window.WF = window.WF || {};

WF.bodies = (function () {
  var list = [];
  var byId = {};

  // Hand-picked bubble anchors in the middle of each marine area's water —
  // polygon centroids land on islands for the odd-shaped areas.
  var MA_CENTERS = {
    "1": [46.30, -124.30], "2": [46.85, -124.40], "2-1": [46.55, -123.98],
    "2-2": [46.93, -124.05], "3": [47.80, -124.75], "4": [48.38, -124.85],
    "5": [48.30, -124.25], "6": [48.25, -123.20], "7": [48.55, -122.95],
    "8-1": [48.30, -122.55], "8-2": [48.03, -122.35], "9": [47.95, -122.45],
    "10": [47.58, -122.42], "11": [47.33, -122.45], "12": [47.55, -123.00],
    "13": [47.27, -122.80]
  };

  function build() {
    list = []; byId = {};
    // marine areas from the official polygons
    if (WF.MARINE_AREAS) {
      WF.MARINE_AREAS.features.forEach(function (f) {
        var an = f.properties.AreaName;
        var body = {
          id: "ma-" + an, kind: "marine", areaName: an,
          name: "Marine Area " + an, title: f.properties.AreaTitle,
          center: MA_CENTERS[an] || [47.5, -123.0],
          short: "MA " + an,
          spots: WF.SPOTS.filter(function (s) { return s.area === "MA " + an; }),
          feature: f
        };
        list.push(body); byId[body.id] = body;
      });
    }
    // each lake and river is its own body
    WF.SPOTS.forEach(function (s) {
      if (s.fishery === "lake" || s.fishery === "river") {
        var body = {
          id: "wb-" + s.id, kind: s.fishery,
          name: s.name, title: s.area,
          center: [s.lat, s.lng],
          short: s.name.replace(/ ?\(.*\)/, "").replace("Lake ", "L. ").replace(" River", " R."),
          spots: [s], feature: null
        };
        list.push(body); byId[body.id] = body;
      }
    });
    return list;
  }

  // body rating = its best spot right now
  function rating(body) {
    var best = 0;
    body.spots.forEach(function (s) {
      var r = WF.score.spot(s);
      if (r.score > best) best = r.score;
    });
    return best;
  }

  // best fish in this body this month: species on in-season spots,
  // weighted by spot score and the species' own best months
  function bestFish(body, n) {
    var month = new Date().getMonth() + 1;
    var agg = {};
    body.spots.forEach(function (s) {
      var r = WF.score.spot(s);
      WF.speciesForSpot(s).forEach(function (id) {
        var sp = WF.speciesById(id);
        var w = r.score * (sp && sp.months.indexOf(month) >= 0 ? 1.0 : 0.45);
        if (!agg[id] || w > agg[id]) agg[id] = w;
      });
    });
    return Object.keys(agg)
      .sort(function (a, b) { return agg[b] - agg[a]; })
      .slice(0, n || 2)
      .map(function (id) { return WF.speciesById(id); });
  }

  // all species present in a body, best-first
  function speciesIn(body) {
    return bestFish(body, 99);
  }

  function fisheriesIn(body) {
    var set = {};
    body.spots.forEach(function (s) {
      set[s.fishery] = true;
      if (s.access && s.access.indexOf("kayak") >= 0) set.kayak = true;
    });
    return set;
  }

  return {
    build: build, rating: rating, bestFish: bestFish, speciesIn: speciesIn,
    fisheriesIn: fisheriesIn,
    all: function () { return list; },
    get: function (id) { return byId[id]; }
  };
})();
