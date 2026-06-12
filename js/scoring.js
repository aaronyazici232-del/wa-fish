// WA Fish — "Fish Now" scoring engine. Scores every spot 0–100 against the
// current month, tide stage, wind, and river flow, with kayak wind safety.
// Weights by fishery:
//   salt/coast: 15 base + 30 season + 25 tide + 30 wind
//   river:      15 base + 35 season + 50 flow
//   lake:       20 base + 40 season + 40 wind
window.WF = window.WF || {};

WF.score = (function () {

  function seasonFactor(spot, month) {
    if (spot.prime && spot.prime.indexOf(month) >= 0) return 1.0;
    if (spot.months && spot.months.indexOf(month) >= 0) return 0.6;
    var adj = spot.months && (spot.months.indexOf(month === 1 ? 12 : month - 1) >= 0 ||
                              spot.months.indexOf(month === 12 ? 1 : month + 1) >= 0);
    return adj ? 0.25 : 0;
  }

  function isSheltered(spot, windDeg) {
    if (!spot.shelter || !spot.shelter.length || windDeg == null) return false;
    return spot.shelter.indexOf(WF.cond.compass8(windDeg)) >= 0;
  }

  function windFactor(spot, wx) {
    if (!wx || wx.wind == null) return { f: 0.6, label: "wind unknown" };
    var spd = wx.wind, gst = wx.gust || spd;
    var f;
    if (spd < 6) f = 1.0;
    else if (spd < 10) f = 0.85;
    else if (spd < 13) f = 0.6;
    else if (spd < 16) f = 0.3;
    else f = 0.05;
    if (isSheltered(spot, wx.dir)) f = Math.min(1, f + 0.25);
    if (gst > spd + 8) f = Math.max(0, f - 0.15);
    return { f: f, spd: spd, gst: gst };
  }

  function kayakSafety(spot, wx) {
    if (!spot.access || spot.access.indexOf("kayak") < 0) return null;
    if (!wx || wx.wind == null) return null;
    var spd = wx.wind, gst = wx.gust || spd;
    var sheltered = isSheltered(spot, wx.dir);
    var level = null;
    if (spd >= 15 || gst >= 20) level = "danger";
    else if (spd >= 11 || gst >= 16) level = "caution";
    if (level && sheltered) level = level === "danger" ? "caution" : null;
    return level;
  }

  function flowFactor(spot, flows) {
    var g = spot.gauge && flows && flows[spot.gauge];
    if (!g) return { f: 0.5, label: "flow unknown" };
    var cfs = g.cfs, lo = spot.flow.good[0], hi = spot.flow.good[1], blown = spot.flow.high;
    var f, label;
    if (cfs >= blown) { f = 0; label = "blown out"; }
    else if (cfs > hi) { f = 0.45; label = "high — fish the edges"; }
    else if (cfs >= lo) { f = 1.0; label = "in shape"; }
    else if (cfs >= lo * 0.6) { f = 0.5; label = "low & clear"; }
    else { f = 0.25; label = "very low"; }
    return { f: f, cfs: cfs, label: label };
  }

  function scoreSpot(spot) {
    var d = WF.cond.get();
    var now = new Date();
    var month = now.getMonth() + 1;
    var wx = d && d.weather && d.weather[spot.id];
    var reasons = [];
    var score = 0;
    var safety = null;

    var sf = seasonFactor(spot, month);
    var tideInfo = null;

    if (spot.fishery === "river") {
      score = 15 + 35 * sf;
      var ff = flowFactor(spot, d && d.flows);
      score += 50 * ff.f;
      reasons.push({ ok: sf >= 0.6, text: sf >= 1 ? "prime season" : sf >= 0.6 ? "in season" : "off season" });
      reasons.push({ ok: ff.f >= 0.8, text: ff.cfs != null ? Math.round(ff.cfs).toLocaleString() + " cfs — " + ff.label : ff.label });
    } else if (spot.fishery === "lake") {
      score = 20 + 40 * sf;
      var wfL = windFactor(spot, wx);
      score += 40 * wfL.f;
      reasons.push({ ok: sf >= 0.6, text: sf >= 1 ? "prime season" : sf >= 0.6 ? "in season" : "off season" });
      if (wfL.spd != null) reasons.push({ ok: wfL.f >= 0.7, text: "wind " + Math.round(wfL.spd) + " kn" });
      safety = kayakSafety(spot, wx);
    } else { // salt / coast
      score = 15 + 30 * sf;
      reasons.push({ ok: sf >= 0.6, text: sf >= 1 ? "prime season" : sf >= 0.6 ? "in season" : "off season" });

      if (spot.tides && spot.station) {
        tideInfo = WF.cond.stage(spot.station);
        if (tideInfo) {
          var match = spot.tides.indexOf(tideInfo.stage) >= 0;
          // moving-water spots get partial credit during the "wrong" moving stage
          var partial = !match && tideInfo.stage.indexOf("slack") < 0 &&
                        (spot.tides.indexOf("incoming") >= 0 || spot.tides.indexOf("outgoing") >= 0);
          score += match ? 25 : partial ? 12 : 4;
          reasons.push({ ok: match, text: tideInfo.stage + (match ? " — good tide" : "") });
        } else {
          score += 12; reasons.push({ ok: false, text: "tide unknown" });
        }
      } else {
        score += 15; // tide-agnostic (piers, squid)
        if (spot.tides === null) reasons.push({ ok: true, text: "tide not critical" });
      }

      var wfS = windFactor(spot, wx);
      score += 30 * wfS.f;
      if (wfS.spd != null) {
        var wtxt = "wind " + Math.round(wfS.spd) + " kn" + (wfS.gst > wfS.spd + 5 ? " g" + Math.round(wfS.gst) : "");
        if (isSheltered(spot, wx.dir)) wtxt += " (sheltered)";
        reasons.push({ ok: wfS.f >= 0.7, text: wtxt });
      }
      safety = kayakSafety(spot, wx);
    }

    // Out-of-season spots sink regardless of conditions
    if (sf === 0) score = Math.min(score, 25);

    return {
      spot: spot,
      score: Math.round(Math.max(0, Math.min(100, score))),
      reasons: reasons,
      safety: safety,
      tide: tideInfo
    };
  }

  function rankAll(filter) {
    return WF.SPOTS
      .filter(function (s) { return !filter || filter(s); })
      .map(scoreSpot)
      .sort(function (a, b) { return b.score - a.score; });
  }

  return { spot: scoreSpot, rankAll: rankAll };
})();
