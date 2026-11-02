// scripts/generate-screenshots.js
// Automated WebP generator for Android App Screenshots
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcDir = 'd:/Unkno/AndroidStudioProjects/logbookplus/screenshots';
const assetDir = path.join(__dirname, '..', 'assets', 'images', 'screenshots');
const publicAssetDir = path.join(__dirname, '..', 'public', 'assets', 'images', 'screenshots');

const SCREENSHOT_FILES = [
  'light_02_dashboard.png',
  'dark_02_dashboard.png',
  'light_03_home.png',
  'dark_03_home.png',
  'light_10_grid.png',
  'dark_10_grid.png',
  'light_11_edit_entry.png',
  'dark_11_edit_entry.png',
  'light_04_export.png',
  'dark_04_export.png',
  'light_12_backup_settings.png',
  'dark_12_backup_settings.png'
];

async function generateScreenshots() {
  if (!fs.existsSync(srcDir)) {
    console.log('[screenshots] Source Android screenshots directory not found. Skipping generation.');
    return;
  }

  fs.mkdirSync(assetDir, { recursive: true });
  fs.mkdirSync(publicAssetDir, { recursive: true });

  console.log('[screenshots] Processing and optimizing Android app screenshots to WebP...');

  for (const file of SCREENSHOT_FILES) {
    const srcFile = path.join(srcDir, file);
    if (!fs.existsSync(srcFile)) continue;

    const baseName = file.replace('.png', '.webp');
    const destFile = path.join(assetDir, baseName);
    const pubDestFile = path.join(publicAssetDir, baseName);

    // Resize to high-DPI width: 720px (720x1600 aspect 9:20), WebP quality 82
    await sharp(srcFile)
      .resize({ width: 720, withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(destFile);

    fs.copyFileSync(destFile, pubDestFile);
    const stat = fs.statSync(destFile);
    console.log(`  [OK] ${baseName} -> ${(stat.size / 1024).toFixed(1)} KB (720x1600)`);
  }
  console.log('[screenshots] All screenshots successfully generated.');
}

if (require.main === module) {
  generateScreenshots().catch(err => {
    console.error('[screenshots] Error generating screenshots:', err);
    process.exit(1);
  });
}

module.exports = { generateScreenshots };

