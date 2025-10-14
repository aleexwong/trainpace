/**
 * Generate sitemap.xml for TrainPace
 * Run this script to update sitemap: node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const baseUrl = 'https://www.trainpace.com';

// All pages that should be in the sitemap
const pages = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/calculator', priority: '0.9', changefreq: 'monthly' },
  { url: '/fuel', priority: '0.9', changefreq: 'monthly' },
  { url: '/elevationfinder', priority: '0.8', changefreq: 'monthly' },
  { url: '/dashboard', priority: '0.7', changefreq: 'weekly' },
  { url: '/ethos', priority: '0.6', changefreq: 'yearly' },
  { url: '/faq', priority: '0.7', changefreq: 'monthly' },
  { url: '/privacy', priority: '0.5', changefreq: 'yearly' },
  { url: '/terms', priority: '0.5', changefreq: 'yearly' },
  { url: '/login', priority: '0.4', changefreq: 'monthly' },
  { url: '/register', priority: '0.4', changefreq: 'monthly' },
  // Preview routes
  { url: '/preview-route/boston', priority: '0.6', changefreq: 'yearly' },
  { url: '/preview-route/nyc', priority: '0.6', changefreq: 'yearly' },
  { url: '/preview-route/chicago', priority: '0.6', changefreq: 'yearly' },
  { url: '/preview-route/berlin', priority: '0.6', changefreq: 'yearly' },
  { url: '/preview-route/london', priority: '0.6', changefreq: 'yearly' },
  { url: '/preview-route/tokyo', priority: '0.6', changefreq: 'yearly' },
];

function generateSitemap() {
  const currentDate = new Date().toISOString().split('T')[0];

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  pages.forEach((page) => {
    sitemap += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  });

  sitemap += '</urlset>';

  return sitemap;
}

// Write sitemap to public directory
const sitemap = generateSitemap();
const publicDir = path.join(__dirname, '../vite-project/public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');

fs.writeFileSync(sitemapPath, sitemap, 'utf8');
console.log('✅ Sitemap generated successfully at:', sitemapPath);
