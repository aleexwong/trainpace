# TrainPace SEO Strategy
*Bespoke analysis for zero-budget organic growth*

---

## Part 1: App & Market Analysis

### What TrainPace Does

TrainPace is a **free, science-backed training suite for self-coached runners** combining three core tools:

1. **Pace Calculator** - VDOT-based training zone generator from any race result
2. **ElevationFinder** - GPX route analysis with interactive maps and difficulty scoring
3. **Race Fuel Planner** - AI-powered marathon nutrition calculator (Gemini integration)

**Unique Value Props:**
- 100% free forever (vs. $150+/mo coaching)
- No account required for core features
- All three tools in one place (competitors are fragmented)
- Real founder proof: 3:01 → 2:06 half marathon using these tools

---

### Competitive Landscape

#### Pace Calculator Competitors
| Competitor | Strengths | Weaknesses |
|------------|-----------|------------|
| **V.O2 (VDOT official)** | Official Jack Daniels brand, mobile app, watch sync | Requires account, paid features |
| **McMillan Running** | 25+ years authority, trusted brand | Cluttered UI, email-gated features |
| **Strava Pace Calculator** | Massive brand recognition | Basic features, no training zones |
| **RunningPaceCalculator.fit** | Multiple calculators | Poor UX, ad-heavy |

#### Elevation/GPX Competitors
| Competitor | Strengths | Weaknesses |
|------------|-----------|------------|
| **gpx.studio** | Full editing capabilities | No AI insights, technical UI |
| **Strava routes** | Large user base, social | Requires account, subscription for analysis |
| **glandnav.com** | Privacy-focused, local processing | Basic visualization |

#### Fuel Calculator Competitors
| Competitor | Strengths | Weaknesses |
|------------|-----------|------------|
| **Precision Hydration** | Strong brand, detailed | Product-focused (sells products) |
| **TriWorldHub** | Detailed nutrition plans | Poor UX, ads |
| **TheRunningWeek** | Simple gel calculator | Limited features |

### TrainPace's Competitive Advantages
1. **All-in-one solution** - Competitors are fragmented (one tool each)
2. **Truly free** - No paywalls, no email gates, no ads
3. **Modern UX** - Clean React app vs. dated competitors
4. **AI integration** - Gemini-powered fuel advice (unique)
5. **Pre-loaded marathon courses** - Boston, NYC, Chicago, etc.

### Market Opportunity
- Sports training market: $27.8B (2023) → $50.7B (2035)
- 21-35 age demographic dominates (your target user)
- 242M Americans participated in fitness activities (2023)
- Growing trend toward self-directed training with tech tools

---

## Part 2: Current SEO Assessment

### What You're Doing Right ✅
1. **Pre-rendering** - Static HTML generation for core pages
2. **Structured data** - Organization, WebSite, SoftwareApplication schemas
3. **Meta tags** - Proper og:tags and Twitter cards
4. **Robots.txt** - Clean crawl directives
5. **Sitemap** - All key pages indexed
6. **Fast hosting** - Vercel edge network
7. **Lighthouse scores** - 95+ performance, 100 SEO

### Critical Gaps ❌
1. **No content strategy** - Zero blog/educational content
2. **Limited keyword targeting** - Only 11 indexable pages
3. **No programmatic SEO** - Missing templated landing pages
4. **Thin content on tool pages** - Calculators lack supporting text
5. **No FAQ schema** - FAQ page not getting rich snippets
6. **Missing BreadcrumbList schema**
7. **No backlink strategy**

---

## Part 3: Bespoke SEO Strategy for TrainPace

### The Core Insight

**Your biggest opportunity is programmatic SEO combined with long-tail content.**

You have three major advantages competitors don't:
1. **Unique data** - Marathon course profiles (Boston, NYC, etc.)
2. **Multi-tool integration** - Can create "complete race prep" pages
3. **Founder story** - Authentic proof that converts

### Strategy Overview

```
               HIGH LEVERAGE (Do This)
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    ▼                   ▼                   ▼
Programmatic      Long-tail           Content
Race Pages      Calculator Pages      Clusters
    │                   │                   │
    └───────────────────┼───────────────────┘
                        │
                        ▼
              ~500 Indexable Pages
              (from current 11)
```

---

## Part 4: Critical Baseline Tasks (Must Do First)

