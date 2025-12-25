/**
 * Centralized SEO configuration for all pages
 * This enables consistent metadata and programmatic SEO
 */

export const BASE_URL = 'https://www.trainpace.com';
export const SITE_NAME = 'TrainPace';
export const DEFAULT_OG_IMAGE = `${BASE_URL}/landing-page-2025.png`;

// Race distance configurations for programmatic SEO
export const RACE_DISTANCES = {
  '5k': {
    name: '5K',
    fullName: '5 Kilometer',
    distanceKm: 5,
    distanceMiles: 3.1,
    description: 'Popular road race distance, perfect for beginners and speed training',
    typicalTimes: { beginner: '35-45 min', intermediate: '25-35 min', advanced: '18-25 min' },
  },
  '10k': {
    name: '10K',
    fullName: '10 Kilometer',
    distanceKm: 10,
    distanceMiles: 6.2,
    description: 'Classic distance requiring endurance and speed balance',
    typicalTimes: { beginner: '70-90 min', intermediate: '50-70 min', advanced: '35-50 min' },
  },
  'half-marathon': {
    name: 'Half Marathon',
    fullName: 'Half Marathon (21.1K)',
    distanceKm: 21.0975,
    distanceMiles: 13.1,
    description: 'The stepping stone to marathon running',
    typicalTimes: { beginner: '2:30-3:00', intermediate: '1:50-2:30', advanced: '1:20-1:50' },
  },
  'marathon': {
    name: 'Marathon',
    fullName: 'Marathon (42.2K)',
    distanceKm: 42.195,
    distanceMiles: 26.2,
    description: 'The ultimate endurance challenge for runners',
    typicalTimes: { beginner: '5:00-6:00', intermediate: '4:00-5:00', advanced: '3:00-4:00' },
  },
} as const;

// Marathon course configurations for programmatic SEO
export const MARATHON_COURSES = {
  boston: {
    name: 'Boston Marathon',
    city: 'Boston',
    country: 'United States',
    month: 'April',
    difficulty: 'Challenging',
    elevation: { gain: 245, loss: 400 },
    keyFeatures: ['Heartbreak Hill', 'Net Downhill', 'Point-to-Point Course'],
    description: 'The world\'s oldest annual marathon, famous for Heartbreak Hill and strict qualifying times.',
    metaDescription: 'Boston Marathon elevation profile with interactive course map. Analyze Heartbreak Hill, Newton Hills, and plan your pacing strategy for race day.',
  },
  nyc: {
    name: 'NYC Marathon',
    city: 'New York City',
    country: 'United States',
    month: 'November',
    difficulty: 'Moderate',
    elevation: { gain: 290, loss: 290 },
    keyFeatures: ['Five Boroughs', 'Central Park Finish', 'Iconic Bridges'],
    description: 'The world\'s largest marathon, running through all five NYC boroughs.',
    metaDescription: 'NYC Marathon elevation profile and course map. See the five boroughs route, bridge climbs, and Central Park finish. Plan your race strategy.',
  },
  chicago: {
    name: 'Chicago Marathon',
    city: 'Chicago',
    country: 'United States',
    month: 'October',
    difficulty: 'Easy',
    elevation: { gain: 75, loss: 75 },
    keyFeatures: ['Flat and Fast', 'PR Course', '29 Neighborhoods'],
    description: 'One of the flattest major marathons, known for fast times and great crowd support.',
    metaDescription: 'Chicago Marathon elevation profile - one of the flattest World Marathon Majors. Perfect for setting a PR. Interactive course map and pacing tips.',
  },
  berlin: {
    name: 'Berlin Marathon',
    city: 'Berlin',
    country: 'Germany',
    month: 'September',
    difficulty: 'Easy',
    elevation: { gain: 55, loss: 55 },
    keyFeatures: ['World Record Course', 'Brandenburg Gate Finish', 'Pancake Flat'],
    description: 'The fastest marathon in the world, where most world records are set.',
    metaDescription: 'Berlin Marathon elevation profile - the fastest marathon course in the world. See why world records are set here. Interactive course map.',
  },
  london: {
    name: 'London Marathon',
    city: 'London',
    country: 'United Kingdom',
    month: 'April',
    difficulty: 'Easy',
    elevation: { gain: 65, loss: 100 },
    keyFeatures: ['Historic Landmarks', 'Charity Running', 'The Mall Finish'],
    description: 'Iconic course past Tower Bridge, Big Ben, and Buckingham Palace.',
    metaDescription: 'London Marathon elevation profile with iconic landmarks. See the Tower Bridge crossing, Westminster route, and Mall finish on our interactive course map.',
  },
  tokyo: {
    name: 'Tokyo Marathon',
    city: 'Tokyo',
    country: 'Japan',
    month: 'March',
    difficulty: 'Easy',
    elevation: { gain: 40, loss: 45 },
    keyFeatures: ['Urban Scenery', 'Japanese Culture', 'Efficient Organization'],
    description: 'Experience Japanese hospitality on this flat, fast urban course.',
    metaDescription: 'Tokyo Marathon elevation profile - experience the flat, fast course through Japan\'s capital. Interactive map with key landmarks and pacing strategy.',
  },
} as const;

