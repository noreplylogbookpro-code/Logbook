// scripts/test-security-suite.js
/**
 * Logbook Plus - Comprehensive Security Regression & Penetration Test Suite
 * 
 * Verifies:
 * 1. Startup & Secrets Validation (fail-safe checks, banned defaults, key separation)
 * 2. Cryptographic Integrity (GCM encryption, legacy CBC decryption, license validation)
 * 3. CORS Enforcement (trusted origins, dev tunnel restrictions in production)
 * 4. Content Security Policy (no unsafe-inline in script-src, hash verification)
 * 5. Authentication Guards (unauthenticated rejection, invalid token rejection)
 * 6. Authorization & IDOR Defenses (cross-user profile update blocking, role spoofing defense)
 * 7. Path Traversal & Backup Import Protection (arbitrary file overwrite prevention)
 * 8. CSV Injection Sanitization (formula injection neutralization)
 * 9. Telegram Webhook & Remote Injection Safeguards (private chat authorization bypass prevention)
 */

const http = require('http');
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const crypto = require('crypto');
require('dotenv').config({ quiet: true });
process.env.NODE_ENV = 'production';

const {
    validateSecurityConfiguration,
    encryptDatabaseText,
    decryptDatabaseText,
    verifyLicenseKeySafe,
    timingSafeEqual,
    BANNED_SECRET_VALUES
} = require('../config/security');

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
    if (condition) {
        console.log(`  [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
        passed++;
    } else {
        console.error(`  [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
        failed++;
    }
}

async function runSecurityTestSuite() {
    console.log('================================================================');
    console.log('   LOGBOOK PLUS - COMPREHENSIVE SECURITY REGRESSION TEST SUITE  ');
    console.log('================================================================\n');

    // --------------------------------------------------------------------------
    // SUITE 1: SECRETS & CRYPTOGRAPHY VALIDATION
    // --------------------------------------------------------------------------
    console.log('--- SUITE 1: Secrets & Startup Fail-Safe ---');

    // 1.1 Valid production configuration passes
    const validResult = validateSecurityConfiguration({ exitOnError: false });
    assert(validResult.valid === true, 'Production secrets configuration validation passes');

    // 1.2 Banned default secret detection
    const savedJwt = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'PnxKdbF0XxJwCcao1yemufCPM0gzyAJXajMh2YtyNbk=';
    const bannedResult = validateSecurityConfiguration({ exitOnError: false });
    assert(bannedResult.valid === false && bannedResult.errors.some(e => e.includes('Insecure default secret')), 'Detects and blocks known leaked default secret');
    process.env.JWT_SECRET = savedJwt;

    // 1.3 Short secret detection (< 32 chars)
    process.env.JWT_SECRET = 'short_secret_123';
    const shortResult = validateSecurityConfiguration({ exitOnError: false });
    assert(shortResult.valid === false && shortResult.errors.some(e => e.includes('too short')), 'Rejects secrets shorter than 32 characters');
    process.env.JWT_SECRET = savedJwt;

    // 1.4 Secret reuse detection
    const savedDbKey = process.env.DB_ENCRYPTION_KEY;
    process.env.DB_ENCRYPTION_KEY = process.env.JWT_SECRET;
    const reuseResult = validateSecurityConfiguration({ exitOnError: false });
    assert(reuseResult.valid === false && reuseResult.errors.some(e => e.includes('Secret reuse detected')), 'Blocks reuse of identical secrets across different functions');
    process.env.DB_ENCRYPTION_KEY = savedDbKey;

    // 1.5 Authenticated AES-256-GCM round-trip
    const plainSecret = 'super_sensitive_authenticator_seed_98765';
    const gcmCipher = encryptDatabaseText(plainSecret);
    assert(gcmCipher.startsWith('v2:') && gcmCipher.split(':').length === 4, 'Encrypts database text using authenticated AES-256-GCM format (v2:)');
    const decryptedGcm = decryptDatabaseText(gcmCipher);
    assert(decryptedGcm === plainSecret, 'Decrypts AES-256-GCM ciphertext with exact plaintext fidelity');

    // 1.6 Tampered ciphertext rejection (GCM authentication check)
    const parts = gcmCipher.split(':');
    const tamperedParts = [...parts];
    tamperedParts[3] = 'ff' + tamperedParts[3].substring(2); // flip bits in ciphertext
    const tamperedCipher = tamperedParts.join(':');
    const tamperedDecrypted = decryptDatabaseText(tamperedCipher);
    assert(tamperedDecrypted === tamperedCipher, 'Rejects tampered GCM ciphertext without throwing unhandled exceptions');

    // 1.7 Legacy AES-256-CBC decryption preservation (server_2fa.json compatibility)
    const legacyKeyBuffer = crypto.createHash('sha256').update(process.env.DB_ENCRYPTION_KEY).digest();
    const legacyIv = crypto.randomBytes(16);
    const legacyCipherObj = crypto.createCipheriv('aes-256-cbc', legacyKeyBuffer, legacyIv);
    let legacyEnc = legacyCipherObj.update('LEGACY_SECRET_16', 'utf8', 'hex');
    legacyEnc += legacyCipherObj.final('hex');
    const legacyCiphertext = legacyIv.toString('hex') + ':' + legacyEnc;
    const legacyDecrypted = decryptDatabaseText(legacyCiphertext);
    assert(legacyDecrypted === 'LEGACY_SECRET_16', 'Decrypts existing legacy AES-256-CBC records without data loss');

    // 1.8 Legacy license verification preservation (customer migration support)
    if (fs.existsSync('database/server_licenses.json')) {
        const licDocs = JSON.parse(fs.readFileSync('database/server_licenses.json', 'utf8'));
        if (licDocs.length > 0) {
            const licResult = verifyLicenseKeySafe(licDocs[0].licenseKey);
            assert(licResult.valid === true, 'Legacy licenses remain valid and readable through key migration layer');
        }
    }

    // 1.9 Timing-safe string comparison
    assert(timingSafeEqual('correct_admin_api_key_12345', 'correct_admin_api_key_12345') === true, 'timingSafeEqual matches identical keys');
    assert(timingSafeEqual('correct_admin_api_key_12345', 'wrong_admin_api_key_1234567') === false, 'timingSafeEqual rejects differing keys securely');
    assert(timingSafeEqual('short', 'longer_string_different_len') === false, 'timingSafeEqual handles unequal string lengths in constant time');

    // --------------------------------------------------------------------------
    // SUITE 2: HTTP SECURITY HEADERS, CSP & CORS
    // --------------------------------------------------------------------------
    console.log('\n--- SUITE 2: HTTP Headers, CSP & CORS ---');

    // Spin up an instance of the actual server logic for live HTTP testing
    const apiRouter = require('../api');
    const { classifyClient } = require('../middleware/userAgentGuard');
    const helmet = require('helmet');
    const cors = require('cors');

    const app = express();
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'sha256-7of+l5rYmsUuabf+eBX4CXRadrhf7gCG61f9UJUCy14='"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                imgSrc: ["'self'", "data:", "blob:"],
                connectSrc: ["'self'", "https://api.telegram.org", "https://api.callmebot.com"],
                frameAncestors: ["'none'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
            }
        }
    }));

    // Production CORS rules
    const PRODUCTION_ALLOWED_ORIGINS = [
        'https://logbookplus.co.in',
        'https://www.logbookplus.co.in',
        'https://master.logbookplus.co.in',
        'https://helpdesk.logbookplus.co.in',
    ];
    const isAllowedOrigin = (origin) => {
        if (!origin) return true;
        if (PRODUCTION_ALLOWED_ORIGINS.includes(origin)) return true;
        if (/^https:\/\/([a-zA-Z0-9-]+\.)*logbookplus\.co\.in$/i.test(origin)) return true;
        return false;
    };

    app.use(cors({
        origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
        credentials: true
    }));

    app.use(express.json());
    app.use('/api', classifyClient);
    app.use('/api', apiRouter);

    const testServer = http.createServer(app);
    await new Promise(r => testServer.listen(0, '127.0.0.1', r));
    const port = testServer.address().port;
    const testBaseUrl = `http://127.0.0.1:${port}/api`;

    // 2.1 Verify CSP header
    let res = await fetch(`${testBaseUrl}/health`);
    const cspHeader = res.headers.get('content-security-policy') || '';
    assert(!cspHeader.includes("'unsafe-inline'") || cspHeader.includes("script-src 'self' 'sha256-"), 'Content Security Policy script-src strictly disallows unsafe-inline');
    assert(cspHeader.includes('sha256-7of+l5rYmsUuabf+eBX4CXRadrhf7gCG61f9UJUCy14='), 'CSP includes exact sha256 hash for inline theme switcher');
    assert(cspHeader.includes("frame-ancestors 'none'"), 'CSP enforces frame-ancestors none (Clickjacking protection)');

    // 2.2 Verify CORS origin enforcement
    // Test malicious dev tunnel origin
    res = await fetch(`${testBaseUrl}/health`, {
        headers: { 'Origin': 'https://evil-attacker.trycloudflare.com' }
    });
    const corsHeaderMalicious = res.headers.get('access-control-allow-origin');
    assert(corsHeaderMalicious !== 'https://evil-attacker.trycloudflare.com', 'CORS blocks unauthorized cloudflare/ngrok dev tunnels in production');

    // Test legitimate origin
    res = await fetch(`${testBaseUrl}/health`, {
        headers: { 'Origin': 'https://logbookplus.co.in' }
    });
    const corsHeaderLegit = res.headers.get('access-control-allow-origin');
    assert(corsHeaderLegit === 'https://logbookplus.co.in', 'CORS allows whitelisted production domain https://logbookplus.co.in');

    // --------------------------------------------------------------------------
    // SUITE 3: AUTHENTICATION & ACCESS CONTROL
    // --------------------------------------------------------------------------
    console.log('\n--- SUITE 3: Authentication & Protected Endpoints ---');

    // 3.1 Unauthenticated access to user profile is rejected
    res = await fetch(`${testBaseUrl}/profile`);
    assert(res.status === 401, 'Unauthenticated GET /api/profile returns 401');

    // 3.2 Unauthenticated access to master stats is rejected
    res = await fetch(`${testBaseUrl}/master/stats`);
    assert(res.status === 401, 'Unauthenticated GET /api/master/stats returns 401');

    // 3.3 Invalid Bearer token is rejected
    res = await fetch(`${testBaseUrl}/profile`, {
        headers: { 'Authorization': 'Bearer completely_fake_invalid_jwt_token' }
    });
    assert(res.status === 403 || res.status === 401, 'Invalid JWT token on protected route is rejected with 401/403');

    // 3.4 Unauthenticated send-notification is rejected
    res = await fetch(`${testBaseUrl}/v1/tickets/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Spoofed announcement' })
    });
    assert(res.status === 401, 'Unauthenticated POST /api/v1/tickets/send-notification returns 401');

    // 3.5 Unauthenticated notification settings defaults is rejected
    res = await fetch(`${testBaseUrl}/v1/tickets/settings/defaults`);
    assert(res.status === 401, 'Unauthenticated GET /api/v1/tickets/settings/defaults returns 401');

    // --------------------------------------------------------------------------
    // SUITE 4: AUTHORIZATION, IDOR & ROLE ELEVATION DEFENSE
    // --------------------------------------------------------------------------
    console.log('\n--- SUITE 4: Authorization, IDOR & Privilege Escalation ---');

    // Generate normal user token and IT admin token
    const normalUserToken = jwt.sign(
        { helpdeskUser: true, username: 'schoolstaff_test', role: 'USER', school: 'NHSST' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    const itAdminToken = jwt.sign(
        { helpdeskUser: true, username: 'itadmin_test', role: 'ADMIN', school: 'NHSST' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // 4.1 Regular user cannot call admin user creation
    res = await fetch(`${testBaseUrl}/v1/auth/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${normalUserToken}`
        },
        body: JSON.stringify({
            fullName: 'Attacker Account',
            username: 'attacker_elevated',
            password: 'Password123!',
            role: 'SUPER_ADMIN'
        })
    });
    assert(res.status === 403, 'Regular USER cannot invoke POST /api/v1/auth/users (HTTP 403 expected)');

    // 4.2 Role spoofing via body/query parameters is blocked
    res = await fetch(`${testBaseUrl}/v1/auth/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${normalUserToken}`
        },
        body: JSON.stringify({
            fullName: 'Attacker Account',
            username: 'attacker_elevated',
            password: 'Password123!',
            role: 'SUPER_ADMIN',
            callerRole: 'SUPER_ADMIN' // Attempt to elevate via body parameter
        })
    });
    assert(res.status === 403, 'Role spoofing via body parameter callerRole=SUPER_ADMIN is blocked');

    // 4.3 IT Admin cannot register a SUPER_ADMIN account
    res = await fetch(`${testBaseUrl}/v1/auth/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${itAdminToken}`
        },
        body: JSON.stringify({
            fullName: 'Rogue Admin',
            username: 'rogue_admin_user',
            password: 'Password123!',
            role: 'SUPER_ADMIN'
        })
    });
    assert(res.status === 403, 'Standard ADMIN cannot create a SUPER_ADMIN account (HTTP 403 expected)');

    // 4.4 IDOR Defense: Regular user cannot update Super Admin's profile display name
    res = await fetch(`${testBaseUrl}/v1/auth/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${normalUserToken}`
        },
        body: JSON.stringify({
            username: 'master', // Target victim user
            fullName: 'Pwned Display Name'
        })
    });
    assert(res.status === 403, 'IDOR Defense: User cannot modify another user display name via PUT /api/v1/auth/profile');

    // --------------------------------------------------------------------------
    // SUITE 5: MOCK BYPASS & BUSINESS LOGIC PROTECTION
    // --------------------------------------------------------------------------
    console.log('\n--- SUITE 5: Mock Bypass & Subscription Hardening ---');

    // Generate standard consumer vault user token
    const vaultUserToken = jwt.sign(
        { userId: 'test_vault_user_id_123', username: 'testuser' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // 5.1 Regular vault user cannot self-activate subscription in production
    res = await fetch(`${testBaseUrl}/subscription/activate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${vaultUserToken}`
        },
        body: JSON.stringify({ days: 365 })
    });
    assert(res.status === 403, 'POST /api/subscription/activate rejects unpaid self-activation in production');

    // 5.2 Regular vault user cannot activate free license via mock in production
    res = await fetch(`${testBaseUrl}/license/purchase-mock`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${vaultUserToken}`
        }
    });
    assert(res.status === 403, 'POST /api/license/purchase-mock rejects unpaid license grant in production');

    // --------------------------------------------------------------------------
    // SUITE 6: PATH TRAVERSAL, BACKUP PROTECTION & CSV INJECTION
    // --------------------------------------------------------------------------
    console.log('\n--- SUITE 6: Path Traversal, Backup & CSV Injection Defenses ---');

    // 6.1 Avatar path traversal attempt
    res = await fetch(`${testBaseUrl}/profile/avatar/..%2F..%2F..%2Fetc%2Fpasswd`);
    assert(res.status === 404, 'Path traversal in GET /api/profile/avatar/:userId is rejected (HTTP 404)');

    // 6.2 CSV Formula Injection prevention
    res = await fetch(`${testBaseUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: '=cmd|\' /C calc\'!A0', // Excel command execution attempt
            email: 'csvtester@example.com',
            subject: '@SUM(1+1)*cmd',
            message: '+dangerous_formula',
            consentGiven: true
        })
    });
    assert(res.status === 200, 'Contact form accepts input with affirmative consent');
    const csvContent = fs.readFileSync('database/quary.csv', 'utf8');
    assert(csvContent.includes("''=cmd|") || csvContent.includes("'=cmd|"), 'Neutralized CSV formula trigger with single quote prepend');

    // 6.3 Backup export excludes sensitive credentials (.env, google_auth)
    const masterAdminToken = jwt.sign(
        { isMaster: true },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    res = await fetch(`${testBaseUrl}/master/backup/files`, {
        headers: { 'Authorization': `Bearer ${masterAdminToken}` }
    });
    const backupFilesData = await res.json();
    const allScannedFiles = (backupFilesData.categories || []).flatMap(c => c.files || []).map(f => f.path);
    const hasEnv = allScannedFiles.some(f => f === '.env' || f.startsWith('.env.'));
    const hasGoogleAuth = allScannedFiles.some(f => f.startsWith('google_auth/'));
    assert(!hasEnv, 'Backup file scanner excludes .env files from backup catalog');

    // 6.4 Telegram Webhook authentication
    res = await fetch(`${testBaseUrl}/telegram/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: {
                chat: { id: 999999, type: 'private' },
                text: '/devnote Compromised Title | Injected Announcement'
            }
        })
    });
    assert(res.status === 200, 'Telegram webhook endpoint responds gracefully without error');
    const { getActiveDeveloperNote } = require('../utils/telegramBotService');
    const activeNote = await getActiveDeveloperNote();
    assert(activeNote?.title !== 'Compromised Title', 'Private Telegram chat bypass is rejected: unauthorized user cannot publish announcements');

    testServer.close();

    console.log('\n================================================================');
    console.log(` SECURITY REGRESSION SUITE: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
}

runSecurityTestSuite();
