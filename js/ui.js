// WA Fish — view rendering: water-body sheet (species guides + spots),
// spot detail, species guide, Fish Now list, tides tab, regs tab.
// Sheets stack: body -> spot -> species, with a back button.
window.WF = window.WF || {};

WF.ui = (function () {

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var FISHERY_LABEL = { salt: "Salt", coast: "Coast", river: "River", lake: "Lake", marine: "Salt" };
  var FISHERY_CLASS = { salt: "f-salt", coast: "f-coast", river: "f-river", lake: "f-lake" };
  var MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // ---------- sheet plumbing with a back stack ----------
  var stack = []; // [{type:'body'|'spot'|'species', id}]

  function openSheet(html) {
    var sheet = document.getElementById("sheet");
    sheet.querySelector(".sheet-body").innerHTML = html;
    sheet.classList.add("open");
    document.getElementById("sheet-backdrop").classList.add("open");
    sheet.querySelector(".sheet-body").scrollTop = 0;
  }

  function closeSheet() {
    stack = [];
    document.getElementById("sheet").classList.remove("open");
    document.getElementById("sheet-backdrop").classList.remove("open");
  }

  function back() {
    stack.pop();
    var top = stack[stack.length - 1];
    if (!top) { closeSheet(); return; }
    if (top.type === "body") renderBodySheet(top.id);
    else if (top.type === "spot") renderSpotSheet(top.id);
    else if (top.type === "species") renderSpeciesSheet(top.id);
  }

  function backBtn() {
    if (stack.length < 2) return "";
    var prev = stack[stack.length - 2];
    var label = prev.type === "body" ? (WF.bodies.get(prev.id) || {}).short || "back" : "back";
    return "<button class='back-btn' id='sheet-back'>‹ " + esc(label) + "</button>";
  }

  function wireBack() {
    var b = document.getElementById("sheet-back");
    if (b) b.addEventListener("click", back);
  }

  function monthBadge(months) {
    var now = new Date().getMonth() + 1;
    var on = months.indexOf(now) >= 0;
    var txt = months.map(function (m) { return MONTHS[m]; }).join(" ");
    return "<span class='chip sm " + (on ? "ok" : "") + "'>" + (on ? "✓ now · " : "") + txt + "</span>";
  }

  // ---------- water body sheet ----------
  function showBody(bodyId) {
    stack = [{ type: "body", id: bodyId }];
    renderBodySheet(bodyId);
  }

  function renderBodySheet(bodyId) {
    var body = WF.bodies.get(bodyId);
    if (!body) return;
    var rating = WF.bodies.rating(body);
    var cls = rating >= 70 ? "good" : rating >= 45 ? "mid" : "low";
    var best = WF.bodies.bestFish(body, 2);
    var allSpecies = WF.bodies.speciesIn(body);
    var spFilter = WF.map.getSpeciesFilter();

    var html = "<div class='sheet-grab'></div>";
    html += "<div class='sheet-head'><div>" +
      "<h2>" + esc(body.name) + "</h2>" +
      "<div class='spot-sub'>" + esc(body.title || "") + " · " + body.spots.length + " spot" + (body.spots.length === 1 ? "" : "s") + "</div>" +
      "</div><div class='score " + cls + "'>" + (body.spots.length ? rating : "–") + "</div></div>";

    if (best.length) {
      html += "<div class='chips'>" + best.map(function (sp) {
        return "<span class='chip sm ok'>🎣 best now: " + esc(sp.name.split(" (")[0]) + "</span>";
      }).join("") + "</div>";
    }

    // ----- pick a fish -> hot spots light up -----
    if (body.spots.length) {
      html += "<div class='blk'><div class='blk-t'>🎣 Find a fish's hot spots</div>" +
        "<div class='muted note'>Tap a fish — its best spots light up here and on the map, ranked by season, tide & wind right now.</div></div>";
      html += "<div class='chips' id='body-species-filter'>" +
        "<span class='chip sm sel" + (!spFilter ? " on" : "") + "' data-sp=''>All fish</span>" +
        allSpecies.map(function (sp) {
          return "<span class='chip sm sel" + (spFilter === sp.id ? " on" : "") + "' data-sp='" + sp.id + "'>" +
            esc(sp.name.split(" (")[0]) + "</span>";
        }).join("") + "</div>";
      html += "<div id='body-best'></div>";
      html += "<div id='body-spots'></div>";
    } else {
      html += "<div class='empty'>No curated spots in this area yet — add one in data/spots.js.</div>";
    }

    // ----- species guides with regs by the fish -----
    if (allSpecies.length) {
      html += "<div class='blk'><div class='blk-t'>Fish here — what to throw & the rules</div></div>";
      html += allSpecies.map(function (sp) { return speciesCard(sp, body.id); }).join("");
    }

    html += "<div class='btn-row'>" +
      "<a class='btn' target='_blank' rel='noopener' href='https://wdfw.wa.gov/fishing/regulations/emergency-rules'>Emergency rules</a>" +
      "<a class='btn' target='_blank' rel='noopener' href='https://wdfw.wa.gov/fishing/regulations'>Full regs</a></div>";

    openSheet(html);
    renderBodySpots(body);

    document.querySelectorAll("#body-species-filter .chip").forEach(function (c) {
      c.addEventListener("click", function () {
        var id = c.dataset.sp || null;
        WF.map.setSpeciesFilter(id);
        document.querySelectorAll("#body-species-filter .chip").forEach(function (x) {
          x.classList.toggle("on", x === c);
        });
        renderBodySpots(body);
      });
    });
    document.querySelectorAll(".sp-card").forEach(function (c) {
      c.addEventListener("click", function () { showSpecies(c.dataset.sp); });
    });
  }

  function renderBodySpots(body) {
    var el = document.getElementById("body-spots");
    if (!el) return;
    var spFilter = WF.map.getSpeciesFilter();
    var rows = body.spots
      .filter(function (s) { return !spFilter || WF.speciesForSpot(s).indexOf(spFilter) >= 0; })
      .map(function (s) { return { s: s, r: spFilter ? WF.score.spotForSpecies(s, spFilter) : WF.score.spot(s) }; })
      .sort(function (a, b) { return b.r.score - a.r.score; });

    // "best for this fish" banner
    var banner = document.getElementById("body-best");
    if (banner) {
      if (spFilter && rows.length) {
        var sp = WF.speciesById(spFilter);
        var t = rows[0];
        var bcls = t.r.score >= 70 ? "good" : t.r.score >= 45 ? "mid" : "low";
        var note = t.r.fishIn ? "" : "<div class='muted'>Out of season now — try " +
          sp.months.map(function (m) { return MONTHS[m]; }).slice(0, 3).join("/") + "</div>";
        banner.innerHTML = "<div class='best-banner'><div>🔥 Best for <b>" + esc(sp.name.split(" (")[0]) +
          "</b> right now<br><span class='bb-spot'>" + esc(t.s.name) + "</span>" + note +
          "</div><div class='score " + bcls + "'>" + t.r.score + "</div></div>";
      } else { banner.innerHTML = ""; }
    }

    el.innerHTML = rows.map(function (row, i) {
      var s = row.s, r = row.r;
      var cls = r.score >= 70 ? "good" : r.score >= 45 ? "mid" : "low";
      var ico = (s.access || []).indexOf("kayak") >= 0 ? "🛶 " : (s.access || []).indexOf("pier") >= 0 ? "⚓ " : "";
      var flame = (spFilter && i === 0 && r.score >= 40) ? "🔥 " : "";
      return "<div class='spot-row' data-id='" + s.id + "'>" +
        "<div><b>" + flame + ico + esc(s.name) + "</b><div class='spot-sub'>" +
        esc((s.species || []).slice(0, 3).join(" · ")) + "</div></div>" +
        "<div class='score sm " + cls + "'>" + r.score + "</div></div>";
    }).join("") || "<div class='empty'>No spots here for that fish.</div>";
    el.querySelectorAll(".spot-row").forEach(function (c) {
      c.addEventListener("click", function () { showDetail(c.dataset.id, true); });
    });
  }

  // compact species card: art, lures/bait, expandable guide, REGS BY THE FISH
  function speciesCard(sp) {
    return "<div class='card sp-card' data-sp='" + sp.id + "'>" +
      "<div class='sp-head'>" + WF.fishart(sp.art, 78) +
      "<div><b>" + esc(sp.name) + "</b>" +
      (sp.aka ? "<div class='spot-sub'>" + esc(sp.aka) + "</div>" : "") +
      "<div class='chips'>" + monthBadge(sp.months) + "</div></div></div>" +
      "<div class='sp-line'><span>Lures</span>" + esc(sp.lures) + "</div>" +
      "<div class='sp-line'><span>Bait</span>" + esc(sp.bait) + "</div>" +
      "<div class='sp-regs'>📋 " + esc(sp.regs) + "</div>" +
      "<div class='sp-more'>tap for the how-to guide ›</div></div>";
  }

  // ---------- full species guide sheet ----------
  function showSpecies(spId) {
    stack.push({ type: "species", id: spId });
    renderSpeciesSheet(spId);
  }

  function renderSpeciesSheet(spId) {
    var sp = WF.speciesById(spId);
    if (!sp) return;
    var html = "<div class='sheet-grab'></div>" + backBtn();
    html += "<div class='sp-hero'>" + WF.fishart(sp.art, 150) +
      "<div><h2>" + esc(sp.name) + "</h2>" +
      (sp.aka ? "<div class='spot-sub'>" + esc(sp.aka) + "</div>" : "") + "</div></div>";
    html += "<div class='chips'>" + monthBadge(sp.months) + "</div>";
    html += "<div class='blk'><div class='blk-t'>How to catch them</div><div class='blk-b'>" + esc(sp.guide) + "</div></div>";
    html += "<div class='blk'><div class='blk-t'>Best lures</div><div class='blk-b'>" + esc(sp.lures) + "</div></div>";
    html += "<div class='blk'><div class='blk-t'>Bait / live bait</div><div class='blk-b'>" + esc(sp.bait) + "</div></div>";
    html += "<div class='blk'><div class='blk-t'>Regulations</div><div class='blk-b sp-regs'>📋 " + esc(sp.regs) +
      "</div></div>";
    if (WF.map.getSelected()) {
      html += "<button class='btn wide' id='sp-hotspots'>📍 Show " + esc(sp.name.split(" (")[0]) + " hot spots on the map</button>";
    }
    html += "<div class='btn-row'>" +
      "<a class='btn' target='_blank' rel='noopener' href='https://wdfw.wa.gov/fishing/regulations'>Verify current rules</a>" +
      "<a class='btn' target='_blank' rel='noopener' href='https://wdfw.wa.gov/fishing/regulations/emergency-rules'>Emergency rules</a></div>";
    openSheet(html);
    wireBack();
    var hs = document.getElementById("sp-hotspots");
    if (hs) hs.addEventListener("click", function () {
      WF.map.setSpeciesFilter(sp.id);
      closeSheet();
      WF.app.showTab("map");
    });
  }

  // ---------- spot detail sheet ----------
  function showDetail(id, push) {
    if (push && stack.length && stack[stack.length - 1].type === "body") {
      stack.push({ type: "spot", id: id });
    } else {
      stack = [{ type: "spot", id: id }];
    }
    renderSpotSheet(id);
  }

  function renderSpotSheet(id) {
    var s = null;
    WF.SPOTS.forEach(function (x) { if (x.id === id) s = x; });
    if (!s) return;
    var r = WF.score.spot(s);
    var d = WF.cond.get();
    var wx = d && d.weather && d.weather[s.id];

    var html = "<div class='sheet-grab'></div>" + backBtn();
    html += "<div class='sheet-head'><div><h2>" + esc(s.name) + "</h2>" +
      "<div class='spot-sub'><span class='tag " + FISHERY_CLASS[s.fishery] + "'>" + FISHERY_LABEL[s.fishery] + "</span> " +
      esc(s.area || "") + "</div></div>" +
      "<div class='score " + (r.score >= 70 ? "good" : r.score >= 45 ? "mid" : "low") + "'>" + r.score + "</div></div>";

    if (r.safety === "danger") html += "<div class='safety danger'>⚠️ Wind is at or above kayak limits right now</div>";
    else if (r.safety === "caution") html += "<div class='safety caution'>⚠️ Kayak caution — watch the wind trend</div>";

    html += "<div class='chips'>" + r.reasons.map(function (re) {
      return "<span class='chip sm " + (re.ok ? "ok" : "no") + "'>" + (re.ok ? "✓ " : "✗ ") + esc(re.text) + "</span>";
    }).join("") + "</div>";

    // species chips -> guides
    var spIds = WF.speciesForSpot(s);
    if (spIds.length) {
      html += "<div class='blk'><div class='blk-t'>Fish here — tap for guide</div><div class='chips'>" +
        spIds.map(function (spid) {
          var sp = WF.speciesById(spid);
          return "<span class='chip sm sel sp-chip' data-sp='" + spid + "'>🐟 " + esc(sp.name.split(" (")[0]) + "</span>";
        }).join("") + "</div></div>";
    }

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

    var links = "<a class='btn' target='_blank' rel='noopener' href='https://www.google.com/maps/dir/?api=1&destination=" + s.lat + "," + s.lng + "'>Directions</a>";
    if (s.gauge) links += "<a class='btn' target='_blank' rel='noopener' href='https://waterdata.usgs.gov/monitoring-location/" + s.gauge + "'>USGS gauge</a>";
    links += "<a class='btn' target='_blank' rel='noopener' href='https://wdfw.wa.gov/fishing/regulations/emergency-rules'>Emergency rules</a>";
    html += "<div class='btn-row'>" + links + "</div>";
    html += "<button class='btn wide' id='detail-map-btn'>Show on map</button>";

    openSheet(html);
    wireBack();
    document.querySelectorAll(".sp-chip").forEach(function (c) {
      c.addEventListener("click", function () { showSpecies(c.dataset.sp); });
    });
    document.getElementById("detail-map-btn").addEventListener("click", function () {
      closeSheet();
      WF.app.showTab("map");
      WF.map.focus(s);
    });
  }

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
      var now = Date.now();
      var upcoming = preds.filter(function (p) { return p.ms > now - 2 * 3600e3; }).slice(0, 8);
      html += "<div class='card'><div class='blk-t'>Highs & lows</div><div class='kv'>" + upcoming.map(function (p) {
        var dt = new Date(p.ms);
        var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        var lbl = days[dt.getDay()] + " " + (dt.getHours() % 12 || 12) + ":" + ("0" + dt.getMinutes()).slice(-2) + (dt.getHours() < 12 ? "am" : "pm");
        return "<div class='kv-row'><span>" + (p.type === "H" ? "▲ High" : "▼ Low") + " — " + lbl + "</span><b>" + p.v.toFixed(1) + " ft</b></div>";
      }).join("") + "</div></div>";
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
      " — typical patterns only, NOT current law. Verify before every trip.</div>";
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
    renderFishNow: renderFishNow, showDetail: showDetail, showBody: showBody,
    showSpecies: showSpecies, closeSheet: closeSheet,
    renderTides: renderTides, renderRegs: renderRegs, renderAge: renderAge
  };
})();
