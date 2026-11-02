// scripts/test-seo-crawlability.js
// Automated Laboratory Verification Suite for SEO, Prerendering, Sitemap, Robots & Structured Data
const http = require('http');
const path = require('path');
const fs = require('fs');

async function runSeoTests() {
  console.log('====================================================');
  console.log('   LOGBOOK PLUS - SEO & CRAWLABILITY TEST SUITE     ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Verify XML Sitemap File on Disk
  console.log('--- SUITE 1: XML Sitemap & Canonical URLs ---');
  const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  assert(fs.existsSync(sitemapPath), 'public/sitemap.xml exists on disk');

  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  assert(sitemapContent.startsWith('<?xml'), 'sitemap.xml starts with valid XML declaration');
  assert(sitemapContent.includes('<urlset'), 'sitemap.xml contains valid <urlset> element');

  const locMatches = [...sitemapContent.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  assert(locMatches.length === 24, `sitemap.xml contains exactly 24 canonical URLs (found: ${locMatches.length})`);

  // Check uniqueness
  const uniqueLocs = new Set(locMatches);
  assert(uniqueLocs.size === locMatches.length, 'sitemap.xml contains zero duplicate URLs');

  // Check no trailing slashes on subpages
  const invalidTrailing = locMatches.filter(u => u !== 'https://logbookplus.co.in/' && u.endsWith('/'));
  assert(invalidTrailing.length === 0, 'sitemap.xml subpages have zero trailing slashes');

  // Check all URLs are HTTPS
  const nonHttps = locMatches.filter(u => !u.startsWith('https://logbookplus.co.in'));
  assert(nonHttps.length === 0, 'All sitemap URLs use canonical https://logbookplus.co.in origin');

  // Check all lastmod are valid ISO dates
  const lastmodMatches = [...sitemapContent.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map(m => m[1]);
  const invalidDates = lastmodMatches.filter(d => !/^\d{4}-\d{2}-\d{2}$/.test(d));
  assert(invalidDates.length === 0, 'All lastmod dates follow strict YYYY-MM-DD format');

  // 2. Verify Robots.txt File on Disk
  console.log('\n--- SUITE 2: Robots.txt Directives & Assets Accessibility ---');
  const robotsPath = path.join(__dirname, '..', 'public', 'robots.txt');
  assert(fs.existsSync(robotsPath), 'public/robots.txt exists on disk');

  const robotsContent = fs.readFileSync(robotsPath, 'utf8');
  assert(robotsContent.includes('Sitemap: https://logbookplus.co.in/sitemap.xml'), 'robots.txt specifies canonical Sitemap URL');
  assert(robotsContent.includes('Allow: /'), 'robots.txt allows public routes');
  assert(robotsContent.includes('Allow: /assets/'), 'robots.txt explicitly allows /assets/ for Googlebot rendering');
  assert(robotsContent.includes('Allow: /dist-assets/'), 'robots.txt explicitly allows /dist-assets/ for bundle execution');
  assert(robotsContent.includes('Allow: /llms.txt'), 'robots.txt explicitly allows /llms.txt');
  assert(robotsContent.includes('Disallow: /api/'), 'robots.txt disallows /api/ backend endpoints');
  assert(robotsContent.includes('Disallow: /app/dashboard'), 'robots.txt disallows private authenticated dashboard');
  assert(robotsContent.includes('Disallow: /master'), 'robots.txt disallows admin master console');
  assert(robotsContent.includes('Disallow: /helpdesk'), 'robots.txt disallows helpdesk console');
  assert(!robotsContent.includes('Disallow: /*.json$'), 'robots.txt does not inadvertently block JSON schema assets');

  // 3. Inspect Static Prerendered HTML Files for Unique Metadata
  console.log('\n--- SUITE 3: Static Prerendered Route HTML Inspection ---');
  const routesToInspect = [
    { path: 'index.html', title: 'Offline Expense Tracker', canonical: 'https://logbookplus.co.in/' },
    { path: 'pricing/index.html', title: 'Pricing & Plans', canonical: 'https://logbookplus.co.in/pricing' },
    { path: 'about/index.html', title: 'About Logbook Plus', canonical: 'https://logbookplus.co.in/about' },
    { path: 'contact/index.html', title: 'Contact Support', canonical: 'https://logbookplus.co.in/contact' },
    { path: 'blog/index.html', title: 'Engineering Blog', canonical: 'https://logbookplus.co.in/blog' },
    { path: 'help-center/index.html', title: 'Help Center & FAQ', canonical: 'https://logbookplus.co.in/help-center' },
    { path: 'security/index.html', title: 'Security Policy', canonical: 'https://logbookplus.co.in/security' },
    { path: 'privacy/index.html', title: 'Privacy Policy', canonical: 'https://logbookplus.co.in/privacy' },
    { path: 'cookie/index.html', title: 'Cookie Policy', canonical: 'https://logbookplus.co.in/cookie' },
    { path: 'documentation/index.html', title: 'Documentation & Protocols', canonical: 'https://logbookplus.co.in/documentation' },
    { path: 'community/index.html', title: 'Community & Open Channels', canonical: 'https://logbookplus.co.in/community' },
    { path: 'blog/why-local-first-database-design-matters/index.html', title: 'Why Local-First Database Design Matters', canonical: 'https://logbookplus.co.in/blog/why-local-first-database-design-matters' },
    { path: 'blog/securing-cloud-backups-with-zero-knowledge-encryption/index.html', title: 'Securing Cloud Backups with Zero-Knowledge Encryption', canonical: 'https://logbookplus.co.in/blog/securing-cloud-backups-with-zero-knowledge-encryption' }
  ];

  const seenTitles = new Set();
  const seenCanonicals = new Set();

  for (const r of routesToInspect) {
    const fullPath = path.join(__dirname, '..', 'public', r.path);
    assert(fs.existsSync(fullPath), `Prerendered file exists: public/${r.path}`);

    const html = fs.readFileSync(fullPath, 'utf8');

    // Title tag
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const expectedTitleNeedle = r.title.replace('&', '&amp;');
    assert(titleMatch && (titleMatch[1].includes(r.title) || titleMatch[1].includes(expectedTitleNeedle)), `public/${r.path} has unique matching title: "${titleMatch ? titleMatch[1].slice(0, 45) : 'missing'}..."`);
    if (titleMatch) seenTitles.add(titleMatch[1]);

    // Canonical tag
    const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);
    assert(canonicalMatch && canonicalMatch[1] === r.canonical, `public/${r.path} has exact canonical URL: ${canonicalMatch ? canonicalMatch[1] : 'missing'}`);
    if (canonicalMatch) seenCanonicals.add(canonicalMatch[1]);

    // Sitemap link check (must NEVER be base64 data URI)
    const sitemapMatch = html.match(/<link\s+rel=["']sitemap["'][^>]*href=["'](.*?)["']/i);
    assert(sitemapMatch && sitemapMatch[1] === 'https://logbookplus.co.in/sitemap.xml', `public/${r.path} has clean absolute sitemap link (not base64 data URL)`);

    // Meta description
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    assert(descMatch && descMatch[1].length > 30, `public/${r.path} has valid meta description (${descMatch ? descMatch[1].length : 0} chars)`);

    // Open Graph Tags
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
    const ogUrlMatch = html.match(/<meta\s+property=["']og:url["']\s+content=["'](.*?)["']/i);
    assert(ogTitleMatch && ogUrlMatch && ogUrlMatch[1] === r.canonical, `public/${r.path} has matching og:title and og:url`);

    // Structured Data (JSON-LD)
    const jsonLdMatch = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    assert(jsonLdMatch !== null, `public/${r.path} has JSON-LD structured data script`);
    if (jsonLdMatch) {
      try {
        const parsed = JSON.parse(jsonLdMatch[1]);
        assert(Array.isArray(parsed) && parsed.length > 0, `public/${r.path} structured data is valid JSON array`);
      } catch (e) {
        assert(false, `public/${r.path} structured data failed JSON parse: ${e.message}`);
      }
    }

    // Semantic content inside root div
    const rootMatch = html.match(/<div\s+id=["']root["']>([\s\S]*?)<\/div>/i);
    assert(rootMatch && rootMatch[1].trim().length > 50, `public/${r.path} contains prerendered semantic HTML content`);
  }

  assert(seenTitles.size === routesToInspect.length, `All ${routesToInspect.length} tested routes have distinct unique titles`);
  assert(seenCanonicals.size === routesToInspect.length, `All ${routesToInspect.length} tested routes have distinct unique canonical URLs`);

  // 4. Live Server HTTP Response Verification
  console.log('\n--- SUITE 4: Live Server HTTP Response & Redirect Tests ---');

  // Launch a test server instance using express from server.js
  const express = require('express');
  const testApp = express();
  const PORT = 52919;

  // Emulate server.js middleware stack for test verification
  const { ROUTE_ALIASES, getSeoForPath } = require('../utils/seoData');
  const { renderHtmlForRoute } = require('../utils/seoEngine');

  // Trailing slash redirect
  testApp.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    const rawPath = req.path;
    if (rawPath.startsWith('/api') || rawPath.startsWith('/assets') || rawPath.startsWith('/dist-assets') || rawPath.includes('.')) {
      return next();
    }
    if (rawPath.length > 1 && rawPath.endsWith('/')) {
      const cleanPath = rawPath.replace(/\/+$/, '');
      const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
      return res.redirect(301, cleanPath + queryString);
    }
    const cleanLower = rawPath.toLowerCase();
    if (ROUTE_ALIASES[cleanLower]) {
      const target = ROUTE_ALIASES[cleanLower];
      const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
      return res.redirect(301, target + queryString);
    }
    next();
  });

  testApp.use(express.static(path.join(__dirname, '..', 'public'), { redirect: false, index: false }));

  testApp.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    const seo = getSeoForPath(req.path);
    if (seo) {
      const cleanPath = req.path.replace(/^\/|\/$/g, '');
      const prerenderFile = req.path === '/'
        ? path.join(__dirname, '..', 'public', 'index.html')
        : path.join(__dirname, '..', 'public', cleanPath, 'index.html');
      if (fs.existsSync(prerenderFile)) {
        return res.sendFile(prerenderFile);
      }
      const baseTemplate = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
      const renderedHtml = renderHtmlForRoute(baseTemplate, req.path);
      res.type('text/html; charset=utf-8');
      return res.send(renderedHtml);
    }
    res.status(404);
    const notFoundPage = path.join(__dirname, '..', 'public', '404.html');
    if (fs.existsSync(notFoundPage)) {
      return res.sendFile(notFoundPage);
    }
    res.send('404 Not Found');
  });

  const server = http.createServer(testApp);
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));

  function makeRequest(urlPath) {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: PORT,
        path: urlPath,
        method: 'GET'
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
      });
      req.on('error', reject);
      req.end();
    });
  }

  // Test 1: 301 trailing slash redirect
  const slashRes = await makeRequest('/pricing/');
  assert(slashRes.statusCode === 301 && slashRes.headers.location === '/pricing', 'GET /pricing/ returns 301 Redirect to /pricing');

  // Test 2: 301 alias redirect
  const faqRes = await makeRequest('/faq');
  assert(faqRes.statusCode === 301 && faqRes.headers.location === '/help-center', 'GET /faq returns 301 Redirect to /help-center');

  const docsRes = await makeRequest('/docs');
  assert(docsRes.statusCode === 301 && docsRes.headers.location === '/documentation', 'GET /docs returns 301 Redirect to /documentation');

  // Test 3: Public route returns 200 with tailored content
  const pricingRes = await makeRequest('/pricing');
  assert(pricingRes.statusCode === 200, 'GET /pricing returns HTTP 200 OK');
  assert(pricingRes.body.includes('<title>Pricing &amp; Plans'), 'GET /pricing contains tailored pricing title');
  assert(pricingRes.body.includes('https://logbookplus.co.in/pricing'), 'GET /pricing contains correct canonical URL');

  // Test 4: Dynamic blog post returns 200
  const blogRes = await makeRequest('/blog/why-local-first-database-design-matters');
  assert(blogRes.statusCode === 200, 'GET /blog/why-local-first-database-design-matters returns HTTP 200 OK');
  assert(blogRes.body.includes('Why Local-First Database Design Matters'), 'Blog article response contains tailored headline');

  // Test 5: Unknown path returns HTTP 404 (True 404, not soft 404)
  const notFoundRes = await makeRequest('/some-completely-invalid-page-xyz');
  assert(notFoundRes.statusCode === 404, 'GET /some-completely-invalid-page-xyz returns true HTTP 404 status');

  // Test 6: robots.txt and sitemap.xml
  const robotsRes = await makeRequest('/robots.txt');
  assert(robotsRes.statusCode === 200, 'GET /robots.txt returns HTTP 200 OK');

  const sitemapRes = await makeRequest('/sitemap.xml');
  assert(sitemapRes.statusCode === 200, 'GET /sitemap.xml returns HTTP 200 OK');

  await new Promise(resolve => server.close(resolve));

  console.log('\n====================================================');
  console.log(` SEO TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSeoTests().catch(err => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
