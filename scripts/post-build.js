// post-build.js
// Cleanup is now handled by the cleanDistAssets() Vite plugin in vite.config.js
// which runs automatically before each build. No post-build cleanup needed.

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');

// Just log the active assets for reference — no deletions
const cssMatch = indexHtml.match(/dist-assets\/(index-[A-Za-z0-9_-]+\.css)/);
const jsMatch = indexHtml.match(/dist-assets\/(index-[A-Za-z0-9_-]+\.js)/);

console.log(`[post-build] Entry JS:  ${jsMatch ? jsMatch[1] : 'not found'}`);
console.log(`[post-build] Entry CSS: ${cssMatch ? cssMatch[1] : 'not found'}`);

const distAssetsDir = path.join(publicDir, 'dist-assets');
if (fs.existsSync(distAssetsDir)) {
  const files = fs.readdirSync(distAssetsDir);
  console.log(`[post-build] Total files in dist-assets/: ${files.length}`);
}
