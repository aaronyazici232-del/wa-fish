// WA Fish — app shell: tabs, refresh-on-open, service worker registration.
window.WF = window.WF || {};

WF.app = (function () {
  var current = "map";

  function showTab(name) {
    current = name;
    document.querySelectorAll(".view").forEach(function (v) {
      v.classList.toggle("active", v.id === "view-" + name);
    });
    document.querySelectorAll("#nav button").forEach(function (b) {
      b.classList.toggle("on", b.dataset.tab === name);
    });
    if (name === "map") { WF.map.init(); WF.map.invalidate(); }
    if (name === "fishnow") WF.ui.renderFishNow();
    if (name === "tides") WF.ui.renderTides();
    if (name === "regs") WF.ui.renderRegs();
  }

  function refresh() {
    var btn = document.getElementById("refresh-btn");
    btn.classList.add("spin");
    return WF.cond.refresh().then(function (d) {
      btn.classList.remove("spin");
      WF.ui.renderAge();
      WF.map.render();
      if (current === "fishnow") WF.ui.renderFishNow();
      if (current === "tides") WF.ui.renderTides();
      if (d.errors && d.errors.length) console.warn("partial refresh:", d.errors);
    }).catch(function (e) {
      btn.classList.remove("spin");
      WF.ui.renderAge();
      console.warn("refresh failed", e);
    });
  }

  function init() {
    // tabs
    document.querySelectorAll("#nav button").forEach(function (b) {
      b.addEventListener("click", function () { showTab(b.dataset.tab); });
    });
    // filters (shared by map + fish now)
    document.querySelectorAll("#map-filters .chip").forEach(function (c) {
      c.addEventListener("click", function () {
        WF.map.setFilter(c.dataset.f);
        if (current === "fishnow") WF.ui.renderFishNow();
      });
    });
    document.getElementById("refresh-btn").addEventListener("click", refresh);
    document.getElementById("sheet-backdrop").addEventListener("click", WF.ui.closeSheet);

    // load cache, paint immediately, then refresh if online
    WF.cond.load();
    WF.ui.renderAge();
    showTab("map");
    if (navigator.onLine) refresh();
    setInterval(WF.ui.renderAge, 60e3);

    // PWA service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  }

  document.addEventListener("DOMContentLoaded", init);
  return { showTab: showTab, refresh: refresh };
})();