// Training zone configurations for programmatic SEO
export const TRAINING_ZONES = {
  easy: {
    name: 'Easy Pace',
    purpose: 'Recovery and base building',
    effort: '60-70% max heart rate',
    benefits: ['Build aerobic base', 'Recovery between hard sessions', 'Fat burning'],
    description: 'Comfortable conversational pace for building endurance',
  },
  tempo: {
    name: 'Tempo Pace',
    purpose: 'Lactate threshold training',
    effort: '85-90% max heart rate',
    benefits: ['Improve lactate threshold', 'Race pace confidence', 'Mental toughness'],
    description: 'Comfortably hard pace you can sustain for 45-60 minutes',
  },
  threshold: {
    name: 'Threshold Pace',
    purpose: 'Maximum sustainable effort',
    effort: '88-92% max heart rate',
    benefits: ['Push lactate threshold higher', 'Half marathon race pace', 'Endurance speed'],
    description: 'The edge of comfortable - sustainable for 20-30 minutes',
  },
  interval: {
    name: 'Interval Pace',
    purpose: 'VO2max development',
    effort: '95-100% max heart rate',
    benefits: ['Improve VO2max', 'Running economy', 'Speed development'],
    description: 'Hard efforts with recovery periods, 3-5 minute repeats',
  },
  repetition: {
    name: 'Repetition Pace',
    purpose: 'Speed and form',
    effort: 'Maximum',
    benefits: ['Neuromuscular power', 'Running form', 'Pure speed'],
    description: 'Short, fast sprints with full recovery',
  },
} as const;

// Page SEO configurations
export const PAGE_SEO = {
  home: {
    title: 'TrainPace – Free Running Pace Calculator & Race Day Tools',
    description: 'Free running calculator for training paces, race fueling, and GPX elevation analysis. Get VDOT-based pace zones, plan how many gels to carry, and preview marathon course profiles.',
    keywords: ['running pace calculator', 'training pace', 'VDOT calculator', 'marathon training', 'running tools', 'free running app'],
  },
  calculator: {
    title: 'Running Pace Calculator – VDOT Training Zones, Easy to Tempo Pace | TrainPace',
    description: 'Free VDOT running pace calculator. Enter any race time to get Easy, Tempo, Threshold, and Interval training zones. Includes Yasso 800s, race predictor for 5K to marathon, and printable pace charts.',
    keywords: ['VDOT calculator', 'running pace calculator', 'training zones', 'easy pace', 'tempo pace', 'marathon pace', 'race predictor'],
  },
  fuel: {
    title: 'Marathon Fuel Calculator – How Many Gels & When to Take Them | TrainPace',
    description: 'Calculate exactly how many gels you need for your marathon or half marathon. Get a personalized fueling schedule with 60-90g/hr carb targets, timing recommendations, and avoid hitting the wall.',
    keywords: ['marathon fuel calculator', 'gel calculator', 'race nutrition', 'carb loading', 'marathon gels', 'running nutrition'],
  },
  elevation: {
    title: 'GPX Elevation Profile Viewer – Free Route Analysis & Climb Stats | TrainPace',
    description: 'Free GPX elevation profile viewer. Upload any route to see elevation gain, grade percentages, and climb difficulty on an interactive map. Analyze marathon courses before race day.',
    keywords: ['GPX elevation profile', 'route analysis', 'elevation gain calculator', 'running route map', 'climb analyzer'],
  },
  faq: {
    title: 'FAQ – TrainPace Running Tools Help & Support',
    description: 'Get answers to frequently asked questions about TrainPace pace calculator, elevation finder, fuel planner, and more. Learn how to use our free running tools.',
    keywords: ['TrainPace FAQ', 'running calculator help', 'GPX upload help', 'pace calculator guide'],
  },
  about: {
    title: 'About TrainPace – Free Running Tools for Self-Coached Athletes',
    description: 'Learn about TrainPace, the free running tools platform built by runners for runners. No ads, no paywalls, just science-backed training tools.',
    keywords: ['about TrainPace', 'running app story', 'self-coached runners', 'free running tools'],
  },
  dashboard: {
    title: 'Dashboard – Your Saved Routes & Training Plans | TrainPace',
    description: 'Access your saved GPX routes, pace plans, and fuel strategies. Manage your running data in one place.',
    keywords: ['running dashboard', 'saved routes', 'training plans'],
  },
  privacy: {
    title: 'Privacy Policy | TrainPace',
    description: 'Learn how TrainPace protects your privacy and handles your data securely.',
    keywords: ['privacy policy', 'data protection'],
  },
  terms: {
    title: 'Terms of Service | TrainPace',
    description: 'Terms and conditions for using TrainPace running tools and services.',
    keywords: ['terms of service', 'user agreement'],
  },
} as const;

