const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');

// 1. Identify active asset hashes from the fresh index.html
const activeFiles = [];
const cssMatch = indexHtml.match(/dist-assets\/(index-[A-Za-z0-9_-]+\.css)/);
if (cssMatch) activeFiles.push(cssMatch[1]);
const jsMatch = indexHtml.match(/dist-assets\/(index-[A-Za-z0-9_-]+\.js)/);
if (jsMatch) activeFiles.push(jsMatch[1]);

console.log(`Active bundle assets: ${activeFiles.join(', ')}`);

// 2. Clean up obsolete hashed asset files
const distAssetsDir = path.join(publicDir, 'dist-assets');
if (fs.existsSync(distAssetsDir)) {
  const files = fs.readdirSync(distAssetsDir);
  files.forEach((file) => {
    if (file.startsWith('index-') && (file.endsWith('.js') || file.endsWith('.css'))) {
      if (!activeFiles.includes(file)) {
        try {
          fs.unlinkSync(path.join(distAssetsDir, file));
          console.log(`Deleted obsolete build asset: dist-assets/${file}`);
        } catch (err) {
          console.error(`Failed to delete obsolete asset ${file}:`, err.message);
        }
      }
    }
  });
}


