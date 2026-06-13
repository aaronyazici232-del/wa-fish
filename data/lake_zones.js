// WA Fish — fishing zones inside the marquee lakes. Each zone is a sub-area
// with a habitat type; js/hotzones.js scores them per species + conditions and
// the best ones render as golden "probability" blobs on the lake.
// type: deep | dropoff | point | flat | weed | dock | inlet
// wind: (optional) the wind direction that stacks bait onto this shore.
// Lakes without an entry get auto-zones generated from their real polygon.
window.WF = window.WF || {};

WF.LAKE_ZONES = {
  "wb-lake-sammamish": [
    { name: "South-end weed flats & Issaquah Ck mouth", type: "weed", lat: 47.5470, lng: -122.0460, r: 380, wind: "N" },
    { name: "North-end flats (Sammamish R mouth)", type: "inlet", lat: 47.6045, lng: -122.1045, r: 360, wind: "S" },
    { name: "East-shore docks & breakline", type: "dock", lat: 47.5850, lng: -122.0640, r: 300, wind: "W" },
    { name: "West-shore drop-off", type: "dropoff", lat: 47.5760, lng: -122.0945, r: 300, wind: "E" },
    { name: "Open basin (suspended)", type: "deep", lat: 47.5825, lng: -122.0810, r: 340 }
  ],
  "wb-lake-washington": [
    { name: "Union Bay weed flats", type: "weed", lat: 47.6440, lng: -122.2730, r: 420 },
    { name: "Mercer Is. east channel drop-off", type: "dropoff", lat: 47.5700, lng: -122.2330, r: 380 },
    { name: "Seward Park point", type: "point", lat: 47.5520, lng: -122.2520, r: 320 },
    { name: "North-end flats (Kenmore)", type: "inlet", lat: 47.6930, lng: -122.2660, r: 420 },
    { name: "South end (Cedar R mouth, Renton)", type: "inlet", lat: 47.5030, lng: -122.2080, r: 420 },
    { name: "East-shore docks (Bellevue/Medina)", type: "dock", lat: 47.6150, lng: -122.2250, r: 360, wind: "W" },
    { name: "Open basin (60–200 ft)", type: "deep", lat: 47.6100, lng: -122.2470, r: 460 }
  ],
  "wb-green-lake": [
    { name: "North-end flats", type: "flat", lat: 47.6855, lng: -122.3285, r: 150 },
    { name: "West weedline", type: "weed", lat: 47.6810, lng: -122.3345, r: 150 },
    { name: "East dock line & drop", type: "dock", lat: 47.6805, lng: -122.3265, r: 150 },
    { name: "South swim-area flats", type: "flat", lat: 47.6775, lng: -122.3300, r: 150 }
  ],
  "wb-lake-stevens": [
    { name: "North inlet (Stitch Lk Ck)", type: "inlet", lat: 48.0290, lng: -122.0690, r: 240 },
    { name: "East-shore drop-off", type: "dropoff", lat: 48.0150, lng: -122.0520, r: 240, wind: "W" },
    { name: "West-shore docks", type: "dock", lat: 48.0110, lng: -122.0760, r: 240, wind: "E" },
    { name: "Open basin (kokanee)", type: "deep", lat: 48.0130, lng: -122.0640, r: 300 },
    { name: "South-end flats", type: "flat", lat: 47.9980, lng: -122.0610, r: 240 }
  ],
  "wb-american-lake": [
    { name: "Open basin (kokanee)", type: "deep", lat: 47.1215, lng: -122.5650, r: 360 },
    { name: "North docks & marina", type: "dock", lat: 47.1350, lng: -122.5600, r: 280 },
    { name: "South rocky points", type: "point", lat: 47.1100, lng: -122.5700, r: 280 },
    { name: "East weed bay", type: "weed", lat: 47.1180, lng: -122.5530, r: 260 }
  ],
  "wb-lake-cushman": [
    { name: "Old river channel (deep)", type: "deep", lat: 47.4900, lng: -123.2100, r: 360 },
    { name: "North inlet (Skokomish R)", type: "inlet", lat: 47.5250, lng: -123.2010, r: 320 },
    { name: "Rocky points", type: "point", lat: 47.4720, lng: -123.2280, r: 300 },
    { name: "Steep drop-off wall", type: "dropoff", lat: 47.5000, lng: -123.2250, r: 300 }
  ],
  "wb-baker-lake": [
    { name: "Old river channel (sockeye)", type: "deep", lat: 48.6950, lng: -121.6600, r: 380 },
    { name: "Upper inlet (Baker R)", type: "inlet", lat: 48.7350, lng: -121.6580, r: 360 },
    { name: "Horseshoe Cove flats", type: "flat", lat: 48.6660, lng: -121.6700, r: 320 },
    { name: "Mid-lake drop-off", type: "dropoff", lat: 48.7100, lng: -121.6540, r: 320 }
  ]
};
