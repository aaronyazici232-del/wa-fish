// WA Fish — original stylized SVG fish illustrations, parameterized per
// species from data/species.js `art`. viewBox 120x60, scales to any width.
window.WF = window.WF || {};

WF.fishart = function (art, w) {
  w = w || 84;
  var a = art || {}, s = "";
  var back = a.back || "#456", side = a.side || "#bcc", belly = a.belly || "#eef";

  function spots(cx, cy, rx, ry, n, color) {
    var out = "", seed = 7;
    for (var i = 0; i < n; i++) {
      seed = (seed * 31 + 17) % 97;
      var px = cx - rx + (seed / 97) * 2 * rx;
      seed = (seed * 31 + 17) % 97;
      var py = cy - ry + (seed / 97) * 2 * ry;
      out += "<circle cx='" + px.toFixed(1) + "' cy='" + py.toFixed(1) + "' r='1.4' fill='" + color + "' opacity='.55'/>";
    }
    return out;
  }

  if (a.shape === "salmon" || !a.shape) {
    s += "<path d='M12 30 C26 13 66 11 88 22 L106 12 L101 30 L106 48 L88 38 C66 49 26 47 12 30 Z' fill='" + side + "'/>";
    s += "<path d='M12 30 C26 13 66 11 88 22 L92 24 C66 20 30 21 12 30 Z' fill='" + back + "'/>";
    s += "<path d='M12 30 C30 39 66 40 88 38 L84 35 C60 38 30 36 12 30 Z' fill='" + belly + "'/>";
    if (a.hump) s += "<path d='M34 19 C42 8 58 8 66 17 C56 13 44 13 34 19 Z' fill='" + back + "'/>";
    if (a.stripe) s += "<path d='M16 29 C40 26 70 27 88 30 C70 33 40 33 16 31 Z' fill='" + a.stripe + "' opacity='.55'/>";
    s += "<path d='M58 14 L66 8 L70 14 Z' fill='" + back + "'/>"; // dorsal
    s += "<path d='M78 16 L82 12 L84 17 Z' fill='" + back + "' opacity='.8'/>"; // adipose
    s += "<path d='M44 40 L48 50 L54 41 Z' fill='" + side + "'/>"; // pelvic
    s += "<path d='M30 34 C36 38 42 38 46 34 L40 30 Z' fill='" + back + "' opacity='.5'/>"; // pectoral
    s += "<path d='M20 23 C16 27 16 33 20 37' stroke='" + back + "' stroke-width='1.4' fill='none' opacity='.6'/>"; // gill
    if (a.kype) s += "<path d='M12 30 C9 28 8 31 11 33 Z' fill='" + back + "'/>";
    if (a.slash) s += "<path d='M17 35 L24 37' stroke='" + a.slash + "' stroke-width='2.4' stroke-linecap='round'/>";
    if (a.bars) {
      for (var b = 0; b < 4; b++) {
        var bx = 30 + b * 14;
        s += "<path d='M" + bx + " 18 L" + (bx + 6) + " 42' stroke='#7a4f63' stroke-width='4' opacity='.35'/>";
      }
    }
    if (a.spots) s += spots(50, 21, 30, 5, 9, "#26323a") + "<g opacity='.7'>" + spots(98, 30, 6, 12, 5, "#26323a") + "</g>";
    s += "<circle cx='20' cy='26' r='2.6' fill='#1a2228'/><circle cx='19.2' cy='25.2' r='.8' fill='#fff'/>";
  }

  if (a.shape === "ling") {
    s += "<path d='M10 32 C20 20 50 17 74 20 C90 22 100 24 106 18 L103 31 L106 44 C98 39 88 40 74 41 C50 44 20 42 10 32 Z' fill='" + side + "'/>";
    s += "<path d='M10 32 C24 22 60 18 92 23 L92 26 C60 23 26 26 10 32 Z' fill='" + back + "'/>";
    s += "<path d='M24 20 L30 12 L38 18 L46 11 L54 18 L64 12 L72 19 L82 15 L88 21 L60 21 Z' fill='" + back + "' opacity='.85'/>"; // long spiny dorsal
    s += "<path d='M12 32 C10 28 9 33 12 35 L20 36 Z' fill='" + back + "'/>"; // big jaw
    s += "<path d='M34 38 C40 43 48 43 52 38 L44 34 Z' fill='" + back + "' opacity='.5'/>";
    if (a.spots) s += spots(58, 28, 38, 7, 14, "#3c3626");
    s += "<circle cx='22' cy='27' r='2.8' fill='#1a2228'/><circle cx='21' cy='26' r='.9' fill='#fff'/>";
  }

  if (a.shape === "rockfish") {
    s += "<path d='M16 32 C26 14 62 12 82 22 L100 14 L96 31 L100 46 L82 40 C62 50 26 48 16 32 Z' fill='" + side + "'/>";
    s += "<path d='M16 32 C28 16 60 14 84 23 L84 26 C58 20 30 24 16 32 Z' fill='" + back + "'/>";
    s += "<path d='M30 17 L34 8 L38 16 L43 7 L47 15 L52 7 L56 15 L62 9 L66 16 Z' fill='" + back + "'/>"; // spines
    s += "<path d='M34 42 C42 47 50 46 54 41 L44 37 Z' fill='" + back + "' opacity='.6'/>";
    if (a.spots) s += spots(56, 28, 32, 10, 16, "#1f2326");
    s += "<circle cx='26' cy='27' r='3' fill='#14181b'/><circle cx='25' cy='26' r='1' fill='#fff'/>";
  }

  if (a.shape === "flat") {
    s += "<path d='M14 30 C30 12 80 10 100 26 L110 22 L106 31 L110 40 L100 35 C80 50 30 48 14 30 Z' fill='" + side + "'/>";
    s += "<path d='M14 30 C30 14 78 12 100 27 C78 20 32 20 14 30 Z' fill='" + back + "'/>";
    s += "<path d='M20 28 C40 22 80 22 98 29' stroke='" + belly + "' stroke-width='1.6' fill='none' opacity='.7'/>"; // lateral arch
    if (a.spots) s += spots(58, 28, 38, 11, 18, "#3a3122");
    s += "<circle cx='28' cy='24' r='2.4' fill='#1a1d20'/><circle cx='33' cy='20' r='2.4' fill='#1a1d20'/>"; // both eyes up
  }

  if (a.shape === "bass" || a.shape === "perch" || a.shape === "surfperch") {
    s += "<path d='M14 32 C24 14 60 11 80 22 L98 14 L94 32 L98 48 L80 41 C60 51 24 49 14 32 Z' fill='" + side + "'/>";
    s += "<path d='M14 32 C26 16 58 13 82 23 L82 26 C56 19 28 24 14 32 Z' fill='" + back + "'/>";
    s += "<path d='M30 16 L34 7 L38 15 L43 6 L47 14 L52 7 L56 15 Z' fill='" + back + "' opacity='.9'/>";
    if (a.barsV) {
      for (var v = 0; v < 5; v++) {
        var vx = 30 + v * 11;
        s += "<path d='M" + vx + " 18 L" + (vx + 4) + " 44' stroke='" + back + "' stroke-width='4.5' opacity='.4'/>";
      }
    }
    if (a.stripeH) s += "<path d='M18 31 C40 28 66 29 82 32 C66 35 40 35 18 33 Z' fill='" + back + "' opacity='.7'/>";
    s += "<path d='M34 42 C42 47 50 46 54 41 L44 37 Z' fill='" + back + "' opacity='.55'/>";
    s += "<circle cx='24' cy='27' r='2.8' fill='#181c14'/><circle cx='23' cy='26' r='.9' fill='#fff'/>";
  }

  if (a.shape === "crab") {
    s += "<ellipse cx='60' cy='34' rx='28' ry='17' fill='" + side + "'/>";
    s += "<path d='M34 30 C40 20 80 20 86 30 C80 24 40 24 34 30 Z' fill='" + back + "'/>";
    // claws
    s += "<path d='M30 26 C20 18 12 16 8 20 L14 23 L9 26 C14 30 24 30 30 30 Z' fill='" + back + "'/>";
    s += "<path d='M90 26 C100 18 108 16 112 20 L106 23 L111 26 C106 30 96 30 90 30 Z' fill='" + back + "'/>";
    // legs
    for (var l = 0; l < 4; l++) {
      var lx = 40 + l * 12;
      s += "<path d='M" + lx + " 48 L" + (lx - 6) + " 57' stroke='" + back + "' stroke-width='3.2' stroke-linecap='round'/>";
      s += "<path d='M" + (lx + 4) + " 48 L" + (lx + 10) + " 57' stroke='" + back + "' stroke-width='3.2' stroke-linecap='round'/>";
    }
    s += "<circle cx='52' cy='24' r='2.2' fill='#241a14'/><circle cx='68' cy='24' r='2.2' fill='#241a14'/>";
  }

  if (a.shape === "squid") {
    s += "<path d='M18 30 C30 18 58 18 70 30 C58 42 30 42 18 30 Z' fill='" + side + "'/>"; // mantle
    s += "<path d='M18 30 L6 18 L14 30 L6 42 Z' fill='" + back + "'/>"; // fins
    s += "<path d='M70 30 C84 20 100 18 112 22 C100 24 88 27 76 30 C88 33 100 36 112 38 C100 42 84 40 70 30 Z' fill='" + back + "' opacity='.85'/>"; // arms
    s += "<path d='M74 26 C92 18 106 16 114 17 M74 34 C92 42 106 44 114 43' stroke='" + back + "' stroke-width='2' fill='none' opacity='.6'/>"; // tentacles
    s += "<circle cx='62' cy='30' r='3.4' fill='#2a2230'/><circle cx='61' cy='29' r='1.1' fill='#fff'/>";
  }

  if (a.shape === "shrimp") {
    s += "<path d='M24 22 C44 10 78 12 92 26 C98 34 94 44 84 46 C88 38 86 32 78 30 C64 24 44 24 32 30 C26 32 24 27 24 22 Z' fill='" + side + "'/>";
    s += "<path d='M24 22 C44 12 76 14 90 26 C76 18 46 18 26 26 Z' fill='" + back + "'/>";
    for (var g = 0; g < 4; g++) {
      var gx = 38 + g * 12;
      s += "<path d='M" + gx + " 16 Q" + (gx + 6) + " 26 " + gx + " 32' stroke='" + back + "' stroke-width='1.6' fill='none' opacity='.5'/>"; // segments
    }
    s += "<path d='M84 46 L74 56 M84 46 L88 56 M82 44 L66 54' stroke='" + back + "' stroke-width='2' stroke-linecap='round' opacity='.8'/>"; // tail fan & legs
    s += "<path d='M24 22 L8 12 M24 24 L6 22' stroke='" + back + "' stroke-width='1.6' stroke-linecap='round'/>"; // antennae
    s += "<circle cx='28' cy='22' r='2.2' fill='#33201a'/>";
  }

  return "<svg viewBox='0 0 120 60' width='" + w + "' height='" + Math.round(w / 2) +
    "' xmlns='http://www.w3.org/2000/svg' class='fishart'>" + s + "</svg>";
};