These are **non-negotiable technical fixes** before any growth work:

### 1. Add FAQ Schema to FAQ Page
```json
{
  "@type": "FAQPage",
  "mainEntity": [...]
}
```
**Why:** Your FAQ has great content but no rich snippets. This is free SERP real estate.

### 2. Add BreadcrumbList Schema
Every page should have breadcrumb structured data for better SERP appearance.

### 3. Add "HowTo" Schema on Tool Pages
Each calculator page should have HowTo schema:
- "How to calculate your VDOT training paces"
- "How to analyze GPX elevation data"
- "How to calculate marathon fuel needs"

### 4. Expand Meta Descriptions
Current descriptions are good but could include more long-tail keywords.

### 5. Add Internal Linking Structure
Connect your tools together:
- Pace Calculator → "Now analyze your race course" → ElevationFinder
- ElevationFinder → "Plan your fueling strategy" → Fuel Planner

### 6. Set Up Google Search Console
If not already done - essential for tracking keywords and indexing.

### 7. Submit to Running/Fitness Directories
Free backlinks from:
- Product Hunt
- AlternativeTo
- SaaSHub
- Running community forums

**Time estimate:** 2-3 days of focused work

---

## Part 5: High-Leverage Growth Activities

### THE ONE THING: Programmatic Race Preparation Pages

**This is where you should spend 70% of your time.**

#### What It Is
Create templated landing pages for every major race, targeting search queries like:
- "Boston Marathon elevation profile"
- "NYC Marathon pace strategy"
- "Chicago Marathon fueling plan"
- "Berlin Marathon course difficulty"

#### Why This Works
1. **High-intent keywords** - Runners searching this are preparing for races
2. **Low competition** - Competitors focus on generic keywords
3. **Your unique data** - You already have the course profiles
4. **Natural tool integration** - Each page leads to your tools

#### Implementation
Create a page template that includes:
```
/race/[marathon-name]-[year]/

├── Hero: Race name + date + your difficulty score
├── Elevation Profile: Interactive chart (your ElevationFinder)
├── Key Stats: Distance, elevation gain, grade %
├── Pace Strategy: Section linking to Pace Calculator
├── Fueling Plan: Section linking to Fuel Planner
├── Course Breakdown: Mile-by-mile analysis
├── Weather History: Average temps for race week
├── FAQ: Race-specific questions
└── CTA: "Create your training plan"
```

#### Target Pages to Create
**Major Marathons (20 pages):**
- Boston, NYC, Chicago, Berlin, London, Tokyo (you have these)
- LA, Marine Corps, Twin Cities, Philadelphia
- Big Sur, Grandma's, Houston, Austin, Portland
- Disney, Rock 'n' Roll series (Vegas, Nashville, etc.)

**Major Half Marathons (20 pages):**
- Same approach for popular halfs

**By Location (50+ pages):**
- "Hilly marathon courses in [state]"
- "Flat marathon courses for PRs"
- "Best first marathon courses"

This creates **100+ indexable pages** from templated content with real data.

---

### Secondary Focus: Long-Tail Calculator Pages (20% of time)

Create variation pages for your calculators:

#### Pace Calculator Variations
- `/calculator/5k-pace-calculator` - Optimized for "5K pace calculator"
- `/calculator/marathon-pace-calculator` - "marathon pace calculator"
- `/calculator/half-marathon-pace-calculator`
- `/calculator/tempo-run-pace`
- `/calculator/easy-run-pace`
- `/calculator/vdot-to-pace`

#### Fuel Calculator Variations
- `/fuel/how-many-gels-for-marathon`
- `/fuel/half-marathon-fueling-strategy`
- `/fuel/ultra-marathon-nutrition-calculator`
- `/fuel/carbs-per-hour-running`

#### Elevation Variations
- `/elevationfinder/gpx-elevation-profile-analyzer`
- `/elevationfinder/route-difficulty-calculator`
- `/elevationfinder/strava-route-analysis`

**Each page:** Same core tool, but with content/copy optimized for that specific keyword.

---

### Tertiary Focus: Content Clusters (10% of time)

Create pillar content that establishes authority:

#### Pillar 1: Training Paces
- **Hub:** "The Complete Guide to Running Training Paces"
- **Spokes:** Easy pace, tempo pace, threshold, VDOT explained, heart rate zones

