// WA Fish — conditions layer. Fetches tides (NOAA CO-OPS), wind/weather
// (Open-Meteo), and river flows (USGS) ONLY when refresh() is called — on app
// open or manual pull. Last good data is kept in localStorage for offline use.
window.WF = window.WF || {};

WF.cond = (function () {
  var KEY = "wf_cache_v1";
  var data = null; // { fetchedAt, tides:{station:[{t,v,type}]}, weather:{spotId:{...}}, flows:{gauge:{cfs,time}}, sun:{sunrise,sunset} }

  function load() {
    try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { data = null; }
    return data;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }

  function fmtDate(d) {
    return d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
  }

  // --- NOAA tides (hilo predictions, yesterday + 3 days) ---
  function fetchTides(station) {
    var start = new Date(Date.now() - 24 * 3600e3);
    var url = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter" +
      "?product=predictions&application=wa-fish&datum=MLLW&time_zone=lst_ldt" +
      "&units=english&interval=hilo&format=json" +
      "&begin_date=" + fmtDate(start) + "&range=96&station=" + station;
    return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.predictions) throw new Error(j.error ? j.error.message : "no predictions");
      return j.predictions.map(function (p) {
        return { t: p.t, ms: new Date(p.t.replace(" ", "T")).getTime(), v: parseFloat(p.v), type: p.type };
      });
    });
  }

  // --- Open-Meteo weather, batched (multiple coords per request) ---
  function fetchWeather(spots) {
    var chunks = [];
    for (var i = 0; i < spots.length; i += 50) chunks.push(spots.slice(i, i + 50));
    return Promise.all(chunks.map(function (chunk) {
      var url = "https://api.open-meteo.com/v1/forecast" +
        "?latitude=" + chunk.map(function (s) { return s.lat.toFixed(3); }).join(",") +
        "&longitude=" + chunk.map(function (s) { return s.lng.toFixed(3); }).join(",") +
        "&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,precipitation" +
        "&daily=sunrise,sunset&forecast_days=1" +
        "&wind_speed_unit=kn&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles";
      return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
        var arr = Array.isArray(j) ? j : [j];
        var out = {};
        arr.forEach(function (loc, i) {
          var c = loc.current || {};
          out[chunk[i].id] = {
            tempF: c.temperature_2m, wind: c.wind_speed_10m, gust: c.wind_gusts_10m,
            dir: c.wind_direction_10m, code: c.weather_code, precip: c.precipitation
          };
        });
        var sun = null;
        if (arr[0] && arr[0].daily) sun = { sunrise: arr[0].daily.sunrise[0], sunset: arr[0].daily.sunset[0] };
        return { weather: out, sun: sun };
      });
    })).then(function (results) {
      var weather = {}, sun = null;
      results.forEach(function (res) {
        Object.keys(res.weather).forEach(function (k) { weather[k] = res.weather[k]; });
        if (res.sun) sun = res.sun;
      });
      return { weather: weather, sun: sun };
    });
  }

  // --- USGS river flows, one call for all gauges ---
  function fetchFlows(gauges) {
    if (!gauges.length) return Promise.resolve({});
    var url = "https://waterservices.usgs.gov/nwis/iv/?format=json&parameterCd=00060&siteStatus=all&sites=" + gauges.join(",");
    return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      var out = {};
      (j.value.timeSeries || []).forEach(function (ts) {
        var site = ts.sourceInfo.siteCode[0].value;
        var v = ts.values[0] && ts.values[0].value[0];
        if (v) out[site] = { cfs: parseFloat(v.value), time: v.dateTime, name: ts.sourceInfo.siteName };
      });
      return out;
    });
  }

  function refresh(onProgress) {
    var stations = {}, gauges = {};
    WF.SPOTS.forEach(function (s) {
      if (s.station) stations[s.station] = true;
      if (s.gauge) gauges[s.gauge] = true;
    });
    var stationIds = Object.keys(stations);
    var next = { fetchedAt: Date.now(), tides: {}, weather: {}, flows: {}, sun: null, errors: [] };

    var tideJobs = stationIds.map(function (id) {
      return fetchTides(id).then(
        function (preds) { next.tides[id] = preds; },
        function (e) { next.errors.push("tide " + id + ": " + e.message); }
      );
    });
    var wxJob = fetchWeather(WF.SPOTS).then(
      function (res) { next.weather = res.weather; next.sun = res.sun; },
      function (e) { next.errors.push("weather: " + e.message); }
    );
    var flowJob = fetchFlows(Object.keys(gauges)).then(
      function (flows) { next.flows = flows; },
      function (e) { next.errors.push("flows: " + e.message); }
    );

    return Promise.all(tideJobs.concat([wxJob, flowJob])).then(function () {
      // Keep old data for anything that failed this round
      if (data) {
        Object.keys(data.tides || {}).forEach(function (id) { if (!next.tides[id]) next.tides[id] = data.tides[id]; });
        if (!Object.keys(next.weather).length && data.weather) { next.weather = data.weather; }
        if (!Object.keys(next.flows).length && data.flows) { next.flows = data.flows; }
        if (!next.sun) next.sun = data.sun;
      }
      data = next;
      save();
      return data;
    });
  }

  // Fetch tides for one extra station on demand (tide-tab picker), cached.
  function tidesFor(station) {
    if (data && data.tides && data.tides[station]) return Promise.resolve(data.tides[station]);
    return fetchTides(station).then(function (preds) {
      if (data) { data.tides[station] = preds; save(); }
      return preds;
    });
  }

  // --- Derived: current tide stage at a station ---
  // Returns {stage, prev, next, pct} where stage is "incoming"|"outgoing"|"high slack"|"low slack"
  function stage(station, atMs) {
    if (!data || !data.tides[station]) return null;
    var now = atMs || Date.now();
    var preds = data.tides[station];
    var prev = null, nx = null;
    for (var i = 0; i < preds.length; i++) {
      if (preds[i].ms <= now) prev = preds[i]; else { nx = preds[i]; break; }
    }
    if (!prev || !nx) return null;
    var SLACK = 40 * 60e3;
    var st;
    if (now - prev.ms < SLACK) st = prev.type === "H" ? "high slack" : "low slack";
    else if (nx.ms - now < SLACK) st = nx.type === "H" ? "high slack" : "low slack";
    else st = nx.type === "H" ? "incoming" : "outgoing";
    return { stage: st, prev: prev, next: nx, pct: (now - prev.ms) / (nx.ms - prev.ms) };
  }

  // --- Moon phase (local computation, no API) ---
  function moon(d) {
    var synodic = 29.53058867;
    var ref = Date.UTC(2000, 0, 6, 18, 14); // known new moon
    var days = ((d || Date.now()) - ref) / 86400e3;
    var phase = ((days % synodic) + synodic) % synodic;
    var names = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous",
                 "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
    var icons = ["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘"];
    var idx = Math.floor((phase / synodic) * 8 + 0.5) % 8;
    return { name: names[idx], icon: icons[idx], age: phase };
  }

  var WX_CODES = {
    0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Fog", 51: "Drizzle", 53: "Drizzle", 55: "Drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain", 66: "Freezing rain", 67: "Freezing rain",
    71: "Snow", 73: "Snow", 75: "Snow", 80: "Showers", 81: "Showers", 82: "Heavy showers",
    95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm"
  };
  function wxText(code) { return WX_CODES[code] || "—"; }

  function compass(deg) {
    var pts = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
    return pts[Math.round(deg / 22.5) % 16];
  }
  function compass8(deg) {
    var pts = ["N","NE","E","SE","S","SW","W","NW"];
    return pts[Math.round(deg / 45) % 8];
  }

  return {
    load: load, refresh: refresh, tidesFor: tidesFor, stage: stage, moon: moon,
    wxText: wxText, compass: compass, compass8: compass8,
    get: function () { return data; }
  };
})();
