// WA Fish — species guides: what to throw, how to fish it, and the rule that
// matters, right next to the fish. regs lines are TYPICAL patterns — the
// verify link is the law. `keywords` map these guides onto spot species text.
// `art` feeds js/fishart.js (original stylized illustrations).
window.WF = window.WF || {};

WF.SPECIES = [
  {
    id: "chinook", name: "Chinook (King)", aka: "Blackmouth = resident winter chinook",
    keywords: ["chinook", "king", "blackmouth"],
    months: [7, 8, 11, 12, 1, 2],
    art: { shape: "salmon", back: "#2e4a3d", side: "#b9c6cc", belly: "#eef2f3", spots: true, kype: true },
    lures: "4\" spoons (Coyote, Kingfisher) behind a flasher, hoochies (green/glow), Buzz Bombs or 3–4 oz jigs from the beach",
    bait: "Cut-plug or whole herring, anchovy in a helmet",
    guide: "Troll 1.5–2.5 mph with a flasher and 36–42\" leader. Summer kings ride tide seams off points at 30–80 ft — fish the two hours around tide change at first light. Winter blackmouth hug bottom near bait at 90–140 ft: drop to bottom, reel up two cranks, stay in the zone. From the kayak, mooching cut-plug herring on the current seam is deadly and simple.",
    regs: "Barbless hooks in marine areas. 22\" min in most marine areas; many fisheries are hatchery (clipped) only. Openings are short and quota-driven."
  },
  {
    id: "coho", name: "Coho (Silver)", aka: "",
    keywords: ["coho", "silver"],
    months: [8, 9, 10],
    art: { shape: "salmon", back: "#33536b", side: "#c4ced4", belly: "#f2f5f6", spots: false, kype: false },
    lures: "2.5–3.5\" spoons, pink/white mini hoochies, #4–5 spinners from the beach, twitching jigs (3/8 oz pink/purple) in rivers",
    bait: "Herring strip behind a small flasher",
    guide: "Fish the top 30 ft and move fast — coho chase. Troll quicker than for kings (2.5–3.5 mph) or cast and rip spoons off beaches in September, first two hours of light. In rivers, twitch jigs in the slow frog water and pockets coho stack in. If you mark bait balls on the 4cv with fish above them, that's the picture.",
    regs: "Wild (unclipped) coho release in many marine areas and rivers. Marine min size 16\" where set. Check the area's hatchery-only rules."
  },
  {
    id: "pink", name: "Pink (Humpy)", aka: "Odd years only — next run 2027",
    keywords: ["pink"],
    months: [8, 9],
    art: { shape: "salmon", back: "#4a5568", side: "#cdd5da", belly: "#f4f6f7", spots: true, hump: true },
    lures: "Anything small and PINK: mini hoochies, Buzz Bombs, Rotators, 1/4 oz pink jigs, pink spoons",
    bait: "Rarely needed — this is a lure fishery",
    guide: "The easiest salmon in Washington when they're in. Cast pink from any beach on the migration route (Browns Point, Picnic Point, Point No Point) on an incoming tide, slow retrieve with pauses. In rivers, dead-drift a pink jig under a float. Light gear makes them fun — they average 3–5 lbs.",
    regs: "Run years only (odd). Counts in the daily salmon limit; some rivers add a bonus pink limit in run years. Barbless in marine areas."
  },
  {
    id: "chum", name: "Chum (Dog salmon)", aka: "",
    keywords: ["chum"],
    months: [10, 11, 12],
    art: { shape: "salmon", back: "#46584a", side: "#b9c3b6", belly: "#eef1ec", spots: false, bars: true, kype: true },
    lures: "Chartreuse or green: 1/4–3/8 oz jigs under a float, small green spoons, chartreuse yarn flies",
    bait: "Sand shrimp where bait is legal",
    guide: "November's fish. Chum bite chartreuse out of aggression — float a green jig in travel lanes off beaches (Hoodsport is the classic) or in lower-river tailouts. They're the hardest-pulling salmon for their size; bring a real drag. Fresh chrome fish near salt are great; they color up fast in rivers.",
    regs: "Hoodsport hatchery zone has its own terminal rules. Some rivers close mid-run to protect chum — watch emergency rules."
  },
  {
    id: "sockeye", name: "Sockeye", aka: "Baker Lake's headline fishery",
    keywords: ["sockeye"],
    months: [7, 8],
    art: { shape: "salmon", back: "#3d5c50", side: "#c0cbc9", belly: "#f0f3f2", spots: false },
    lures: "Bare red hook or small pink mini-squid 12–18\" behind a 0 dodger, trolled DEAD slow",
    bait: "Tip with shrimp or corn where legal",
    guide: "A sonar game: find the school (they band tight, usually 30–60 ft at Baker Lake), then troll 0.8–1.2 mph through it with a dodger and bare red hook. If you're not marking them on the 4cv, don't fish — relocate. Schools move daily.",
    regs: "Opens only when the run clears escapement — announced early summer per lake. Check before driving."
  },
  {
    id: "steelhead", name: "Steelhead", aka: "Winter (Dec–Mar) and summer runs",
    keywords: ["steelhead"],
    months: [12, 1, 2, 6, 7],
    art: { shape: "salmon", back: "#4f5d6b", side: "#ccd4d9", belly: "#f4f6f7", spots: true, stripe: "#d98c8c" },
    lures: "1/8–1/4 oz jigs (pink, black/red) under a float, beads and yarn on a drift rig, #3–4 spoons swung through tailouts",
    bait: "Sand shrimp or eggs ONLY where bait is legal — many rivers ban it",
    guide: "Read water first: steelhead hold in walking-pace slots 3–8 ft deep. Float-fish a jig through every seam, adjusting depth to tick near bottom. Hatchery winters peak December–January (Bogachiel, Cowlitz, Green); summer fish on the Skykomish and Cowlitz June–July. Cover water — a dozen good casts, then move.",
    regs: "Wild steelhead release statewide. Single-point barbless; many rivers are selective-gear (no bait). OP rivers carry extra rules that change yearly."
  },
  {
    id: "cutthroat", name: "Sea-run Cutthroat", aka: "Coastal cutthroat in lakes too",
    keywords: ["cutthroat"],
    months: [1, 2, 3, 9, 10, 11, 12],
    art: { shape: "salmon", back: "#5a5b3f", side: "#d3cfae", belly: "#f4f2e3", spots: true, slash: "#e06c3c" },
    lures: "Small spoons (Dick Nite 50/50), 3\" soft jerkbaits, small spinners, clouser-style flies",
    bait: "Not needed — and release fish anyway",
    guide: "The year-round beach fishery. Work shallow gravel beaches, creek mouths, and oyster beds on a moving tide — cutts cruise the top 10 ft within casting range. Long casts parallel to shore, erratic retrieve. They follow; pause the lure when you see a flash. A light rod and a kayak make this Washington's most underrated fishery.",
    regs: "Release required in most marine waters and many rivers. Where retention is allowed it's tight (e.g., 2/day, 14\" min). Treat it as catch-and-release."
  },
  {
    id: "rainbow", name: "Rainbow Trout (stocked)", aka: "Includes triploids",
    keywords: ["rainbow", "triploid", "stocked"],
    months: [3, 4, 5, 6, 10],
    art: { shape: "salmon", back: "#4d6151", side: "#cfd6d2", belly: "#f3f5f4", spots: true, stripe: "#d98c8c" },
    lures: "Small spoons (Kastmaster 1/8 oz), inline spinners, wedding ring + worm trolled slow",
    bait: "PowerBait floated off bottom on a slip rig, worm under a bobber",
    guide: "Hit lakes within two weeks of a plant (stocking link in the Regs tab). From the kayak, slow-troll a wedding ring at 1 mph along 8–15 ft contours; stockers school, so circle back through hookup spots. Bank: PowerBait on a 18–24\" leader above a sliding sinker, rod in a holder, patience.",
    regs: "5 trout/day typical on year-round lakes. Seasonal lakes open the last Saturday of April. Triploids sometimes have special limits."
  },
  {
    id: "kokanee", name: "Kokanee", aka: "Landlocked sockeye",
    keywords: ["kokanee"],
    months: [4, 5, 6, 7],
    art: { shape: "salmon", back: "#3d5c50", side: "#c4cecb", belly: "#f0f3f2", spots: false },
    lures: "Pink/orange micro-squid or wedding ring behind a dodger, trolled 1.0–1.5 mph",
    bait: "Tip every hook with white shoepeg corn — it matters",
    guide: "Pure sonar fishing the 4cv is made for: kokanee hold in a tight temperature band (15–25 ft spring, 30–50 ft by July). Find the band, get your gear in it exactly — leaded line, weights, or a downrigger — and make S-turns; the speed change triggers strikes. Soft mouths: light drag, no hard hooksets.",
    regs: "Usually counted in the trout limit; some lakes (Stevens, American) have kokanee-specific bonus limits."
  },
  {
    id: "lingcod", name: "Lingcod", aka: "",
    keywords: ["lingcod"],
    months: [5, 6],
    art: { shape: "ling", back: "#5b5440", side: "#a8a183", belly: "#e8e4d2", spots: true },
    lures: "6–10 oz swimbaits and pipe jigs, big curly-tail grubs on lead heads — bigger is better",
    bait: "Live greenling or sanddab on a sliding rig where legal",
    guide: "Drop straight to rock piles and walls (Burrows Pass, Fort Casey, Neah Bay) and pound bottom — lift, drop, stay vertical. Lings inhale a bait and sulk; reel steady, no jerking, and keep them coming or they'll dive back to the hole. Fish slack tide in the passes; current makes vertical work impossible. From a kayak, anchor is a no — drift and reset.",
    regs: "Puget Sound: May 1–Jun 15, 1/day, 26–36\" slot. Coast (MA 1–4): longer season, 2/day, no slot. Check current pamphlet."
  },
  {
    id: "rockfish", name: "Black Rockfish", aka: "Sea bass",
    keywords: ["rockfish"],
    months: [4, 5, 6, 7, 8, 9],
    art: { shape: "rockfish", back: "#2f3438", side: "#5b6166", belly: "#a9adb1", spots: true },
    lures: "3–4\" swimbaits on 1–2 oz heads, shrimp flies in tandem, small metal jigs",
    bait: "Rarely needed — they eat plastics happily",
    guide: "Coast-only retention. Schools suspend over rocky structure and kelp edges — watch the 4cv for a mid-water cloud, drop into it, and reel through it. Westport jetty: cast a swimbait, count down 5–10 s, steady retrieve. Strong, simple, delicious.",
    regs: "Puget Sound (areas 5–13): retention CLOSED, descending device required aboard. Coast: open within the bottomfish limit (typically 7)."
  },
  {
    id: "halibut", name: "Pacific Halibut", aka: "",
    keywords: ["halibut"],
    months: [4, 5, 6],
    art: { shape: "flat", back: "#5a4f3d", side: "#8c7f63", belly: "#efe9da", spots: true },
    lures: "16–24 oz jigs (white/glow), spreader bar with a big grub",
    bait: "Herring, salmon bellies, or squid on the spreader bar",
    guide: "Flat, featureless bottom 100–250 ft — the opposite of lingcod ground. Anchor or drift slow with bait pinned near bottom and wait; scent does the work. Strait spots (Freshwater Bay, Sekiu) are kayak-possible on the calmest May days only — this is big-water fishing, pick days ruthlessly and fish with a buddy.",
    regs: "Open only on announced days Apr–Jun under a statewide quota. One fish, any size. Catch record card required."
  },
  {
    id: "squid", name: "Market Squid", aka: "Winter pier squidding",
    keywords: ["squid"],
    months: [10, 11, 12, 1],
    art: { shape: "squid", back: "#b08d9a", side: "#d8c3ca", belly: "#f1e8eb" },
    lures: "Glow squid jigs (1.5–2.5\"), two in tandem; a small LED light or glow stick above them",
    bait: "None — jigs only",
    guide: "Night fishery on lighted piers (Edmonds, Seacrest, Les Davis, Redondo) October–January. Drop jigs under the lights, lift-and-hold retrieve — squid grab on the pause. Recharge glow jigs against the pier lights. Bring a headlamp, a bucket, and warm clothes; the bite comes in waves.",
    regs: "10 lbs or 5 quarts daily. Shellfish license required. Pier hours vary by city."
  },
  {
    id: "crab", name: "Dungeness Crab", aka: "",
    keywords: ["crab"],
    months: [7, 8, 9],
    art: { shape: "crab", back: "#9a5b40", side: "#c4825f", belly: "#ecd9c8" },
    lures: "Pots or ring nets — from the kayak, a ring net or a single light pot is the move",
    bait: "Chicken legs, fish carcasses, clams in a bait cage",
    guide: "Drop on sand/eelgrass bottom 20–60 ft (Golden Gardens, Kayak Point, Bellingham Bay). Soak pots 1–2 hours minimum; ring nets get pulled every 15–20 min. Measure carefully and toss females and softshells back gently. A kayak crab-and-coho combo trip in September is peak Washington.",
    regs: "Summer typically Jul–early Sep, Thursday–Monday only. Males only, 6.25\" minimum, hard-shell. Crab endorsement + catch record card — and REPORT your card even if you caught nothing."
  },
  {
    id: "surfperch", name: "Redtail Surfperch", aka: "",
    keywords: ["surfperch"],
    months: [4, 5, 6, 7, 8],
    art: { shape: "surfperch", back: "#7d6a6e", side: "#c9bfc1", belly: "#f0ebec", barsV: true },
    lures: "2\" Gulp Sandworms (camo/natural) on a hi-lo rig",
    bait: "Sand shrimp — the classic. Size 4–6 hooks, 2–4 oz pyramid sinker",
    guide: "Read the beach at low tide: find troughs and rip cuts, then fish them on the incoming. Cast just past the first breaker line, keep the line tight, and walk the beach until you find the school — where there's one perch there are forty. Long Beach and Ocean Shores are drive-on convenient.",
    regs: "12/day typical on coastal beaches, year-round. Check razor-clam dig closures that sometimes affect beach access."
  },
  {
    id: "smallmouth", name: "Smallmouth Bass", aka: "",
    keywords: ["smallmouth"],
    months: [5, 6, 7],
    art: { shape: "bass", back: "#5d5a35", side: "#b3a96b", belly: "#ece7cb", barsV: true },
    lures: "Ned rigs, tubes, drop-shot with 3\" minnow plastics, topwater early on calm mornings",
    bait: "Not needed",
    guide: "Lake Washington and Sammamish: rocky points, dock pilings, and gravel humps in 5–25 ft, May through July. From the kayak, drift the dock lines and pitch a ned rig parallel to structure. Pre-spawn fish (May) are the big ones — work slow.",
    regs: "No minimum size and liberal limits on most westside lakes (bass rules were loosened to protect salmon smolts). Check the lake listing."
  },
  {
    id: "largemouth", name: "Largemouth Bass", aka: "",
    keywords: ["largemouth", "bass"],
    months: [5, 6, 7, 8],
    art: { shape: "bass", back: "#3f5c38", side: "#8fae77", belly: "#e4eed8", stripeH: true },
    lures: "Senkos (wacky), frogs over pads in summer, spinnerbaits along weedlines",
    bait: "Nightcrawler under a bobber never stops working",
    guide: "Warm, weedy bays and lily pads — Green Lake, Lake Meridian shallows. Summer mornings throw a frog over the pads and hang on; midday skip senkos under docks. Slow everything down in spring.",
    regs: "Same liberalized warmwater rules as smallmouth on most lakes — no min size, generous limits. Verify per lake."
  },
  {
    id: "yellowperch", name: "Yellow Perch", aka: "",
    keywords: ["yellow perch"],
    months: [6, 7, 8, 9],
    art: { shape: "perch", back: "#6b6531", side: "#cdbd61", belly: "#f2ecca", barsV: true },
    lures: "Small jigs (1/16 oz) tipped with worm, perch rigs with two hooks",
    bait: "Worm pieces — perch eat worms, period",
    guide: "Summer flats in 15–30 ft on Lake Washington — anchor the kayak, drop a two-hook perch rig with worm, and stay until the school finds you. The 4cv shows them as a loose carpet near bottom. Great with kids, great in the pan.",
    regs: "No daily limit on most large westside lakes (freshwater license still required)."
  },
  {
    id: "shrimp", name: "Spot Shrimp", aka: "Hood Canal's famous days",
    keywords: ["shrimp"],
    months: [5],
    art: { shape: "shrimp", back: "#b06a4a", side: "#d99b77", belly: "#f3ddca" },
    lures: "Shrimp pots, 200–300 ft of line, heavy weight",
    bait: "Commercial shrimp pellets mashed with fish oil or canned cat food",
    guide: "A handful of announced days in May, mostly Hood Canal — and it's an event. Drop pots at 200–300 ft before the opener, pull on schedule. From a kayak this is serious work (a pot puller or a partner helps); many do it from the Hoodsport/Seabeck launches in calm morning water.",
    regs: "80 shrimp/day. Specific announced dates and hours only. Pot mesh, buoy marking, and line rules — read them before buying gear."
  },
  {
    id: "flounder", name: "Flounder & Sole", aka: "Sand dabs too",
    keywords: ["flounder", "sole"],
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    art: { shape: "flat", back: "#6b5d49", side: "#9c8b6f", belly: "#f0ead9", spots: true },
    lures: "Small jigs or drop-shot with 2\" Gulp on sandy bottom",
    bait: "Pieces of shrimp or worm on a size 4 hook, slack-bounced on sand",
    guide: "The everyman bottom fish — sandy flats 20–60 ft off any pier or beach (Les Davis, Dash Point, Redondo). Drag bait slow across the bottom with occasional hops; bites are subtle taps. Year-round and reliable when nothing else is open.",
    regs: "15/day flatfish (halibut excluded) typical in Puget Sound. Open year-round in most areas."
  },
  {
    id: "greenling", name: "Kelp Greenling", aka: "",
    keywords: ["greenling"],
    months: [4, 5, 6, 7, 8, 9],
    art: { shape: "ling", back: "#4f5b45", side: "#90997b", belly: "#e2e6d6", spots: true },
    lures: "Small jigs and grubs worked along kelp edges",
    bait: "Shrimp pieces, mussels",
    guide: "Kelp and rock in 10–40 ft — Washington Park, Fort Casey, Neah Bay. Aggressive little biters that save a slow lingcod day, and a legal live greenling is the best lingcod bait there is (where allowed). Light gear fun from the kayak.",
    regs: "Counts in the bottomfish limit. Puget Sound bottomfish rules apply — check the area."
  }
];

// longest-keyword-wins mapping from a spot's species strings to guide ids
WF.speciesForSpot = function (spot) {
  var found = {};
  (spot.species || []).forEach(function (str) {
    var s = str.toLowerCase();
    var best = null, bestLen = 0;
    WF.SPECIES.forEach(function (sp) {
      sp.keywords.forEach(function (kw) {
        if (s.indexOf(kw) >= 0 && kw.length > bestLen) { best = sp.id; bestLen = kw.length; }
      });
    });
    if (best) found[best] = true;
  });
  return Object.keys(found);
};

WF.speciesById = function (id) {
  for (var i = 0; i < WF.SPECIES.length; i++) if (WF.SPECIES[i].id === id) return WF.SPECIES[i];
  return null;
};
