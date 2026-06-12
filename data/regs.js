// WA Fish — regulations snapshot. This is a REFERENCE, not the law.
// Compiled June 2026 from general WDFW patterns. Salmon seasons are reset every
// year at North of Falcon (April) and emergency rules change weekly — ALWAYS
// verify on WDFW before fishing. Every section links to the official source.
window.WF = window.WF || {};

WF.REGS_META = {
  compiled: "2026-06-12",
  disclaimer: "Snapshot for orientation only. Seasons shown are typical patterns, not current law. Verify on WDFW before every trip — emergency rules change weekly.",
  links: [
    { label: "WDFW Fishing Regulations (pamphlet)", url: "https://wdfw.wa.gov/fishing/regulations" },
    { label: "Emergency Rule Changes — CHECK EVERY TRIP", url: "https://wdfw.wa.gov/fishing/regulations/emergency-rules" },
    { label: "Marine Area pages", url: "https://wdfw.wa.gov/fishing/locations/marine-areas" },
    { label: "Trout stocking reports", url: "https://wdfw.wa.gov/fishing/reports/stocking" },
    { label: "Buy / renew license", url: "https://fishhunt.dfw.wa.gov" }
  ]
};

WF.REGS = [
  {
    section: "Statewide basics",
    items: [
      { title: "License", body: "Saltwater, freshwater, or combo license required (16+). Salmon/steelhead/halibut/sturgeon need a catch record card (CRC). Shellfish/seaweed license for crab, shrimp, clams — crab also needs its own CRC endorsement." },
      { title: "Two-pole endorsement", body: "Optional add-on, valid on most lakes (not rivers or saltwater salmon, with exceptions)." },
      { title: "Barbless & gear rules", body: "Single-point barbless hooks are required for salmon/steelhead in most marine and many river fisheries. Many rivers carry selective-gear rules (no bait, single barbless). Always reach-specific." },
      { title: "Wild fish release", body: "Wild (unclipped) steelhead must be released statewide in nearly all fisheries. Wild chinook/coho release rules vary by area and run year." },
      { title: "Discover Pass", body: "Needed to park at State Parks and WDFW/DNR lands (Joemma, Dash Point SP, Lake Sammamish SP, many ramps)." }
    ]
  },
  {
    section: "Puget Sound marine areas (5–13)",
    note: "Salmon seasons are set yearly at North of Falcon and managed by quota — dates below are typical patterns only. Winter blackmouth openings vary the most.",
    items: [
      { title: "MA 5 (Sekiu) & MA 6 (East Strait / Port Angeles)", body: "Typical: summer chinook/coho seasons Jul–Aug(–Sep), quota-managed with mid-season closures possible. Halibut: select days Apr–Jun. Lingcod: May 1–Jun 15 (Sound rules)." },
      { title: "MA 7 (San Juans)", body: "Typical: summer salmon openings plus some winter blackmouth windows. Lingcod May 1–Jun 15, 26–36\" slot. Rockfish retention CLOSED." },
      { title: "MA 8-1 / 8-2 (Saratoga, Possession, Tulalip)", body: "Typical: odd-year pink fisheries Aug–Sep, coho Sep–Oct, limited chinook. Tulalip terminal-area 'bubble' has its own special openings (historically Fri noon–Mon noon in summer)." },
      { title: "MA 9 (Admiralty) & MA 10 (Seattle–Bremerton)", body: "Typical: short summer chinook openings (mid-Jul–Aug, quota-driven, can close on days' notice), coho Sep–Oct, some winter blackmouth windows. Elliott Bay gets its own short openings." },
      { title: "MA 11 (Tacoma–Vashon)", body: "Typical: summer chinook Jun–Sep window plus winter blackmouth periods. Point Defiance/Clay Banks is the centerpiece." },
      { title: "MA 12 (Hood Canal)", body: "Typical: summer/fall coho and chum fisheries; Hoodsport hatchery zone has special terminal rules. Shrimp: a handful of announced days in May." },
      { title: "MA 13 (South Sound)", body: "The year-round salmon area (chinook, hatchery-marked). When everything else is closed, MA 13 usually isn't." },
      { title: "Rockfish — all Puget Sound (6–13 incl. 7)", body: "Retention PROHIBITED everywhere in Puget Sound. Release at depth with a descending device (required onboard)." },
      { title: "Lingcod — Puget Sound", body: "Typical: May 1–Jun 15, one fish, 26–36\" slot. Coastal rules differ (longer season, no slot — see coast section)." },
      { title: "Dungeness crab — Puget Sound", body: "Typical: summer season Jul–early Sep, Thu–Mon only; winter season some areas. Sundays/holidays rules, 6.25\" males only, CRC required. Season set area-by-area each June." }
    ]
  },
  {
    section: "Coast (MA 1–4) & estuaries",
    items: [
      { title: "MA 1 (Ilwaco) / Buoy 10", body: "Typical: ocean salmon Jun/Jul–Sep by quota. Buoy 10 estuary fishery Aug–early Sep with its own daily rules." },
      { title: "MA 2 (Westport) & 2-1/2-2 (Willapa, Grays Harbor)", body: "Typical: ocean salmon Jun/Jul–Sep; estuary fall fisheries Aug–Oct. Surfperch open year-round on the beaches." },
      { title: "MA 3 (La Push) & MA 4 (Neah Bay)", body: "Typical: ocean salmon Jul–Sep, halibut select days May–Jun, lingcod/bottomfish roughly Mar–Oct. Makah Recreation Pass required at Neah Bay." },
      { title: "Coastal rockfish & lingcod", body: "Unlike Puget Sound, coastal rockfish retention is OPEN (typically 7 bottomfish/day incl. limits by species). Lingcod open most of the year, 2 fish, no slot — check current pamphlet." },
      { title: "Razor clams", body: "Open only on WDFW-announced dig dates (domoic-acid tested). 15 clams, first 15 dug regardless of condition.", link: "https://wdfw.wa.gov/fishing/shellfishing-regulations/razor-clams" }
    ]
  },
  {
    section: "Rivers",
    note: "River salmon/steelhead seasons are the most volatile rules in the state — Olympic Peninsula rivers especially. The pamphlet is the baseline; emergency rules override it constantly.",
    items: [
      { title: "Green River", body: "Typical: fall salmon opening Sep–Nov (species mix varies yearly); hatchery winter steelhead Dec–Jan when forecast allows." },
      { title: "Puyallup River", body: "Typical: Aug–Nov salmon window; odd-year pinks are the big show. Co-managed with the Puyallup Tribe — days can change quickly." },
      { title: "Skagit / Sauk", body: "Typical: fall pinks (odd yrs)/coho/chum; the spring catch-and-release wild steelhead season opens only when the forecast clears a threshold." },
      { title: "Snohomish / Skykomish / Snoqualmie", body: "Typical: summer hatchery steelhead and select chinook windows on the Sky; fall coho system-wide Sep–Oct. Heavily emergency-managed." },
      { title: "Olympic Peninsula (Sol Duc, Bogachiel, Calawah, Hoh)", body: "Typical: fall coho Oct–Nov, hatchery winter steelhead Dec–Jan, wild steelhead late winter under special rules (no bait, no fishing from boats has applied recently). VERIFY EVERY TRIP — these rules have changed every year." },
      { title: "Cowlitz", body: "Typical: open most of the year for hatchery fish — springers Apr–Jun, summer steelhead Jun–Aug, coho Oct, winter steelhead Dec–Feb." },
      { title: "Samish", body: "Typical: hatchery chinook Aug–Sep in the lower river; specific boundary and gear rules apply." }
    ]
  },
  {
    section: "Lakes",
    items: [
      { title: "Year-round lakes", body: "Most large westside lakes (Washington, Sammamish, American, Meridian, Angle, Green) are open year-round under statewide rules: 5 trout, min sizes vary." },
      { title: "Seasonal lakes", body: "Many smaller lakes run the last Saturday in April through October." },
      { title: "Stocking", body: "WDFW posts trout plants weekly — time your trips to them.", link: "https://wdfw.wa.gov/fishing/reports/stocking" },
      { title: "Baker Lake sockeye", body: "Opens only when the run allows, typically announced for Jul–Aug. Watch the emergency rules page in June." },
      { title: "Kokanee lakes", body: "Lake Stevens, American, Cushman, Baker — kokanee usually count in the trout limit; some lakes have bonus rules." }
    ]
  }
];
