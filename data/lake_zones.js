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
  ],
  "wb-pine-lake": [
    { name: "North weed bay", type: "weed", lat: 47.5905, lng: -122.0470, r: 130 },
    { name: "South-end docks", type: "dock", lat: 47.5840, lng: -122.0470, r: 130 },
    { name: "East dock row", type: "dock", lat: 47.5870, lng: -122.0445, r: 110, wind: "W" },
    { name: "Deep middle (kokanee/trout)", type: "deep", lat: 47.5872, lng: -122.0472, r: 150 }
  ],
  "wb-lake-tapps": [
    { name: "North Tapps weedy arms", type: "weed", lat: 47.2530, lng: -122.1730, r: 380 },
    { name: "Rocky points & old roadbeds", type: "point", lat: 47.2360, lng: -122.1700, r: 320 },
    { name: "Dam-end drop-off", type: "dropoff", lat: 47.2150, lng: -122.1840, r: 320 },
    { name: "Open basin (kokanee)", type: "deep", lat: 47.2330, lng: -122.1780, r: 360 },
    { name: "South dock rows", type: "dock", lat: 47.2230, lng: -122.1650, r: 300 }
  ],
  "wb-lake-sawyer": [
    { name: "North weedy bays", type: "weed", lat: 47.3500, lng: -122.0470, r: 240 },
    { name: "Dock rows", type: "dock", lat: 47.3450, lng: -122.0400, r: 220, wind: "W" },
    { name: "Rocky points", type: "point", lat: 47.3410, lng: -122.0480, r: 220 },
    { name: "Deep hole (kokanee)", type: "deep", lat: 47.3450, lng: -122.0440, r: 260 }
  ],
  "wb-moses-lake": [
    { name: "Rocky Ford arm & Crab Ck inlet", type: "inlet", lat: 47.1951, lng: -119.4241, r: 360 },
    { name: "Parker Horn weed & docks", type: "weed", lat: 47.1796, lng: -119.3371, r: 360 },
    { name: "Pelican Horn (south arm)", type: "weed", lat: 47.0884, lng: -119.3290, r: 360 },
    { name: "Cascade Valley rock humps", type: "dropoff", lat: 47.1272, lng: -119.3310, r: 360 },
    { name: "Connelly Park flats", type: "flat", lat: 47.1292, lng: -119.2925, r: 360 }
  ],
  "wb-potholes-reservoir": [
    { name: "The Dunes (flooded sand & willows)", type: "weed", lat: 47.0463, lng: -119.3478, r: 400 },
    { name: "Lind Coulee arm (walleye)", type: "dropoff", lat: 46.9929, lng: -119.2293, r: 400 },
    { name: "O'Sullivan Dam face", type: "dropoff", lat: 46.9804, lng: -119.3478, r: 400 },
    { name: "Main-lake humps", type: "point", lat: 47.0149, lng: -119.3505, r: 400 },
    { name: "Medicare Beach / MarDon docks", type: "dock", lat: 47.0149, lng: -119.4043, r: 400 }
  ],
  "wb-banks-lake": [
    { name: "Osborn Bay (north weed)", type: "weed", lat: 47.9384, lng: -119.0188, r: 380 },
    { name: "Steamboat Rock points (smallmouth)", type: "point", lat: 47.8588, lng: -119.1214, r: 380 },
    { name: "Barker Canyon rock walls", type: "dropoff", lat: 47.7983, lng: -119.1898, r: 380 },
    { name: "Northrup / Jones Bay points", type: "point", lat: 47.7414, lng: -119.2354, r: 380 },
    { name: "Coulee City / Dry Falls flats (walleye)", type: "flat", lat: 47.6392, lng: -119.2886, r: 380 }
  ],
  "wb-lake-chelan": [
    { name: "Chelan town rock points (smallmouth)", type: "point", lat: 47.8397, lng: -120.0273, r: 400 },
    { name: "Lakeside / Manson bays", type: "point", lat: 47.8617, lng: -120.0873, r: 400 },
    { name: "Lower-basin drop-off (kokanee edge)", type: "dropoff", lat: 47.9221, lng: -120.1999, r: 400 },
    { name: "25-Mile Ck inlet (kokanee staging)", type: "inlet", lat: 48.0045, lng: -120.2899, r: 400 },
    { name: "Mid-lake deep (mackinaw)", type: "deep", lat: 48.0815, lng: -120.4624, r: 400 }
  ],
  "wb-lake-roosevelt": [
    { name: "Spring Canyon flats (walleye)", type: "dropoff", lat: 47.9494, lng: -118.8222, r: 440 },
    { name: "Keller Ferry / Sanpoil mouth", type: "point", lat: 47.9381, lng: -118.6900, r: 440 },
    { name: "Mid-channel band (kokanee/triploid)", type: "deep", lat: 48.1202, lng: -118.2574, r: 440 },
    { name: "Gravel points (smallmouth)", type: "point", lat: 48.3365, lng: -118.1613, r: 440 },
    { name: "Kettle Falls / Colville inlet", type: "inlet", lat: 48.5983, lng: -118.1252, r: 440 }
  ],
  "wb-newman-lake": [
    { name: "North weed bay (musky/largemouth)", type: "weed", lat: 47.7906, lng: -117.0997, r: 200 },
    { name: "Thompson Ck inlet", type: "inlet", lat: 47.7894, lng: -117.0931, r: 200 },
    { name: "West-shore weedline", type: "weed", lat: 47.7768, lng: -117.1115, r: 200, wind: "E" },
    { name: "Dam-end docks (crappie)", type: "dock", lat: 47.7650, lng: -117.0979, r: 200 },
    { name: "Deep middle (trout)", type: "deep", lat: 47.7768, lng: -117.0997, r: 200 }
  ],
  "wb-curlew-lake": [
    { name: "North inlet (Curlew Ck)", type: "inlet", lat: 48.7579, lng: -118.6654, r: 260 },
    { name: "State-park west docks", type: "dock", lat: 48.7353, lng: -118.6715, r: 260, wind: "E" },
    { name: "Deep middle (trophy rainbow)", type: "deep", lat: 48.7345, lng: -118.6654, r: 260 },
    { name: "South weed bay (bass/musky)", type: "weed", lat: 48.7089, lng: -118.6664, r: 260 }
  ],
  "wb-lake-kapowsin": [
    { name: "North standing timber", type: "weed", lat: 46.9838, lng: -122.2219, r: 150 },
    { name: "East stump flats", type: "flat", lat: 46.9815, lng: -122.2102, r: 150 },
    { name: "West-shore docks & pads", type: "dock", lat: 46.9761, lng: -122.2301, r: 150 },
    { name: "South timber", type: "weed", lat: 46.9670, lng: -122.2246, r: 150 },
    { name: "Old river channel (deep)", type: "deep", lat: 46.9764, lng: -122.2215, r: 150 }
  ],
  "wb-spanaway-lake": [
    { name: "North park docks", type: "dock", lat: 47.1168, lng: -122.4483, r: 150 },
    { name: "West-shore drop-off", type: "dropoff", lat: 47.1106, lng: -122.4532, r: 150, wind: "E" },
    { name: "South weed bay", type: "weed", lat: 47.1042, lng: -122.4483, r: 150 },
    { name: "Deep middle (trout)", type: "deep", lat: 47.1100, lng: -122.4483, r: 150 }
  ],
  "wb-lake-wenatchee": [
    { name: "Upper inlet (White/Little Wenatchee R)", type: "inlet", lat: 47.8247, lng: -120.8132, r: 360 },
    { name: "Deep middle (sockeye/kokanee)", type: "deep", lat: 47.8238, lng: -120.7839, r: 360 },
    { name: "South-shore drop", type: "dropoff", lat: 47.8186, lng: -120.7828, r: 360 },
    { name: "Outlet / state park (SE)", type: "dropoff", lat: 47.8182, lng: -120.7445, r: 360 }
  ],
  "wb-lake-whatcom": [
    { name: "North basin (Bloedel Donovan, kokanee)", type: "deep", lat: 48.7509, lng: -122.3953, r: 360 },
    { name: "Strawberry Pt rock (smallmouth)", type: "point", lat: 48.7299, lng: -122.3415, r: 360 },
    { name: "Geneva docks", type: "dock", lat: 48.7211, lng: -122.3016, r: 360 },
    { name: "South basin deep (Sudden Valley)", type: "deep", lat: 48.6879, lng: -122.2964, r: 360 }
  ],
  "wb-rimrock-lake": [
    { name: "Dam end (deep, kokanee)", type: "deep", lat: 46.6387, lng: -121.1448, r: 340 },
    { name: "North Fork Tieton inlet", type: "inlet", lat: 46.6387, lng: -121.2416, r: 340 },
    { name: "South-shore points", type: "point", lat: 46.6366, lng: -121.1801, r: 340 },
    { name: "Main basin (kokanee troll)", type: "deep", lat: 46.6387, lng: -121.1817, r: 340 }
  ],
  "wb-liberty-lake": [
    { name: "North lily/weed bay", type: "weed", lat: 47.6512, lng: -117.0779, r: 210 },
    { name: "West-shore drop-off", type: "dropoff", lat: 47.6447, lng: -117.0890, r: 210, wind: "E" },
    { name: "County-park docks (south)", type: "dock", lat: 47.6374, lng: -117.0786, r: 210 },
    { name: "Deep middle (trout/kokanee)", type: "deep", lat: 47.6447, lng: -117.0779, r: 210 }
  ],
  "wb-riffe-lake": [
    { name: "Mossyrock Dam end (deep)", type: "deep", lat: 46.4717, lng: -122.1806, r: 400 },
    { name: "Mid-lake rock points (smallmouth)", type: "point", lat: 46.4878, lng: -122.2915, r: 400 },
    { name: "Riffe narrows points", type: "point", lat: 46.5146, lng: -122.3587, r: 400 },
    { name: "Upper Cowlitz inlet (west)", type: "inlet", lat: 46.5297, lng: -122.4142, r: 400 }
  ],
  "wb-sprague-lake": [
    { name: "NE weedy flats & resort", type: "weed", lat: 47.2806, lng: -118.0353, r: 380 },
    { name: "SW rock humps (walleye)", type: "dropoff", lat: 47.2442, lng: -118.0941, r: 380 },
    { name: "Main-lake humps", type: "point", lat: 47.2551, lng: -118.0734, r: 380 },
    { name: "North bay docks", type: "dock", lat: 47.2653, lng: -118.0631, r: 380 },
    { name: "South weed bay (bass/crappie)", type: "weed", lat: 47.2468, lng: -118.0714, r: 380 }
  ]
};
