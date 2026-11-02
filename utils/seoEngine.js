// utils/seoEngine.js
// High-Performance HTML Prerendering & SEO Metadata Injection Engine
const { BASE_URL, DEFAULT_OG_IMAGE, getSeoForPath } = require('./seoData');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function injectSeoIntoHtml(templateHtml, seoData) {
  if (!templateHtml || !seoData) return templateHtml;

  let html = templateHtml;

  // 1. Title Tag
  const titleTag = `<title>${escapeHtml(seoData.title)}</title>`;
  if (/<title>.*?<\/title>/i.test(html)) {
    html = html.replace(/<title>.*?<\/title>/i, titleTag);
  } else {
    html = html.replace('</head>', `  ${titleTag}\n</head>`);
  }

  // 2. Meta Description
  const metaDescTag = `<meta name="description" content="${escapeHtml(seoData.description)}" />`;
  if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, metaDescTag);
  } else {
    html = html.replace('</head>', `  ${metaDescTag}\n</head>`);
  }

  // 3. Canonical Tag
  const canonicalTag = `<link rel="canonical" href="${seoData.canonical}" />`;
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `  ${canonicalTag}\n</head>`);
  }

  // 4. Sitemap Link (Ensure absolute canonical URL, never base64 data URI)
  const sitemapTag = `<link rel="sitemap" type="application/xml" title="Sitemap" href="${BASE_URL}/sitemap.xml" />`;
  if (/<link\s+rel=["']sitemap["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel=["']sitemap["'][^>]*>/i, sitemapTag);
  } else {
    html = html.replace('</head>', `  ${sitemapTag}\n</head>`);
  }

  // 5. Open Graph Meta Tags
  const ogTitle = `<meta property="og:title" content="${escapeHtml(seoData.title)}" />`;
  const ogDesc = `<meta property="og:description" content="${escapeHtml(seoData.description)}" />`;
  const ogUrl = `<meta property="og:url" content="${seoData.canonical}" />`;
  const ogType = `<meta property="og:type" content="${seoData.ogType || 'website'}" />`;
  const ogImage = `<meta property="og:image" content="${seoData.ogImage || DEFAULT_OG_IMAGE}" />`;

  html = html.replace(/<meta\s+property=["']og:title["'][^>]*>/i, ogTitle);
  html = html.replace(/<meta\s+property=["']og:description["'][^>]*>/i, ogDesc);
  html = html.replace(/<meta\s+property=["']og:url["'][^>]*>/i, ogUrl);
  html = html.replace(/<meta\s+property=["']og:type["'][^>]*>/i, ogType);
  html = html.replace(/<meta\s+property=["']og:image["'][^>]*>/i, ogImage);

  // 6. Twitter Card Meta Tags
  const twTitle = `<meta name="twitter:title" content="${escapeHtml(seoData.title)}" />`;
  const twDesc = `<meta name="twitter:description" content="${escapeHtml(seoData.description)}" />`;
  const twUrl = `<meta name="twitter:url" content="${seoData.canonical}" />`;
  const twImage = `<meta name="twitter:image" content="${seoData.ogImage || DEFAULT_OG_IMAGE}" />`;

  html = html.replace(/<meta\s+name=["']twitter:title["'][^>]*>/i, twTitle);
  html = html.replace(/<meta\s+name=["']twitter:description["'][^>]*>/i, twDesc);
  html = html.replace(/<meta\s+name=["']twitter:url["'][^>]*>/i, twUrl);
  html = html.replace(/<meta\s+name=["']twitter:image["'][^>]*>/i, twImage);

  // 7. Structured Data (JSON-LD)
  if (seoData.structuredData && Array.isArray(seoData.structuredData)) {
    // Remove existing schema script if any
    html = html.replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
    const jsonLdTag = `  <script type="application/ld+json" id="structured-data-jsonld">\n${JSON.stringify(seoData.structuredData, null, 2)}\n  </script>\n`;
    html = html.replace('</head>', `${jsonLdTag}</head>`);
  }

  // 8. Semantic Content inside <div id="root">
  if (seoData.semanticContent) {
    const rootPattern = /<div id=["']root["']>([\s\S]*?)<\/div>/i;
    const semanticWrap = `<div id="root">${seoData.semanticContent}</div>`;
    html = html.replace(rootPattern, semanticWrap);
  }

  return html;
}

function renderHtmlForRoute(baseHtmlTemplate, reqPath) {
  const seo = getSeoForPath(reqPath);
  if (!seo) return null;
  return injectSeoIntoHtml(baseHtmlTemplate, seo);
}

module.exports = {
  escapeHtml,
  injectSeoIntoHtml,
  renderHtmlForRoute
};