#### Pillar 2: Race Fueling
- **Hub:** "Marathon Fueling: The Science-Backed Guide"
- **Spokes:** When to take gels, bonking prevention, carb loading, race day nutrition

#### Pillar 3: Course Analysis
- **Hub:** "How to Analyze Any Running Course"
- **Spokes:** Reading elevation profiles, grade percentage meaning, adjusting pace for hills

---

## Part 6: Time Allocation Summary

### For Maximum Growth With Zero Budget:

| Activity | Time Allocation | Why |
|----------|-----------------|-----|
| **Programmatic race pages** | 70% | Highest ROI, unique data, high-intent keywords |
| **Long-tail calculator pages** | 20% | Quick wins, keyword variations |
| **Content clusters** | 10% | Authority building, backlink magnets |

### Weekly Breakdown (20 hours/week example)
- **14 hours:** Building out race preparation pages
- **4 hours:** Creating calculator variation pages
- **2 hours:** Writing pillar content pieces

### Month 1 Priority Order
1. Complete baseline technical fixes (Week 1)
2. Create race page template (Week 1)
3. Launch 10 major marathon pages (Week 2-3)
4. Create 5 calculator variation pages (Week 3-4)
5. Write 1 pillar content piece (Week 4)

---

## Part 7: Keywords to Target (by Priority)

### Tier 1: High Volume, Achievable
- "running pace calculator"
- "marathon pace calculator"
- "VDOT calculator"
- "5K pace calculator"
- "marathon fuel calculator"
- "how many gels for marathon"

### Tier 2: Long-tail, High Intent
- "[marathon name] elevation profile"
- "[marathon name] course difficulty"
- "Boston Marathon hills analysis"
- "what pace for sub 4 hour marathon"
- "marathon fueling strategy"
- "GPX elevation analyzer"

### Tier 3: Comparison/Alternative
- "free VDOT calculator"
- "McMillan calculator alternative"
- "Strava pace calculator alternative"

---

## Part 8: Free Tools You Need

1. **Google Search Console** - Track rankings, find keywords
2. **Google Analytics 4** - You have this ✅
3. **Ubersuggest free tier** - Keyword research
4. **AnswerThePublic** - Find questions people ask
5. **AlsoAsked.com** - Related questions
6. **Google Trends** - Seasonal keyword planning

---

## Part 9: 90-Day Roadmap

### Days 1-7: Foundation
- [ ] Complete all baseline technical fixes
- [ ] Set up Google Search Console (if not done)
- [ ] Build race page template
- [ ] Research top 20 marathon keywords

### Days 8-30: Programmatic Launch
- [ ] Launch 20 major marathon pages
- [ ] Launch 10 half marathon pages
- [ ] Create 5 calculator variation pages
- [ ] Submit sitemap to GSC

### Days 31-60: Scale & Iterate
- [ ] Add 30 more race pages
- [ ] Monitor Search Console for keyword opportunities
- [ ] Create 10 more calculator variations
- [ ] Write 2 pillar content pieces
- [ ] Start outreach for backlinks (running forums, Reddit)

### Days 61-90: Optimize & Expand
- [ ] Analyze which pages are ranking
- [ ] Double down on winning keywords
- [ ] Create state/region race pages
- [ ] Add "best races for" category pages

---

## The Bottom Line

**Your unfair advantage is your unique race course data + all-in-one tool integration.**

No competitor has:
1. Pre-analyzed marathon elevation profiles
2. Combined with personalized pace zones
3. Combined with AI-powered fuel planning
4. All free, all in one place

**Turn that into 100+ programmatic landing pages and you'll own the "race preparation" search space.**

---

## Quick Reference Card

### Critical Baseline (Do First)
1. FAQ schema
2. HowTo schema on tools
3. BreadcrumbList schema
4. Internal linking
5. Directory submissions

### Time Allocation
- 70% → Programmatic race pages
- 20% → Calculator variations
- 10% → Pillar content

### Primary Keywords
- "[marathon] elevation profile"
- "[marathon] pace strategy"
- "marathon fuel calculator"
- "VDOT calculator free"

### Success Metrics
- Indexable pages: 11 → 150+
- Organic keywords ranking: Track in GSC
- Organic traffic: Measure weekly growth

---

*Document created for TrainPace by Claude*
*Strategy effective as of January 2026*
