// post-build.js
const fs = require('fs');
const path = require('path');
const { runPrerender } = require('./prerender');

const publicDir = path.join(__dirname, '..', 'public');
const indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');

// Just log the active assets for reference
const cssMatch = indexHtml.match(/dist-assets\/(index-[A-Za-z0-9_-]+\.css)/);
const jsMatch = indexHtml.match(/dist-assets\/(index-[A-Za-z0-9_-]+\.js)/);

console.log(`[post-build] Entry JS:  ${jsMatch ? jsMatch[1] : 'not found'}`);
console.log(`[post-build] Entry CSS: ${cssMatch ? cssMatch[1] : 'not found'}`);

const distAssetsDir = path.join(publicDir, 'dist-assets');
if (fs.existsSync(distAssetsDir)) {
  const files = fs.readdirSync(distAssetsDir);
  console.log(`[post-build] Total active files in dist-assets/: ${files.length}`);
}

// Sync static assets to public/assets for standalone hosting
const assetsSrc = path.join(__dirname, '..', 'assets');
const assetsDest = path.join(publicDir, 'assets');
if (fs.existsSync(assetsSrc)) {
  fs.cpSync(assetsSrc, assetsDest, { recursive: true });
}

// Execute static HTML prerendering and SEO generation
runPrerender();
