/**
 * Route Fingerprint Data
 *
 * Pre-computed fingerprints for all known race courses.
 * Generated from marathon-data.json thumbnail points.
 *
 * Size: ~1.7KB per race (~26KB total for 15 races).
 * Can scale to 500+ races at ~850KB — still fine for client-side loading.
 *
 * To regenerate: run the generateFingerprint() function from fingerprint.ts
 * with the route's thumbnail/full points.
 */

import type { RouteFingerprint } from "./fingerprint-types";

export const RACE_FINGERPRINTS: RouteFingerprint[] = [
  {
    "raceId": "boston",
    "name": "Boston Marathon",
    "distance": 42.2,
    "bounds": {
      "minLat": 42.2287,
      "maxLat": 42.3556,
      "minLng": -71.5226,
      "maxLng": -71.0603
    },
    "start": {
      "lat": 42.2287,
      "lng": -71.5226
    },
    "finish": {
      "lat": 42.3501,
      "lng": -71.0603
    },
    "waypoints": [
      {
        "lat": 42.2287,
        "lng": -71.5226,
        "distanceKm": 0
      },
      {
        "lat": 42.2311,
        "lng": -71.5072,
        "distanceKm": 1.76
      },
      {
        "lat": 42.2348,
        "lng": -71.4872,
        "distanceKm": 3.52
      },
      {
        "lat": 42.2381,
        "lng": -71.4543,
        "distanceKm": 5.27
      },
      {
        "lat": 42.2415,
        "lng": -71.4158,
        "distanceKm": 7.03
      },
      {
        "lat": 42.2454,
        "lng": -71.3947,
        "distanceKm": 8.79
      },
      {
        "lat": 42.2507,
        "lng": -71.37,
        "distanceKm": 10.55
      },
      {
        "lat": 42.2583,
        "lng": -71.3495,
        "distanceKm": 12.31
      },
      {
        "lat": 42.2645,
        "lng": -71.3196,
        "distanceKm": 14.07
      },
      {
        "lat": 42.2749,
        "lng": -71.2938,
        "distanceKm": 15.82
      },
      {
        "lat": 42.2816,
        "lng": -71.2831,
        "distanceKm": 17.58
      },
      {
        "lat": 42.2898,
        "lng": -71.2573,
        "distanceKm": 19.34
      },
      {
        "lat": 42.3012,
        "lng": -71.2234,
        "distanceKm": 21.1
      },
      {
        "lat": 42.3105,
        "lng": -71.1965,
        "distanceKm": 22.86
      },
      {
        "lat": 42.3182,
        "lng": -71.1738,
        "distanceKm": 24.61
      },
      {
        "lat": 42.3248,
        "lng": -71.1515,
        "distanceKm": 26.37
      },
      {
        "lat": 42.3313,
        "lng": -71.1271,
        "distanceKm": 28.13
      },
      {
        "lat": 42.3388,
        "lng": -71.1027,
        "distanceKm": 29.89
      },
      {
        "lat": 42.3456,
        "lng": -71.0824,
        "distanceKm": 31.65
      },
      {
        "lat": 42.3502,
        "lng": -71.0742,
        "distanceKm": 33.4
      },
      {
        "lat": 42.3534,
        "lng": -71.0678,
        "distanceKm": 35.16
      },
      {
        "lat": 42.3552,
        "lng": -71.063,
        "distanceKm": 36.92
      },
      {
        "lat": 42.3538,
        "lng": -71.0616,
        "distanceKm": 38.68
      },
      {
        "lat": 42.352,
        "lng": -71.0608,
        "distanceKm": 40.44
      },
      {
        "lat": 42.3501,
        "lng": -71.0603,
        "distanceKm": 42.2
      }
    ],
    "elevationProfile": [
      1,
      0.974,
      0.953,
      0.933,
      0.915,
      0.897,
      0.868,
      0.835,
      0.812,
      0.794,
      0.777,
      0.765,
      0.754,
      0.734,
      0.71,
      0.695,
      0.681,
      0.65,
      0.625,
      0.613,
      0.623,
      0.657,
      0.681,
      0.712,
      0.761,
      0.775,
      0.753,
      0.718,
      0.682,
      0.617,
      0.549,
      0.515,
      0.489,
      0.463,
      0.397,
      0.331,
      0.265,
      0.232,
      0.208,
      0.185,
      0.162,
      0.139,
      0.116,
      0.097,
      0.08,
      0.064,
      0.048,
      0.032,
      0.016,
      0
    ],
    "elevationGain": 156
  },
  {
    "raceId": "nyc",
    "name": "New York City Marathon",
    "distance": 42.2,
    "bounds": {
      "minLat": 40.6062,
      "maxLat": 40.7845,
      "minLng": -74.0641,
      "maxLng": -73.8012
    },
    "start": {
      "lat": 40.6062,
      "lng": -74.0641
    },
    "finish": {
      "lat": 40.7829,
      "lng": -73.9654
    },
    "waypoints": [
      {
        "lat": 40.6062,
        "lng": -74.0641,
        "distanceKm": 0
      },
      {
        "lat": 40.6132,
        "lng": -74.046,
        "distanceKm": 1.76
      },
      {
        "lat": 40.6207,
        "lng": -74.0188,
        "distanceKm": 3.52
      },
      {
        "lat": 40.6311,
        "lng": -73.9945,
        "distanceKm": 5.27
      },
      {
        "lat": 40.6437,
        "lng": -73.9839,
        "distanceKm": 7.03
      },
      {
        "lat": 40.6529,
        "lng": -73.9717,
        "distanceKm": 8.79
      },
      {
        "lat": 40.662,
        "lng": -73.9591,
        "distanceKm": 10.55
      },
      {
        "lat": 40.6718,
        "lng": -73.9463,
        "distanceKm": 12.31
      },
      {
        "lat": 40.6791,
        "lng": -73.9319,
        "distanceKm": 14.07
      },
      {
        "lat": 40.6866,
        "lng": -73.917,
        "distanceKm": 15.82
      },
      {
        "lat": 40.6944,
        "lng": -73.9014,
        "distanceKm": 17.58
      },
      {
        "lat": 40.7133,
        "lng": -73.8918,
        "distanceKm": 19.34
      },
      {
        "lat": 40.7253,
        "lng": -73.8723,
        "distanceKm": 21.1
      },
      {
        "lat": 40.7363,
        "lng": -73.8513,
        "distanceKm": 22.86
      },
      {
        "lat": 40.7452,
        "lng": -73.8247,
        "distanceKm": 24.61
      },
      {
        "lat": 40.7583,
        "lng": -73.8065,
        "distanceKm": 26.37
      },
      {
        "lat": 40.7736,
        "lng": -73.8147,
        "distanceKm": 28.13
      },
      {
        "lat": 40.782,
        "lng": -73.8287,
        "distanceKm": 29.89
      },
      {
        "lat": 40.7809,
        "lng": -73.8601,
        "distanceKm": 31.65
      },
      {
        "lat": 40.7741,
        "lng": -73.8864,
        "distanceKm": 33.4
      },
      {
        "lat": 40.7674,
        "lng": -73.9099,
        "distanceKm": 35.16
      },
      {
        "lat": 40.7606,
        "lng": -73.9304,
        "distanceKm": 36.92
      },
      {
        "lat": 40.7535,
        "lng": -73.9481,
        "distanceKm": 38.68
      },
      {
        "lat": 40.7521,
        "lng": -73.9709,
        "distanceKm": 40.44
      },
      {
        "lat": 40.7829,
        "lng": -73.9654,
        "distanceKm": 42.2
      }
    ],
    "elevationProfile": [
      0.395,
      0.596,
      0.797,
      0.969,
      1,
      0.685,
      0.382,
      0.217,
      0.052,
      0,
      0.051,
      0.102,
      0.104,
      0.076,
      0.048,
      0.065,
      0.112,
      0.159,
      0.194,
      0.216,
      0.238,
      0.273,
      0.318,
      0.515,
      0.775,
      0.482,
      0.087,
      0.065,
      0.098,
      0.11,
      0.077,
      0.044,
      0.117,
      0.229,
      0.349,
      0.489,
      0.563,
      0.382,
      0.302,
      0.262,
      0.282,
      0.337,
      0.392,
      0.448,
      0.503,
      0.529,
      0.483,
      0.418,
      0.326,
      0.184
    ],
    "elevationGain": 234
  },
  {
    "raceId": "chicago",
    "name": "Chicago Marathon",
    "distance": 42.2,
    "bounds": {
      "minLat": 41.8389,
      "maxLat": 41.9445,
      "minLng": -87.6923,
      "maxLng": -87.6123
    },
    "start": {
      "lat": 41.8781,
      "lng": -87.6298
    },
    "finish": {
      "lat": 41.8756,
      "lng": -87.6244
    },
    "waypoints": [
      {
        "lat": 41.8781,
        "lng": -87.6298,
        "distanceKm": 0
      },
      {
        "lat": 41.884,
        "lng": -87.6244,
        "distanceKm": 1.76
      },
      {
        "lat": 41.8921,
        "lng": -87.6187,
        "distanceKm": 3.52
      },
      {
        "lat": 41.9002,
        "lng": -87.6151,
        "distanceKm": 5.27
      },
      {
        "lat": 41.9079,
        "lng": -87.6165,
        "distanceKm": 7.03
      },
      {
        "lat": 41.9152,
        "lng": -87.623,
        "distanceKm": 8.79
      },
      {
        "lat": 41.9221,
        "lng": -87.6299,
        "distanceKm": 10.55
      },
      {
        "lat": 41.9294,
        "lng": -87.6372,
        "distanceKm": 12.31
      },
      {
        "lat": 41.9372,
        "lng": -87.645,
        "distanceKm": 14.07
      },
      {
        "lat": 41.9435,
        "lng": -87.6523,
        "distanceKm": 15.82
      },
      {
        "lat": 41.941,
        "lng": -87.6623,
        "distanceKm": 17.58
      },
      {
        "lat": 41.9337,
        "lng": -87.673,
        "distanceKm": 19.34
      },
      {
        "lat": 41.9209,
        "lng": -87.6814,
        "distanceKm": 21.1
      },
      {
        "lat": 41.9073,
        "lng": -87.6869,
        "distanceKm": 22.86
      },
      {
        "lat": 41.8955,
        "lng": -87.6922,
        "distanceKm": 24.61
      },
      {
        "lat": 41.8821,
        "lng": -87.6851,
        "distanceKm": 26.37
      },
      {
        "lat": 41.8693,
        "lng": -87.6783,
        "distanceKm": 28.13
      },
      {
        "lat": 41.8568,
        "lng": -87.6716,
        "distanceKm": 29.89
      },
      {
        "lat": 41.8452,
        "lng": -87.6648,
        "distanceKm": 31.65
      },
      {
        "lat": 41.8401,
        "lng": -87.6546,
        "distanceKm": 33.4
      },
      {
        "lat": 41.8411,
        "lng": -87.6436,
        "distanceKm": 35.16
      },
      {
        "lat": 41.8486,
        "lng": -87.6326,
        "distanceKm": 36.92
      },
      {
        "lat": 41.8598,
        "lng": -87.6227,
        "distanceKm": 38.68
      },
      {
        "lat": 41.8711,
        "lng": -87.614,
        "distanceKm": 40.44
      },
      {
        "lat": 41.8756,
        "lng": -87.6244,
        "distanceKm": 42.2
      }
    ],
    "elevationProfile": [
      0.506,
      0.434,
      0.366,
      0.303,
      0.24,
      0.239,
      0.281,
      0.323,
      0.391,
      0.465,
      0.54,
      0.601,
      0.654,
      0.708,
      0.69,
      0.569,
      0.449,
      0.43,
      0.509,
      0.603,
      0.729,
      0.854,
      0.944,
      1,
      0.984,
      0.873,
      0.785,
      0.745,
      0.704,
      0.662,
      0.616,
      0.57,
      0.526,
      0.483,
      0.439,
      0.397,
      0.355,
      0.313,
      0.269,
      0.225,
      0.178,
      0.13,
      0.08,
      0.024,
      0,
      0.089,
      0.182,
      0.29,
      0.253,
      0.331
    ],
    "elevationGain": 89
  },
  {
    "raceId": "london",
    "name": "London Marathon",
    "distance": 42.2,
    "bounds": {
      "minLat": 51.4769,
      "maxLat": 51.5145,
      "minLng": -0.1534,
      "maxLng": 0.0005
    },
    "start": {
      "lat": 51.4769,
      "lng": 0.0005
    },
    "finish": {
      "lat": 51.5074,
      "lng": -0.1278
    },
    "waypoints": [
      {
        "lat": 51.4769,
        "lng": 0.0005,
        "distanceKm": 0
      },
      {
        "lat": 51.48,
        "lng": -0.0134,
        "distanceKm": 1.76
      },
      {
        "lat": 51.4829,
        "lng": -0.0255,
        "distanceKm": 3.52
      },
      {
        "lat": 51.4867,
        "lng": -0.0367,
        "distanceKm": 5.27
      },
      {
        "lat": 51.4919,
        "lng": -0.047,
        "distanceKm": 7.03
      },
      {
        "lat": 51.4969,
        "lng": -0.0573,
        "distanceKm": 8.79
      },
      {
        "lat": 51.5013,
        "lng": -0.068,
        "distanceKm": 10.55
      },
      {
        "lat": 51.5058,
        "lng": -0.0763,
        "distanceKm": 12.31
      },
      {
        "lat": 51.5092,
        "lng": -0.0841,
        "distanceKm": 14.07
      },
      {
        "lat": 51.5125,
        "lng": -0.092,
        "distanceKm": 15.82
      },
      {
        "lat": 51.5144,
        "lng": -0.1034,
        "distanceKm": 17.58
      },
      {
        "lat": 51.5131,
        "lng": -0.1143,
        "distanceKm": 19.34
      },
      {
        "lat": 51.5088,
        "lng": -0.125,
        "distanceKm": 21.1
      },
      {
        "lat": 51.5065,
        "lng": -0.1337,
        "distanceKm": 22.86
      },
      {
        "lat": 51.501,
        "lng": -0.1427,
        "distanceKm": 24.61
      },
      {
        "lat": 51.4982,
        "lng": -0.1486,
        "distanceKm": 26.37
      },
      {
        "lat": 51.4952,
        "lng": -0.1523,
        "distanceKm": 28.13
      },
      {
        "lat": 51.4918,
        "lng": -0.1444,
        "distanceKm": 29.89
      },
      {
        "lat": 51.4886,
        "lng": -0.1365,
        "distanceKm": 31.65
      },
      {
        "lat": 51.488,
        "lng": -0.128,
        "distanceKm": 33.4
      },
      {
        "lat": 51.4954,
        "lng": -0.1249,
        "distanceKm": 35.16
      },
      {
        "lat": 51.5014,
        "lng": -0.1351,
        "distanceKm": 36.92
      },
      {
        "lat": 51.5032,
        "lng": -0.1426,
        "distanceKm": 38.68
      },
      {
        "lat": 51.5026,
        "lng": -0.1424,
        "distanceKm": 40.44
      },
      {
        "lat": 51.5074,
        "lng": -0.1278,
        "distanceKm": 42.2
      }
    ],
    "elevationProfile": [
      1,
      0.928,
      0.854,
      0.758,
      0.671,
      0.603,
      0.538,
      0.478,
      0.416,
      0.336,
      0.255,
      0.19,
      0.126,
      0.306,
      0.545,
      0.497,
      0.433,
      0.351,
      0.267,
      0.195,
      0.128,
      0.064,
      0,
      0.071,
      0.198,
      0.299,
      0.384,
      0.459,
      0.527,
      0.596,
      0.668,
      0.748,
      0.833,
      0.908,
      0.975,
      0.96,
      0.897,
      0.819,
      0.729,
      0.654,
      0.591,
      0.529,
      0.468,
      0.46,
      0.594,
      0.716,
      0.806,
      0.813,
      0.662,
      0.557
    ],
    "elevationGain": 145
  },
  {
    "raceId": "berlin",
    "name": "Berlin Marathon",
    "distance": 42.2,
    "bounds": {
      "minLat": 52.4334,
      "maxLat": 52.5163,
      "minLng": 13.3234,
      "maxLng": 13.4712
    },
    "start": {
      "lat": 52.5145,
      "lng": 13.3501
    },
    "finish": {
      "lat": 52.5163,
      "lng": 13.3777
    },
    "waypoints": [
      {
        "lat": 52.5145,
        "lng": 13.3501,
        "distanceKm": 0
      },
      {
        "lat": 52.5124,
        "lng": 13.362,
        "distanceKm": 1.76
      },
      {
        "lat": 52.5089,
        "lng": 13.3746,
        "distanceKm": 3.52
      },
      {
        "lat": 52.5035,
        "lng": 13.3865,
        "distanceKm": 5.27
      },
      {
        "lat": 52.4989,
        "lng": 13.3984,
        "distanceKm": 7.03
      },
      {
        "lat": 52.4937,
        "lng": 13.4105,
        "distanceKm": 8.79
      },
      {
        "lat": 52.4893,
        "lng": 13.4224,
        "distanceKm": 10.55
      },
      {
        "lat": 52.4827,
        "lng": 13.4349,
        "distanceKm": 12.31
      },
      {
        "lat": 52.4761,
        "lng": 13.4469,
        "distanceKm": 14.07
      },
      {
        "lat": 52.4696,
        "lng": 13.4548,
        "distanceKm": 15.82
      },
      {
        "lat": 52.4641,
        "lng": 13.4625,
        "distanceKm": 17.58
      },
      {
        "lat": 52.4573,
        "lng": 13.4705,
        "distanceKm": 19.34
      },
      {
        "lat": 52.4518,
        "lng": 13.4643,
        "distanceKm": 21.1
      },
      {
        "lat": 52.4464,
        "lng": 13.4567,
        "distanceKm": 22.86
      },
      {
        "lat": 52.44,
        "lng": 13.449,
        "distanceKm": 24.61
      },
      {
        "lat": 52.4341,
        "lng": 13.4267,
        "distanceKm": 26.37
      },
      {
        "lat": 52.4388,
        "lng": 13.4045,
        "distanceKm": 28.13
      },
      {
        "lat": 52.4446,
        "lng": 13.3828,
        "distanceKm": 29.89
      },
      {
        "lat": 52.451,
        "lng": 13.3611,
        "distanceKm": 31.65
      },
      {
        "lat": 52.461,
        "lng": 13.348,
        "distanceKm": 33.4
      },
      {
        "lat": 52.4758,
        "lng": 13.3393,
        "distanceKm": 35.16
      },
      {
        "lat": 52.4886,
        "lng": 13.3308,
        "distanceKm": 36.92
      },
      {
        "lat": 52.5005,
        "lng": 13.3247,
        "distanceKm": 38.68
      },
      {
        "lat": 52.5104,
        "lng": 13.3409,
        "distanceKm": 40.44
      },
      {
        "lat": 52.5163,
        "lng": 13.3777,
        "distanceKm": 42.2
      }
    ],
    "elevationProfile": [
      1,
      0.964,
      0.929,
      0.909,
      0.89,
      0.855,
      0.82,
      0.784,
      0.748,
      0.713,
      0.677,
      0.654,
      0.636,
      0.596,
      0.539,
      0.495,
      0.46,
      0.424,
      0.389,
      0.353,
      0.317,
      0.287,
      0.269,
      0.244,
      0.208,
      0.177,
      0.159,
      0.139,
      0.103,
      0.067,
      0.03,
      0,
      0.036,
      0.071,
      0.107,
      0.142,
      0.194,
      0.248,
      0.301,
      0.355,
      0.326,
      0.269,
      0.215,
      0.162,
      0.181,
      0.235,
      0.29,
      0.346,
      0.311,
      0.256
    ],
    "elevationGain": 67
  },
  {
    "raceId": "tokyo",
    "name": "Tokyo Marathon",
    "distance": 42.2,
    "bounds": {
      "minLat": 35.6189,
      "maxLat": 35.6934,
      "minLng": 139.6917,
      "maxLng": 139.8612
    },
    "start": {
      "lat": 35.6896,
      "lng": 139.6917
    },
    "finish": {
      "lat": 35.6814,
      "lng": 139.7534
    },
    "waypoints": [
      {
        "lat": 35.6896,
        "lng": 139.6917,
        "distanceKm": 0
      },
      {
        "lat": 35.6923,
        "lng": 139.7038,
        "distanceKm": 1.76
      },
      {
        "lat": 35.6931,
        "lng": 139.7164,
        "distanceKm": 3.52
      },
      {
        "lat": 35.6886,
        "lng": 139.7283,
        "distanceKm": 5.27
      },
      {
        "lat": 35.6822,
        "lng": 139.739,
        "distanceKm": 7.03
      },
      {
        "lat": 35.6756,
        "lng": 139.7456,
        "distanceKm": 8.79
      },
      {
        "lat": 35.6687,
        "lng": 139.7526,
        "distanceKm": 10.55
      },
      {
        "lat": 35.6623,
        "lng": 139.7634,
        "distanceKm": 12.31
      },
      {
        "lat": 35.6557,
        "lng": 139.7743,
        "distanceKm": 14.07
      },
      {
        "lat": 35.6492,
        "lng": 139.7851,
        "distanceKm": 15.82
      },
      {
        "lat": 35.6424,
        "lng": 139.7966,
        "distanceKm": 17.58
      },
      {
        "lat": 35.6358,
        "lng": 139.8074,
        "distanceKm": 19.34
      },
      {
        "lat": 35.6293,
        "lng": 139.8183,
        "distanceKm": 21.1
      },
      {
        "lat": 35.6235,
        "lng": 139.8265,
        "distanceKm": 22.86
      },
      {
        "lat": 35.6191,
        "lng": 139.8341,
        "distanceKm": 24.61
      },
      {
        "lat": 35.6251,
        "lng": 139.8448,
        "distanceKm": 26.37
      },
      {
        "lat": 35.6352,
        "lng": 139.8531,
        "distanceKm": 28.13
      },
      {
        "lat": 35.645,
        "lng": 139.8607,
        "distanceKm": 29.89
      },
      {
        "lat": 35.6558,
        "lng": 139.8571,
        "distanceKm": 31.65
      },
      {
        "lat": 35.6672,
        "lng": 139.8462,
        "distanceKm": 33.4
      },
      {
        "lat": 35.6781,
        "lng": 139.8251,
        "distanceKm": 35.16
      },
      {
        "lat": 35.6839,
        "lng": 139.8034,
        "distanceKm": 36.92
      },
      {
        "lat": 35.6907,
        "lng": 139.7805,
        "distanceKm": 38.68
      },
      {
        "lat": 35.6932,
        "lng": 139.7587,
        "distanceKm": 40.44
      },
      {
        "lat": 35.6814,
        "lng": 139.7534,
        "distanceKm": 42.2
      }
    ],
    "elevationProfile": [
      0.387,
      0.482,
      0.576,
      0.616,
      0.652,
      0.588,
      0.524,
      0.497,
      0.471,
      0.434,
      0.396,
      0.356,
      0.315,
      0.287,
      0.261,
      0.235,
      0.21,
      0.176,
      0.138,
      0.098,
      0.058,
      0.026,
      0,
      0.017,
      0.081,
      0.136,
      0.176,
      0.221,
      0.272,
      0.319,
      0.358,
      0.397,
      0.437,
      0.481,
      0.532,
      0.581,
      0.619,
      0.658,
      0.698,
      0.74,
      0.791,
      0.842,
      0.881,
      0.919,
      0.959,
      1,
      0.978,
      0.953,
      0.9,
      0.922
    ],
    "elevationGain": 198
  },
  {
    "raceId": "sydney",
    "name": "Sydney Marathon",
    "distance": 42.2,
    "bounds": {
      "minLat": -33.9089,
      "maxLat": -33.815,
      "minLng": 151.1723,
      "maxLng": 151.2423
    },
    "start": {
      "lat": -33.815,
      "lng": 151.2094
    },
    "finish": {
      "lat": -33.8568,
      "lng": 151.2153
    },
    "waypoints": [
      {
        "lat": -33.815,
        "lng": 151.2094,
        "distanceKm": 0
      },
      {
        "lat": -33.8198,
        "lng": 151.212,
        "distanceKm": 1.76
      },
      {
        "lat": -33.8264,
        "lng": 151.214,
        "distanceKm": 3.52
      },
      {
        "lat": -33.8324,
        "lng": 151.2128,
        "distanceKm": 5.27
      },
      {
        "lat": -33.8364,
        "lng": 151.2093,
        "distanceKm": 7.03
      },
      {
        "lat": -33.8388,
        "lng": 151.2131,
        "distanceKm": 8.79
      },
      {
        "lat": -33.8424,
        "lng": 151.218,
        "distanceKm": 10.55
      },
      {
        "lat": -33.846,
        "lng": 151.2241,
        "distanceKm": 12.31
      },
      {
        "lat": -33.8496,
        "lng": 151.2296,
        "distanceKm": 14.07
      },
      {
        "lat": -33.854,
        "lng": 151.234,
        "distanceKm": 15.82
      },
      {
        "lat": -33.8585,
        "lng": 151.2385,
        "distanceKm": 17.58
      },
      {
        "lat": -33.8631,
        "lng": 151.2415,
        "distanceKm": 19.34
      },
      {
        "lat": -33.8675,
        "lng": 151.2353,
        "distanceKm": 21.1
      },
      {
        "lat": -33.8721,
        "lng": 151.2205,
        "distanceKm": 22.86
      },
      {
        "lat": -33.8768,
        "lng": 151.2062,
        "distanceKm": 24.61
      },
      {
        "lat": -33.8837,
        "lng": 151.1922,
        "distanceKm": 26.37
      },
      {
        "lat": -33.89,
        "lng": 151.1812,
        "distanceKm": 28.13
      },
      {
        "lat": -33.8959,
        "lng": 151.1747,
        "distanceKm": 29.89
      },
      {
        "lat": -33.9021,
        "lng": 151.1857,
        "distanceKm": 31.65
      },
      {
        "lat": -33.9063,
        "lng": 151.1977,
        "distanceKm": 33.4
      },
      {
        "lat": -33.9077,
        "lng": 151.2108,
        "distanceKm": 35.16
      },
      {
        "lat": -33.9021,
        "lng": 151.2191,
        "distanceKm": 36.92
      },
      {
        "lat": -33.8963,
        "lng": 151.2246,
        "distanceKm": 38.68
      },
      {
        "lat": -33.8884,
        "lng": 151.2305,
        "distanceKm": 40.44
      },
      {
        "lat": -33.8568,
        "lng": 151.2153,
        "distanceKm": 42.2
      }
    ],
    "elevationProfile": [
      0.612,
      0.674,
      0.784,
      0.926,
      1,
      0.993,
      0.797,
      0.612,
      0.439,
      0.339,
      0.281,
      0.253,
      0.239,
      0.221,
      0.202,
      0.188,
      0.175,
      0.163,
      0.15,
      0.133,
      0.115,
      0.182,
      0.257,
      0.289,
      0.319,
      0.308,
      0.291,
      0.266,
      0.241,
      0.222,
      0.204,
      0.191,
      0.178,
      0.165,
      0.152,
      0.136,
      0.119,
      0.105,
      0.092,
      0.079,
      0.066,
      0.069,
      0.082,
      0.095,
      0.108,
      0.123,
      0.141,
      0.135,
      0.102,
      0
    ],
    "elevationGain": 234
  },
  {
    "raceId": "paris",
    "name": "Paris Marathon",
    "distance": 42.2,
    "bounds": {
      "minLat": 48.8312,
      "maxLat": 48.8745,
      "minLng": 2.2756,
      "maxLng": 2.4345
    },
    "start": {
      "lat": 48.8698,
      "lng": 2.3078
    },
    "finish": {
      "lat": 48.8738,
      "lng": 2.2945
    },
    "waypoints": [
      {
        "lat": 48.8698,
        "lng": 2.3078,
        "distanceKm": 0
      },
      {
        "lat": 48.8663,
        "lng": 2.3209,
        "distanceKm": 1.76
      },
      {
        "lat": 48.8592,
        "lng": 2.335,
        "distanceKm": 3.52
      },
      {
        "lat": 48.8519,
        "lng": 2.35,
        "distanceKm": 5.27
      },
      {
        "lat": 48.8461,
        "lng": 2.3663,
        "distanceKm": 7.03
      },
      {
        "lat": 48.8413,
        "lng": 2.3806,
        "distanceKm": 8.79
      },
      {
        "lat": 48.8369,
        "lng": 2.3941,
        "distanceKm": 10.55
      },
      {
        "lat": 48.8335,
        "lng": 2.4056,
        "distanceKm": 12.31
      },
      {
        "lat": 48.8328,
        "lng": 2.4178,
        "distanceKm": 14.07
      },
      {
        "lat": 48.8378,
        "lng": 2.4316,
        "distanceKm": 15.82
      },
      {
        "lat": 48.8431,
        "lng": 2.4239,
        "distanceKm": 17.58
      },
      {
        "lat": 48.8484,
        "lng": 2.4107,
        "distanceKm": 19.34
      },
      {
        "lat": 48.8532,
        "lng": 2.3989,
        "distanceKm": 21.1
      },
      {
        "lat": 48.8576,
        "lng": 2.3866,
        "distanceKm": 22.86
      },
      {
        "lat": 48.861,
        "lng": 2.3731,
        "distanceKm": 24.61
      },
      {
        "lat": 48.8612,
        "lng": 2.3608,
        "distanceKm": 26.37
      },
      {
        "lat": 48.8595,
        "lng": 2.3493,
        "distanceKm": 28.13
      },
      {
        "lat": 48.8566,
        "lng": 2.3362,
        "distanceKm": 29.89
      },
      {
        "lat": 48.8537,
        "lng": 2.3224,
        "distanceKm": 31.65
      },
      {
        "lat": 48.8579,
        "lng": 2.3106,
        "distanceKm": 33.4
      },
      {
        "lat": 48.8622,
        "lng": 2.2989,
        "distanceKm": 35.16
      },
      {
        "lat": 48.867,
        "lng": 2.2877,
        "distanceKm": 36.92
      },
      {
        "lat": 48.8716,
        "lng": 2.2796,
        "distanceKm": 38.68
      },
      {
        "lat": 48.8743,
        "lng": 2.2806,
        "distanceKm": 40.44
      },
      {
        "lat": 48.8738,
        "lng": 2.2945,
        "distanceKm": 42.2
      }
    ],
    "elevationProfile": [
      0.233,
      0.19,
      0.147,
      0.166,
      0.232,
      0.299,
      0.361,
      0.417,
      0.473,
      0.523,
      0.569,
      0.616,
      0.664,
      0.717,
      0.77,
      0.822,
      0.874,
      0.924,
      0.974,
      1,
      0.923,
      0.845,
      0.768,
      0.698,
      0.63,
      0.562,
      0.494,
      0.447,
      0.401,
      0.355,
      0.304,
      0.251,
      0.199,
      0.146,
      0.096,
      0.048,
      0,
      0.001,
      0.069,
      0.137,
      0.205,
      0.28,
      0.36,
      0.44,
      0.514,
      0.575,
      0.636,
      0.606,
      0.55,
      0.493
    ],
    "elevationGain": 135
  },
  {
    "raceId": "amsterdam",
    "name": "Amsterdam Marathon",
    "distance": 42.2,
    "bounds": {
      "minLat": 52.3289,
      "maxLat": 52.3845,
      "minLng": 4.8565,
      "maxLng": 4.9278
    },
    "start": {
      "lat": 52.3434,
      "lng": 4.8565
    },
    "finish": {
      "lat": 52.3434,
      "lng": 4.8565
    },
    "waypoints": [
      {
        "lat": 52.3434,
        "lng": 4.8565,
        "distanceKm": 0
      },
      {
        "lat": 52.3489,
        "lng": 4.8644,
        "distanceKm": 1.76
      },
      {
        "lat": 52.3554,
        "lng": 4.872,
        "distanceKm": 3.52
      },
      {
        "lat": 52.3626,
        "lng": 4.8792,
        "distanceKm": 5.27
      },
      {
        "lat": 52.3693,
        "lng": 4.8867,
        "distanceKm": 7.03
      },
      {
        "lat": 52.3758,
        "lng": 4.8938,
        "distanceKm": 8.79
      },
      {
        "lat": 52.3819,
        "lng": 4.9005,
        "distanceKm": 10.55
      },
      {
        "lat": 52.3809,
        "lng": 4.907,
        "distanceKm": 12.31
      },
      {
        "lat": 52.3746,
        "lng": 4.9133,
        "distanceKm": 14.07
      },
      {
        "lat": 52.368,
        "lng": 4.9195,
        "distanceKm": 15.82
      },
      {
        "lat": 52.3613,
        "lng": 4.9256,
        "distanceKm": 17.58
      },
      {
        "lat": 52.3543,
        "lng": 4.9236,
        "distanceKm": 19.34
      },
      {
        "lat": 52.3472,
        "lng": 4.9171,
        "distanceKm": 21.1
      },
      {
        "lat": 52.3424,
        "lng": 4.9106,
        "distanceKm": 22.86
      },
      {
        "lat": 52.3382,
        "lng": 4.9041,
        "distanceKm": 24.61
      },
      {
        "lat": 52.3338,
        "lng": 4.8979,
        "distanceKm": 26.37
      },
      {
        "lat": 52.3293,
        "lng": 4.8918,
        "distanceKm": 28.13
      },
      {
        "lat": 52.3316,
        "lng": 4.8853,
        "distanceKm": 29.89
      },
      {
        "lat": 52.3346,
        "lng": 4.8788,
        "distanceKm": 31.65
      },
      {
        "lat": 52.338,
        "lng": 4.8732,
        "distanceKm": 33.4
      },
      {
        "lat": 52.3413,
        "lng": 4.8676,
        "distanceKm": 35.16
      },
      {
        "lat": 52.3444,
        "lng": 4.8624,
        "distanceKm": 36.92
      },
      {
        "lat": 52.3474,
        "lng": 4.8572,
        "distanceKm": 38.68
      },
      {
        "lat": 52.3457,
        "lng": 4.8565,
        "distanceKm": 40.44
      },
      {
        "lat": 52.3434,
        "lng": 4.8565,
        "distanceKm": 42.2
      }
    ],
    "elevationProfile": [
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5
    ],
    "elevationGain": 25
  },
  {
    "raceId": "valencia",
    "name": "Valencia Marathon",
    "distance": 42.2,
    "bounds": {
      "minLat": 39.4534,
      "maxLat": 39.4989,
      "minLng": -0.3989,
      "maxLng": -0.3412
    },
    "start": {
      "lat": 39.4699,
      "lng": -0.3763
    },
    "finish": {
      "lat": 39.4699,
      "lng": -0.3763
    },
    "waypoints": [
      {
        "lat": 39.4699,
        "lng": -0.3763,
        "distanceKm": 0
      },
      {
        "lat": 39.4741,
        "lng": -0.3677,
        "distanceKm": 1.76
      },
      {
        "lat": 39.4784,
        "lng": -0.3595,
        "distanceKm": 3.52
      },
      {
        "lat": 39.4828,
        "lng": -0.3517,
        "distanceKm": 5.27
      },
      {
        "lat": 39.4877,
        "lng": -0.3456,
        "distanceKm": 7.03
      },
      {
        "lat": 39.4925,
        "lng": -0.3431,
        "distanceKm": 8.79
      },
      {
        "lat": 39.4972,
        "lng": -0.3498,
        "distanceKm": 10.55
      },
      {
        "lat": 39.4971,
        "lng": -0.3564,
        "distanceKm": 12.31
      },
      {
        "lat": 39.4941,
        "lng": -0.3629,
        "distanceKm": 14.07
      },
      {
        "lat": 39.4903,
        "lng": -0.3694,
        "distanceKm": 15.82
      },
      {
        "lat": 39.4861,
        "lng": -0.3759,
        "distanceKm": 17.58
      },
      {
        "lat": 39.482,
        "lng": -0.3819,
        "distanceKm": 19.34
      },
      {
        "lat": 39.4778,
        "lng": -0.3878,
        "distanceKm": 21.1
      },
      {
        "lat": 39.4733,
        "lng": -0.3934,
        "distanceKm": 22.86
      },
      {
        "lat": 39.4689,
        "lng": -0.3989,
        "distanceKm": 24.61
      },
      {
        "lat": 39.4651,
        "lng": -0.3929,
        "distanceKm": 26.37
      },
      {
        "lat": 39.4613,
        "lng": -0.3869,
        "distanceKm": 28.13
      },
      {
        "lat": 39.4572,
        "lng": -0.3805,
        "distanceKm": 29.89
      },
      {
        "lat": 39.4536,
        "lng": -0.374,
        "distanceKm": 31.65
      },
      {
        "lat": 39.4563,
        "lng": -0.368,
        "distanceKm": 33.4
      },
      {
        "lat": 39.459,
        "lng": -0.3625,
        "distanceKm": 35.16
      },
      {
        "lat": 39.4623,
        "lng": -0.3668,
        "distanceKm": 36.92
      },
      {
        "lat": 39.4656,
        "lng": -0.3711,
        "distanceKm": 38.68
      },
      {
        "lat": 39.4677,
        "lng": -0.3737,
        "distanceKm": 40.44
      },
      {
        "lat": 39.4699,
        "lng": -0.3763,
        "distanceKm": 42.2
      }
    ],
    "elevationProfile": [
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5
    ],
    "elevationGain": 28
  },
  {
    "raceId": "rotterdam",
    "name": "Rotterdam Marathon",
    "distance": 42.2,
    "bounds": {
      "minLat": 51.8956,
      "maxLat": 51.9289,
      "minLng": 4.4667,
      "maxLng": 4.5278
    },
    "start": {
      "lat": 51.9225,
      "lng": 4.4792
    },
    "finish": {
      "lat": 51.9225,
      "lng": 4.4792
    },
    "waypoints": [
      {
        "lat": 51.9225,
        "lng": 4.4792,
        "distanceKm": 0
      },
      {
        "lat": 51.9189,
        "lng": 4.4884,
        "distanceKm": 1.76
      },
      {
        "lat": 51.9154,
        "lng": 4.4965,
        "distanceKm": 3.52
      },
      {
        "lat": 51.912,
        "lng": 4.5041,
        "distanceKm": 5.27
      },
      {
        "lat": 51.9088,
        "lng": 4.511,
        "distanceKm": 7.03
      },
      {
        "lat": 51.9057,
        "lng": 4.5178,
        "distanceKm": 8.79
      },
      {
        "lat": 51.9028,
        "lng": 4.5243,
        "distanceKm": 10.55
      },
      {
        "lat": 51.8999,
        "lng": 4.5251,
        "distanceKm": 12.31
      },
      {
        "lat": 51.8972,
        "lng": 4.5191,
        "distanceKm": 14.07
      },
      {
        "lat": 51.8967,
        "lng": 4.5131,
        "distanceKm": 15.82
      },
      {
        "lat": 51.8995,
        "lng": 4.5072,
        "distanceKm": 17.58
      },
      {
        "lat": 51.9026,
        "lng": 4.5012,
        "distanceKm": 19.34
      },
      {
        "lat": 51.9063,
        "lng": 4.4953,
        "distanceKm": 21.1
      },
      {
        "lat": 51.9099,
        "lng": 4.4894,
        "distanceKm": 22.86
      },
      {
        "lat": 51.913,
        "lng": 4.4837,
        "distanceKm": 24.61
      },
      {
        "lat": 51.9161,
        "lng": 4.4781,
        "distanceKm": 26.37
      },
      {
        "lat": 51.9195,
        "lng": 4.4729,
        "distanceKm": 28.13
      },
      {
        "lat": 51.9228,
        "lng": 4.4676,
        "distanceKm": 29.89
      },
      {
        "lat": 51.9252,
        "lng": 4.4708,
        "distanceKm": 31.65
      },
      {
        "lat": 51.9275,
        "lng": 4.4758,
        "distanceKm": 33.4
      },
      {
        "lat": 51.9283,
        "lng": 4.4797,
        "distanceKm": 35.16
      },
      {
        "lat": 51.9267,
        "lng": 4.4819,
        "distanceKm": 36.92
      },
      {
        "lat": 51.9252,
        "lng": 4.4828,
        "distanceKm": 38.68
      },
      {
        "lat": 51.9238,
        "lng": 4.481,
        "distanceKm": 40.44
      },
      {
        "lat": 51.9225,
        "lng": 4.4792,
        "distanceKm": 42.2
      }
    ],
    "elevationProfile": [
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5
    ],
    "elevationGain": 35
  },
  {
    "raceId": "marine-corps",
    "name": "Marine Corps Marathon",
    "distance": 42.2,
    "bounds": {
      "minLat": 38.8656,
      "maxLat": 38.9023,
      "minLng": -77.0789,
      "maxLng": -77.0167
    },
    "start": {
      "lat": 38.8719,
      "lng": -77.0563
    },
    "finish": {
      "lat": 38.8901,
      "lng": -77.0656
    },
    "waypoints": [
      {
        "lat": 38.8719,
        "lng": -77.0563,
        "distanceKm": 0
      },
      {
        "lat": 38.8791,
        "lng": -77.0635,
        "distanceKm": 1.76
      },
      {
        "lat": 38.8862,
        "lng": -77.0706,
        "distanceKm": 3.52
      },
      {
        "lat": 38.8932,
        "lng": -77.0776,
        "distanceKm": 5.27
      },
      {
        "lat": 38.8986,
        "lng": -77.0718,
        "distanceKm": 7.03
      },
      {
        "lat": 38.9004,
        "lng": -77.0632,
        "distanceKm": 8.79
      },
      {
        "lat": 38.8937,
        "lng": -77.0544,
        "distanceKm": 10.55
      },
      {
        "lat": 38.8871,
        "lng": -77.0471,
        "distanceKm": 12.31
      },
      {
        "lat": 38.8805,
        "lng": -77.0405,
        "distanceKm": 14.07
      },
      {
        "lat": 38.8736,
        "lng": -77.0344,
        "distanceKm": 15.82
      },
      {
        "lat": 38.8665,
        "lng": -77.0285,
        "distanceKm": 17.58
      },
      {
        "lat": 38.8718,
        "lng": -77.0226,
        "distanceKm": 19.34
      },
      {
        "lat": 38.8789,
        "lng": -77.0167,
        "distanceKm": 21.1
      },
      {
        "lat": 38.8856,
        "lng": -77.0234,
        "distanceKm": 22.86
      },
      {
        "lat": 38.8907,
        "lng": -77.0302,
        "distanceKm": 24.61
      },
      {
        "lat": 38.8877,
        "lng": -77.0373,
        "distanceKm": 26.37
      },
      {
        "lat": 38.8845,
        "lng": -77.0441,
        "distanceKm": 28.13
      },
      {
        "lat": 38.8808,
        "lng": -77.0502,
        "distanceKm": 29.89
      },
      {
        "lat": 38.8772,
        "lng": -77.0562,
        "distanceKm": 31.65
      },
      {
        "lat": 38.8737,
        "lng": -77.0622,
        "distanceKm": 33.4
      },
      {
        "lat": 38.8744,
        "lng": -77.0666,
        "distanceKm": 35.16
      },
      {
        "lat": 38.8778,
        "lng": -77.0701,
        "distanceKm": 36.92
      },
      {
        "lat": 38.8817,
        "lng": -77.0698,
        "distanceKm": 38.68
      },
      {
        "lat": 38.8859,
        "lng": -77.0677,
        "distanceKm": 40.44
      },
      {
        "lat": 38.8901,
        "lng": -77.0656,
        "distanceKm": 42.2
      }
    ],
    "elevationProfile": [
      0.187,
      0.273,
      0.36,
      0.446,
      0.533,
      0.619,
      0.706,
      0.794,
      0.883,
      0.973,
      1,
      0.917,
      0.833,
      0.75,
      0.567,
      0.384,
      0.2,
      0.044,
      0.03,
      0.015,
      0,
      0,
      0.029,
      0.059,
      0.088,
      0.125,
      0.171,
      0.216,
      0.261,
      0.329,
      0.402,
      0.475,
      0.549,
      0.624,
      0.7,
      0.775,
      0.823,
      0.779,
      0.735,
      0.691,
      0.653,
      0.625,
      0.596,
      0.568,
      0.545,
      0.53,
      0.514,
      0.499,
      0.484,
      0.468
    ],
    "elevationGain": 245
  },
  {
    "raceId": "big-sur",
    "name": "Big Sur Marathon",
    "distance": 42.2,
    "bounds": {
      "minLat": 36.2704,
      "maxLat": 36.555,
      "minLng": -121.923,
      "maxLng": -121.8078
    },
    "start": {
      "lat": 36.2704,
      "lng": -121.8078
    },
    "finish": {
      "lat": 36.555,
      "lng": -121.923
    },
    "waypoints": [
      {
        "lat": 36.2704,
        "lng": -121.8078,
        "distanceKm": 0
      },
      {
        "lat": 36.2779,
        "lng": -121.8127,
        "distanceKm": 1.76
      },
      {
        "lat": 36.2851,
        "lng": -121.8174,
        "distanceKm": 3.52
      },
      {
        "lat": 36.292,
        "lng": -121.8218,
        "distanceKm": 5.27
      },
      {
        "lat": 36.2988,
        "lng": -121.8262,
        "distanceKm": 7.03
      },
      {
        "lat": 36.3055,
        "lng": -121.8304,
        "distanceKm": 8.79
      },
      {
        "lat": 36.3121,
        "lng": -121.8346,
        "distanceKm": 10.55
      },
      {
        "lat": 36.3186,
        "lng": -121.8387,
        "distanceKm": 12.31
      },
      {
        "lat": 36.3249,
        "lng": -121.8427,
        "distanceKm": 14.07
      },
      {
        "lat": 36.3313,
        "lng": -121.8468,
        "distanceKm": 15.82
      },
      {
        "lat": 36.3378,
        "lng": -121.8509,
        "distanceKm": 17.58
      },
      {
        "lat": 36.3443,
        "lng": -121.855,
        "distanceKm": 19.34
      },
      {
        "lat": 36.3506,
        "lng": -121.8591,
        "distanceKm": 21.1
      },
      {
        "lat": 36.3569,
        "lng": -121.8631,
        "distanceKm": 22.86
      },
      {
        "lat": 36.3634,
        "lng": -121.8673,
        "distanceKm": 24.61
      },
      {
        "lat": 36.3699,
        "lng": -121.8714,
        "distanceKm": 26.37
      },
      {
        "lat": 36.3762,
        "lng": -121.8754,
        "distanceKm": 28.13
      },
      {
        "lat": 36.3826,
        "lng": -121.8794,
        "distanceKm": 29.89
      },
      {
        "lat": 36.3889,
        "lng": -121.8834,
        "distanceKm": 31.65
      },
      {
        "lat": 36.3953,
        "lng": -121.8875,
        "distanceKm": 33.4
      },
      {
        "lat": 36.4018,
        "lng": -121.8917,
        "distanceKm": 35.16
      },
      {
        "lat": 36.4082,
        "lng": -121.8957,
        "distanceKm": 36.92
      },
      {
        "lat": 36.4145,
        "lng": -121.8998,
        "distanceKm": 38.68
      },
      {
        "lat": 36.471,
        "lng": -121.9098,
        "distanceKm": 40.44
      },
      {
        "lat": 36.555,
        "lng": -121.923,
        "distanceKm": 42.2
      }
    ],
    "elevationProfile": [
      0.67,
      0.653,
      0.635,
      0.618,
      0.601,
      0.586,
      0.57,
      0.554,
      0.539,
      0.524,
      0.508,
      0.53,
      0.602,
      0.673,
      0.744,
      0.81,
      0.873,
      0.937,
      1,
      0.991,
      0.944,
      0.896,
      0.849,
      0.779,
      0.704,
      0.629,
      0.555,
      0.509,
      0.467,
      0.426,
      0.385,
      0.35,
      0.316,
      0.281,
      0.248,
      0.225,
      0.202,
      0.179,
      0.156,
      0.139,
      0.121,
      0.103,
      0.086,
      0.072,
      0.058,
      0.043,
      0.03,
      0.02,
      0.01,
      0
    ],
    "elevationGain": 610
  },
  {
    "raceId": "california-international",
    "name": "California International Marathon",
    "distance": 42.2,
    "bounds": {
      "minLat": 38.5689,
      "maxLat": 38.678,
      "minLng": -121.4934,
      "maxLng": -121.165
    },
    "start": {
      "lat": 38.678,
      "lng": -121.165
    },
    "finish": {
      "lat": 38.5767,
      "lng": -121.4934
    },
    "waypoints": [
      {
        "lat": 38.678,
        "lng": -121.165,
        "distanceKm": 0
      },
      {
        "lat": 38.673,
        "lng": -121.1775,
        "distanceKm": 1.76
      },
      {
        "lat": 38.6679,
        "lng": -121.1902,
        "distanceKm": 3.52
      },
      {
        "lat": 38.6625,
        "lng": -121.2038,
        "distanceKm": 5.27
      },
      {
        "lat": 38.657,
        "lng": -121.2173,
        "distanceKm": 7.03
      },
      {
        "lat": 38.6512,
        "lng": -121.2306,
        "distanceKm": 8.79
      },
      {
        "lat": 38.6454,
        "lng": -121.2438,
        "distanceKm": 10.55
      },
      {
        "lat": 38.6396,
        "lng": -121.257,
        "distanceKm": 12.31
      },
      {
        "lat": 38.6338,
        "lng": -121.2702,
        "distanceKm": 14.07
      },
      {
        "lat": 38.628,
        "lng": -121.2834,
        "distanceKm": 15.82
      },
      {
        "lat": 38.6223,
        "lng": -121.2965,
        "distanceKm": 17.58
      },
      {
        "lat": 38.6164,
        "lng": -121.3097,
        "distanceKm": 19.34
      },
      {
        "lat": 38.6106,
        "lng": -121.3229,
        "distanceKm": 21.1
      },
      {
        "lat": 38.6048,
        "lng": -121.3361,
        "distanceKm": 22.86
      },
      {
        "lat": 38.599,
        "lng": -121.3493,
        "distanceKm": 24.61
      },
      {
        "lat": 38.5931,
        "lng": -121.3628,
        "distanceKm": 26.37
      },
      {
        "lat": 38.5871,
        "lng": -121.3764,
        "distanceKm": 28.13
      },
      {
        "lat": 38.5812,
        "lng": -121.3897,
        "distanceKm": 29.89
      },
      {
        "lat": 38.5754,
        "lng": -121.4029,
        "distanceKm": 31.65
      },
      {
        "lat": 38.5716,
        "lng": -121.4161,
        "distanceKm": 33.4
      },
      {
        "lat": 38.5699,
        "lng": -121.4293,
        "distanceKm": 35.16
      },
      {
        "lat": 38.5701,
        "lng": -121.4426,
        "distanceKm": 36.92
      },
      {
        "lat": 38.5733,
        "lng": -121.4562,
        "distanceKm": 38.68
      },
      {
        "lat": 38.5759,
        "lng": -121.4721,
        "distanceKm": 40.44
      },
      {
        "lat": 38.5767,
        "lng": -121.4934,
        "distanceKm": 42.2
      }
    ],
    "elevationProfile": [
      1,
      0.975,
      0.95,
      0.925,
      0.9,
      0.878,
      0.855,
      0.833,
      0.811,
      0.789,
      0.767,
      0.746,
      0.724,
      0.693,
      0.661,
      0.628,
      0.595,
      0.563,
      0.53,
      0.498,
      0.465,
      0.435,
      0.413,
      0.391,
      0.369,
      0.348,
      0.326,
      0.304,
      0.282,
      0.261,
      0.238,
      0.216,
      0.194,
      0.171,
      0.152,
      0.137,
      0.122,
      0.107,
      0.092,
      0.079,
      0.065,
      0.052,
      0.039,
      0.034,
      0.029,
      0.025,
      0.02,
      0.014,
      0.007,
      0
    ],
    "elevationGain": 45
  },
  {
    "raceId": "oslo",
    "name": "Oslo Marathon",
    "distance": 42.2,
    "bounds": {
      "minLat": 59.9071,
      "maxLat": 59.942,
      "minLng": 10.7051,
      "maxLng": 10.7952
    },
    "start": {
      "lat": 59.9111,
      "lng": 10.7346
    },
    "finish": {
      "lat": 59.9111,
      "lng": 10.7346
    },
    "waypoints": [
      {
        "lat": 59.9111,
        "lng": 10.7346,
        "distanceKm": 0
      },
      {
        "lat": 59.9125,
        "lng": 10.7306,
        "distanceKm": 1.76
      },
      {
        "lat": 59.9139,
        "lng": 10.7267,
        "distanceKm": 3.52
      },
      {
        "lat": 59.9171,
        "lng": 10.7214,
        "distanceKm": 5.27
      },
      {
        "lat": 59.9202,
        "lng": 10.7161,
        "distanceKm": 7.03
      },
      {
        "lat": 59.9245,
        "lng": 10.7112,
        "distanceKm": 8.79
      },
      {
        "lat": 59.929,
        "lng": 10.7063,
        "distanceKm": 10.55
      },
      {
        "lat": 59.9331,
        "lng": 10.7099,
        "distanceKm": 12.31
      },
      {
        "lat": 59.937,
        "lng": 10.7165,
        "distanceKm": 14.07
      },
      {
        "lat": 59.9396,
        "lng": 10.7247,
        "distanceKm": 15.82
      },
      {
        "lat": 59.9411,
        "lng": 10.7343,
        "distanceKm": 17.58
      },
      {
        "lat": 59.9414,
        "lng": 10.7437,
        "distanceKm": 19.34
      },
      {
        "lat": 59.9399,
        "lng": 10.7531,
        "distanceKm": 21.1
      },
      {
        "lat": 59.9381,
        "lng": 10.762,
        "distanceKm": 22.86
      },
      {
        "lat": 59.9359,
        "lng": 10.7704,
        "distanceKm": 24.61
      },
      {
        "lat": 59.9331,
        "lng": 10.7782,
        "distanceKm": 26.37
      },
      {
        "lat": 59.929,
        "lng": 10.7845,
        "distanceKm": 28.13
      },
      {
        "lat": 59.9247,
        "lng": 10.7901,
        "distanceKm": 29.89
      },
      {
        "lat": 59.92,
        "lng": 10.7927,
        "distanceKm": 31.65
      },
      {
        "lat": 59.9153,
        "lng": 10.7952,
        "distanceKm": 33.4
      },
      {
        "lat": 59.9114,
        "lng": 10.7884,
        "distanceKm": 35.16
      },
      {
        "lat": 59.9078,
        "lng": 10.7812,
        "distanceKm": 36.92
      },
      {
        "lat": 59.9074,
        "lng": 10.768,
        "distanceKm": 38.68
      },
      {
        "lat": 59.908,
        "lng": 10.7532,
        "distanceKm": 40.44
      },
      {
        "lat": 59.9111,
        "lng": 10.7346,
        "distanceKm": 42.2
      }
    ],
    "elevationProfile": [
      0,
      0.064,
      0.129,
      0.193,
      0.258,
      0.311,
      0.363,
      0.416,
      0.468,
      0.525,
      0.584,
      0.644,
      0.703,
      0.762,
      0.822,
      0.881,
      0.941,
      1,
      0.983,
      0.95,
      0.916,
      0.882,
      0.839,
      0.784,
      0.729,
      0.673,
      0.625,
      0.591,
      0.557,
      0.523,
      0.489,
      0.503,
      0.52,
      0.538,
      0.555,
      0.54,
      0.507,
      0.473,
      0.439,
      0.4,
      0.343,
      0.286,
      0.229,
      0.182,
      0.161,
      0.14,
      0.119,
      0.084,
      0.042,
      0
    ],
    "elevationGain": 220
  }
];
