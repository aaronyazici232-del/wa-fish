// WA Fish — SVG tide curve. Interpolates a smooth curve between NOAA high/low
// predictions using the standard cosine method, marks each event, and draws a
// "now" line. Returns an SVG string sized for a phone screen.
window.WF = window.WF || {};

WF.tidechart = function (preds, opts) {
  opts = opts || {};
  var W = opts.width || 360, H = opts.height || 170;
  var padL = 30, padR = 8, padT = 14, padB = 24;
  var now = Date.now();
  var start = opts.start || (now - 3 * 3600e3);
  var end = opts.end || (now + 27 * 3600e3);

  var events = preds.filter(function (p) { return p.ms > start - 9 * 3600e3 && p.ms < end + 9 * 3600e3; });
  if (events.length < 2) return "<div class='muted'>No tide data</div>";

  function heightAt(t) {
    var e0 = null, e1 = null;
    for (var i = 0; i < events.length - 1; i++) {
      if (events[i].ms <= t && events[i + 1].ms >= t) { e0 = events[i]; e1 = events[i + 1]; break; }
    }
    if (!e0) return null;
    var frac = (t - e0.ms) / (e1.ms - e0.ms);
    return (e0.v + e1.v) / 2 + ((e0.v - e1.v) / 2) * Math.cos(Math.PI * frac);
  }

  var vMin = Infinity, vMax = -Infinity;
  events.forEach(function (e) { vMin = Math.min(vMin, e.v); vMax = Math.max(vMax, e.v); });
  var span = (vMax - vMin) || 1; vMin -= span * 0.15; vMax += span * 0.15;

  function x(t) { return padL + (t - start) / (end - start) * (W - padL - padR); }
  function y(v) { return padT + (1 - (v - vMin) / (vMax - vMin)) * (H - padT - padB); }

  var steps = 120, pts = [];
  for (var i = 0; i <= steps; i++) {
    var t = start + (end - start) * (i / steps);
    var h = heightAt(t);
    if (h != null) pts.push(x(t).toFixed(1) + "," + y(h).toFixed(1));
  }

  var svg = "<svg viewBox='0 0 " + W + " " + H + "' xmlns='http://www.w3.org/2000/svg' class='tidechart'>";
  // baseline grid: 0 ft line if visible
  if (vMin < 0 && vMax > 0) {
    svg += "<line x1='" + padL + "' y1='" + y(0) + "' x2='" + (W - padR) + "' y2='" + y(0) + "' class='tc-zero'/>";
  }
  // area under curve
  if (pts.length) {
    svg += "<polyline points='" + pts.join(" ") + "' class='tc-line'/>";
    svg += "<polygon points='" + padL + "," + (H - padB) + " " + pts.join(" ") + " " + (W - padR) + "," + (H - padB) + "' class='tc-fill'/>";
  }
  // now line
  if (now > start && now < end) {
    var hNow = heightAt(now);
    svg += "<line x1='" + x(now) + "' y1='" + padT + "' x2='" + x(now) + "' y2='" + (H - padB) + "' class='tc-now'/>";
    if (hNow != null) svg += "<circle cx='" + x(now) + "' cy='" + y(hNow) + "' r='4' class='tc-nowdot'/>";
  }
  // event markers + labels
  events.forEach(function (e) {
    if (e.ms < start || e.ms > end) return;
    var d = new Date(e.ms);
    var hh = d.getHours(), mm = ("0" + d.getMinutes()).slice(-2);
    var label = (hh % 12 || 12) + ":" + mm + (hh < 12 ? "a" : "p");
    var ex = x(e.ms), ey = y(e.v);
    svg += "<circle cx='" + ex + "' cy='" + ey + "' r='3' class='tc-evt'/>";
    var ty = e.type === "H" ? ey - 8 : ey + 14;
    svg += "<text x='" + ex + "' y='" + ty + "' class='tc-txt' text-anchor='middle'>" + e.v.toFixed(1) + "'</text>";
    svg += "<text x='" + ex + "' y='" + (H - 8) + "' class='tc-txt tc-time' text-anchor='middle'>" + label + "</text>";
  });
  // y-axis labels
  svg += "<text x='4' y='" + (padT + 8) + "' class='tc-txt'>" + vMax.toFixed(0) + "'</text>";
  svg += "<text x='4' y='" + (H - padB) + "' class='tc-txt'>" + vMin.toFixed(0) + "'</text>";
  svg += "</svg>";
  return svg;
};
