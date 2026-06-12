// WA Fish — view rendering: Fish Now list, spot detail sheet, tides tab, regs tab.
window.WF = window.WF || {};

WF.ui = (function () {

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var FISHERY_LABEL = { salt: "Salt", coast: "Coast", river: "River", lake: "Lake" };
  var FISHERY_CLASS = { salt: "f-salt", coast: "f-coast", river: "f-river", lake: "f-lake" };

  // ---------- Fish Now ----------
  function renderFishNow() {
    var el = document.getElementById("fishnow-list");
    var d = WF.cond.get();
    if (!d) {
      el.innerHTML = "<div class='empty'>No conditions yet — tap refresh ⟳ when you have signal.</div>";
      return;
    }
    var f = WF.map.getFilter();
    var ranked = WF.score.rankAll(function (s) {
      if (f === "all") return true;
      if (f === "kayak") return s.access && s.access.indexOf("kayak") >= 0;
      return s.fishery === f;
    });
    var html = ranked.map(function (r) {
      var s = r.spot;
      var chips = r.reasons.map(function (re) {
        return "<span class='chip sm " + (re.ok ? "ok" : "no") + "'>" + (re.ok ? "✓ " : "✗ ") + esc(re.text) + "</span>";
      }).join("");
      var safety = "";
      if (r.safety === "danger") safety = "<div class='safety danger'>⚠️ Too windy for the kayak right now</div>";
      else if (r.safety === "caution") safety = "<div class='safety caution'>⚠️ Kayak caution — building wind</div>";
      var cls = r.score >= 70 ? "good" : r.score >= 45 ? "mid" : "low";
      return "<div class='card spot-card' data-id='" + s.id + "'>" +
        "<div class='card-head'><div>" +
          "<div class='spot-name'>" + esc(s.name) + "</div>" +
          "<div class='spot-sub'><span class='tag " + FISHERY_CLASS[s.fishery] + "'>" + FISHERY_LABEL[s.fishery] + "</span> " + esc(s.area || "") + "</div>" +
        "</div><div class='score " + cls + "'>" + r.score + "</div></div>" +
        "<div class='chips'>" + chips + "</div>" + safety +
        "</div>";
    }).join("");
    el.innerHTML = html || "<div class='empty'>No spots match this filter.</div>";
    el.querySelectorAll(".spot-card").forEach(function (c) {
      c.addEventListener("click", function () { showDetail(c.dataset.id); });
    });
  }

  // ---------- Spot detail sheet ----------
  function showDetail(id) {
    var s = null;
    WF.SPOTS.forEach(function (x) { if (x.id === id) s = x; });
    if (!s) return;
    var r = WF.score.spot(s);
    var d = WF.cond.get();
    var wx = d && d.weather && d.weather[s.id];

    var html = "<div class='sheet-grab'></div>";
    html += "<div class='sheet-head'><div><h2>" + esc(s.name) + "</h2>" +
      "<div class='spot-sub'><span class='tag " + FISHERY_CLASS[s.fishery] + "'>" + FISHERY_LABEL[s.fishery] + "</span> " +
      esc(s.area || "") + "</div></div>" +
      "<div class='score " + (r.score >= 70 ? "good" : r.score >= 45 ? "mid" : "low") + "'>" + r.score + "</div></div>";

    if (r.safety === "danger") html += "<div class='safety danger'>⚠️ Wind is at or above kayak limits right now</div>";
    else if (r.safety === "caution") html += "<div class='safety caution'>⚠️ Kayak caution — watch the wind trend</div>";

    html += "<div class='chips'>" + r.reasons.map(function (re) {
      return "<span class='chip sm " + (re.ok ? "ok" : "no") + "'>" + (re.ok ? "✓ " : "✗ ") + esc(re.text) + "</span>";
    }).join("") + "</div>";

    // current conditions block
    var rows = [];
    if (wx && wx.wind != null) {
      rows.push(["Wind", Math.round(wx.wind) + " kn g" + Math.round(wx.gust) + " from " + WF.cond.compass(wx.dir)]);
      rows.push(["Weather", WF.cond.wxText(wx.code) + ", " + Math.round(wx.tempF) + "°F"]);
    }
    if (r.tide) {
      var nx = r.tide.next;
      var nd = new Date(nx.ms);
      rows.push(["Tide", r.tide.stage + " → " + (nx.type === "H" ? "high" : "low") + " " +
        (nd.getHours() % 12 || 12) + ":" + ("0" + nd.getMinutes()).slice(-2) + (nd.getHours() < 12 ? "am" : "pm") +
        " (" + nx.v.toFixed(1) + " ft)"]);
    }
    if (s.gauge && d && d.flows && d.flows[s.gauge]) {
      rows.push(["Flow", Math.round(d.flows[s.gauge].cfs).toLocaleString() + " cfs" + (s.gaugeNote ? " — " + s.gaugeNote : "")]);
      rows.push(["Good range", s.flow.good[0].toLocaleString() + "–" + s.flow.good[1].toLocaleString() + " cfs (blown ≥ " + s.flow.high.toLocaleString() + ")"]);
    }
    if (rows.length) {
      html += "<div class='kv'>" + rows.map(function (row) {
        return "<div class='kv-row'><span>" + row[0] + "</span><b>" + esc(row[1]) + "</b></div>";
      }).join("") + "</div>";
    }

    // tide mini-chart
    if (s.station && d && d.tides && d.tides[s.station]) {
      html += "<div class='mini-chart'>" + WF.tidechart(d.tides[s.station], { width: 360, height: 150 }) + "</div>";
    }

    function block(title, body) {
      if (!body || body === "—") return "";
      return "<div class='blk'><div class='blk-t'>" + title + "</div><div class='blk-b'>" + esc(body) + "</div></div>";
    }
    html += block("Target species", (s.species || []).join(" · "));
    html += block("Launch / access", s.launch);
    html += block("Depth & structure", s.depth);
    html += block("Striker 4cv tips", s.sonar);
    html += block("Notes", s.notes);

    // links
    var links = "<a class='btn' target='_blank' rel='noopener' href='https://www.google.com/maps/dir/?api=1&destination=" + s.lat + "," + s.lng + "'>Directions</a>";
    if (s.gauge) links += "<a class='btn' target='_blank' rel='noopener' href='https://waterdata.usgs.gov/monitoring-location/" + s.gauge + "'>USGS gauge</a>";
    links += "<a class='btn' target='_blank' rel='noopener' href='https://wdfw.wa.gov/fishing/regulations/emergency-rules'>Emergency rules</a>";
    html += "<div class='btn-row'>" + links + "</div>";
    html += "<button class='btn wide' id='detail-map-btn'>Show on map</button>";

    var sheet = document.getElementById("sheet");
    sheet.querySelector(".sheet-body").innerHTML = html;
    sheet.classList.add("open");
    document.getElementById("sheet-backdrop").classList.add("open");
    document.getElementById("detail-map-btn").addEventListener("click", function () {
      closeSheet();
      WF.app.showTab("map");
      WF.map.focus(s);
    });
  }

  function closeSheet() {
    document.getElementById("sheet").classList.remove("open");
    document.getElementById("sheet-backdrop").classList.remove("open");
  }

  // ---------- Tides tab ----------
  var tideStation = "9447130";
  function renderTides() {
    var sel = document.getElementById("tide-station");
    if (!sel.options.length) {
      var groups = { central: "Central Sound", north: "North Sound", south: "South Sound / Hood Canal", peninsula: "Strait / Peninsula", coast: "Coast" };
      Object.keys(groups).forEach(function (g) {
        var og = document.createElement("optgroup");
        og.label = groups[g];
        WF.STATIONS.filter(function (st) { return st.region === g; }).forEach(function (st) {
          var o = document.createElement("option");
          o.value = st.id; o.textContent = st.name;
          og.appendChild(o);
        });
        sel.appendChild(og);
      });
      sel.value = tideStation;
      sel.addEventListener("change", function () { tideStation = sel.value; drawTides(); });
    }
    drawTides();
  }

  function drawTides() {
    var box = document.getElementById("tide-content");
    var d = WF.cond.get();
    box.innerHTML = "<div class='empty'>Loading tides…</div>";
    WF.cond.tidesFor(tideStation).then(function (preds) {
      var html = "<div class='card'>" + WF.tidechart(preds, { width: 380, height: 190 }) + "</div>";
      // table of upcoming events
      var now = Date.now();
      var upcoming = preds.filter(function (p) { return p.ms > now - 2 * 3600e3; }).slice(0, 8);
      html += "<div class='card'><div class='blk-t'>Highs & lows</div><div class='kv'>" + upcoming.map(function (p) {
        var dt = new Date(p.ms);
        var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        var lbl = days[dt.getDay()] + " " + (dt.getHours() % 12 || 12) + ":" + ("0" + dt.getMinutes()).slice(-2) + (dt.getHours() < 12 ? "am" : "pm");
        return "<div class='kv-row'><span>" + (p.type === "H" ? "▲ High" : "▼ Low") + " — " + lbl + "</span><b>" + p.v.toFixed(1) + " ft</b></div>";
      }).join("") + "</div></div>";
      // sun & moon
      var moon = WF.cond.moon();
      var sunRow = "";
      if (d && d.sun) {
        var sr = new Date(d.sun.sunrise), ss = new Date(d.sun.sunset);
        function t12(x) { return (x.getHours() % 12 || 12) + ":" + ("0" + x.getMinutes()).slice(-2) + (x.getHours() < 12 ? "am" : "pm"); }
        sunRow = "<div class='kv-row'><span>Sunrise / sunset</span><b>" + t12(sr) + " / " + t12(ss) + "</b></div>";
      }
      html += "<div class='card'><div class='kv'>" + sunRow +
        "<div class='kv-row'><span>Moon</span><b>" + moon.icon + " " + moon.name + "</b></div></div></div>";
      box.innerHTML = html;
    }).catch(function () {
      box.innerHTML = "<div class='empty'>Couldn't load tides for this station — no signal or NOAA hiccup. Try refresh.</div>";
    });
  }

  // ---------- Regs tab ----------
  function renderRegs() {
    var el = document.getElementById("regs-content");
    if (el.dataset.done) return;
    var html = "<div class='safety caution'>📋 Snapshot from " + WF.REGS_META.compiled +
      " — typical patterns only, NOT current law. " + esc(WF.REGS_META.disclaimer.split(".")[2] || "Verify before every trip.") + "</div>";
    html += "<div class='card'><div class='blk-t'>Official sources</div><div class='btn-col'>" +
      WF.REGS_META.links.map(function (l) {
        return "<a class='btn' target='_blank' rel='noopener' href='" + l.url + "'>" + esc(l.label) + "</a>";
      }).join("") + "</div></div>";
    html += WF.REGS.map(function (sec, i) {
      var items = sec.items.map(function (it) {
        var link = it.link ? " <a target='_blank' rel='noopener' href='" + it.link + "'>↗ details</a>" : "";
        return "<div class='blk'><div class='blk-t'>" + esc(it.title) + "</div><div class='blk-b'>" + esc(it.body) + link + "</div></div>";
      }).join("");
      var note = sec.note ? "<div class='muted note'>" + esc(sec.note) + "</div>" : "";
      return "<details class='card acc'" + (i === 0 ? " open" : "") + "><summary>" + esc(sec.section) + "</summary>" + note + items + "</details>";
    }).join("");
    el.innerHTML = html;
    el.dataset.done = "1";
  }

  // ---------- header age ----------
  function renderAge() {
    var el = document.getElementById("data-age");
    var d = WF.cond.get();
    if (!d) { el.textContent = "no data"; el.className = "age stale"; return; }
    var mins = Math.round((Date.now() - d.fetchedAt) / 60e3);
    var txt = mins < 1 ? "just now" : mins < 60 ? mins + "m ago" : Math.round(mins / 60) + "h ago";
    el.textContent = "↻ " + txt;
    el.className = "age" + (mins > 360 ? " stale" : "");
  }

  return {
    renderFishNow: renderFishNow, showDetail: showDetail, closeSheet: closeSheet,
    renderTides: renderTides, renderRegs: renderRegs, renderAge: renderAge
  };
})();
