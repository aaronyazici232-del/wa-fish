# WA Fish

Personal Washington fishing PWA — smart spot map, tides, wind, river flows, and
a WDFW regs reference. Built for one Android phone and a kayak. Not for
publication.

## What it does

- **Map** — ~70 public WA fishing spots (Puget Sound, coast, rivers, lakes),
  color-coded by fishery, each marker showing its live "Fish Now" score.
  Filters: All / 🛶 Kayak / Salt / Coast / Rivers / Lakes.
- **Fish Now** — every spot scored 0–100 against the current month, tide stage,
  wind (with kayak safety flags), and USGS river flow. Tap a card for launch
  info, depth/structure, and Garmin Striker 4cv sonar tips.
- **Tides** — tide curve + highs/lows for 34 NOAA stations, sunrise/sunset,
  moon phase.
- **Regs** — WDFW snapshot (typical seasons, limits, gear rules) with deep
  links to official + emergency rules pages. Reference only — always verify.

Data refreshes only when the app opens or you tap ⟳. Last-good data is cached
in localStorage and the service worker caches the app shell + viewed map
tiles, so it still opens (with dated data) when you're out of signal.

APIs (all free, keyless, called straight from the phone): NOAA CO-OPS tides,
Open-Meteo weather, USGS Water Services flows. No backend, no accounts.

## Run locally

```
python -m http.server 8642 --directory wa-fish
```

then open http://localhost:8642

## Put it on your phone (GitHub Pages)

1. Create a **public** repo on github.com (e.g. `wa-fish`) — public is required
   for free Pages; the app contains nothing private.
2. From this folder:
   ```
   git remote add origin https://github.com/<you>/wa-fish.git
   git push -u origin master
   ```
3. On GitHub: repo → Settings → Pages → Source: "Deploy from a branch" →
   branch `master`, folder `/ (root)` → Save.
4. On your Android phone, open `https://<you>.github.io/wa-fish/` in Chrome →
   menu (⋮) → **Add to Home screen**. It installs like an app.

Updates: edit files, commit, push — the phone picks up the new version on next
open (the service worker version string in `sw.js` should be bumped when shell
files change).

## Editing spots

Everything lives in [data/spots.js](data/spots.js) — plain JS objects. Add your
own spots, fix tide-stage tags as you learn what a spot actually fishes best
on, adjust river flow ranges. [data/regs.js](data/regs.js) holds the regs
snapshot; ask Claude to recompile it each season.
