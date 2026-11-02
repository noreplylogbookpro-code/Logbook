// scripts/test-phase3-validation.js
// Automated verification suite for Phase 3 UI/UX, Performance, Accessibility & CRO
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('====================================================');
console.log('   LOGBOOK PLUS - PHASE 3 UI/UX & PERFORMANCE SUITE ');
console.log('====================================================');

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

// SUITE 1: Android App Real Screenshots Verification
console.log('\n--- SUITE 1: Android App Real Screenshots & WebP Optimization ---');
const screenshotsDir = path.join(__dirname, '..', 'assets', 'images', 'screenshots');
const publicScreenshotsDir = path.join(__dirname, '..', 'public', 'assets', 'images', 'screenshots');

assert(fs.existsSync(screenshotsDir), 'assets/images/screenshots directory exists');
assert(fs.existsSync(publicScreenshotsDir), 'public/assets/images/screenshots directory exists');

const REQUIRED_SCREENSHOTS = [
  'light_02_dashboard.webp',
  'dark_02_dashboard.webp',
  'light_03_home.webp',
  'dark_03_home.webp',
  'light_10_grid.webp',
  'dark_10_grid.webp',
  'light_11_edit_entry.webp',
  'dark_11_edit_entry.webp',
  'light_04_export.webp',
  'dark_04_export.webp',
  'light_12_backup_settings.webp',
  'dark_12_backup_settings.webp'
];

for (const sc of REQUIRED_SCREENSHOTS) {
  const filePath = path.join(screenshotsDir, sc);
  const pubFilePath = path.join(publicScreenshotsDir, sc);
  const exists = fs.existsSync(filePath) && fs.existsSync(pubFilePath);
  assert(exists, `Screenshot exists in both assets and public: ${sc}`);

  if (exists) {
    const stat = fs.statSync(filePath);
    assert(stat.size < 65000, `Optimized WebP file size < 65KB: ${sc} (${(stat.size / 1024).toFixed(1)}KB)`);
  }
}

// SUITE 2: Visual Brand & Accessibility in CSS
console.log('\n--- SUITE 2: Brand Color (#2467B9), Focus Visible & Reduced Motion ---');
const cssPath = path.join(__dirname, '..', 'src', 'index.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert(cssContent.includes('#2467B9'), 'CSS contains Logbook Plus brand blue #2467B9');
assert(cssContent.includes('--brand-blue: #2467B9'), 'CSS registers --brand-blue token');
assert(cssContent.includes(':focus-visible'), 'CSS defines visible keyboard focus-visible indicator');
assert(cssContent.includes('prefers-reduced-motion'), 'CSS defines @media (prefers-reduced-motion: reduce)');
assert(cssContent.includes('touch-target-min'), 'CSS defines accessible touch target utilities');

// SUITE 3: Accessibility Landmarks & Skip Link in React Components
console.log('\n--- SUITE 3: Accessibility Landmarks, Roles & Skip Links ---');
const appJsx = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');

assert(appJsx.includes('href="#main-content"'), 'App.jsx contains Skip-to-content accessibility link');
assert(appJsx.includes('id="main-content"'), 'App.jsx contains <main id="main-content"> landmark');
assert(appJsx.includes('role="banner"'), 'Header has role="banner" semantic landmark');
assert(appJsx.includes('aria-label="Main Navigation"'), 'Desktop <nav> has accessible aria-label');
assert(appJsx.includes('aria-label="Mobile Navigation"'), 'Mobile drawer <nav> has accessible aria-label');
assert(appJsx.includes('aria-expanded'), 'Mobile menu toggle button has aria-expanded attribute');

const showcaseJsx = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'AppShowcase.jsx'), 'utf8');
assert(showcaseJsx.includes('role="tablist"'), 'AppShowcase defines role="tablist"');
assert(showcaseJsx.includes('role="tab"'), 'AppShowcase defines role="tab" controls');
assert(showcaseJsx.includes('role="tabpanel"'), 'AppShowcase defines role="tabpanel" content');
assert(showcaseJsx.includes('aria-selected'), 'AppShowcase tabs have dynamic aria-selected');

const faqJsx = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'HomeFaq.jsx'), 'utf8');
assert(faqJsx.includes('aria-expanded'), 'HomeFaq accordion items have aria-expanded');
assert(faqJsx.includes('aria-controls'), 'HomeFaq accordion buttons have aria-controls');

// SUITE 4: Google Play Links & CRO Verification
console.log('\n--- SUITE 4: Google Play Listing & CRO Elements ---');
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.logbookplus';

assert(appJsx.includes(PLAY_STORE_URL), 'App.jsx contains verified Google Play URL');
assert(showcaseJsx.includes(PLAY_STORE_URL), 'AppShowcase.jsx links to verified Google Play URL');

const heroJsx = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'Hero.jsx'), 'utf8');
assert(heroJsx.includes(PLAY_STORE_URL), 'Hero.jsx links to verified Google Play URL');
assert(heroJsx.includes('heroScreenshot'), 'Hero.jsx uses real Android app dashboard screenshot');
assert(heroJsx.includes('aspect-[9/20]'), 'Hero.jsx specifies 9:20 aspect ratio to eliminate CLS');

const mobileBarJsx = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'MobileInstallBar.jsx'), 'utf8');
assert(mobileBarJsx.includes(PLAY_STORE_URL), 'MobileInstallBar.jsx links to verified Google Play URL');
assert(mobileBarJsx.includes('sessionStorage'), 'MobileInstallBar respects user dismissal with sessionStorage');

// SUITE 5: Caching Headers & Server Performance Policies
console.log('\n--- SUITE 5: Caching Headers & Immutable Bundle Configuration ---');
const serverJs = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

assert(serverJs.includes("app.use('/dist-assets'"), 'server.js explicitly mounts /dist-assets static handler');
assert(serverJs.includes("immutable: true"), 'server.js configures immutable: true for hashed dist assets');
assert(serverJs.includes("maxAge: '1y'"), 'server.js configures 1-year maxAge for hashed dist assets');
assert(serverJs.includes("max-age=0, must-revalidate"), 'server.js enforces immediate HTML revalidation');

const htaccess = fs.readFileSync(path.join(__dirname, '..', '.htaccess'), 'utf8');
assert(htaccess.includes('max-age=31536000, immutable'), '.htaccess enforces 1-year immutable caching for static assets');
assert(htaccess.includes('max-age=0, must-revalidate'), '.htaccess enforces immediate HTML revalidation');

// SUITE 6: Prerendered HTML Inspection
console.log('\n--- SUITE 6: Prerendered HTML Quality & Heading Hierarchy ---');
const publicIndex = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

assert(publicIndex.includes(PLAY_STORE_URL), 'public/index.html includes Google Play link in prerendered HTML');
assert(publicIndex.includes('Expense Intelligence That Stays Yours'), 'public/index.html contains H1 title');
assert(publicIndex.includes('Local Encrypted Database'), 'public/index.html contains features');
assert(publicIndex.includes('Frequently Asked Questions'), 'public/index.html contains FAQ');

console.log('\n====================================================');
console.log(` PHASE 3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) process.exit(1);