// Generate marathon page SEO
export function getMarathonPageSEO(slug: keyof typeof MARATHON_COURSES) {
  const course = MARATHON_COURSES[slug];
  return {
    title: `${course.name} Elevation Profile – Course Map & Hill Analysis | TrainPace`,
    description: course.metaDescription,
    keywords: [
      `${course.name.toLowerCase()} elevation`,
      `${course.name.toLowerCase()} course map`,
      `${course.city.toLowerCase()} marathon profile`,
      'marathon elevation profile',
      'race course analysis',
    ],
  };
}

// Generate race distance guide SEO
export function getRaceDistanceGuideSEO(distance: keyof typeof RACE_DISTANCES) {
  const race = RACE_DISTANCES[distance];
  return {
    title: `${race.name} Training Guide – Pace Calculator & Training Plans | TrainPace`,
    description: `Complete ${race.name} training guide with pace calculator, training zones, and race day strategies. ${race.description}`,
    keywords: [
      `${race.name.toLowerCase()} training`,
      `${race.name.toLowerCase()} pace calculator`,
      `${race.name.toLowerCase()} training plan`,
      'running pace zones',
      'race training guide',
    ],
  };
}

// Internal linking structure for programmatic SEO
export const INTERNAL_LINKS = {
  calculator: [
    { text: 'Fuel Planner', href: '/fuel', description: 'Plan your race nutrition' },
    { text: 'Elevation Finder', href: '/elevationfinder', description: 'Analyze course profiles' },
    { text: 'FAQ', href: '/faq', description: 'Get help with pace zones' },
  ],
  fuel: [
    { text: 'Pace Calculator', href: '/calculator', description: 'Calculate training paces' },
    { text: 'Elevation Finder', href: '/elevationfinder', description: 'Analyze your race course' },
    { text: 'Boston Marathon', href: '/preview-route/boston', description: 'Preview the course' },
  ],
  elevation: [
    { text: 'Pace Calculator', href: '/calculator', description: 'Get your training paces' },
    { text: 'Fuel Planner', href: '/fuel', description: 'Plan your race nutrition' },
    { text: 'Marathon Courses', href: '/preview-route/boston', description: 'Preview major marathons' },
  ],
  marathons: [
    { text: 'Boston Marathon', href: '/preview-route/boston' },
    { text: 'NYC Marathon', href: '/preview-route/nyc' },
    { text: 'Chicago Marathon', href: '/preview-route/chicago' },
    { text: 'Berlin Marathon', href: '/preview-route/berlin' },
    { text: 'London Marathon', href: '/preview-route/london' },
    { text: 'Tokyo Marathon', href: '/preview-route/tokyo' },
  ],
} as const;
