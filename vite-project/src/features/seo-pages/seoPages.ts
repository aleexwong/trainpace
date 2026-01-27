/**
 * SEO Pages Configuration
 *
 * Centralized configuration for all programmatic SEO pages.
 * Migrated to use the new scalable SEO system from @/lib/seo.
 *
 * This file defines page data that feeds into:
 * - Dynamic route generation
 * - Prerendering
 * - Sitemap generation
 * - Schema markup
 *
 * To add new pages at scale, use the content generators from @/lib/seo
 * or add entries directly to these arrays.
 */

import type { SeoPageConfig } from '../../lib/seo';
import { generatePageId, BASE_URL } from '../../lib/seo';

// Re-export the old types for backward compatibility
export type { SeoPageConfig } from './types';

// =============================================================================
// Helper Functions
// =============================================================================

function withBaseUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

// =============================================================================
// Calculator SEO Pages
// =============================================================================

export const calculatorSeoPages: SeoPageConfig[] = [
  {
    id: generatePageId('pace', '5k-pace-calculator'),
    slug: '5k-pace-calculator',
    tool: 'pace',
    path: '/calculator/5k-pace-calculator',
    title: '5K Pace Calculator - Training Paces + Pace Chart | TrainPace',
    description:
      'Free 5K pace calculator. Enter your 5K time to get VDOT-based Easy, Tempo, Threshold, and Interval training paces plus a printable pace chart.',
    h1: '5K Pace Calculator',
    intro:
      'Use a recent 5K result to generate science-backed training paces for easy runs, tempo efforts, thresholds, and intervals.',
    bullets: [
      'VDOT-style training zones from your 5K time',
      'Easy, Tempo, Threshold, Interval, Long Run paces',
      'Works in min/km or min/mile',
    ],
    cta: { href: '/calculator', label: 'Open the Pace Calculator' },
    initialInputs: { distance: '5' },
    faq: [
      {
        question: 'What is a good 5K pace?',
        answer:
          'A "good" 5K pace depends on experience and age. The useful thing is consistency: use your current 5K time to set training paces you can repeat week after week.',
      },
      {
        question: 'Should easy pace feel slow for 5K training?',
        answer:
          'Yes. Easy pace should feel conversational. It builds aerobic fitness and lets you recover so you can hit your harder workouts.',
      },
      {
        question: 'How often should I update my 5K training paces?',
        answer:
          'Any time you run a meaningful PR or your fitness changes (often every 4-8 weeks in a training block).',
      },
    ],
    howTo: {
      name: 'How to calculate your 5K training paces',
      description:
        'Enter your 5K distance and finish time to get personalized training zones for easy runs, tempo runs, thresholds, and intervals.',
      steps: [
        { name: 'Enter 5K distance', text: 'Set the distance to 5.0 km (or 3.1 miles).' },
        { name: 'Enter your finish time', text: 'Type your most recent 5K time (HH:MM:SS).' },
        { name: 'Calculate training zones', text: 'Generate Easy, Tempo, Threshold, and Interval paces.' },
      ],
    },
  },
  {
    id: generatePageId('pace', '10k-pace-calculator'),
    slug: '10k-pace-calculator',
    tool: 'pace',
    path: '/calculator/10k-pace-calculator',
    title: '10K Pace Calculator - Training Zones (VDOT) | TrainPace',
    description:
      'Free 10K pace calculator. Convert your 10K race time into easy, tempo, threshold, and interval training paces using VDOT-style zones.',
    h1: '10K Pace Calculator',
    intro:
      'Your 10K is a great predictor for threshold fitness. Use it to set sustainable tempo and threshold paces.',
    bullets: [
      'Personalized training zones from a 10K result',
      'Tempo and threshold paces you can repeat',
      'Includes interval + long-run guidance',
    ],
    cta: { href: '/calculator', label: 'Open the Pace Calculator' },
    initialInputs: { distance: '10' },
    faq: [
      {
        question: 'Is 10K pace the same as threshold pace?',
        answer:
          'Not exactly. 10K pace is typically faster than threshold pace. Threshold pace is the effort you can hold for about an hour.',
      },
      {
        question: 'Can I use a 10K time to train for a marathon?',
        answer:
          'Yes. A strong 10K provides a fitness anchor for training zones, then you build marathon-specific endurance with long runs and steady efforts.',
      },
    ],
    howTo: {
      name: 'How to calculate your 10K training paces',
      description:
        'Use your 10K finish time to calculate realistic easy, tempo, threshold, and interval paces.',
      steps: [
        { name: 'Select 10K distance', text: 'Set distance to 10.0 km (or 6.2 miles).' },
        { name: 'Enter your time', text: 'Input your most recent 10K race result.' },
        { name: 'Use the zones', text: 'Apply the suggested paces to workouts and long runs.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'half-marathon-pace-calculator'),
    slug: 'half-marathon-pace-calculator',
    tool: 'pace',
    path: '/calculator/half-marathon-pace-calculator',
    title: 'Half Marathon Pace Calculator - Race Pace + Training Zones | TrainPace',
    description:
      'Free half marathon pace calculator. Use your 13.1 finish time to estimate race pace and get VDOT-based training paces for easy, tempo, and threshold runs.',
    h1: 'Half Marathon Pace Calculator',
    intro:
      'A half marathon is one of the best "fitness benchmarks" for endurance athletes. Use it to dial in tempo work and long-run pacing.',
    bullets: [
      'Half marathon pace (min/km or min/mile)',
      'Training zones for easy, tempo, threshold, intervals',
      'Great for marathon build-ups',
    ],
    cta: { href: '/calculator', label: 'Open the Pace Calculator' },
    initialInputs: { distance: '21.0975' },
    faq: [
      {
        question: 'What pace should I run a half marathon?',
        answer:
          'Start from your current fitness (a recent race) and aim for a pace you can hold steadily. The calculator helps translate results into realistic pacing.',
      },
      {
        question: 'How different are tempo pace and half marathon pace?',
        answer:
          'They can be close for many runners. Tempo pace is often a touch faster than half marathon pace, but the exact gap depends on your endurance.',
      },
    ],
    howTo: {
      name: 'How to calculate half marathon training paces',
      description:
        'Use your half marathon finish time to get training paces for easy runs, tempo workouts, threshold intervals, and long runs.',
      steps: [
        { name: 'Set distance', text: 'Choose 21.1 km (13.1 miles).' },
        { name: 'Enter your finish time', text: 'Use an official result or a hard effort time trial.' },
        { name: 'Train with the paces', text: 'Use easy pace for volume and tempo/threshold for quality.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'marathon-pace-calculator'),
    slug: 'marathon-pace-calculator',
    tool: 'pace',
    path: '/calculator/marathon-pace-calculator',
    title: 'Marathon Pace Calculator - Training Paces + Race Strategy | TrainPace',
    description:
      'Free marathon pace calculator. Convert your marathon time to min/km or min/mile and get VDOT-style training paces for easy, tempo, threshold, and interval runs.',
    h1: 'Marathon Pace Calculator',
    intro:
      'Use your marathon time (or a recent shorter race) to set training paces and build a simple pacing strategy for race day.',
    bullets: [
      'Marathon pace in min/km and min/mile',
      'Training zones that match your fitness',
      'Pairs well with course elevation + fueling planning',
    ],
    cta: { href: '/calculator', label: 'Open the Pace Calculator' },
    initialInputs: { distance: '42.195' },
    faq: [
      {
        question: 'How do I pace a marathon evenly?',
        answer:
          'Start slightly conservative, settle into goal effort, and avoid surges early. If the course is hilly, adjust effort (not pace) on climbs.',
      },
      {
        question: 'Can a 10K or half marathon predict marathon pace?',
        answer:
          'Yes. Shorter races are useful predictors, especially when combined with consistent long-run training.',
      },
    ],
    howTo: {
      name: 'How to calculate your marathon pace and training zones',
      description:
        'Enter your marathon time to calculate goal pace and supporting training paces for workouts.',
      steps: [
        { name: 'Choose marathon distance', text: 'Set distance to 42.195 km (26.2 miles).' },
        { name: 'Enter your time', text: 'Use a recent marathon or a realistic goal time.' },
        { name: 'Use zones in training', text: 'Build volume with easy runs and add tempo/threshold workouts.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'vdot-calculator'),
    slug: 'vdot-calculator',
    tool: 'pace',
    path: '/calculator/vdot-calculator',
    title: 'VDOT Calculator - Convert Race Times to Training Paces | TrainPace',
    description:
      'Free VDOT calculator. Convert any race time (5K to marathon) into VDOT-based training paces for easy runs, tempo, threshold, and intervals.',
    h1: 'VDOT Calculator (Training Paces)',
    intro:
      'VDOT is a practical way to translate race results into training paces. Use it to keep easy days easy and hard days appropriately hard.',
    bullets: [
      'VDOT-inspired pacing guidance',
      'Works for 5K, 10K, half, marathon',
      'Useful for building workout targets',
    ],
    cta: { href: '/calculator', label: 'Calculate Your Training Paces' },
    faq: [
      {
        question: 'What does VDOT mean?',
        answer:
          'VDOT is a performance-based metric popularized by coach Jack Daniels. It helps runners set training paces from race results.',
      },
      {
        question: 'Do I need a lab test to use VDOT?',
        answer:
          'No. A recent race result is enough to estimate a practical training level.',
      },
    ],
    howTo: {
      name: 'How to use a VDOT calculator',
      description:
        'Use a recent race time to generate training pace zones using VDOT-style methodology.',
      steps: [
        { name: 'Pick a recent race', text: 'Use your most recent hard effort (ideally within 6-8 weeks).' },
        { name: 'Enter distance + time', text: 'Input the distance and your finish time.' },
        { name: 'Train by zones', text: 'Use the suggested zones to guide workouts and long runs.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'easy-pace-calculator'),
    slug: 'easy-pace-calculator',
    tool: 'pace',
    path: '/calculator/easy-pace-calculator',
    title: 'Easy Run Pace Calculator - Find Your Conversational Pace | TrainPace',
    description:
      'Easy run pace calculator. Use your race time to find a conversational easy pace range for aerobic base building and recovery runs.',
    h1: 'Easy Run Pace Calculator',
    intro:
      'Easy pace should feel surprisingly relaxed. This page helps you find a sustainable aerobic pace range based on your current fitness.',
    bullets: [
      'Conversational easy pace range',
      'Great for base building and recovery',
      'Avoids turning easy days into "medium-hard" days',
    ],
    cta: { href: '/calculator', label: 'Calculate Easy Pace' },
    howTo: {
      name: 'How to find your easy run pace',
      description:
        'Use your race result to set an easy pace that supports recovery and aerobic development.',
      steps: [
        { name: 'Enter a recent race', text: 'Use a 5K-10K-half-marathon result from the last 1-2 months.' },
        { name: 'Calculate training paces', text: 'Generate your pace zones in the calculator.' },
        { name: 'Use easy pace for volume', text: 'Run most mileage at easy pace to stay consistent.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'tempo-pace-calculator'),
    slug: 'tempo-pace-calculator',
    tool: 'pace',
    path: '/calculator/tempo-pace-calculator',
    title: 'Tempo Run Pace Calculator - Lactate Threshold Workouts | TrainPace',
    description:
      'Tempo pace calculator. Convert your race time to a tempo pace for steady-state threshold workouts and controlled hard runs.',
    h1: 'Tempo Run Pace Calculator',
    intro:
      'Tempo runs are the bread-and-butter of distance training. Use your race time to set a tempo pace you can sustain without fading.',
    bullets: [
      'Tempo pace targets from race fitness',
      'Useful for 20-40 minute steady efforts',
      'Helps avoid starting too fast',
    ],
    cta: { href: '/calculator', label: 'Calculate Tempo Pace' },
    howTo: {
      name: 'How to calculate tempo pace',
      description:
        'Use a recent race time to estimate a realistic tempo run pace for threshold development.',
      steps: [
        { name: 'Enter race result', text: 'Input distance and finish time in the pace calculator.' },
        { name: 'Locate tempo/threshold zone', text: 'Use the Tempo or Threshold target in the results.' },
        { name: 'Use for workouts', text: 'Apply to tempo runs, cruise intervals, and progression runs.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'threshold-pace-calculator'),
    slug: 'threshold-pace-calculator',
    tool: 'pace',
    path: '/calculator/threshold-pace-calculator',
    title: 'Threshold Pace Calculator - Find Your LT Pace | TrainPace',
    description:
      'Threshold pace calculator. Turn race results into lactate threshold training paces for cruise intervals and steady threshold efforts.',
    h1: 'Threshold Pace Calculator',
    intro:
      'Threshold pace is the fastest pace you can hold for a long, controlled effort. Set it correctly and your workouts become repeatable and safer.',
    bullets: [
      'Threshold (LT) pace targets',
      'Great for cruise intervals and steady runs',
      'Based on your current race fitness',
    ],
    cta: { href: '/calculator', label: 'Calculate Threshold Pace' },
    howTo: {
      name: 'How to estimate threshold pace',
      description:
        'Calculate lactate threshold pacing from your most recent race result.',
      steps: [
        { name: 'Enter distance + time', text: 'Input your race distance and finish time.' },
        { name: 'Generate zones', text: 'Click calculate to see threshold targets.' },
        { name: 'Use in workouts', text: 'Apply threshold pace to cruise intervals and sustained efforts.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'mile-pace-calculator'),
    slug: 'mile-pace-calculator',
    tool: 'pace',
    path: '/calculator/mile-pace-calculator',
    title: 'Mile Pace Calculator - Convert Time to Pace (min/mile) | TrainPace',
    description:
      'Free mile pace calculator. Convert a 1-mile time into training paces and see how it relates to longer race performances.',
    h1: 'Mile Pace Calculator',
    intro:
      'A mile is a sharp fitness test. Use it to anchor interval work and track speed development.',
    bullets: [
      'Great for speed benchmarks',
      'Useful for interval pacing',
      'Converts to training zones',
    ],
    cta: { href: '/calculator', label: 'Open the Pace Calculator' },
    initialInputs: { distance: '1.60934' },
  },
  {
    id: generatePageId('pace', '8k-pace-calculator'),
    slug: '8k-pace-calculator',
    tool: 'pace',
    path: '/calculator/8k-pace-calculator',
    title: '8K Pace Calculator - Training Paces from an 8K Time | TrainPace',
    description:
      '8K pace calculator. Enter your 8K time to generate VDOT-style training paces for easy runs, tempo, threshold, and intervals.',
    h1: '8K Pace Calculator',
    intro:
      'Use an 8K result to set realistic paces for threshold workouts and longer intervals.',
    bullets: [
      'Training zones from an 8K',
      'Min/km and min/mile',
      'Good predictor for threshold work',
    ],
    cta: { href: '/calculator', label: 'Open the Pace Calculator' },
    initialInputs: { distance: '8' },
  },
  {
    id: generatePageId('pace', '15k-pace-calculator'),
    slug: '15k-pace-calculator',
    tool: 'pace',
    path: '/calculator/15k-pace-calculator',
    title: '15K Pace Calculator - Training Paces + Race Pace | TrainPace',
    description:
      '15K pace calculator. Convert a 15K race time into training paces for easy runs, tempo, threshold, and intervals.',
    h1: '15K Pace Calculator',
    intro:
      'A 15K sits between 10K and half marathon - great for estimating endurance and threshold fitness.',
    bullets: [
      'Bridges 10K and half',
      'Useful for tempo and steady runs',
      'Training zones included',
    ],
    cta: { href: '/calculator', label: 'Open the Pace Calculator' },
    initialInputs: { distance: '15' },
  },
  {
    id: generatePageId('pace', '20k-pace-calculator'),
    slug: '20k-pace-calculator',
    tool: 'pace',
    path: '/calculator/20k-pace-calculator',
    title: '20K Pace Calculator - Training Zones and Race Pace | TrainPace',
    description:
      '20K pace calculator. Use a 20K time to estimate half marathon pacing and generate VDOT-style training paces.',
    h1: '20K Pace Calculator',
    intro:
      'A 20K is close enough to a half marathon to guide long-run pacing and threshold workouts.',
    bullets: [
      'Half-marathon-adjacent benchmark',
      'Great for long-run targets',
      'Training zones included',
    ],
    cta: { href: '/calculator', label: 'Open the Pace Calculator' },
    initialInputs: { distance: '20' },
  },
  {
    id: generatePageId('pace', '30k-pace-calculator'),
    slug: '30k-pace-calculator',
    tool: 'pace',
    path: '/calculator/30k-pace-calculator',
    title: '30K Pace Calculator - Marathon Training Pace Targets | TrainPace',
    description:
      '30K pace calculator. Convert a 30K time into marathon training paces and long-run targets (min/km or min/mile).',
    h1: '30K Pace Calculator',
    intro:
      'A 30K effort is a marathon-specific benchmark. Use it to sanity-check marathon pacing and long-run efforts.',
    bullets: [
      'Marathon-specific benchmark',
      'Long-run pacing guidance',
      'Training zones included',
    ],
    cta: { href: '/calculator', label: 'Open the Pace Calculator' },
    initialInputs: { distance: '30' },
  },
  {
    id: generatePageId('pace', 'km-to-mile-pace-converter'),
    slug: 'km-to-mile-pace-converter',
    tool: 'pace',
    path: '/calculator/km-to-mile-pace-converter',
    title: 'KM to Mile Pace Converter - min/km to min/mile | TrainPace',
    description:
      'Convert min/km to min/mile (and back). Use the TrainPace calculator to view all training paces in your preferred units.',
    h1: 'KM to Mile Pace Converter',
    intro:
      'Training plans often mix units. Use the calculator to view every pace in min/km or min/mile.',
    bullets: [
      'Instant unit conversion',
      'Training zones in your units',
      'Avoids conversion mistakes',
    ],
    cta: { href: '/calculator', label: 'Convert Paces' },
  },
  {
    id: generatePageId('pace', 'sub-20-5k-pace'),
    slug: 'sub-20-5k-pace',
    tool: 'pace',
    path: '/calculator/sub-20-5k-pace',
    title: 'Sub-20 5K Pace - Required Pace and Training Zones | TrainPace',
    description:
      'Sub-20 5K pace guide. See the pace required to break 20 minutes and generate training paces to build toward the goal.',
    h1: 'Sub-20 5K Pace',
    intro:
      'Breaking 20 minutes requires both aerobic support and speed. Use training zones to balance easy volume with quality workouts.',
    bullets: [
      'Know the goal pace',
      'Build training zones from current fitness',
      'Use interval/threshold targets',
    ],
    cta: { href: '/calculator', label: 'Calculate Your Training Paces' },
  },
  {
    id: generatePageId('pace', 'sub-90-half-marathon-pace'),
    slug: 'sub-90-half-marathon-pace',
    tool: 'pace',
    path: '/calculator/sub-90-half-marathon-pace',
    title: 'Sub-90 Half Marathon Pace - Required Pace and Training Zones | TrainPace',
    description:
      'Sub-90 half marathon pace guide. See the required pace to break 1:30 and generate training paces to support the goal.',
    h1: 'Sub-90 Half Marathon Pace',
    intro:
      'A sub-90 half is a classic benchmark. Use threshold and tempo work plus consistent easy mileage to build toward it.',
    bullets: [
      'Know the required pace',
      'Train with threshold/tempo targets',
      'Keep easy days truly easy',
    ],
    cta: { href: '/calculator', label: 'Calculate Training Paces' },
  },
  {
    id: generatePageId('pace', 'sub-4-marathon-pace'),
    slug: 'sub-4-marathon-pace',
    tool: 'pace',
    path: '/calculator/sub-4-marathon-pace',
    title: 'Sub-4 Marathon Pace - Required Pace and Training Zones | TrainPace',
    description:
      'Sub-4 marathon pace guide. See the pace needed to break 4 hours and generate training paces for long runs, tempo, and threshold workouts.',
    h1: 'Sub-4 Marathon Pace',
    intro:
      'Breaking 4 is about endurance and discipline. Use training zones to build volume while keeping workouts appropriately controlled.',
    bullets: [
      'Know the required pace',
      'Long-run targets',
      'Fueling and course planning',
    ],
    cta: { href: '/calculator', label: 'Calculate Training Paces' },
  },

  // ==========================================================================
  // Marathon Time Goal Pages
  // ==========================================================================
  {
    id: generatePageId('pace', 'sub-3-marathon-pace'),
    slug: 'sub-3-marathon-pace',
    tool: 'pace',
    path: '/calculator/sub-3-marathon-pace',
    title: 'Sub-3 Hour Marathon Pace - Training Plan + Pace Chart | TrainPace',
    description:
      'Sub-3 marathon pace guide. Required pace is 4:16/km (6:52/mi). Get training zones, workout targets, and pacing strategy to break 3 hours.',
    h1: 'Sub-3 Hour Marathon Pace',
    intro:
      'Breaking 3 hours requires 4:16/km (6:52/mi) pace. This is an elite amateur goal that demands consistent training, smart pacing, and precise execution.',
    bullets: [
      'Required pace: 4:16/km or 6:52/mile',
      'Training zones for sub-3 fitness',
      'Pacing strategy and fueling tips',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-3 Training Paces' },
    initialInputs: { distance: '42.195' },
    faq: [
      {
        question: 'What pace do I need to run sub-3?',
        answer:
          'You need to average 4:16/km (6:52/mile) or faster. Most successful sub-3 runners aim for 4:14-4:15/km to build in a small buffer.',
      },
      {
        question: 'How hard is it to run a sub-3 marathon?',
        answer:
          'Very hard. Only about 4% of male marathon finishers and less than 1% of female finishers break 3 hours. It requires consistent training of 80-100+ km/week for most runners.',
      },
      {
        question: 'What 5K or 10K time predicts sub-3?',
        answer:
          'A sub-18:30 5K or sub-38:00 10K suggests sub-3 marathon potential. A sub-1:25 half marathon is an even better predictor.',
      },
    ],
    howTo: {
      name: 'How to train for a sub-3 marathon',
      description:
        'Build the fitness and pacing skills to break 3 hours in the marathon.',
      steps: [
        { name: 'Build your base', text: 'Establish 80-100+ km weekly volume with mostly easy running.' },
        { name: 'Add quality workouts', text: 'Include tempo runs at 4:00-4:05/km and long runs with marathon pace segments.' },
        { name: 'Practice race pace', text: 'Run portions of long runs at 4:16/km to lock in the feel.' },
        { name: 'Execute on race day', text: 'Start at 4:16-4:17/km, stay patient, and negative split if possible.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'sub-3-15-marathon-pace'),
    slug: 'sub-3-15-marathon-pace',
    tool: 'pace',
    path: '/calculator/sub-3-15-marathon-pace',
    title: 'Sub-3:15 Marathon Pace - Required Pace + Training Zones | TrainPace',
    description:
      'Sub-3:15 marathon pace guide. Required pace is 4:37/km (7:26/mi). Get training zones and workout targets to break 3 hours 15 minutes.',
    h1: 'Sub-3:15 Marathon Pace',
    intro:
      'Breaking 3:15 requires 4:37/km (7:26/mi) pace. This is a Boston Qualifying time for many age groups and a strong amateur achievement.',
    bullets: [
      'Required pace: 4:37/km or 7:26/mile',
      'Boston Qualifier for many age groups',
      'Training zones for sub-3:15 fitness',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-3:15 Training Paces' },
    initialInputs: { distance: '42.195', hours: '3', minutes: '14', seconds: '59' },
    faq: [
      {
        question: 'What pace do I need for sub-3:15?',
        answer:
          'You need to average 4:37/km (7:26/mile) or faster. Aim for 4:35/km to build in a small cushion.',
      },
      {
        question: 'Is sub-3:15 a Boston Qualifier?',
        answer:
          'Yes, for many age groups. Sub-3:15 qualifies men 45-49 and women 18-34 (with additional buffer time often needed).',
      },
      {
        question: 'What half marathon predicts sub-3:15?',
        answer:
          'A sub-1:32 half marathon suggests you have sub-3:15 marathon potential with proper marathon-specific training.',
      },
    ],
    howTo: {
      name: 'How to train for a sub-3:15 marathon',
      description:
        'Build fitness to break 3:15 in the marathon.',
      steps: [
        { name: 'Build mileage', text: 'Target 65-85 km/week with most runs at easy pace.' },
        { name: 'Add tempo work', text: 'Run tempo efforts at 4:20-4:25/km to build threshold.' },
        { name: 'Long runs with pace work', text: 'Include marathon pace segments in your long runs.' },
        { name: 'Race smart', text: 'Start conservatively and execute even splits.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'sub-3-30-marathon-pace'),
    slug: 'sub-3-30-marathon-pace',
    tool: 'pace',
    path: '/calculator/sub-3-30-marathon-pace',
    title: 'Sub-3:30 Marathon Pace - Required Pace + Training Zones | TrainPace',
    description:
      'Sub-3:30 marathon pace guide. Required pace is 4:59/km (8:02/mi). Get training zones and pacing strategy to break 3 hours 30 minutes.',
    h1: 'Sub-3:30 Marathon Pace',
    intro:
      'Breaking 3:30 requires just under 5:00/km (8:02/mi) pace. This is a popular goal and Boston Qualifier for several age groups.',
    bullets: [
      'Required pace: 4:59/km or 8:02/mile',
      'Popular BQ time for many age groups',
      'Achievable with consistent training',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-3:30 Training Paces' },
    initialInputs: { distance: '42.195', hours: '3', minutes: '29', seconds: '59' },
    faq: [
      {
        question: 'What pace is needed for sub-3:30?',
        answer:
          'You need to average 4:59/km (8:02/mile). Aim for 4:57/km to have a small buffer.',
      },
      {
        question: 'How many miles per week for sub-3:30?',
        answer:
          'Most runners need 50-70 km (30-45 miles) per week minimum. Quality matters as much as quantity.',
      },
      {
        question: 'What half marathon predicts sub-3:30?',
        answer:
          'A sub-1:40 half marathon indicates sub-3:30 potential. A 1:35-1:38 half gives you a comfortable buffer.',
      },
    ],
    howTo: {
      name: 'How to train for a sub-3:30 marathon',
      description:
        'Build the endurance and speed to break 3:30.',
      steps: [
        { name: 'Consistent mileage', text: 'Build to 50-70 km/week over several months.' },
        { name: 'Weekly long run', text: 'Progress long runs to 32-35 km, some with marathon pace.' },
        { name: 'Tempo workouts', text: 'Run 20-30 minute tempo efforts at 4:40-4:50/km.' },
        { name: 'Practice pacing', text: 'Know what 4:59/km feels like before race day.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'sub-3-45-marathon-pace'),
    slug: 'sub-3-45-marathon-pace',
    tool: 'pace',
    path: '/calculator/sub-3-45-marathon-pace',
    title: 'Sub-3:45 Marathon Pace - Required Pace + Training Zones | TrainPace',
    description:
      'Sub-3:45 marathon pace guide. Required pace is 5:20/km (8:35/mi). Get training zones and strategy to break 3 hours 45 minutes.',
    h1: 'Sub-3:45 Marathon Pace',
    intro:
      'Breaking 3:45 requires 5:20/km (8:35/mi) pace. This is an achievable goal for dedicated recreational runners.',
    bullets: [
      'Required pace: 5:20/km or 8:35/mile',
      'Achievable intermediate goal',
      'Stepping stone to sub-3:30',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-3:45 Training Paces' },
    initialInputs: { distance: '42.195', hours: '3', minutes: '44', seconds: '59' },
    faq: [
      {
        question: 'What pace for sub-3:45 marathon?',
        answer:
          'Average 5:20/km (8:35/mile) or faster. Target 5:18/km for a small buffer.',
      },
      {
        question: 'What half marathon time predicts sub-3:45?',
        answer:
          'A sub-1:47 half marathon suggests sub-3:45 potential. Around 1:42-1:45 gives comfortable fitness.',
      },
    ],
    howTo: {
      name: 'How to run a sub-3:45 marathon',
      description:
        'Training approach to break 3:45 in the marathon.',
      steps: [
        { name: 'Build base', text: 'Run 40-60 km/week consistently for 3-4 months.' },
        { name: 'Long runs', text: 'Progress to 28-32 km long runs.' },
        { name: 'Quality sessions', text: 'Include tempo and marathon pace work weekly.' },
        { name: 'Race execution', text: 'Start at goal pace, fuel consistently, finish strong.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'sub-4-30-marathon-pace'),
    slug: 'sub-4-30-marathon-pace',
    tool: 'pace',
    path: '/calculator/sub-4-30-marathon-pace',
    title: 'Sub-4:30 Marathon Pace - Required Pace + Training Zones | TrainPace',
    description:
      'Sub-4:30 marathon pace guide. Required pace is 6:24/km (10:18/mi). Training zones and pacing strategy for your first or fastest marathon.',
    h1: 'Sub-4:30 Marathon Pace',
    intro:
      'Breaking 4:30 requires 6:24/km (10:18/mi) pace. This is an excellent goal for intermediate marathoners.',
    bullets: [
      'Required pace: 6:24/km or 10:18/mile',
      'Great intermediate goal',
      'Focus on fueling and pacing',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-4:30 Training Paces' },
    initialInputs: { distance: '42.195', hours: '4', minutes: '29', seconds: '59' },
    faq: [
      {
        question: 'What pace for sub-4:30?',
        answer:
          'Average 6:24/km (10:18/mile). Give yourself a buffer by targeting 6:20/km.',
      },
      {
        question: 'Is sub-4:30 a good marathon time?',
        answer:
          'Yes! Sub-4:30 puts you in the top half of marathon finishers and shows solid endurance fitness.',
      },
    ],
    howTo: {
      name: 'How to run a sub-4:30 marathon',
      description:
        'Training and race strategy for sub-4:30.',
      steps: [
        { name: 'Build consistency', text: 'Run 4-5 days per week for several months.' },
        { name: 'Long runs', text: 'Build up to 25-30 km long runs.' },
        { name: 'Practice fueling', text: 'Take gels every 30-45 minutes in training.' },
        { name: 'Pace yourself', text: 'Start conservatively and stay consistent.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'sub-5-marathon-pace'),
    slug: 'sub-5-marathon-pace',
    tool: 'pace',
    path: '/calculator/sub-5-marathon-pace',
    title: 'Sub-5 Hour Marathon Pace - Required Pace + Training Plan | TrainPace',
    description:
      'Sub-5 marathon pace guide. Required pace is 7:07/km (11:27/mi). Training zones and tips to break 5 hours in your marathon.',
    h1: 'Sub-5 Hour Marathon Pace',
    intro:
      'Breaking 5 hours requires 7:07/km (11:27/mi) pace. This is a great first marathon goal that\'s achievable with proper training.',
    bullets: [
      'Required pace: 7:07/km or 11:27/mile',
      'Great first marathon goal',
      'Focus on finishing strong',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-5 Training Paces' },
    initialInputs: { distance: '42.195', hours: '4', minutes: '59', seconds: '59' },
    faq: [
      {
        question: 'What pace for sub-5 marathon?',
        answer:
          'Average 7:07/km (11:27/mile). Target 7:00/km to build in a cushion.',
      },
      {
        question: 'Is sub-5 a good marathon time?',
        answer:
          'Absolutely! Finishing a marathon is an achievement. Sub-5 shows you trained properly and executed well.',
      },
      {
        question: 'How should I train for sub-5?',
        answer:
          'Focus on building endurance with long runs up to 25-28 km. Run most training at a comfortable, conversational pace.',
      },
    ],
    howTo: {
      name: 'How to run a sub-5 marathon',
      description:
        'Training approach for a sub-5 hour marathon.',
      steps: [
        { name: 'Build endurance', text: 'Run 4 days per week, gradually increasing long runs.' },
        { name: 'Stay consistent', text: 'Consistency matters more than speed.' },
        { name: 'Practice fueling', text: 'Learn to take gels and water during long runs.' },
        { name: 'Walk if needed', text: 'Planned walk breaks are fine - just keep moving forward.' },
      ],
    },
  },

  // ==========================================================================
  // Half Marathon Time Goal Pages
  // ==========================================================================
  {
    id: generatePageId('pace', 'sub-1-20-half-marathon-pace'),
    slug: 'sub-1-20-half-marathon-pace',
    tool: 'pace',
    path: '/calculator/sub-1-20-half-marathon-pace',
    title: 'Sub-1:20 Half Marathon Pace - Training Zones + Strategy | TrainPace',
    description:
      'Sub-1:20 half marathon pace guide. Required pace is 3:47/km (6:06/mi). Training zones and race strategy for elite amateur half marathon.',
    h1: 'Sub-1:20 Half Marathon Pace',
    intro:
      'Breaking 1:20 requires 3:47/km (6:06/mi) pace. This is a highly competitive time that demands serious training.',
    bullets: [
      'Required pace: 3:47/km or 6:06/mile',
      'Elite amateur achievement',
      'Requires high-volume training',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-1:20 Training Paces' },
    initialInputs: { distance: '21.0975', hours: '1', minutes: '19', seconds: '59' },
    faq: [
      {
        question: 'What pace for sub-1:20 half?',
        answer:
          'Average 3:47/km (6:06/mile). Most aim for 3:45-3:46/km to build a cushion.',
      },
      {
        question: 'What 5K predicts sub-1:20 half?',
        answer:
          'A sub-17:00 5K suggests sub-1:20 half marathon potential.',
      },
    ],
    howTo: {
      name: 'How to run a sub-1:20 half marathon',
      description:
        'Training for an elite amateur half marathon time.',
      steps: [
        { name: 'High mileage', text: 'Run 80-100+ km/week consistently.' },
        { name: 'Speed work', text: 'Include VO2max intervals and threshold work.' },
        { name: 'Race tactics', text: 'Even pacing with a strong final 5K.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'sub-1-30-half-marathon-pace'),
    slug: 'sub-1-30-half-marathon-pace',
    tool: 'pace',
    path: '/calculator/sub-1-30-half-marathon-pace',
    title: 'Sub-1:30 Half Marathon Pace - Training Zones + Plan | TrainPace',
    description:
      'Sub-1:30 half marathon pace guide. Required pace is 4:16/km (6:52/mi). Get training zones and race strategy to break 90 minutes.',
    h1: 'Sub-1:30 Half Marathon Pace',
    intro:
      'Breaking 90 minutes requires 4:16/km (6:52/mi) pace. This is a classic benchmark that requires dedicated training.',
    bullets: [
      'Required pace: 4:16/km or 6:52/mile',
      'Classic running milestone',
      'Requires consistent training',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-90 Training Paces' },
    initialInputs: { distance: '21.0975', hours: '1', minutes: '29', seconds: '59' },
    faq: [
      {
        question: 'What pace for sub-1:30 half?',
        answer:
          'Average 4:16/km (6:52/mile). Target 4:14/km for a small buffer.',
      },
      {
        question: 'What 10K predicts sub-1:30 half?',
        answer:
          'A sub-40:00 10K suggests sub-90 half marathon fitness.',
      },
      {
        question: 'How many miles per week for sub-90?',
        answer:
          'Most runners need 50-70 km (30-45 miles) weekly minimum with quality threshold work.',
      },
    ],
    howTo: {
      name: 'How to run a sub-90 half marathon',
      description:
        'Training approach to break 90 minutes.',
      steps: [
        { name: 'Build base', text: 'Run 50-70 km/week consistently.' },
        { name: 'Tempo work', text: 'Regular threshold runs at 4:05-4:10/km.' },
        { name: 'Long runs', text: 'Build to 18-22 km long runs with pace work.' },
        { name: 'Race execution', text: 'Even splits or slight negative split.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'sub-1-45-half-marathon-pace'),
    slug: 'sub-1-45-half-marathon-pace',
    tool: 'pace',
    path: '/calculator/sub-1-45-half-marathon-pace',
    title: 'Sub-1:45 Half Marathon Pace - Training Zones + Strategy | TrainPace',
    description:
      'Sub-1:45 half marathon pace guide. Required pace is 4:58/km (8:00/mi). Training zones and tips to break 1 hour 45 minutes.',
    h1: 'Sub-1:45 Half Marathon Pace',
    intro:
      'Breaking 1:45 requires just under 5:00/km (8:00/mi) pace. This is an achievable goal for dedicated recreational runners.',
    bullets: [
      'Required pace: 4:58/km or 8:00/mile',
      'Popular intermediate goal',
      'Stepping stone to sub-90',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-1:45 Training Paces' },
    initialInputs: { distance: '21.0975', hours: '1', minutes: '44', seconds: '59' },
    faq: [
      {
        question: 'What pace for sub-1:45 half?',
        answer:
          'Average 4:58/km (8:00/mile). Aim for 4:55/km for a comfortable buffer.',
      },
      {
        question: 'What 10K predicts sub-1:45 half?',
        answer:
          'A sub-47:00 10K indicates sub-1:45 half marathon potential.',
      },
    ],
    howTo: {
      name: 'How to run a sub-1:45 half marathon',
      description:
        'Training approach for sub-1:45.',
      steps: [
        { name: 'Consistent training', text: 'Run 4-5 days per week.' },
        { name: 'Build to 15-18 km long runs', text: 'Practice sustained running.' },
        { name: 'Add tempo work', text: 'Run 15-20 min tempos at 4:45/km.' },
        { name: 'Race smart', text: 'Start at goal pace and stay consistent.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'sub-2-hour-half-marathon-pace'),
    slug: 'sub-2-hour-half-marathon-pace',
    tool: 'pace',
    path: '/calculator/sub-2-hour-half-marathon-pace',
    title: 'Sub-2 Hour Half Marathon Pace - Training Plan + Tips | TrainPace',
    description:
      'Sub-2 hour half marathon pace guide. Required pace is 5:41/km (9:09/mi). Training zones and strategy to break 2 hours.',
    h1: 'Sub-2 Hour Half Marathon Pace',
    intro:
      'Breaking 2 hours requires 5:41/km (9:09/mi) pace. This is an excellent first half marathon goal.',
    bullets: [
      'Required pace: 5:41/km or 9:09/mile',
      'Great first half marathon goal',
      'Achievable with consistent training',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-2 Hour Training Paces' },
    initialInputs: { distance: '21.0975', hours: '1', minutes: '59', seconds: '59' },
    faq: [
      {
        question: 'What pace for sub-2 hour half?',
        answer:
          'Average 5:41/km (9:09/mile). Target 5:38/km for a small buffer.',
      },
      {
        question: 'Is sub-2 hour a good half marathon time?',
        answer:
          'Yes! Breaking 2 hours is a significant achievement and shows solid running fitness.',
      },
      {
        question: 'How should I train for sub-2?',
        answer:
          'Run 4-5 days per week, build long runs to 16-18 km, and practice running at goal pace.',
      },
    ],
    howTo: {
      name: 'How to run a sub-2 hour half marathon',
      description:
        'Training approach for sub-2 hours.',
      steps: [
        { name: 'Build endurance', text: 'Progress long runs to 16-18 km.' },
        { name: 'Consistent running', text: 'Run 4-5 days per week for several months.' },
        { name: 'Practice race pace', text: 'Know what 5:41/km feels like.' },
        { name: 'Start conservative', text: 'Better to speed up late than slow down.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'sub-2-15-half-marathon-pace'),
    slug: 'sub-2-15-half-marathon-pace',
    tool: 'pace',
    path: '/calculator/sub-2-15-half-marathon-pace',
    title: 'Sub-2:15 Half Marathon Pace - Training Zones + Tips | TrainPace',
    description:
      'Sub-2:15 half marathon pace guide. Required pace is 6:24/km (10:18/mi). Training zones for intermediate half marathon runners.',
    h1: 'Sub-2:15 Half Marathon Pace',
    intro:
      'Breaking 2:15 requires 6:24/km (10:18/mi) pace. This is a great intermediate goal before targeting sub-2.',
    bullets: [
      'Required pace: 6:24/km or 10:18/mile',
      'Good intermediate target',
      'Stepping stone to sub-2',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-2:15 Training Paces' },
    initialInputs: { distance: '21.0975', hours: '2', minutes: '14', seconds: '59' },
    faq: [
      {
        question: 'What pace for sub-2:15 half?',
        answer:
          'Average 6:24/km (10:18/mile). Target 6:20/km for a buffer.',
      },
      {
        question: 'Is sub-2:15 a good beginner goal?',
        answer:
          'Yes! For newer runners, sub-2:15 is an achievable first half marathon goal.',
      },
    ],
    howTo: {
      name: 'How to run a sub-2:15 half marathon',
      description:
        'Training approach for sub-2:15.',
      steps: [
        { name: 'Build base', text: 'Run consistently 3-4 days per week.' },
        { name: 'Long runs', text: 'Build up to 14-16 km long runs.' },
        { name: 'Stay consistent', text: 'Consistency matters more than speed.' },
        { name: 'Race your pace', text: 'Start at 6:24/km and hold steady.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'sub-2-30-half-marathon-pace'),
    slug: 'sub-2-30-half-marathon-pace',
    tool: 'pace',
    path: '/calculator/sub-2-30-half-marathon-pace',
    title: 'Sub-2:30 Half Marathon Pace - Training Plan + Tips | TrainPace',
    description:
      'Sub-2:30 half marathon pace guide. Required pace is 7:07/km (11:27/mi). Training tips for completing your first half marathon strong.',
    h1: 'Sub-2:30 Half Marathon Pace',
    intro:
      'Breaking 2:30 requires 7:07/km (11:27/mi) pace. This is a realistic first half marathon goal.',
    bullets: [
      'Required pace: 7:07/km or 11:27/mile',
      'Great first half marathon goal',
      'Focus on finishing strong',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-2:30 Training Paces' },
    initialInputs: { distance: '21.0975', hours: '2', minutes: '29', seconds: '59' },
    faq: [
      {
        question: 'What pace for sub-2:30 half?',
        answer:
          'Average 7:07/km (11:27/mile). Give yourself cushion with 7:00/km.',
      },
      {
        question: 'Can I walk and still break 2:30?',
        answer:
          'Short walk breaks are fine. Use a run-walk strategy (run 4-5 min, walk 1 min) if needed.',
      },
    ],
    howTo: {
      name: 'How to run a sub-2:30 half marathon',
      description:
        'Training approach for sub-2:30.',
      steps: [
        { name: 'Build slowly', text: 'Start running 3 days per week.' },
        { name: 'Long runs', text: 'Build up to 12-14 km long runs.' },
        { name: 'Run-walk is okay', text: 'Use walk breaks if they help you go farther.' },
        { name: 'Pace yourself', text: 'Start easy and finish strong.' },
      ],
    },
  },

  // ==========================================================================
  // 5K Time Goal Pages
  // ==========================================================================
  {
    id: generatePageId('pace', 'sub-18-5k-pace'),
    slug: 'sub-18-5k-pace',
    tool: 'pace',
    path: '/calculator/sub-18-5k-pace',
    title: 'Sub-18 Minute 5K Pace - Training Plan + Workouts | TrainPace',
    description:
      'Sub-18 5K pace guide. Required pace is 3:36/km (5:47/mi). Training zones and interval workouts to break 18 minutes.',
    h1: 'Sub-18 Minute 5K Pace',
    intro:
      'Breaking 18 minutes requires 3:36/km (5:47/mi) pace. This is a competitive goal that requires speed work and race experience.',
    bullets: [
      'Required pace: 3:36/km or 5:47/mile',
      'Competitive club-level time',
      'Requires structured speed work',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-18 Training Paces' },
    initialInputs: { distance: '5', minutes: '17', seconds: '59' },
    faq: [
      {
        question: 'What pace for sub-18 5K?',
        answer:
          'Average 3:36/km (5:47/mile). Most aim for 3:34-3:35/km to have a buffer.',
      },
      {
        question: 'How do I train for sub-18?',
        answer:
          'Combine interval training (400m-1000m repeats), tempo runs, and easy mileage. Volume of 50-70 km/week typically needed.',
      },
    ],
    howTo: {
      name: 'How to run a sub-18 5K',
      description:
        'Training approach for sub-18 minutes.',
      steps: [
        { name: 'Build aerobic base', text: 'Run 50+ km/week with mostly easy running.' },
        { name: 'Interval training', text: 'Run 400m-1K repeats at faster than race pace.' },
        { name: 'Tempo runs', text: 'Regular threshold work at 3:50-4:00/km.' },
        { name: 'Race tactics', text: 'Even pacing or slight negative split.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'sub-25-5k-pace'),
    slug: 'sub-25-5k-pace',
    tool: 'pace',
    path: '/calculator/sub-25-5k-pace',
    title: 'Sub-25 Minute 5K Pace - Training Plan + Tips | TrainPace',
    description:
      'Sub-25 5K pace guide. Required pace is 5:00/km (8:03/mi). Training zones and tips to break 25 minutes in the 5K.',
    h1: 'Sub-25 Minute 5K Pace',
    intro:
      'Breaking 25 minutes requires exactly 5:00/km (8:03/mi) pace. This is a satisfying milestone for recreational runners.',
    bullets: [
      'Required pace: 5:00/km or 8:03/mile',
      'Popular recreational milestone',
      'Achievable with consistent training',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-25 Training Paces' },
    initialInputs: { distance: '5', minutes: '24', seconds: '59' },
    faq: [
      {
        question: 'What pace for sub-25 5K?',
        answer:
          'Average 5:00/km (8:03/mile). Target 4:55/km for a comfortable cushion.',
      },
      {
        question: 'How long to get to sub-25?',
        answer:
          'Varies by starting fitness. Many runners can achieve sub-25 within 3-6 months of consistent training.',
      },
    ],
    howTo: {
      name: 'How to run a sub-25 5K',
      description:
        'Training approach for sub-25 minutes.',
      steps: [
        { name: 'Run consistently', text: 'Run 3-4 days per week.' },
        { name: 'Add one faster run', text: 'Include intervals or tempo once per week.' },
        { name: 'Build to 8-10 km long runs', text: 'Endurance helps speed.' },
        { name: 'Practice race pace', text: 'Know what 5:00/km feels like.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'sub-30-5k-pace'),
    slug: 'sub-30-5k-pace',
    tool: 'pace',
    path: '/calculator/sub-30-5k-pace',
    title: 'Sub-30 Minute 5K Pace - Training Plan + Tips | TrainPace',
    description:
      'Sub-30 5K pace guide. Required pace is 6:00/km (9:39/mi). Training tips to break 30 minutes in your first 5K.',
    h1: 'Sub-30 Minute 5K Pace',
    intro:
      'Breaking 30 minutes requires 6:00/km (9:39/mi) pace. This is an excellent first 5K goal.',
    bullets: [
      'Required pace: 6:00/km or 9:39/mile',
      'Great first 5K goal',
      'Focus on consistent running',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-30 Training Paces' },
    initialInputs: { distance: '5', minutes: '29', seconds: '59' },
    faq: [
      {
        question: 'What pace for sub-30 5K?',
        answer:
          'Average 6:00/km (9:39/mile). Aim for 5:55/km for a small buffer.',
      },
      {
        question: 'Is sub-30 a good 5K time?',
        answer:
          'Yes! Breaking 30 minutes is a meaningful achievement for beginner runners.',
      },
    ],
    howTo: {
      name: 'How to run a sub-30 5K',
      description:
        'Training approach for sub-30 minutes.',
      steps: [
        { name: 'Run regularly', text: 'Run 3 days per week.' },
        { name: 'Build up to running 5K', text: 'Use run-walk intervals if needed.' },
        { name: 'Gradually increase pace', text: 'As fitness improves, speed follows.' },
        { name: 'Run your own race', text: 'Don\'t go out too fast.' },
      ],
    },
  },

  // ==========================================================================
  // 10K Time Goal Pages
  // ==========================================================================
  {
    id: generatePageId('pace', 'sub-40-10k-pace'),
    slug: 'sub-40-10k-pace',
    tool: 'pace',
    path: '/calculator/sub-40-10k-pace',
    title: 'Sub-40 Minute 10K Pace - Training Plan + Workouts | TrainPace',
    description:
      'Sub-40 10K pace guide. Required pace is 4:00/km (6:26/mi). Training zones and workouts to break 40 minutes.',
    h1: 'Sub-40 Minute 10K Pace',
    intro:
      'Breaking 40 minutes requires 4:00/km (6:26/mi) pace. This is a competitive time that requires dedicated training.',
    bullets: [
      'Required pace: 4:00/km or 6:26/mile',
      'Competitive club-level time',
      'Requires structured training',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-40 Training Paces' },
    initialInputs: { distance: '10', minutes: '39', seconds: '59' },
    faq: [
      {
        question: 'What pace for sub-40 10K?',
        answer:
          'Average 4:00/km (6:26/mile). Aim for 3:58/km for a buffer.',
      },
      {
        question: 'What 5K predicts sub-40 10K?',
        answer:
          'A sub-19:00 5K suggests sub-40 10K potential.',
      },
    ],
    howTo: {
      name: 'How to run a sub-40 10K',
      description:
        'Training approach for sub-40 minutes.',
      steps: [
        { name: 'Build mileage', text: 'Run 50-70 km/week consistently.' },
        { name: 'Tempo work', text: 'Regular tempo runs at 3:50-3:55/km.' },
        { name: 'Intervals', text: 'Include 1K repeats at 3:45-3:50/km.' },
        { name: 'Race smart', text: 'Even pacing throughout.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'sub-45-10k-pace'),
    slug: 'sub-45-10k-pace',
    tool: 'pace',
    path: '/calculator/sub-45-10k-pace',
    title: 'Sub-45 Minute 10K Pace - Training Plan + Tips | TrainPace',
    description:
      'Sub-45 10K pace guide. Required pace is 4:30/km (7:15/mi). Training zones to break 45 minutes in the 10K.',
    h1: 'Sub-45 Minute 10K Pace',
    intro:
      'Breaking 45 minutes requires 4:30/km (7:15/mi) pace. This is a great intermediate goal.',
    bullets: [
      'Required pace: 4:30/km or 7:15/mile',
      'Popular intermediate milestone',
      'Stepping stone to sub-40',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-45 Training Paces' },
    initialInputs: { distance: '10', minutes: '44', seconds: '59' },
    faq: [
      {
        question: 'What pace for sub-45 10K?',
        answer:
          'Average 4:30/km (7:15/mile). Target 4:27/km for a small buffer.',
      },
      {
        question: 'What 5K predicts sub-45 10K?',
        answer:
          'A sub-21:30 5K suggests sub-45 10K potential.',
      },
    ],
    howTo: {
      name: 'How to run a sub-45 10K',
      description:
        'Training approach for sub-45.',
      steps: [
        { name: 'Run 4-5 days/week', text: 'Build consistent training habits.' },
        { name: 'One tempo run weekly', text: 'Run 15-20 min at 4:20/km.' },
        { name: 'Long runs', text: 'Build to 14-16 km long runs.' },
        { name: 'Practice race pace', text: 'Know what 4:30/km feels like.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'sub-50-10k-pace'),
    slug: 'sub-50-10k-pace',
    tool: 'pace',
    path: '/calculator/sub-50-10k-pace',
    title: 'Sub-50 Minute 10K Pace - Training Plan + Tips | TrainPace',
    description:
      'Sub-50 10K pace guide. Required pace is 5:00/km (8:03/mi). Training zones and tips to break 50 minutes.',
    h1: 'Sub-50 Minute 10K Pace',
    intro:
      'Breaking 50 minutes requires exactly 5:00/km (8:03/mi) pace. This is an excellent goal for recreational runners.',
    bullets: [
      'Required pace: 5:00/km or 8:03/mile',
      'Popular recreational milestone',
      'Achievable with consistent training',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-50 Training Paces' },
    initialInputs: { distance: '10', minutes: '49', seconds: '59' },
    faq: [
      {
        question: 'What pace for sub-50 10K?',
        answer:
          'Average 5:00/km (8:03/mile). Target 4:55/km for a comfortable buffer.',
      },
      {
        question: 'What 5K predicts sub-50 10K?',
        answer:
          'A sub-24:00 5K suggests sub-50 10K potential.',
      },
    ],
    howTo: {
      name: 'How to run a sub-50 10K',
      description:
        'Training approach for sub-50.',
      steps: [
        { name: 'Run consistently', text: 'Run 3-4 days per week.' },
        { name: 'Build to 12 km long runs', text: 'Endurance helps speed.' },
        { name: 'One faster run weekly', text: 'Include tempo or intervals.' },
        { name: 'Start conservatively', text: 'Even pacing is key.' },
      ],
    },
  },
  {
    id: generatePageId('pace', 'sub-60-10k-pace'),
    slug: 'sub-60-10k-pace',
    tool: 'pace',
    path: '/calculator/sub-60-10k-pace',
    title: 'Sub-60 Minute 10K Pace - Training Plan + Tips | TrainPace',
    description:
      'Sub-60 10K pace guide. Required pace is 6:00/km (9:39/mi). Training tips to break 1 hour in the 10K.',
    h1: 'Sub-60 Minute 10K Pace',
    intro:
      'Breaking 60 minutes requires 6:00/km (9:39/mi) pace. This is a great first 10K goal.',
    bullets: [
      'Required pace: 6:00/km or 9:39/mile',
      'Great first 10K goal',
      'Focus on consistent running',
    ],
    cta: { href: '/calculator', label: 'Calculate Sub-60 Training Paces' },
    initialInputs: { distance: '10', minutes: '59', seconds: '59' },
    faq: [
      {
        question: 'What pace for sub-60 10K?',
        answer:
          'Average 6:00/km (9:39/mile). Target 5:55/km for a small buffer.',
      },
      {
        question: 'Is sub-60 a good 10K time?',
        answer:
          'Yes! Breaking an hour is a meaningful achievement for beginner to intermediate runners.',
      },
    ],
    howTo: {
      name: 'How to run a sub-60 10K',
      description:
        'Training approach for sub-60.',
      steps: [
        { name: 'Build endurance', text: 'Run 3 days per week consistently.' },
        { name: 'Progress slowly', text: 'Add distance gradually each week.' },
        { name: 'Practice 10K distance', text: 'Run at least one 10K before race day.' },
        { name: 'Pace yourself', text: 'Start at 6:00/km and hold steady.' },
      ],
    },
  },
];

// =============================================================================
// Race SEO Pages - Factory Function
// =============================================================================

function makeRacePage(
  raceName: string,
  slug: string,
  previewRouteKey?: string
): SeoPageConfig {
  return {
    id: generatePageId('race', slug),
    slug,
    tool: 'race',
    path: `/race/${slug}`,
    title: `${raceName} Race Prep - Pace, Fueling, and Course Strategy | TrainPace`,
    description: `${raceName} race prep: set training paces from your goal time, build a fueling plan, and analyze the course elevation. Free running tools for self-coached runners.`,
    h1: `${raceName} Race Prep`,
    intro:
      `Use TrainPace to plan a simple, repeatable strategy for ${raceName}: pacing targets, fueling basics, and course/elevation awareness.`,
    bullets: [
      'Pace calculator: training zones + race pace',
      'Fuel planner: carbs/hour + gel timing',
      'Elevation analysis: hills, grades, and difficulty',
    ],
    cta: { href: '/calculator', label: 'Start With Pacing' },
    previewRouteKey,
    howTo: {
      name: `How to prepare for ${raceName}`,
      description:
        `Plan pacing, fueling, and course strategy for ${raceName} using free calculators and GPX elevation analysis.`,
      steps: [
        {
          name: 'Pick a realistic goal time',
          text: 'Use a recent race result or time trial to set a starting point.',
        },
        {
          name: 'Set training paces',
          text: 'Calculate easy, tempo, threshold, and interval paces for your training block.',
        },
        {
          name: 'Build a fueling plan',
          text: 'Estimate carbs/hour and gel timing that you can practice in long runs.',
        },
        {
          name: 'Review course elevation',
          text: 'Upload a GPX to spot key climbs and decide where to adjust effort.',
        },
      ],
    },
  };
}

export const raceSeoPages: SeoPageConfig[] = [
  // Marathon majors + big-city marathons
  makeRacePage('Boston Marathon', 'boston-marathon', 'boston'),
  makeRacePage('New York City Marathon', 'nyc-marathon', 'nyc'),
  makeRacePage('Chicago Marathon', 'chicago-marathon', 'chicago'),
  makeRacePage('Berlin Marathon', 'berlin-marathon', 'berlin'),
  makeRacePage('London Marathon', 'london-marathon', 'london'),
  makeRacePage('Tokyo Marathon', 'tokyo-marathon', 'tokyo'),
  makeRacePage('Sydney Marathon', 'sydney-marathon', 'sydney'),
  makeRacePage('Paris Marathon', 'paris-marathon', 'paris'),
  makeRacePage('Amsterdam Marathon', 'amsterdam-marathon', 'amsterdam'),
  makeRacePage('Valencia Marathon', 'valencia-marathon', 'valencia'),
  makeRacePage('Barcelona Marathon', 'barcelona-marathon'),
  makeRacePage('Rome Marathon', 'rome-marathon'),
  makeRacePage('Vienna City Marathon', 'vienna-city-marathon'),
  makeRacePage('Prague Marathon', 'prague-marathon'),
  makeRacePage('Dublin Marathon', 'dublin-marathon'),
  makeRacePage('Edinburgh Marathon', 'edinburgh-marathon'),
  makeRacePage('Copenhagen Marathon', 'copenhagen-marathon'),
  makeRacePage('Stockholm Marathon', 'stockholm-marathon'),
  makeRacePage('Oslo Marathon', 'oslo-marathon', 'oslo'),
  makeRacePage('Helsinki Marathon', 'helsinki-marathon'),
  makeRacePage('Athens Marathon', 'athens-marathon'),
  makeRacePage('Istanbul Marathon', 'istanbul-marathon'),
  makeRacePage('Dubai Marathon', 'dubai-marathon'),
  makeRacePage('Seoul Marathon', 'seoul-marathon'),
  makeRacePage('Singapore Marathon', 'singapore-marathon'),
  makeRacePage('Shanghai Marathon', 'shanghai-marathon'),
  makeRacePage('Osaka Marathon', 'osaka-marathon'),
  makeRacePage('Nagoya Womens Marathon', 'nagoya-womens-marathon'),
  makeRacePage('Fukuoka Marathon', 'fukuoka-marathon'),
  makeRacePage('Honolulu Marathon', 'honolulu-marathon'),
  makeRacePage('Los Angeles Marathon', 'los-angeles-marathon'),
  makeRacePage('San Francisco Marathon', 'san-francisco-marathon'),
  makeRacePage('Seattle Marathon', 'seattle-marathon'),
  makeRacePage('Portland Marathon', 'portland-marathon'),
  makeRacePage('Houston Marathon', 'houston-marathon'),
  makeRacePage('Austin Marathon', 'austin-marathon'),
  makeRacePage('Miami Marathon', 'miami-marathon'),
  makeRacePage('Philadelphia Marathon', 'philadelphia-marathon'),
  makeRacePage('Marine Corps Marathon', 'marine-corps-marathon', 'marine-corps'),
  makeRacePage('Twin Cities Marathon', 'twin-cities-marathon'),
  makeRacePage('Detroit Free Press Marathon', 'detroit-marathon'),
  makeRacePage('Indianapolis Monumental Marathon', 'indianapolis-monumental-marathon'),
  makeRacePage('California International Marathon', 'california-international-marathon', 'california-international'),
  makeRacePage('Big Sur International Marathon', 'big-sur-marathon', 'big-sur'),
  makeRacePage('Grandmas Marathon', 'grandmas-marathon'),
  makeRacePage('St George Marathon', 'st-george-marathon'),
  makeRacePage('Reykjavik Marathon', 'reykjavik-marathon'),
  makeRacePage('Cape Town Marathon', 'cape-town-marathon'),
  makeRacePage('Johannesburg Marathon', 'johannesburg-marathon'),
  makeRacePage('Buenos Aires Marathon', 'buenos-aires-marathon'),
  makeRacePage('Rio de Janeiro Marathon', 'rio-marathon'),
  makeRacePage('Toronto Waterfront Marathon', 'toronto-waterfront-marathon'),
  makeRacePage('Vancouver Marathon', 'vancouver-marathon'),
  makeRacePage('Ottawa Marathon', 'ottawa-marathon'),
  makeRacePage('Montreal Marathon', 'montreal-marathon'),
  makeRacePage('Rotterdam Marathon', 'rotterdam-marathon', 'rotterdam'),
  makeRacePage('Manchester Marathon', 'manchester-marathon'),
  makeRacePage('Brighton Marathon', 'brighton-marathon'),
  makeRacePage('Geneva Marathon', 'geneva-marathon'),
  makeRacePage('Zurich Marathon', 'zurich-marathon'),
  makeRacePage('Venice Marathon', 'venice-marathon'),
  makeRacePage('Florence Marathon', 'florence-marathon'),
  makeRacePage('Naples Marathon', 'naples-marathon'),
  makeRacePage('Brussels Marathon', 'brussels-marathon'),
  makeRacePage('Bruges Marathon', 'bruges-marathon'),
  makeRacePage('Rotterdam Half Marathon', 'rotterdam-half'),
  makeRacePage('New Orleans Marathon', 'new-orleans-marathon'),
  makeRacePage('Savannah Marathon', 'savannah-marathon'),
  makeRacePage('Charleston Marathon', 'charleston-marathon'),
  makeRacePage('Nashville Marathon', 'nashville-marathon'),
  makeRacePage('Atlanta Marathon', 'atlanta-marathon'),
  makeRacePage('Phoenix Marathon', 'phoenix-marathon'),
  makeRacePage('Mesa Marathon', 'mesa-marathon'),
  makeRacePage('Tucson Marathon', 'tucson-marathon'),
  makeRacePage('Jacksonville Marathon', 'jacksonville-marathon'),
  makeRacePage('St Louis Marathon', 'st-louis-marathon'),
  makeRacePage('Kansas City Marathon', 'kansas-city-marathon'),
  makeRacePage('Cleveland Marathon', 'cleveland-marathon'),
  makeRacePage('Pittsburgh Marathon', 'pittsburgh-marathon'),
  makeRacePage('Richmond Marathon', 'richmond-marathon'),
  makeRacePage('Newport Marathon', 'newport-marathon'),
  makeRacePage('Providence Marathon', 'providence-marathon'),
  makeRacePage('Salt Lake City Marathon', 'salt-lake-city-marathon'),
  makeRacePage('Denver Colfax Marathon', 'denver-colfax-marathon'),

  // Popular half marathons
  makeRacePage('NYC Half', 'nyc-half'),
  makeRacePage('Brooklyn Half', 'brooklyn-half'),
  makeRacePage('Houston Half Marathon', 'houston-half-marathon'),
  makeRacePage('Austin Half Marathon', 'austin-half-marathon'),
  makeRacePage('Philadelphia Half Marathon', 'philadelphia-half-marathon'),
  makeRacePage('Chicago Half Marathon', 'chicago-half-marathon'),
  makeRacePage('San Francisco Half Marathon', 'san-francisco-half-marathon'),
  makeRacePage('RBC Brooklyn Half', 'rbc-brooklyn-half'),
  makeRacePage('Rock n Roll Las Vegas Half', 'las-vegas-half'),
  makeRacePage('Rock n Roll Nashville Half', 'nashville-half'),
  makeRacePage('Rock n Roll San Diego Half', 'san-diego-half'),
  makeRacePage('DC Half Marathon', 'dc-half'),
  makeRacePage('Copenhagen Half Marathon', 'copenhagen-half'),
  makeRacePage('Barcelona Half Marathon', 'barcelona-half'),
  makeRacePage('Paris Half Marathon', 'paris-half'),
  makeRacePage('Berlin Half Marathon', 'berlin-half'),
  makeRacePage('Lisbon Half Marathon', 'lisbon-half'),
  makeRacePage('Dublin Half Marathon', 'dublin-half'),
  makeRacePage('Edinburgh Half Marathon', 'edinburgh-half'),
  makeRacePage('Amsterdam Half Marathon', 'amsterdam-half'),
  makeRacePage('Valencia Half Marathon', 'valencia-half'),
  makeRacePage('Cairns Half Marathon', 'cairns-half'),
  makeRacePage('Pittsburgh Half Marathon', 'pittsburgh-half'),
  makeRacePage('Richmond Half Marathon', 'richmond-half'),
  makeRacePage('Cleveland Half Marathon', 'cleveland-half'),
  makeRacePage('Denver Half Marathon', 'denver-half'),
  makeRacePage('San Jose Half Marathon', 'san-jose-half'),
  makeRacePage('San Antonio Half Marathon', 'san-antonio-half'),
  makeRacePage('New Orleans Half Marathon', 'new-orleans-half'),
  makeRacePage('Miami Half Marathon', 'miami-half'),
  makeRacePage('Seattle Half Marathon', 'seattle-half'),
  makeRacePage('Portland Half Marathon', 'portland-half'),

  // Common race distances + events
  makeRacePage('Local 5K', '5k'),
  makeRacePage('Local 10K', '10k'),
  makeRacePage('Half Marathon', 'half-marathon'),
  makeRacePage('Marathon', 'marathon'),
];

// =============================================================================
// Fuel SEO Pages
// =============================================================================

export const fuelSeoPages: SeoPageConfig[] = [
  {
    id: generatePageId('fuel', 'marathon-fueling-plan'),
    slug: 'marathon-fueling-plan',
    tool: 'fuel',
    path: '/fuel/marathon-fueling-plan',
    title: 'Marathon Fueling Plan Calculator - Gels, Carbs/Hour, Timing | TrainPace',
    description:
      'Build a marathon fueling plan in minutes. Calculate carbs per hour, total carbs, gels needed, and a simple timing schedule to avoid hitting the wall.',
    h1: 'Marathon Fueling Plan Calculator',
    intro:
      'Use your target finish time to estimate how many gels you need and when to take them, with realistic 60-90g/hr carb targets.',
    bullets: [
      'Carbs/hour target + total carbs',
      'Gel count estimate',
      'Simple race-day timing guidance',
    ],
    cta: { href: '/fuel', label: 'Open the Fuel Planner' },
    faq: [
      {
        question: 'How many carbs per hour for a marathon?',
        answer:
          'Most runners do well in the 60-90g/hour range, depending on gut training, intensity, and product tolerance.',
      },
      {
        question: 'When should I take my first gel?',
        answer:
          'Many runners start early (around 20-30 minutes) to stay ahead of energy needs, then follow a steady schedule.',
      },
    ],
    howTo: {
      name: 'How to build a marathon fueling plan',
      description:
        'Enter your marathon finish time and preferences to get a gel count estimate and carb targets.',
      steps: [
        { name: 'Enter finish time', text: 'Use your realistic goal time or recent marathon result.' },
        { name: 'Choose race type', text: 'Select Marathon to apply marathon-specific guidance.' },
        { name: 'Generate the plan', text: 'Get carbs/hour, total carbs, and gels needed.' },
      ],
    },
  },
  {
    id: generatePageId('fuel', 'half-marathon-fueling-plan'),
    slug: 'half-marathon-fueling-plan',
    tool: 'fuel',
    path: '/fuel/half-marathon-fueling-plan',
    title: 'Half Marathon Fueling Plan - How Many Gels + Timing | TrainPace',
    description:
      'Half marathon fueling plan calculator. Estimate gels needed, carbs/hour targets, and a simple schedule based on your finish time and preferences.',
    h1: 'Half Marathon Fueling Plan Calculator',
    intro:
      'Fueling matters in the half marathon too. A small, consistent plan can keep effort steady and prevent late-race fade.',
    bullets: [
      'Gel estimate for 60-120 minutes',
      'Carb targets and simple schedule',
      'Adjusts for your finish time',
    ],
    cta: { href: '/fuel', label: 'Open the Fuel Planner' },
    faq: [
      {
        question: 'Do I need gels for a half marathon?',
        answer:
          'It depends on duration and intensity. Many runners benefit from 1-2 gels, especially if racing hard for 90+ minutes.',
      },
      {
        question: 'Can I fuel with sports drink only?',
        answer:
          'Sometimes. If your drink provides enough carbs and you can carry it, you may not need many gels.',
      },
    ],
    howTo: {
      name: 'How to plan half marathon fueling',
      description:
        'Use your goal time to estimate gels needed and a simple fueling schedule for race day.',
      steps: [
        { name: 'Select Half', text: 'Choose Half Marathon in the fuel planner.' },
        { name: 'Enter finish time', text: 'Use your goal time (or a recent race time).' },
        { name: 'Use the schedule', text: 'Follow the timing guidance and adjust based on what you practiced.' },
      ],
    },
  },
  {
    id: generatePageId('fuel', 'how-many-gels-for-marathon'),
    slug: 'how-many-gels-for-marathon',
    tool: 'fuel',
    path: '/fuel/how-many-gels-for-marathon',
    title: 'How Many Gels for a Marathon? Calculator + Guide | TrainPace',
    description:
      'How many gels do you need for a marathon? Use your finish time and carb target to estimate gel count and build a simple fueling schedule.',
    h1: 'How Many Gels for a Marathon?',
    intro:
      'Gel count depends on race duration and carbs per gel. This page helps you estimate your total and turn it into a repeatable schedule.',
    bullets: [
      'Gel count estimate from finish time',
      'Carbs/hour and total carbs',
      'Pairs well with carb loading + hydration',
    ],
    cta: { href: '/fuel', label: 'Calculate Your Gel Count' },
    faq: [
      {
        question: 'How many gels is too many?',
        answer:
          'Too many is anything your gut can\'t tolerate. Practice in training and increase gradually; most issues come from going too high too soon.',
      },
      {
        question: 'How many grams of carbs are in a gel?',
        answer:
          'Most gels are ~20-30g carbs, but it varies by brand. Always check the label and plan around your actual products.',
      },
    ],
    howTo: {
      name: 'How to estimate marathon gel count',
      description:
        'Calculate gels needed by combining your finish time with a realistic carbs-per-hour target.',
      steps: [
        { name: 'Enter finish time', text: 'Input your marathon goal time.' },
        { name: 'Set carb target', text: 'Use a target like 60-90g/hr based on experience.' },
        { name: 'Translate to gels', text: 'Convert total carbs into gels based on your product labels.' },
      ],
    },
  },
  {
    id: generatePageId('fuel', 'how-many-gels-for-half-marathon'),
    slug: 'how-many-gels-for-half-marathon',
    tool: 'fuel',
    path: '/fuel/how-many-gels-for-half-marathon',
    title: 'How Many Gels for a Half Marathon? Calculator | TrainPace',
    description:
      'Estimate how many gels you need for a half marathon. Use your finish time to get a carb target and a simple gel schedule.',
    h1: 'How Many Gels for a Half Marathon?',
    intro:
      'Most runners don\'t need a large gel load for a half, but 1-2 well-timed gels can make the last 5K feel much better.',
    bullets: [
      'Gel estimate for your goal time',
      'Timing guidance',
      'Works with drink + gel combos',
    ],
    cta: { href: '/fuel', label: 'Calculate Half Marathon Gels' },
    howTo: {
      name: 'How to estimate half marathon gel count',
      description:
        'Use your goal time and intensity to decide whether you need gels and how many.',
      steps: [
        { name: 'Enter goal time', text: 'Input your half marathon goal time.' },
        { name: 'Pick fueling approach', text: 'Decide gels-only or gels + sports drink.' },
        { name: 'Set timing', text: 'Use a steady schedule you practiced in training.' },
      ],
    },
  },
  {
    id: generatePageId('fuel', 'carbs-per-hour-running'),
    slug: 'carbs-per-hour-running',
    tool: 'fuel',
    path: '/fuel/carbs-per-hour-running',
    title: 'Carbs Per Hour for Running - Marathon & Half Calculator | TrainPace',
    description:
      'Carbs per hour running calculator. Estimate a realistic carb target for marathon or half marathon fueling (60-90g/hr) based on your finish time.',
    h1: 'Carbs Per Hour for Running',
    intro:
      'Carbs/hour is the simplest "fueling dial" you can turn. The right target depends on duration, intensity, and gut training.',
    bullets: [
      '60-90g/hr targets (adjustable)',
      'Total carbs + gel estimate',
      'Practical, race-day friendly guidance',
    ],
    cta: { href: '/fuel', label: 'Calculate Carbs/Hour' },
    faq: [
      {
        question: 'Is 90g/hr too much?',
        answer:
          'For some runners, yes. For others (with gut training and proper products), it\'s very doable. Start lower and practice.',
      },
      {
        question: 'Does body weight change carb needs?',
        answer:
          'Weight matters less than duration and intensity for carbs/hour. Tolerance and practice matter most.',
      },
    ],
    howTo: {
      name: 'How to choose carbs per hour for a race',
      description:
        'Estimate a carbs-per-hour target and convert it into gels and timing.',
      steps: [
        { name: 'Choose race duration', text: 'Longer races typically benefit from more consistent fueling.' },
        { name: 'Pick a target range', text: 'Start with 60g/hr and progress toward 90g/hr if tolerated.' },
        { name: 'Practice in training', text: 'Use long runs to train your gut and confirm products.' },
      ],
    },
  },
  {
    id: generatePageId('fuel', 'marathon-nutrition-timing'),
    slug: 'marathon-nutrition-timing',
    tool: 'fuel',
    path: '/fuel/marathon-nutrition-timing',
    title: 'Marathon Nutrition Timing - When to Take Gels | TrainPace',
    description:
      'Marathon nutrition timing guide. Build a simple gel schedule (when to take each gel) based on your finish time and carb target.',
    h1: 'Marathon Nutrition Timing (Gel Schedule)',
    intro:
      'Even a great gel total can fail if timing is chaotic. A simple, repeatable schedule keeps energy stable through the final hour.',
    bullets: [
      'Start-early timing strategy',
      'Spacing you can remember',
      'Pairs with aid stations and water',
    ],
    cta: { href: '/fuel', label: 'Build Your Gel Schedule' },
    howTo: {
      name: 'How to time gels in a marathon',
      description:
        'Create a simple schedule so you take carbs consistently and avoid late-race bonks.',
      steps: [
        { name: 'Pick first gel time', text: 'Many runners take the first gel around 20-30 minutes.' },
        { name: 'Set an interval', text: 'Take a gel every ~25-35 minutes depending on target carbs/hour.' },
        { name: 'Pair with water', text: 'Take gels with water at aid stations when possible.' },
      ],
    },
  },
  {
    id: generatePageId('fuel', 'avoid-hitting-the-wall'),
    slug: 'avoid-hitting-the-wall',
    tool: 'fuel',
    path: '/fuel/avoid-hitting-the-wall',
    title: 'How to Avoid Hitting the Wall in a Marathon (Fuel Plan) | TrainPace',
    description:
      'Avoid hitting the wall with a simple marathon fuel plan. Estimate carbs/hour, gels needed, and a timing schedule you can execute on race day.',
    h1: 'Avoid Hitting the Wall (Marathon Fuel Plan)',
    intro:
      'The "wall" is usually a mix of going out too fast and running out of carbs. A steady pacing plan plus consistent carbs is your best defense.',
    bullets: [
      'Carb targets and gel plan',
      'Simple schedule you can follow',
      'Works with your goal finish time',
    ],
    cta: { href: '/fuel', label: 'Make a Fuel Plan' },
    faq: [
      {
        question: 'Is the wall only about fueling?',
        answer:
          'No. Pacing and conditioning matter a lot. But fueling is the most controllable lever on race day.',
      },
    ],
    howTo: {
      name: 'How to reduce your risk of bonking',
      description:
        'Create a pacing + fueling plan that keeps effort controlled and carbs consistent.',
      steps: [
        { name: 'Choose a realistic goal', text: 'Pick a goal pace you can sustain without early surges.' },
        { name: 'Fuel consistently', text: 'Set a carbs/hour target and stick to a schedule.' },
        { name: 'Practice', text: 'Rehearse gels and pacing in long runs before race day.' },
      ],
    },
  },
  {
    id: generatePageId('fuel', 'carb-loading-for-marathon'),
    slug: 'carb-loading-for-marathon',
    tool: 'fuel',
    path: '/fuel/carb-loading-for-marathon',
    title: 'Carb Loading for a Marathon - Simple Plan + Calculator | TrainPace',
    description:
      'Carb loading for a marathon made simple. Estimate race-day carb needs with the fuel planner, then practice a basic carb-loading approach.',
    h1: 'Carb Loading for a Marathon',
    intro:
      'Carb loading isn\'t magic, but it helps. The key is pairing a steady carb plan with practiced race-day fueling.',
    bullets: [
      'Simple, practical approach',
      'Pairs with race-day gels',
      'Works for most runners',
    ],
    cta: { href: '/fuel', label: 'Build a Fuel Plan' },
  },
  {
    id: generatePageId('fuel', 'marathon-hydration-plan'),
    slug: 'marathon-hydration-plan',
    tool: 'fuel',
    path: '/fuel/marathon-hydration-plan',
    title: 'Marathon Hydration Plan - Water, Electrolytes, and Gels | TrainPace',
    description:
      'Marathon hydration plan basics. Pair gels with water, use aid stations strategically, and keep hydration simple to support carb intake.',
    h1: 'Marathon Hydration Plan',
    intro:
      'Hydration and fueling work together. A simple plan: take carbs consistently and pair gels with water when possible.',
    bullets: [
      'Pair gels with water',
      'Use aid stations intentionally',
      'Keep it simple and repeatable',
    ],
    cta: { href: '/fuel', label: 'Calculate Gels + Carbs' },
  },
  {
    id: generatePageId('fuel', 'fueling-for-hilly-marathon'),
    slug: 'fueling-for-hilly-marathon',
    tool: 'fuel',
    path: '/fuel/fueling-for-hilly-marathon',
    title: 'Fueling for a Hilly Marathon - Carbs/Hour + Timing | TrainPace',
    description:
      'Fueling for a hilly marathon. Keep carbs consistent even when pace varies with climbs. Build a gel schedule based on time, not miles.',
    h1: 'Fueling for a Hilly Marathon',
    intro:
      'On hilly courses, pace changes but time keeps ticking. A time-based fueling schedule is easier to execute.',
    bullets: [
      'Fuel by time, not miles',
      'Avoid skipping gels on climbs',
      'Practice on hilly long runs',
    ],
    cta: { href: '/fuel', label: 'Build a Time-Based Gel Schedule' },
  },
  {
    id: generatePageId('fuel', 'gel-timing-every-30-minutes'),
    slug: 'gel-timing-every-30-minutes',
    tool: 'fuel',
    path: '/fuel/gel-timing-every-30-minutes',
    title: 'Gel Timing Every 30 Minutes - Does It Work? | TrainPace',
    description:
      'Gel timing every 30 minutes is a simple race-day rule. Use the fuel planner to check if it matches your carb target and race duration.',
    h1: 'Gel Timing Every 30 Minutes',
    intro:
      'A consistent schedule is better than improvising. Use a 25-35 minute interval depending on carb target and gel size.',
    bullets: [
      'Simple interval-based schedule',
      'Adjust for gel carb content',
      'Pair with water',
    ],
    cta: { href: '/fuel', label: 'Check Your Gel Schedule' },
  },
];

// =============================================================================
// Elevation Guide SEO Pages
// =============================================================================

export const elevationGuideSeoPages: SeoPageConfig[] = [
  {
    id: generatePageId('elevation', 'gpx-elevation-profile-analyzer'),
    slug: 'gpx-elevation-profile-analyzer',
    tool: 'elevation',
    path: '/elevationfinder/guides/gpx-elevation-profile-analyzer',
    title: 'GPX Elevation Profile Analyzer - Free Route Viewer | TrainPace',
    description:
      'GPX elevation profile analyzer. Upload a GPX file to view elevation gain/loss, grade, and climb difficulty with an interactive map.',
    h1: 'GPX Elevation Profile Analyzer',
    intro:
      'If you have a GPX file from Strava, Garmin, COROS, or your watch, you can visualize elevation gain and gradients in seconds.',
    bullets: [
      'Interactive elevation profile and map',
      'Total gain/loss and grade breakdown',
      'Useful for race course and long-run planning',
    ],
    cta: { href: '/elevationfinder', label: 'Open ElevationFinder' },
    howTo: {
      name: 'How to analyze a GPX elevation profile',
      description:
        'Upload a GPX route and review elevation gain, grades, and difficult sections.',
      steps: [
        { name: 'Export GPX', text: 'Download your GPX from Strava, Garmin Connect, or your device.' },
        { name: 'Upload file', text: 'Drop the GPX into ElevationFinder.' },
        { name: 'Review climbs', text: 'Use the profile and segment analysis to spot key hills.' },
      ],
    },
  },
  {
    id: generatePageId('elevation', 'elevation-gain-calculator'),
    slug: 'elevation-gain-calculator',
    tool: 'elevation',
    path: '/elevationfinder/guides/elevation-gain-calculator',
    title: 'Elevation Gain Calculator (From GPX) - Running Routes | TrainPace',
    description:
      'Elevation gain calculator for running routes. Upload a GPX file to calculate total ascent/descent and see where the climbs happen.',
    h1: 'Elevation Gain Calculator (From GPX)',
    intro:
      'Total elevation gain tells you how demanding a route is, but where it happens matters just as much. Use a profile to plan pacing.',
    bullets: [
      'Total ascent and descent',
      'Visual profile (where climbs are)',
      'Grade breakdown by segment',
    ],
    cta: { href: '/elevationfinder', label: 'Calculate Elevation Gain' },
  },
  {
    id: generatePageId('elevation', 'how-to-read-elevation-profile'),
    slug: 'how-to-read-elevation-profile',
    tool: 'elevation',
    path: '/elevationfinder/guides/how-to-read-elevation-profile',
    title: 'How to Read an Elevation Profile (Running) | TrainPace',
    description:
      'Learn how to read a running elevation profile: grade %, climbs, descents, and where to adjust effort. Includes a free GPX viewer.',
    h1: 'How to Read an Elevation Profile',
    intro:
      'Elevation profiles look simple, but they\'re easy to misread. Focus on grade, climb length, and where the hardest sections land in the route.',
    bullets: [
      'What grade % actually means',
      'Spotting key climbs and descents',
      'How to adjust effort and pacing',
    ],
    cta: { href: '/elevationfinder', label: 'View a GPX Elevation Profile' },
    faq: [
      {
        question: 'What is a "hilly" course?',
        answer:
          'It depends on distance, but look at total climb and sustained grades. A few long climbs can be harder than many small rollers.',
      },
      {
        question: 'Why does a course feel harder than its total elevation gain?',
        answer:
          'Grade and placement matter. A steep climb late in the race can be more damaging than the same climb early.',
      },
    ],
  },
  {
    id: generatePageId('elevation', 'route-difficulty-calculator'),
    slug: 'route-difficulty-calculator',
    tool: 'elevation',
    path: '/elevationfinder/guides/route-difficulty-calculator',
    title: 'Route Difficulty Calculator - Hills, Grades, and Climb Stats | TrainPace',
    description:
      'Route difficulty calculator. Upload a GPX to break down grade, climbs, and hard segments so you can plan pacing for hilly courses.',
    h1: 'Route Difficulty Calculator',
    intro:
      'Difficulty is more than distance. Hills change effort, pacing, and fueling. Use grade breakdowns to plan where to stay conservative.',
    bullets: [
      'Grade thresholds and segment breakdown',
      'Hardest climbs at a glance',
      'Better pacing strategy for race day',
    ],
    cta: { href: '/elevationfinder', label: 'Analyze Route Difficulty' },
  },
  {
    id: generatePageId('elevation', 'strava-gpx-analyzer'),
    slug: 'strava-gpx-analyzer',
    tool: 'elevation',
    path: '/elevationfinder/guides/strava-gpx-analyzer',
    title: 'Strava GPX Analyzer - Elevation Profile + Route Insights | TrainPace',
    description:
      'Strava GPX analyzer. Export your Strava route as GPX and upload to view elevation profile, total gain, and grade breakdown.',
    h1: 'Strava GPX Analyzer',
    intro:
      'TrainPace works with GPX exports from Strava. Export your route, then upload to get elevation gain and segment-by-segment hill insights.',
    bullets: [
      'Works with Strava GPX exports',
      'Elevation profile + map',
      'Grade and climb breakdown',
    ],
    cta: { href: '/elevationfinder', label: 'Analyze a Strava GPX' },
  },
  {
    id: generatePageId('elevation', 'hilly-course-pacing'),
    slug: 'hilly-course-pacing',
    tool: 'elevation',
    path: '/elevationfinder/guides/hilly-course-pacing',
    title: 'Hilly Course Pacing Strategy - Use Elevation to Plan Effort | TrainPace',
    description:
      'Hilly course pacing strategy. Learn how to use elevation profiles and grade breakdowns to adjust effort on climbs and run smart on descents.',
    h1: 'Hilly Course Pacing Strategy',
    intro:
      'On hilly routes, try to keep effort steady and let pace vary. Your goal is to avoid redlining on climbs and wasting energy on descents.',
    bullets: [
      'Plan effort, not just pace',
      'Find key climbs before race day',
      'Avoid blowing up late',
    ],
    cta: { href: '/elevationfinder', label: 'Analyze a Hilly Route' },
  },
  {
    id: generatePageId('elevation', 'marathon-course-elevation'),
    slug: 'marathon-course-elevation',
    tool: 'elevation',
    path: '/elevationfinder/guides/marathon-course-elevation',
    title: 'Marathon Course Elevation - Analyze Any Course with GPX | TrainPace',
    description:
      'Analyze marathon course elevation with a GPX file. View elevation profile, total climb, grade %, and identify the key hills that affect pacing.',
    h1: 'Marathon Course Elevation Analysis',
    intro:
      'Course elevation should inform pacing and fueling. Upload a GPX to find the climbs that will matter most on race day.',
    bullets: [
      'Total climb and grade %',
      'Find the hardest sections',
      'Better pacing + fueling planning',
    ],
    cta: { href: '/elevationfinder', label: 'Upload a Marathon GPX' },
  },
  {
    id: generatePageId('elevation', 'grade-percentage-calculator'),
    slug: 'grade-percentage-calculator',
    tool: 'elevation',
    path: '/elevationfinder/guides/grade-percentage-calculator',
    title: 'Grade Percentage Calculator - Running Hills Explained | TrainPace',
    description:
      'Grade percentage calculator for running. Learn what grade % means, how to spot steep climbs, and why grade matters more than total elevation gain.',
    h1: 'Grade Percentage Calculator (Running)',
    intro:
      'Grade is the most useful way to describe how steep a hill feels. Use grade % and climb length to plan pacing and effort.',
    bullets: [
      'What grade % means',
      'Why 3% vs 8% feels wildly different',
      'Use grade + length to plan effort',
    ],
    cta: { href: '/elevationfinder', label: 'Analyze a Route' },
  },
  {
    id: generatePageId('elevation', 'garmin-gpx-analyzer'),
    slug: 'garmin-gpx-analyzer',
    tool: 'elevation',
    path: '/elevationfinder/guides/garmin-gpx-analyzer',
    title: 'Garmin GPX Analyzer - Elevation Profile and Climb Stats | TrainPace',
    description:
      'Garmin GPX analyzer. Export a GPX from Garmin Connect and upload it to view elevation profile, total gain, grade %, and tough segments.',
    h1: 'Garmin GPX Analyzer',
    intro:
      'If you track runs with Garmin, export your route as GPX and use ElevationFinder to spot climbs and pacing risk areas.',
    bullets: [
      'Works with Garmin Connect GPX',
      'Elevation profile + grade breakdown',
      'Find hardest climbs fast',
    ],
    cta: { href: '/elevationfinder', label: 'Upload Garmin GPX' },
  },
  {
    id: generatePageId('elevation', 'coros-gpx-analyzer'),
    slug: 'coros-gpx-analyzer',
    tool: 'elevation',
    path: '/elevationfinder/guides/coros-gpx-analyzer',
    title: 'COROS GPX Analyzer - Elevation Profile and Grade Breakdown | TrainPace',
    description:
      'COROS GPX analyzer. Upload a GPX from COROS to see elevation gain, loss, grade %, and route difficulty on an interactive map.',
    h1: 'COROS GPX Analyzer',
    intro:
      'Export GPX from COROS and analyze elevation/grades so you know where the course gets hard.',
    bullets: [
      'Works with COROS GPX',
      'Elevation gain/loss',
      'Grade-based difficulty',
    ],
    cta: { href: '/elevationfinder', label: 'Upload COROS GPX' },
  },
  {
    id: generatePageId('elevation', 'trail-running-elevation'),
    slug: 'trail-running-elevation',
    tool: 'elevation',
    path: '/elevationfinder/guides/trail-running-elevation',
    title: 'Trail Running Elevation - Analyze Climbs and Descents with GPX | TrainPace',
    description:
      'Trail running elevation analysis. Upload a GPX to see climbs, descents, grades, and where the toughest sections land on the route.',
    h1: 'Trail Running Elevation Analysis',
    intro:
      'On trails, pacing swings more with terrain. Use grade and climb placement to plan effort and fueling.',
    bullets: [
      'Climb placement and grade',
      'Better effort planning',
      'Useful for long trail runs',
    ],
    cta: { href: '/elevationfinder', label: 'Analyze a Trail GPX' },
  },
  {
    id: generatePageId('elevation', 'hill-repeats-planning'),
    slug: 'hill-repeats-planning',
    tool: 'elevation',
    path: '/elevationfinder/guides/hill-repeats-planning',
    title: 'Hill Repeats Planning - Find the Right Hill (Grade + Length) | TrainPace',
    description:
      'Plan hill repeats by choosing the right hill. Use GPX analysis to identify grade %, climb length, and repeat-friendly segments.',
    h1: 'Hill Repeats Planning',
    intro:
      'The "right" hill depends on your workout: short steep power, longer steady strength, or controlled downhill practice.',
    bullets: [
      'Find repeatable climbs',
      'Use grade % and climb length',
      'Plan safer downhill segments',
    ],
    cta: { href: '/elevationfinder', label: 'Find a Hill in Your GPX' },
  },
];

// =============================================================================
// Lookup Maps
// =============================================================================

export const calculatorSeoPageMap = new Map(
  calculatorSeoPages.map((p) => [p.slug, p])
);
export const fuelSeoPageMap = new Map(fuelSeoPages.map((p) => [p.slug, p]));
export const elevationGuideSeoPageMap = new Map(
  elevationGuideSeoPages.map((p) => [p.slug, p])
);
export const raceSeoPageMap = new Map(raceSeoPages.map((p) => [p.slug, p]));

// =============================================================================
// Combined Exports
// =============================================================================

/**
 * Get all SEO page paths for prerendering
 */
export function getAllSeoPaths(): string[] {
  return [
    ...calculatorSeoPages.map((p) => p.path),
    ...fuelSeoPages.map((p) => p.path),
    ...elevationGuideSeoPages.map((p) => p.path),
    ...raceSeoPages.map((p) => p.path),
  ];
}

/**
 * Get all SEO page configurations
 */
export function getAllSeoPages(): SeoPageConfig[] {
  return [
    ...calculatorSeoPages,
    ...fuelSeoPages,
    ...elevationGuideSeoPages,
    ...raceSeoPages,
  ];
}

/**
 * Get SEO URL with base
 */
export function getSeoUrl(path: string): string {
  return withBaseUrl(path);
}
