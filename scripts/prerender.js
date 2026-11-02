// scripts/prerender.js
// Static Prerenderer for Logbook Plus Public Routes & Blog Articles
const fs = require('fs');
const path = require('path');
const { BASE_URL, STATIC_ROUTES, getPublishedBlogs, getSeoForPath } = require('../utils/seoData');
const { injectSeoIntoHtml } = require('../utils/seoEngine');

function runPrerender() {
  console.log('====================================================');
  console.log('   LOGBOOK PLUS - STATIC PRERENDER & SEO BUILDER    ');
  console.log('====================================================');

  const publicDir = path.join(__dirname, '..', 'public');
  const indexHtmlPath = path.join(publicDir, 'index.html');

  if (!fs.existsSync(indexHtmlPath)) {
    console.error(`[prerender] Error: Base template not found at ${indexHtmlPath}. Run vite build first.`);
    process.exit(1);
  }

  const baseTemplate = fs.readFileSync(indexHtmlPath, 'utf8');
  let prerenderCount = 0;

  // 1. Prerender Homepage into public/index.html
  const homeSeo = getSeoForPath('/');
  if (homeSeo) {
    const homeHtml = injectSeoIntoHtml(baseTemplate, homeSeo);
    fs.writeFileSync(indexHtmlPath, homeHtml, 'utf8');
    console.log(`  [OK] Prerendered: / -> public/index.html`);
    prerenderCount++;
  }

  // 2. Prerender All Public Static Routes
  for (const [routePath, seoData] of Object.entries(STATIC_ROUTES)) {
    if (routePath === '/') continue;

    const routeDirName = routePath.replace(/^\/+/, '');
    const targetDir = path.join(publicDir, routeDirName);
    fs.mkdirSync(targetDir, { recursive: true });

    const routeHtml = injectSeoIntoHtml(baseTemplate, { ...seoData, path: routePath });
    const targetFile = path.join(targetDir, 'index.html');
    fs.writeFileSync(targetFile, routeHtml, 'utf8');
    console.log(`  [OK] Prerendered: ${routePath} -> public/${routeDirName}/index.html`);
    prerenderCount++;
  }

  // 3. Prerender All Published Blog Articles
  const blogs = getPublishedBlogs();
  console.log(`\n  Prerendering ${blogs.length} blog article(s)...`);

  for (const blog of blogs) {
    const blogPath = `/blog/${blog.slug}`;
    const blogSeo = getSeoForPath(blogPath);
    if (blogSeo) {
      const blogDir = path.join(publicDir, 'blog', blog.slug);
      fs.mkdirSync(blogDir, { recursive: true });

      const blogHtml = injectSeoIntoHtml(baseTemplate, blogSeo);
      const targetFile = path.join(blogDir, 'index.html');
      fs.writeFileSync(targetFile, blogHtml, 'utf8');
      console.log(`  [OK] Prerendered: ${blogPath} -> public/blog/${blog.slug}/index.html`);
      prerenderCount++;
    }
  }

  // 4. Generate Valid XML Sitemap
  console.log('\n  Generating canonical XML sitemap...');
  let xmlUrls = [];

  // Home
  xmlUrls.push(`  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${STATIC_ROUTES['/'].lastmod}</lastmod>
    <changefreq>${STATIC_ROUTES['/'].changefreq}</changefreq>
    <priority>${STATIC_ROUTES['/'].priority}</priority>
  </url>`);

  // Static Routes
  for (const [routePath, seoData] of Object.entries(STATIC_ROUTES)) {
    if (routePath === '/') continue;
    xmlUrls.push(`  <url>
    <loc>${BASE_URL}${routePath}</loc>
    <lastmod>${seoData.lastmod}</lastmod>
    <changefreq>${seoData.changefreq}</changefreq>
    <priority>${seoData.priority}</priority>
  </url>`);
  }

  // Blog Articles
  for (const blog of blogs) {
    const blogPath = `/blog/${blog.slug}`;
    const pubDate = blog.date || (blog.createdAt ? new Date(blog.createdAt).toISOString().split('T')[0] : '2026-03-15');
    xmlUrls.push(`  <url>
    <loc>${BASE_URL}${blogPath}</loc>
    <lastmod>${pubDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

${xmlUrls.join('\n\n')}

</urlset>
`;

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');
  fs.writeFileSync(path.join(__dirname, '..', 'sitemap.xml'), sitemapXml, 'utf8');
  console.log(`  [OK] Generated sitemap.xml with ${xmlUrls.length} canonical URLs`);

  // 5. Generate Standard robots.txt
  console.log('\n  Writing hardened, standard robots.txt...');
  const robotsTxt = `# Robots.txt for Logbook Plus
# Official Site: https://logbookplus.co.in
# Configured for Google Search Console & Search Engine Crawlers

User-agent: *
Allow: /
Allow: /assets/
Allow: /dist-assets/
Allow: /sitemap.xml
Allow: /llms.txt

# Disallow private user vault dashboard
Disallow: /app/dashboard
Disallow: /app/dashboard/

# Disallow backend APIs
Disallow: /api/

# Disallow administrative and helpdesk internal consoles
Disallow: /master
Disallow: /master/
Disallow: /helpdesk
Disallow: /helpdesk/
Disallow: /dev
Disallow: /dev/

# Conventional XML Sitemap
Sitemap: ${BASE_URL}/sitemap.xml
`;

  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf8');
  fs.writeFileSync(path.join(__dirname, '..', 'robots.txt'), robotsTxt, 'utf8');
  console.log(`  [OK] Generated robots.txt`);

  console.log('====================================================');
  console.log(` PRERENDER COMPLETE: ${prerenderCount} ROUTES GENERATED`);
  console.log('====================================================\n');
}

if (require.main === module) {
  runPrerender();
}

module.exports = { runPrerender };

