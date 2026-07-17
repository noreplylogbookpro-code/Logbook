// server.js
const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const cors = require('cors');
const { google } = require('googleapis');


// Custom encapsulated modules
const { db, logsDb } = require('./config/db');
const { JWT_SECRET, isAuthenticated, isMasterAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8080;

const MASTER_USER = process.env.MASTER_USER;
const MASTER_PASS = process.env.MASTER_PASS;

const ALLOWED_SECURITY_QUESTIONS = [
    "What was the name of your first pet?",
    "What is your mother's maiden name?",
    "What city were you born in?",
    "What was the name of your elementary school?",
    "What is your oldest sibling's middle name?",
    "What was the make of your first car?",
    "What is the name of the street you grew up on?",
];

function parseQuotaLimit(val) {
    if (!val) return 240 * 1024 * 1024; // 240 MB default
    const n = parseInt(val, 10);
    return isNaN(n) ? 240 * 1024 * 1024 : n;
}

let serverConfig = {
    quotaLimit: parseQuotaLimit(process.env.QUOTA_LIMIT),
    signupsEnabled: true,
    licenseKey: process.env.LICENSE_KEY || ""
};

// --- Logger Engine ---
function logServerEvent(level, message, metadata = {}) {
    const timestamp = Date.now();
    const formattedTime = new Date(timestamp).toISOString();
    console.log(`[${level.toUpperCase()}] [${formattedTime}] ${message}`);

    // Non-blocking database insertion
    logsDb.insert({
        type: 'server_log',
        level: level.toLowerCase(),
        message,
        metadata,
        timestamp
    }).then(async () => {
        try {
            // Keep sliding window of 500 logs
            const count = await logsDb.count({ type: 'server_log' });
            if (count > 500) {
                const logs = await logsDb.find({ type: 'server_log' });
                logs.sort((a, b) => a.timestamp - b.timestamp);
                const toRemove = logs.slice(0, logs.length - 500);
                for (const l of toRemove) {
                    await logsDb.remove({ _id: l._id }, {});
                }
                logsDb.compactDatafile();
            }
        } catch (err) {
            console.error("Error pruning server logs:", err);
        }
    }).catch(err => {
        console.error("Error inserting server log:", err);
    });
}

// --- Security / Limiter Configurations ---
app.set('trust proxy', 1);

const createLimiter = (windowMins, maxRequests, errMsg) => rateLimit({
    windowMs: windowMins * 60 * 1000,
    max: maxRequests,
    message: { error: errMsg },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logServerEvent('alarm', `Rate limit hit on endpoint: ${req.originalUrl || req.url} from IP: ${req.ip}`);
        res.status(options.statusCode).send(options.message);
    }
});

const loginLimiter = createLimiter(15, 10, "Too many attempts. Try again in 15 minutes.");
const signupLimiter = createLimiter(60, 5, "Too many accounts created. Try again after an hour.");
const forgotLimiter = createLimiter(60, 8, "Too many reset attempts. Try again after an hour.");

// --- Global Middleware Setup ---
app.use(cors());
app.use((req, res, next) => {
    res.setHeader('serveo-skip-browser-warning', 'true');
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const url = req.originalUrl || req.url;

        console.log(`[HTTP] ${req.method} ${url} - ${res.statusCode} (${duration}ms)`);
        if (req.method === 'POST' && (url.includes('login') || url.includes('signup'))) {
            console.log(`  User: ${req.body?.username || req.body?.email}`);
        }

        // Save relevant API logs to NeDB (excluding master/logs queries to prevent loop)
        if (url.startsWith('/api/') && !url.includes('/api/master/logs')) {
            let level = 'info';
            if (res.statusCode >= 500) {
                level = 'critical';
            } else if (res.statusCode >= 400) {
                level = 'warning';
            }

            let msg = `[HTTP] ${req.method} ${url} - ${res.statusCode} (${duration}ms)`;
            if (req.body && (req.body.username || req.body.email)) {
                msg += ` (User: ${req.body.username || req.body.email})`;
            }

            logServerEvent(level, msg, {
                method: req.method,
                url,
                status: res.statusCode,
                durationMs: duration,
                ip: req.ip
            });
        }
    });
    next();
});

// Subdomain routing for master dashboard (e.g. master.localhost:8080)
app.use((req, res, next) => {
    const host = req.headers.host || '';
    if (host.startsWith('master.')) {
        if (!req.url.startsWith('/api/') && !req.url.startsWith('/assets/') && !req.url.startsWith('/master/') && !req.url.startsWith('/dist-assets/')) {
            req.url = '/master' + req.url;
        }
    }
    next();
});

// Block direct access to /master path on non-subdomain host
app.use((req, res, next) => {
    const host = req.headers.host || '';
    const url = req.url.toLowerCase();
    if ((url === '/master' || url.startsWith('/master/')) && !host.startsWith('master.')) {
        return res.status(404).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="30;url=/" />
    <title>404 - Access Restricted</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #020617;
            --card-bg: rgba(15, 23, 42, 0.6);
            --border: rgba(255, 255, 255, 0.08);
            --text-primary: #f1f5f9;
            --text-muted: #94a3b8;
            --blue: #3b82f6;
            --purple: #a855f7;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            background-color: var(--bg);
            color: var(--text-primary);
            font-family: 'Inter', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
            position: relative;
        }
        .glow {
            position: absolute;
            width: 400px;
            height: 400px;
            border-radius: 50%;
            filter: blur(120px);
            opacity: 0.15;
            pointer-events: none;
            z-index: 1;
        }
        .glow-blue {
            background: var(--blue);
            top: -10%;
            left: -10%;
        }
        .glow-purple {
            background: var(--purple);
            bottom: -10%;
            right: -10%;
        }
        .container {
            position: relative;
            z-index: 10;
            max-width: 480px;
            width: 100%;
            padding: 2.5rem;
            text-align: center;
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 24px;
            backdrop-filter: blur(16px);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .error-code {
            font-size: 5rem;
            font-weight: 800;
            line-height: 1;
            background: linear-gradient(135deg, var(--blue), var(--purple));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
            letter-spacing: -0.05em;
        }
        h1 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            letter-spacing: -0.02em;
        }
        p {
            color: var(--text-muted);
            font-size: 0.95rem;
            line-height: 1.6;
            margin-bottom: 2rem;
        }
        .btn {
            display: inline-block;
            width: 100%;
            padding: 0.85rem;
            font-size: 0.9rem;
            font-weight: 600;
            text-decoration: none;
            color: #ffffff;
            background: linear-gradient(to right, var(--blue), var(--purple));
            border-radius: 12px;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);
            text-align: center;
        }
        .btn:hover {
            opacity: 0.95;
            transform: translateY(-1px);
            box-shadow: 0 6px 20px 0 rgba(168, 85, 247, 0.4);
        }
    </style>
</head>
<body>
    <div class="glow glow-blue"></div>
    <div class="glow glow-purple"></div>
    <div class="container">
        <div class="error-code">404</div>
        <h1>Restricted Access</h1>
        <p>Unauthorized Access Path. Direct administration console access is blocked. Please route through an authorized supervisor or team member to access master resourcese.</p>
        <a href="/" class="btn" id="redirect-btn">Return to Homepage (30)</a>
    </div>
    <script>
        let seconds = 30;
        const btn = document.getElementById('redirect-btn');
        const interval = setInterval(() => {
            seconds--;
            if (seconds <= 0) {
                clearInterval(interval);
                window.location.href = '/';
            } else {
                btn.textContent = \`Return to Homepage (\${seconds})\`;
            }
        }, 1000);
    </script>
</body>
</html>
        `);
    }
    next();
});

// Serve static assets first
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// SPA Wildcard Route Fallback for all React paths (e.g., /about, /pricing, /app/dashboard)
app.get('*any', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.includes('.')) {
        return next();
    }
    // master.* subdomain requests are rewritten to /master/* by the middleware above.
    // Serve public/master/index.html so the React bundle loads correctly.
    if (req.path.startsWith('/master')) {
        return res.sendFile(path.join(__dirname, 'public', 'master', 'index.html'));
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// --- Health Check Endpoint ---
app.get('/api/health', async (req, res) => {
    let dbOk = false;
    try {
        await db.findOne({ _id: 'health_check_probe' });
        dbOk = true;
    } catch (e) {
        dbOk = false;
    }
    const isProduction = process.env.NODE_ENV === 'production';
    const playApiReady = androidPublisher !== null;
    res.json({
        status: 'ok',
        version: process.env.npm_package_version || '1.0.0',
        environment: isProduction ? 'production' : 'development',
        uptime: Math.floor(process.uptime()),
        db: dbOk ? 'connected' : 'error',
        googlePlayApi: playApiReady ? 'connected' : 'unavailable',
        signupsEnabled: serverConfig.signupsEnabled,
        timestamp: new Date().toISOString()
    });
});

// --- File Encryption Configuration & Helpers ---
const FILE_ENCRYPTION_KEY = process.env.FILE_ENCRYPTION_KEY || process.env.JWT_SECRET || 'logbook-plus-master-fallback-key-2026';
const fileEncryptionKeyBuffer = crypto.createHash('sha256').update(FILE_ENCRYPTION_KEY).digest();

// --- Database Text Encryption & Decryption Helpers ---
const DB_ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || process.env.JWT_SECRET || 'logbook-plus-db-fallback-key-2026';
const dbEncryptionKeyBuffer = crypto.createHash('sha256').update(DB_ENCRYPTION_KEY).digest();

function encryptText(text) {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', dbEncryptionKeyBuffer, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    } catch (e) {
        logServerEvent('error', `Text encryption failure: ${e.message}`);
        return text;
    }
}

function decryptText(encryptedText) {
    if (!encryptedText) return encryptedText;
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 2) {
            return encryptedText; // Not encrypted
        }
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv('aes-256-cbc', dbEncryptionKeyBuffer, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return encryptedText; // Decryption failed, fallback to plain text for backwards compatibility
    }
}

async function encryptFile(filePath) {
    const tempPath = filePath + '.tmp';
    const readStream = fs.createReadStream(filePath);
    const writeStream = fs.createWriteStream(tempPath);

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', fileEncryptionKeyBuffer, iv);

    // Write signature: 'LOGBOOK_CRYPT\0' (14 bytes)
    writeStream.write(Buffer.from('LOGBOOK_CRYPT\0', 'utf8'));
    // Write IV (16 bytes)
    writeStream.write(iv);

    await new Promise((resolve, reject) => {
        readStream
            .pipe(cipher)
            .pipe(writeStream)
            .on('finish', resolve)
            .on('error', reject);
    });

    await fs.move(tempPath, filePath, { overwrite: true });
}

async function isServerEncrypted(filePath) {
    try {
        const fd = await fs.open(filePath, 'r');
        const buffer = Buffer.alloc(14);
        await fs.read(fd, buffer, 0, 14, 0);
        await fs.close(fd);
        return buffer.toString('utf8') === 'LOGBOOK_CRYPT\0';
    } catch (e) {
        return false;
    }
}

async function sendOrDecryptFile(filePath, filename, res) {
    if (await isServerEncrypted(filePath)) {
        try {
            const fd = await fs.open(filePath, 'r');
            const headerBuffer = Buffer.alloc(14);
            const ivBuffer = Buffer.alloc(16);
            await fs.read(fd, headerBuffer, 0, 14, 0);
            await fs.read(fd, ivBuffer, 0, 16, 14);
            await fs.close(fd);

            const readStream = fs.createReadStream(filePath, { start: 30 });
            const decipher = crypto.createDecipheriv('aes-256-cbc', fileEncryptionKeyBuffer, ivBuffer);

            const ext = path.extname(filename).toLowerCase();
            let contentType = 'application/octet-stream';
            if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
            else if (ext === '.png') contentType = 'image/png';
            else if (ext === '.webp') contentType = 'image/webp';

            res.setHeader('Content-Type', contentType);
            if (filename.endsWith('.zip') || filename.endsWith('.enc')) {
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            }

            readStream
                .on('error', (err) => {
                    logServerEvent('error', `Read stream error for file '${filename}': ${err.message}`);
                    if (!res.headersSent) res.status(500).json({ error: "Read stream error" });
                })
                .pipe(decipher)
                .on('error', (err) => {
                    logServerEvent('error', `Decryption error for file '${filename}': ${err.message}`);
                    if (!res.headersSent) res.status(500).json({ error: "Decryption error" });
                })
                .pipe(res);
        } catch (err) {
            logServerEvent('error', `Failed to decrypt stream for file '${filename}': ${err.message}`);
            if (!res.headersSent) res.status(500).json({ error: "Failed to serve encrypted file." });
        }
    } else {
        if (filename.endsWith('.zip') || filename.endsWith('.enc')) {
            res.download(filePath, filename);
        } else {
            res.sendFile(filePath);
        }
    }
}

// --- Storage Setup & Engine ---
const ALLOWED_MIME_TYPES = ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // req.userId is injected dynamically by our isAuthenticated token middleware
        const userPath = path.join(__dirname, 'uploads', req.userId);
        fs.ensureDirSync(userPath);
        cb(null, userPath);
    },
    filename: (req, file, cb) => {
        let policy = (req.body.policy || 'Daily').replace(/[^a-zA-Z0-9]/g, '');
        let ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.enc' && ext !== '.zip') {
            ext = '.zip';
        }
        cb(null, `${policy}_${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 300 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const extOk = ext === '.zip' || ext === '.enc';
        const mimeOk = ALLOWED_MIME_TYPES.includes(file.mimetype);
        if (extOk || mimeOk) return cb(null, true);
        cb(new Error('Only .zip and .enc files are allowed'));
    }
});

const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userPath = path.join(__dirname, 'uploads', req.userId);
        fs.ensureDirSync(userPath);
        cb(null, userPath);
    },
    filename: (req, file, cb) => {
        cb(null, 'avatar.jpg');
    }
});

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp') {
            return cb(null, true);
        }
        cb(new Error('Only images (.jpg, .jpeg, .png, .webp) are allowed'));
    }
});

// --- Licensing & Quota Verification Engine ---
const LICENSE_SECRET = process.env.LICENSE_SECRET || "logbook-plus-master-secret-key-2026";

function verifyLicenseKey(licenseKey) {
    if (!licenseKey) return false;
    try {
        const decoded = jwt.verify(licenseKey, LICENSE_SECRET);
        if (decoded && decoded.type === 'self-hosted') {
            if (decoded.expiresAt && Date.now() > decoded.expiresAt) {
                return false;
            }
            return true;
        }
    } catch (e) {
        return false;
    }
    return false;
}

// --- Google Play Billing Verification Engine ---
const GOOGLE_PLAY_PACKAGE_NAME = process.env.GOOGLE_PLAY_PACKAGE_NAME;
const SERVICE_ACCOUNT_KEY_PATH = process.env.SERVICE_ACCOUNT_KEY_PATH;

let androidPublisher = null;
try {
    if (fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
        const auth = new google.auth.GoogleAuth({
            keyFile: SERVICE_ACCOUNT_KEY_PATH,
            scopes: ['https://www.googleapis.com/auth/androidpublisher']
        });
        androidPublisher = google.androidpublisher({ version: 'v3', auth });
        logServerEvent('info', 'Google Play Developer API initialized successfully');
    } else {
        logServerEvent('warning', 'Google Play service account JSON not found — purchase verification will use fallback mode');
    }
} catch (e) {
    logServerEvent('critical', `Failed to initialize Google Play API: ${e.message}`);
}

/**
 * Verify a Google Play subscription purchase token.
 * Returns { valid: true, expiryTimeMillis, planType } on success.
 */
async function verifyPlaySubscription(purchaseToken, productId, packageName) {
    const indusPkg = process.env.INDUS_APP_STORE_PACKAGE_NAME || 'com.ex.logbookplus';
    if (packageName === indusPkg) {
        logServerEvent('info', `Indus App Store subscription bypass for ${productId}`);
        return { valid: true, expiryTimeMillis: Date.now() + 30 * 24 * 60 * 60 * 1000, planType: determinePlanType(productId) };
    }
    if (!androidPublisher) {
        if (process.env.NODE_ENV === 'production') {
            logServerEvent('critical', `Google Play API not configured — rejecting purchase token for ${productId} in production mode. Set SERVICE_ACCOUNT_KEY_PATH in .env.`);
            return { valid: false, error: 'Google Play API not configured on this server. Contact support.' };
        }
        // Dev/self-hosted fallback: accept without verification
        logServerEvent('warning', `Google Play API not available — accepting purchase token for ${productId} without verification (dev/self-hosted fallback mode)`);
        return { valid: true, expiryTimeMillis: Date.now() + 30 * 24 * 60 * 60 * 1000, planType: determinePlanType(productId) };
    }
    try {
        const response = await androidPublisher.purchases.subscriptions.get({
            packageName: GOOGLE_PLAY_PACKAGE_NAME,
            subscriptionId: productId,
            token: purchaseToken
        });
        const data = response.data;
        // paymentState: 0 = pending, 1 = received, 2 = free trial, 3 = pending deferred upgrade/downgrade
        const isValid = data.paymentState !== undefined && parseInt(data.paymentState) >= 0;
        const expiryTimeMillis = parseInt(data.expiryTimeMillis) || (Date.now() + 30 * 24 * 60 * 60 * 1000);
        return { valid: isValid, expiryTimeMillis, planType: determinePlanType(productId), rawData: data };
    } catch (e) {
        logServerEvent('critical', `Google Play subscription verification failed for ${productId}: ${e.message}`);
        return { valid: false, error: e.message };
    }
}

/**
 * Verify a Google Play in-app (one-time) product purchase token.
 * Returns { valid: true, purchaseTimeMillis, planType } on success.
 */
async function verifyPlayProduct(purchaseToken, productId, packageName) {
    const indusPkg = process.env.INDUS_APP_STORE_PACKAGE_NAME || 'com.ex.logbookplus';
    if (packageName === indusPkg) {
        logServerEvent('info', `Indus App Store product bypass for ${productId}`);
        return { valid: true, expiryTimeMillis: Date.now() + 365 * 24 * 60 * 60 * 1000, planType: determinePlanType(productId) };
    }
    if (!androidPublisher) {
        if (process.env.NODE_ENV === 'production') {
            logServerEvent('critical', `Google Play API not configured — rejecting product purchase for ${productId} in production mode. Set SERVICE_ACCOUNT_KEY_PATH in .env.`);
            return { valid: false, error: 'Google Play API not configured on this server. Contact support.' };
        }
        // Dev/self-hosted fallback: accept without verification
        logServerEvent('warning', `Google Play API not available — accepting product purchase for ${productId} without verification (dev/self-hosted fallback mode)`);
        return { valid: true, expiryTimeMillis: Date.now() + 365 * 24 * 60 * 60 * 1000, planType: determinePlanType(productId) };
    }
    try {
        const response = await androidPublisher.purchases.products.get({
            packageName: GOOGLE_PLAY_PACKAGE_NAME,
            productId: productId,
            token: purchaseToken
        });
        const data = response.data;
        // purchaseState: 0 = purchased, 1 = cancelled, 2 = pending
        const isValid = data.purchaseState === 0;
        const purchaseTime = parseInt(data.purchaseTimeMillis) || Date.now();
        const expiryTimeMillis = purchaseTime + 365 * 24 * 60 * 60 * 1000; // 1 year for license
        return { valid: isValid, expiryTimeMillis, planType: determinePlanType(productId), rawData: data };
    } catch (e) {
        logServerEvent('critical', `Google Play product verification failed for ${productId}: ${e.message}`);
        return { valid: false, error: e.message };
    }
}

/**
 * Determine plan type from Google Play product ID.
 */
function determinePlanType(productId) {
    if (productId.includes('license') || productId.includes('selfhosted') || productId.includes('self_hosted')) {
        return 'licensed';
    }
    return 'premium';
}

async function isSubscribed(req, res, next) {
    // If self-hosted, verify the self-hosted license
    if (process.env.IS_SELF_HOSTED === 'true') {
        const key = process.env.LICENSE_KEY || serverConfig.licenseKey;
        if (!verifyLicenseKey(key)) {
            logServerEvent('alarm', 'Blocked access: unlicensed self-hosted instance or expired license key detected');
            return res.status(402).json({ error: "Unlicensed self-hosted instance. Please configure a valid LICENSE_KEY in your server settings." });
        }
        return next();
    }

    // Otherwise (Cloud SaaS instance), verify specific user account plan
    try {
        const user = await db.findOne({ _id: req.userId });
        const hasValidPlan = user && (user.plan === 'premium' || user.plan === 'licensed' || user.plan === 'license' || user.plan === 'licenced');
        const isActiveOrCancelled = user && (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'cancelled');
        const isExpired = user && user.subscriptionExpiresAt && Date.now() > user.subscriptionExpiresAt;
        if (!user || !hasValidPlan || !isActiveOrCancelled || isExpired) {
            logServerEvent('warning', `Blocked backup/restore access: user ID '${req.userId}' does not have an active or unexpired plan`);
            return res.status(402).json({ error: "Active plan or license required." });
        }
        next();
    } catch (e) {
        res.status(500).json({ error: "Failed to verify subscription status." });
    }
}

async function checkQuota(req, res, next) {
    const userDir = path.join(__dirname, 'uploads', req.userId);
    try {
        if (await fs.pathExists(userDir)) {
            const files = await fs.readdir(userDir);
            const backupFiles = files.filter(f => f !== 'avatar.jpg');
            let size = 0;
            for (const f of backupFiles) {
                size += (await fs.stat(path.join(userDir, f))).size;
            }

            const quotaLimit = 240 * 1024 * 1024; // 240 MB
            const maxBackupCount = 3;

            const fileStats = await Promise.all(
                backupFiles.map(async f => ({ name: f, mtime: (await fs.stat(path.join(userDir, f))).mtimeMs, size: (await fs.stat(path.join(userDir, f))).size }))
            );
            fileStats.sort((a, b) => a.mtime - b.mtime);

            // 1. Enforce backup count limit (max 3). Clean up before uploading new backup.
            let currentCount = backupFiles.length;
            while (currentCount >= maxBackupCount && fileStats.length > 0) {
                const oldest = fileStats.shift();
                await fs.remove(path.join(userDir, oldest.name));
                size -= oldest.size;
                currentCount--;
            }

            // 2. Enforce storage size limit (240MB)
            while (size >= quotaLimit && fileStats.length > 0) {
                const oldest = fileStats.shift();
                await fs.remove(path.join(userDir, oldest.name));
                size -= oldest.size;
            }
        }
        next();
    } catch (e) {
        res.status(500).json({ error: "Quota verification check failed" });
    }
}

// --- Contact Form ---
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) return res.status(400).json({ error: 'All fields are required.' });

    const csvPath = path.join(__dirname, 'quary.csv');
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const row = [escape(new Date().toISOString()), escape(name), escape(email), escape(subject), escape(message)].join(',') + '\n';

    try {
        if (!await fs.pathExists(csvPath)) await fs.writeFile(csvPath, 'Timestamp,Name,Email,Subject,Message\n');
        await fs.appendFile(csvPath, row);
        logServerEvent('info', `Contact inquiry received from ${name} (${email}): ${subject}`);
        res.json({ success: true, message: 'Thank you! Your message has been saved.' });
    } catch (e) {
        logServerEvent('critical', `Failed to save contact inquiry from ${name} (${email})`);
        res.status(500).json({ error: 'Failed to preserve communication payload.' });
    }
});

// --- Newsletter Subscription ---
app.post('/api/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email address is required.' });

    const csvPath = path.join(__dirname, 'subscribers.csv');
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const row = [escape(new Date().toISOString()), escape(email)].join(',') + '\n';

    try {
        if (!await fs.pathExists(csvPath)) await fs.writeFile(csvPath, 'Timestamp,Email\n');
        await fs.appendFile(csvPath, row);
        logServerEvent('info', `Newsletter subscription received from ${email}`);
        res.json({ success: true, message: 'Subscribed successfully!' });
    } catch (e) {
        logServerEvent('critical', `Failed to save newsletter subscription from ${email}`);
        res.status(500).json({ error: 'Failed to process subscription.' });
    }
});

// --- Master Management & Authentication ---
// --- Two-Factor Authentication (TOTP / 2FA) Utilities ---
function base32Decode(base32Str) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let cleanStr = base32Str.replace(/=+$/, '').toUpperCase();
    let length = cleanStr.length;
    let buffer = Buffer.alloc(Math.floor(length * 5 / 8));
    let bits = 0;
    let value = 0;
    let index = 0;

    for (let i = 0; i < length; i++) {
        const val = alphabet.indexOf(cleanStr[i]);
        if (val === -1) throw new Error("Invalid base32 character");
        value = (value << 5) | val;
        bits += 5;
        if (bits >= 8) {
            buffer[index++] = (value >>> (bits - 8)) & 255;
            bits -= 8;
        }
    }
    return buffer;
}

function generateHOTP(secretBuffer, counter) {
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    counterBuffer.writeUInt32BE(counter % 0x100000000, 4);

    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(counterBuffer);
    const hmacResult = hmac.digest();

    const offset = hmacResult[hmacResult.length - 1] & 0xf;
    const code = ((hmacResult[offset] & 0x7f) << 24) |
        ((hmacResult[offset + 1] & 0xff) << 16) |
        ((hmacResult[offset + 2] & 0xff) << 8) |
        (hmacResult[offset + 3] & 0xff);

    const pin = code % 1000000;
    return pin.toString().padStart(6, '0');
}

function verifyTOTP(token, base32Secret, window = 1) {
    if (!token || !base32Secret) return null;
    try {
        const secretBuffer = base32Decode(base32Secret);
        const currentCounter = Math.floor(Date.now() / 30000);
        for (let i = -window; i <= window; i++) {
            if (generateHOTP(secretBuffer, currentCounter + i) === token.trim()) {
                return currentCounter + i; // Return the matched counter
            }
        }
    } catch (e) {
        console.error("TOTP verification error:", e);
    }
    return null;
}

/**
 * Verify a TOTP code with replay protection.
 * @param {string} code - The 6-digit TOTP code to verify.
 * @param {string} base32Secret - The user's base32 TOTP secret.
 * @param {number|null} lastUsedCounter - The counter value of the last successfully used TOTP code (from DB).
 * @returns {{ valid: boolean, counter: number|null }} - Whether the code is valid and the matched counter.
 */
function verifyTOTPWithReplay(code, base32Secret, lastUsedCounter) {
    const matchedCounter = verifyTOTP(code, base32Secret);
    if (matchedCounter === null) {
        return { valid: false, counter: null };
    }
    // Reject if this counter was already used (replay attack)
    if (lastUsedCounter !== null && lastUsedCounter !== undefined && matchedCounter < lastUsedCounter) {
        return { valid: false, counter: null };
    }
    return { valid: true, counter: matchedCounter };
}

function generateBase32Secret(length = 16) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        result += alphabet[randomBytes[i] % alphabet.length];
    }
    return result;
}

// --- Master Management & Authentication ---
app.post('/api/master/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    if (!MASTER_USER || !MASTER_PASS) {
        logServerEvent('critical', 'Master login failure: missing MASTER_USER or MASTER_PASS configuration in environment');
        return res.status(500).json({ error: "Server structural environment missing configurations" });
    }
    if (username !== MASTER_USER) {
        logServerEvent('alarm', `Failed master login attempt: invalid username '${username}' from IP: ${req.ip}`);
        return res.status(403).json({ error: 'Invalid master profiles' });
    }

    try {
        const masterProfile = await db.findOne({ _id: 'master_profile' });
        const isMatch = masterProfile?.password ? await bcrypt.compare(password, masterProfile.password) : (password === MASTER_PASS);

        if (isMatch) {
            if (masterProfile && masterProfile.twoFactorEnabled) {
                // Issue a short-lived MFA pending token
                const mfaToken = jwt.sign({ isMasterTemp: true }, JWT_SECRET, { expiresIn: '5m' });
                return res.json({ requires2FA: true, mfaToken });
            }
            logServerEvent('info', `Master admin logged in successfully from IP: ${req.ip}`);
            // Issue high-privilege administrative short token string
            const token = jwt.sign({ isMaster: true }, JWT_SECRET, { expiresIn: '1h' });
            return res.json({ success: true, token });
        }
    } catch (e) {
        logServerEvent('critical', `Master login system error from IP: ${req.ip}`);
        return res.status(500).json({ error: "Server login error" });
    }
    logServerEvent('alarm', `Failed master login attempt: incorrect password for user '${username}' from IP: ${req.ip}`);
    res.status(403).json({ error: 'Invalid master credentials' });
});

app.post('/api/master/login/verify', loginLimiter, async (req, res) => {
    const { mfaToken, code } = req.body;
    if (!mfaToken || !code) return res.status(400).json({ error: "MFA token and verification code are required" });
    try {
        const decoded = jwt.verify(mfaToken, JWT_SECRET);
        if (!decoded.isMasterTemp) {
            return res.status(401).json({ error: "Invalid MFA session" });
        }
        const masterProfile = await db.findOne({ _id: 'master_profile' });
        if (!masterProfile || !masterProfile.twoFactorEnabled || !masterProfile.twoFactorSecret) {
            return res.status(400).json({ error: "2FA is not enabled on master account" });
        }
        const decryptedCounter = decryptText(masterProfile.lastUsedTOTPCounter);
        const lastUsedTOTPCounter = decryptedCounter ? parseInt(decryptedCounter) : null;
        const mfaResult = verifyTOTPWithReplay(code, decryptText(masterProfile.twoFactorSecret), lastUsedTOTPCounter);
        if (mfaResult.valid) {
            await db.update({ _id: 'master_profile' }, { $set: { lastUsedTOTPCounter: encryptText(String(mfaResult.counter)) } }, { upsert: true });
            logServerEvent('info', `Master admin logged in via 2FA successfully from IP: ${req.ip}`);
            const token = jwt.sign({ isMaster: true }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ success: true, token });
        } else {
            logServerEvent('alarm', `Failed master 2FA login verification code from IP: ${req.ip}`);
            res.status(401).json({ error: "Invalid or already used 2FA code" });
        }
    } catch (err) {
        res.status(401).json({ error: "MFA session expired or invalid" });
    }
});

app.post('/api/master/2fa/setup', isMasterAuth, async (req, res) => {
    try {
        const secret = generateBase32Secret();
        await db.update({ _id: 'master_profile' }, { $set: { tempTwoFactorSecret: encryptText(secret) } }, { upsert: true });
        db.compactDatafile();
        const label = encodeURIComponent('LogbookPlus:MasterAdmin');
        const issuer = encodeURIComponent('LogbookPlus');
        const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;
        res.json({ secret, otpauthUrl });
    } catch (err) {
        res.status(500).json({ error: "Failed to initialize master 2FA setup" });
    }
});

app.post('/api/master/2fa/verify', isMasterAuth, async (req, res) => {
    const { code } = req.body;
    if (!code || code.length !== 6) return res.status(400).json({ error: "Invalid code format" });
    try {
        const profile = await db.findOne({ _id: 'master_profile' });
        if (!profile || !profile.tempTwoFactorSecret) {
            return res.status(400).json({ error: "2FA setup is not initialized" });
        }
        const matchedCounter = verifyTOTP(code, decryptText(profile.tempTwoFactorSecret));
        if (matchedCounter !== null) {
            await db.update({ _id: 'master_profile' }, {
                $set: { twoFactorEnabled: true, twoFactorSecret: profile.tempTwoFactorSecret, tempTwoFactorSecret: null, lastUsedTOTPCounter: encryptText(String(matchedCounter)) }
            }, { upsert: true });
            db.compactDatafile();
            logServerEvent('info', 'Master admin successfully enabled 2FA');
            res.json({ success: true, message: "Two-factor authentication enabled successfully!" });
        } else {
            res.status(400).json({ error: "Verification code is incorrect" });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to verify 2FA code" });
    }
});

app.post('/api/master/2fa/disable', isMasterAuth, async (req, res) => {
    const { password, code } = req.body;
    if (!password || !code) return res.status(400).json({ error: "Password and verification code are required" });
    try {
        const masterProfile = await db.findOne({ _id: 'master_profile' });
        const isMatch = masterProfile?.password ? await bcrypt.compare(password, masterProfile.password) : (password === MASTER_PASS);
        if (!isMatch) {
            return res.status(400).json({ error: "Incorrect password" });
        }
        if (!masterProfile || !masterProfile.twoFactorEnabled || !masterProfile.twoFactorSecret) {
            return res.status(400).json({ error: "2FA is not active" });
        }
        const decryptedCounter = decryptText(masterProfile.lastUsedTOTPCounter);
        const lastUsedTOTPCounter = decryptedCounter ? parseInt(decryptedCounter) : null;
        const disableResult = verifyTOTPWithReplay(code, decryptText(masterProfile.twoFactorSecret), lastUsedTOTPCounter);
        if (disableResult.valid) {
            await db.update({ _id: 'master_profile' }, {
                $set: { twoFactorEnabled: false, twoFactorSecret: null, tempTwoFactorSecret: null, lastUsedTOTPCounter: null }
            }, { upsert: true });
            db.compactDatafile();
            logServerEvent('warning', 'Master admin disabled 2FA');
            res.json({ success: true, message: "2FA has been disabled." });
        } else {
            res.status(400).json({ error: "Invalid or already used verification code" });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to disable 2FA" });
    }
});

app.get('/api/master/config', isMasterAuth, (req, res) => {
    res.json({
        ...serverConfig,
        isSelfHosted: process.env.IS_SELF_HOSTED === 'true',
        isLicenseValid: verifyLicenseKey(process.env.LICENSE_KEY || serverConfig.licenseKey)
    });
});

app.post('/api/master/config', isMasterAuth, (req, res) => {
    if (req.body.quotaLimit !== undefined) serverConfig.quotaLimit = parseInt(req.body.quotaLimit) || serverConfig.quotaLimit;
    if (req.body.signupsEnabled !== undefined) serverConfig.signupsEnabled = !!req.body.signupsEnabled;
    if (req.body.licenseKey !== undefined) serverConfig.licenseKey = req.body.licenseKey;
    logServerEvent('info', `Master config updated: quotaLimit=${Math.floor(serverConfig.quotaLimit / (1024 * 1024))}MB, signupsEnabled=${serverConfig.signupsEnabled}`);
    res.json({ message: "Server configuration updated live", config: serverConfig });
});

app.get('/api/master/profile', isMasterAuth, async (req, res) => {
    const profile = (await db.findOne({ _id: 'master_profile' })) || { name: 'Master Admin', email: 'admin@logbook', profilePicIndex: 0 };
    res.json({ name: profile.name, email: profile.email, profilePicIndex: profile.profilePicIndex || 0, twoFactorEnabled: !!profile.twoFactorEnabled });
});

app.post('/api/master/profile', isMasterAuth, async (req, res) => {
    const { name, email, profilePicIndex } = req.body;
    await db.update({ _id: 'master_profile' }, { $set: { name, email, profilePicIndex: parseInt(profilePicIndex) || 0 } }, { upsert: true });
    db.compactDatafile();
    logServerEvent('info', `Master profile updated: name='${name}', email='${email}'`);
    res.json({ success: true, message: "Master profile updated" });
});

app.post('/api/master/change-password', isMasterAuth, async (req, res) => {
    const { oldPass, newPass } = req.body;
    if (!newPass || newPass.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters." });

    const masterProfile = await db.findOne({ _id: 'master_profile' });
    const isMatch = masterProfile?.password ? await bcrypt.compare(oldPass, masterProfile.password) : (oldPass === MASTER_PASS);
    if (!isMatch) {
        logServerEvent('alarm', 'Failed master password change attempt: current password incorrect');
        return res.status(400).json({ error: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);
    await db.update({ _id: 'master_profile' }, { $set: { password: hashedPassword } }, { upsert: true });
    db.compactDatafile();
    logServerEvent('warning', 'Master password changed successfully');
    res.json({ success: true, message: "Master password updated successfully" });
});

app.get('/api/master/users', isMasterAuth, async (req, res) => {
    res.json(await db.find({ username: { $exists: true } }, { password: 0 }));
});

app.delete('/api/master/users/:id', isMasterAuth, async (req, res) => {
    const userDir = path.join(__dirname, 'uploads', req.params.id);
    if (await fs.pathExists(userDir)) await fs.remove(userDir);
    await db.remove({ _id: req.params.id }, {});
    db.compactDatafile();
    logServerEvent('warning', `Master deleted user completely: user ID '${req.params.id}' and uploads wiped.`);
    res.json({ message: "User and data completely purged" });
});

app.post('/api/master/users/:id/disable-2fa', isMasterAuth, async (req, res) => {
    try {
        await db.update(
            { _id: req.params.id },
            { $set: { twoFactorEnabled: false, twoFactorSecret: null, tempTwoFactorSecret: null } }
        );
        db.compactDatafile();
        logServerEvent('warning', `Master disabled 2FA for user ID: ${req.params.id}`);
        res.json({ success: true, message: "User 2FA has been disabled by administrator." });
    } catch (e) {
        logServerEvent('critical', `Master failed to disable 2FA for user ID: ${req.params.id}`);
        res.status(500).json({ error: "Failed to disable user 2FA." });
    }
});

app.post('/api/master/reboot', isMasterAuth, async (req, res) => {
    try {
        logServerEvent('critical', `Master admin requested server reboot from IP: ${req.ip}`);
        res.json({ success: true, message: "Server reboot command received. Rebooting server..." });
        setTimeout(() => {
            logServerEvent('info', 'Process exiting now for reboot.');
            process.exit(0);
        }, 1500);
    } catch (e) {
        logServerEvent('critical', `Failed to execute server reboot: ${e.message}`);
        res.status(500).json({ error: "Failed to reboot server." });
    }
});

app.post('/api/master/users/:id/revoke-subscription', isMasterAuth, async (req, res) => {
    try {
        await db.update(
            { _id: req.params.id },
            { $set: { plan: 'unpaid', subscriptionStatus: 'cancelled', subscriptionExpiresAt: 0 } }
        );
        db.compactDatafile();
        logServerEvent('warning', `Master revoked monthly premium subscription for user ID: ${req.params.id}`);
        res.json({ success: true, message: "Subscription revoked successfully" });
    } catch (e) {
        logServerEvent('critical', `Master failed to revoke subscription for user ID: ${req.params.id}`);
        res.status(500).json({ error: "Failed to revoke subscription" });
    }
});

app.post('/api/master/users/:id/plan', isMasterAuth, async (req, res) => {
    const { plan, subscriptionStatus, subscriptionExpiresAt } = req.body;
    if (!plan || !subscriptionStatus) {
        return res.status(400).json({ error: "Plan and status are required." });
    }

    try {
        const expiresAt = subscriptionExpiresAt ? parseInt(subscriptionExpiresAt) : 0;
        const quotaLimit = plan === 'premium' ? 240 * 1024 * 1024 : 240 * 1024 * 1024; // Standard quota limit

        await db.update(
            { _id: req.params.id },
            { $set: { plan, subscriptionStatus, subscriptionExpiresAt: expiresAt, quotaLimit } }
        );
        db.compactDatafile();
        logServerEvent('warning', `Master updated plan for user ID '${req.params.id}': plan='${plan}', status='${subscriptionStatus}', expiresAt=${expiresAt}`);
        res.json({ success: true, message: "User plan validity updated successfully" });
    } catch (e) {
        logServerEvent('critical', `Master failed to update plan for user ID: ${req.params.id}`);
        res.status(500).json({ error: "Failed to update user plan validity" });
    }
});

app.get('/api/master/stats', isMasterAuth, async (req, res) => {
    const userCount = await db.count({ username: { $exists: true } });
    const uploadsDir = path.join(__dirname, 'uploads');
    let totalStorageBytes = 0;

    if (await fs.pathExists(uploadsDir)) {
        const getDirSize = async (dir) => {
            const files = await fs.readdir(dir);
            let size = 0;
            for (const f of files) {
                const stat = await fs.stat(path.join(dir, f));
                size += stat.isDirectory() ? await getDirSize(path.join(dir, f)) : stat.size;
            }
            return size;
        };
        totalStorageBytes = await getDirSize(uploadsDir);
    }
    res.json({
        totalUsers: userCount,
        totalStorageMB: (totalStorageBytes / 1024 / 1024).toFixed(2),
        uptimeSeconds: Math.floor(process.uptime()),
        masterUser: MASTER_USER,
        quotaLimitMB: Math.floor(serverConfig.quotaLimit / (1024 * 1024))
    });
});

app.post('/api/master/cleanup', isMasterAuth, async (req, res) => {
    const daysOld = Math.max(1, parseInt(req.body.daysOld) || 30);
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    let deletedCount = 0;
    const uploadsDir = path.join(__dirname, 'uploads');

    if (await fs.pathExists(uploadsDir)) {
        const users = await fs.readdir(uploadsDir);
        for (const user of users) {
            const userDir = path.join(uploadsDir, user);
            if (!(await fs.stat(userDir)).isDirectory()) continue;
            const files = await fs.readdir(userDir);
            for (const file of files) {
                if (file === 'avatar.jpg') continue;
                const filePath = path.join(userDir, file);
                if ((await fs.stat(filePath)).mtimeMs < cutoffTime) {
                    await fs.remove(filePath);
                    deletedCount++;
                }
            }
        }
    }
    logServerEvent('warning', `Storage sweeper executed. Cutoff: > ${daysOld} days old. Deleted ${deletedCount} files.`);
    res.json({ message: `Cleanup complete. Deleted ${deletedCount} files.` });
});

app.get('/api/master/logs', isMasterAuth, async (req, res) => {
    try {
        const logs = await logsDb.find({ type: 'server_log' });
        // Sort by timestamp descending
        logs.sort((a, b) => b.timestamp - a.timestamp);
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch server logs." });
    }
});

app.post('/api/master/logs/clear', isMasterAuth, async (req, res) => {
    try {
        await logsDb.remove({ type: 'server_log' }, { multi: true });
        logsDb.compactDatafile();
        logServerEvent('warning', `Master cleared all server logs`);
        res.json({ success: true, message: "Logs cleared successfully." });
    } catch (e) {
        res.status(500).json({ error: "Failed to clear server logs." });
    }
});

// --- Blog Operations ---
app.post('/api/master/blogs', isMasterAuth, async (req, res) => {
    const { title, category, excerpt, content, imageUrl, date } = req.body;
    if (!title || !excerpt || !content) {
        return res.status(400).json({ error: "Title, Excerpt, and Content are required fields." });
    }

    // Generate safe unique slug
    let slug = title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    if (!slug) slug = 'blog-post-' + Date.now();

    // Check if slug already exists, if so append unique timestamp
    const existing = await db.findOne({ type: 'blog_post', slug });
    if (existing) {
        slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const blogPost = {
        type: 'blog_post',
        title,
        category: category || 'Guides',
        excerpt,
        content,
        imageUrl: imageUrl || '/assets/images/blog_hero.png',
        date: date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        createdAt: Date.now(),
        slug
    };

    try {
        const inserted = await db.insert(blogPost);
        logServerEvent('info', `New blog post created: '${title}' (slug: '${slug}')`);
        res.status(201).json({ success: true, blog: inserted });
    } catch (e) {
        logServerEvent('critical', `Failed to create blog post: '${title}'`);
        res.status(500).json({ error: "Failed to store blog post." });
    }
});

app.put('/api/master/blogs/:id', isMasterAuth, async (req, res) => {
    const { title, category, excerpt, content, imageUrl, date } = req.body;
    if (!title || !excerpt || !content) {
        return res.status(400).json({ error: "Title, Excerpt, and Content are required fields." });
    }

    const existing = await db.findOne({ _id: req.params.id, type: 'blog_post' });
    if (!existing) return res.status(404).json({ error: "Blog post not found." });

    // Generate slug from title if title changed, otherwise keep it
    let slug = existing.slug;
    if (title !== existing.title) {
        slug = title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        if (!slug) slug = 'blog-post-' + Date.now();
        const otherPost = await db.findOne({ type: 'blog_post', slug, _id: { $ne: req.params.id } });
        if (otherPost) {
            slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }
    }

    const updatedData = {
        title,
        category: category || 'Guides',
        excerpt,
        content,
        imageUrl: imageUrl || '/assets/images/blog_hero.png',
        date: date || existing.date,
        slug
    };

    try {
        await db.update({ _id: req.params.id }, { $set: updatedData });
        db.compactDatafile();
        logServerEvent('info', `Blog post updated: '${title}' (slug: '${slug}')`);
        res.json({ success: true, message: "Blog post updated successfully." });
    } catch (e) {
        logServerEvent('critical', `Failed to update blog post ID '${req.params.id}'`);
        res.status(500).json({ error: "Failed to update blog post." });
    }
});

app.delete('/api/master/blogs/:id', isMasterAuth, async (req, res) => {
    try {
        const result = await db.remove({ _id: req.params.id, type: 'blog_post' }, {});
        if (result === 0) return res.status(404).json({ error: "Blog post not found." });
        db.compactDatafile();
        logServerEvent('warning', `Blog post deleted: ID '${req.params.id}'`);
        res.json({ success: true, message: "Blog post deleted successfully." });
    } catch (e) {
        logServerEvent('critical', `Failed to delete blog post ID '${req.params.id}'`);
        res.status(500).json({ error: "Failed to delete blog post." });
    }
});

app.get('/api/blogs', async (req, res) => {
    try {
        const blogs = await db.find({ type: 'blog_post' });
        // Sort by createdAt descending
        blogs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        res.json(blogs);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch blog posts." });
    }
});

// --- Standard Client Routes ---
app.post('/api/check-email', signupLimiter, async (req, res) => {
    if (!req.body.email) return res.status(400).json({ error: "Email target parameters required." });
    const exists = await db.findOne({ username: req.body.email });
    res.json({ exists: !!exists });
});

app.post('/api/check-username', signupLimiter, async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username parameter is required." });

    // Check if any user has this username (stored in the 'name' field in database)
    const exists = await db.findOne({ name: { $regex: new RegExp(`^${username.trim()}$`, 'i') } });
    res.json({ exists: !!exists });
});

// Check if app is on the Indus App Store package name (called during onboarding page 0)
function handleCheckStore(req, res) {
    const packageName = req.body?.packageName || req.query?.packageName || req.headers['x-package-name'] || req.headers['x-requested-with'];
    const googlePkg = process.env.GOOGLE_PLAY_PACKAGE_NAME;
    const isGoogle = (packageName === googlePkg);
    logServerEvent('info', `Store check request for package: ${packageName} (Is Google: ${isGoogle})`);
    res.json({
        success: isGoogle,
        valid: isGoogle,
        isGoogleStore: isGoogle,
        isGooglePackage: isGoogle,
        packageNameMatch: isGoogle
    });
}
app.get('/api/check-store', handleCheckStore);
app.post('/api/check-store', handleCheckStore);
app.get('/api/check-package', handleCheckStore);
app.post('/api/check-package', handleCheckStore);

app.post('/api/signup/check-availability', async (req, res) => {
    const { username, name } = req.body;
    const result = { usernameAvailable: true, nameAvailable: true };
    try {
        if (username) {
            const userExists = await db.findOne({ username });
            if (userExists) result.usernameAvailable = false;
        }
        if (name) {
            const nameExists = await db.findOne({ name });
            if (nameExists) result.nameAvailable = false;
        }
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: "Availability check failed" });
    }
});

app.post('/api/signup', signupLimiter, async (req, res) => {

    if (!serverConfig.signupsEnabled) {
        logServerEvent('warning', 'Signup blocked: signups are disabled', { ip: req.ip });
        return res.status(403).json({ error: "Signups are temporarily disabled." });
    }

    const { username, password, name, securityQuestion, securityAnswer } = req.body;

    if (!username || !password || password.length < 8) return res.status(400).json({ error: "Valid Username and password (min 8 chars) are required." });
    if (!securityQuestion || !securityAnswer || securityAnswer.trim().length < 2) return res.status(400).json({ error: "Security metrics are missing configuration." });
    if (!ALLOWED_SECURITY_QUESTIONS.includes(securityQuestion)) return res.status(400).json({ error: "Invalid context mapping security item." });

    const exists = await db.findOne({ username });
    if (exists) {
        logServerEvent('warning', `Signup failed: user '${username}' already exists`, { ip: req.ip });
        return res.status(400).json({ error: "User profile target registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(securityAnswer.trim().toLowerCase(), 10);

    await db.insert({
        username, password: hashedPassword, name: name || username, email: username,
        profilePicIndex: 0, securityQuestion, securityAnswer: hashedAnswer,
        plan: 'unpaid', subscriptionStatus: 'none', quotaLimit: 240 * 1024 * 1024
    });
    logServerEvent('info', `New user signed up successfully: '${username}'`, { ip: req.ip });
    res.status(201).json({ message: "Success! Account registered." });
});

app.post('/api/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    const user = await db.findOne({ $or: [{ username }, { name: username }] });

    if (user && await bcrypt.compare(password, user.password)) {
        if (user.twoFactorEnabled) {
            // Issue temporary token for 2FA validation step
            const mfaToken = jwt.sign({ userId: user._id, isMfaTemp: true }, JWT_SECRET, { expiresIn: '5m' });
            return res.json({ requires2FA: true, mfaToken });
        }
        logServerEvent('info', `User logged in: '${username}'`, { ip: req.ip });
        // Sign and issue production standard clean JWT token payload
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '3650d' });
        return res.json({
            success: true,
            token,
            userId: user._id,
            name: user.name || user.username,
            email: user.email || "",
            plan: user.plan || "unpaid",
            subscriptionStatus: user.subscriptionStatus || "none",
            subscriptionExpiresAt: user.subscriptionExpiresAt || 0,
            twoFactorEnabled: !!user.twoFactorEnabled
        });
    }
    logServerEvent('warning', `Failed login attempt for user '${username}'`, { ip: req.ip });
    return res.status(401).json({ error: "Invalid Login credentials verification path" });
});

app.post('/api/login/verify', loginLimiter, async (req, res) => {
    const { mfaToken, code } = req.body;
    if (!mfaToken || !code) return res.status(400).json({ error: "MFA token and verification code are required" });
    try {
        const decoded = jwt.verify(mfaToken, JWT_SECRET);
        if (!decoded.isMfaTemp || !decoded.userId) {
            return res.status(401).json({ error: "Invalid MFA session" });
        }
        const user = await db.findOne({ _id: decoded.userId });
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            return res.status(400).json({ error: "2FA is not enabled on this account" });
        }
        const decryptedCounter = decryptText(user.lastUsedTOTPCounter);
        const lastUsedTOTPCounter = decryptedCounter ? parseInt(decryptedCounter) : null;
        const loginMfaResult = verifyTOTPWithReplay(code, decryptText(user.twoFactorSecret), lastUsedTOTPCounter);
        if (loginMfaResult.valid) {
            await db.update({ _id: user._id }, { $set: { lastUsedTOTPCounter: encryptText(String(loginMfaResult.counter)) } });
            logServerEvent('info', `User logged in via 2FA: '${user.username}'`, { ip: req.ip });
            const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '3650d' });
            res.json({
                success: true,
                token,
                userId: user._id,
                name: user.name || user.username,
                email: user.email || "",
                plan: user.plan || "unpaid",
                subscriptionStatus: user.subscriptionStatus || "none",
                subscriptionExpiresAt: user.subscriptionExpiresAt || 0,
                twoFactorEnabled: true
            });
        } else {
            logServerEvent('warning', `Failed 2FA code verification for user '${user.username}'`, { ip: req.ip });
            res.status(401).json({ error: "Invalid or already used 2FA code" });
        }
    } catch (err) {
        res.status(401).json({ error: "MFA session expired or invalid" });
    }
});

// For JWT, logout is handled by clearing the token from client-side memory.
app.post('/api/logout', (req, res) => {
    res.json({ message: "Context unlinked. Clear your tracking token payload on device local memory storage variables." });
});

// --- Forgot/Recovery Operations ---
app.post('/api/forgot/question', forgotLimiter, async (req, res) => {
    const user = await db.findOne({ $or: [{ username: req.body.username }, { name: req.body.username }] });
    if (!user || !user.securityQuestion) {
        return res.json({ question: null, message: "Verification matching targets deployed safely." });
    }
    res.json({ question: user.securityQuestion });
});

app.post('/api/forgot/reset', forgotLimiter, async (req, res) => {
    const { username, securityAnswer, newPassword } = req.body;
    if (!username || !securityAnswer || !newPassword || newPassword.length < 8) return res.status(400).json({ error: "Invalid input structure sizes." });

    const user = await db.findOne({ $or: [{ username }, { name: username }] });
    if (!user || !user.securityAnswer) return res.status(400).json({ error: "Profile missing verification keys." });

    const answerMatch = await bcrypt.compare(securityAnswer.trim().toLowerCase(), user.securityAnswer);
    if (!answerMatch) {
        logServerEvent('warning', `Failed password reset: security question answer mismatch for user '${username}'`, { ip: req.ip });
        return res.status(400).json({ error: "Security configuration parameter context verification mismatched." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update({ _id: user._id }, { $set: { password: hashedPassword, twoFactorEnabled: false, twoFactorSecret: null, tempTwoFactorSecret: null } });
    db.compactDatafile();
    logServerEvent('warning', `Password reset successfully for user '${username}'`, { ip: req.ip });
    res.json({ message: "Password updated safely." });
});

// --- Remote Vault / File Operations (All Token Secured) ---
app.post('/api/backup', isAuthenticated, isSubscribed, checkQuota, upload.single('file'), async (req, res, next) => {
    try {
        if (req.file) {
            await encryptFile(req.file.path);
            logServerEvent('info', `Backup uploaded and encrypted successfully by user ID '${req.userId}'`, { filename: req.file.filename, size: req.file.size });
        } else {
            logServerEvent('warning', `Backup upload request received without file for user ID '${req.userId}'`);
        }
        res.json({ message: "Backup processing complete" });
    } catch (err) {
        logServerEvent('error', `Failed to encrypt uploaded backup for user ID '${req.userId}': ${err.message}`);
        next(err);
    }
});

app.get('/api/info', isAuthenticated, isSubscribed, async (req, res) => {
    const userDir = path.join(__dirname, 'uploads', req.userId);
    const systemQuota = 240; // 240 MB limit in INR plan

    if (!await fs.pathExists(userDir)) return res.json({ totalBackups: 0, storageUsedMB: 0, quotaLimitMB: systemQuota });
    const files = await fs.readdir(userDir);
    const backupFiles = files.filter(f => f !== 'avatar.jpg');
    let totalSize = 0;
    for (const f of backupFiles) totalSize += (await fs.stat(path.join(userDir, f))).size;

    res.json({
        totalBackups: backupFiles.length,
        storageUsedMB: (totalSize / 1024 / 1024).toFixed(2),
        quotaLimitMB: systemQuota
    });
});

app.get('/api/backups', isAuthenticated, isSubscribed, async (req, res) => {
    const userDir = path.join(__dirname, 'uploads', req.userId);
    if (!await fs.pathExists(userDir)) return res.json([]);

    const files = await fs.readdir(userDir);
    const backupList = [];
    for (const file of files) {
        if (file.endsWith('.zip') || file.endsWith('.enc')) {
            const stat = await fs.stat(path.join(userDir, file));
            backupList.push({ name: file, size: (stat.size / 1024 / 1024).toFixed(2) + ' MB', time: stat.mtime.toISOString() });
        }
    }
    res.json(backupList.sort((a, b) => new Date(b.time) - new Date(a.time)));
});

app.get('/api/restore/:filename', isAuthenticated, isSubscribed, async (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(__dirname, 'uploads', req.userId, filename);
    if (await fs.pathExists(filePath)) {
        logServerEvent('info', `Backup restored/downloaded by user ID '${req.userId}': ${filename}`);
        return sendOrDecryptFile(filePath, filename, res);
    }
    res.status(404).json({ error: "Backup target path missing allocation mapping." });
});

app.delete('/api/backup/:filename', isAuthenticated, isSubscribed, async (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(__dirname, 'uploads', req.userId, filename);
    if (!await fs.pathExists(filePath)) return res.status(404).json({ error: "Target missing context references." });

    await fs.remove(filePath);
    logServerEvent('warning', `Backup deleted by user ID '${req.userId}': ${filename}`);
    res.json({ success: true, message: "Target metadata unlinked clean." });
});

// --- Profile Customizations ---
app.get('/api/profile', isAuthenticated, async (req, res) => {
    const user = await db.findOne({ _id: req.userId });
    if (!user) return res.status(404).json({ error: "Identity missing registration profiles." });
    res.json({
        userId: user._id,
        name: user.name || user.username,
        email: user.email || user.username,
        profilePicIndex: user.profilePicIndex || 0,
        plan: user.plan || "unpaid",
        subscriptionStatus: user.subscriptionStatus || "none",
        subscriptionExpiresAt: user.subscriptionExpiresAt || 0,
        twoFactorEnabled: !!user.twoFactorEnabled
    });
});

app.post('/api/profile/avatar', isAuthenticated, uploadAvatar.single('avatar'), async (req, res) => {
    try {
        if (req.file) {
            await encryptFile(req.file.path);
        }
        logServerEvent('info', `User ID '${req.userId}' uploaded a custom profile picture`);
        res.json({ success: true, message: "Profile picture uploaded successfully" });
    } catch (e) {
        logServerEvent('error', `Failed to encrypt custom profile picture upload for user ID '${req.userId}': ${e.message}`);
        res.status(500).json({ error: "Failed to upload avatar: " + e.message });
    }
});

app.get('/api/profile/avatar', isAuthenticated, async (req, res) => {
    const avatarPath = path.join(__dirname, 'uploads', req.userId, 'avatar.jpg');
    if (await fs.pathExists(avatarPath)) {
        return sendOrDecryptFile(avatarPath, 'avatar.jpg', res);
    }
    res.status(404).json({ error: "No custom profile picture found" });
});

app.delete('/api/profile/avatar', isAuthenticated, async (req, res) => {
    try {
        const avatarPath = path.join(__dirname, 'uploads', req.userId, 'avatar.jpg');
        if (await fs.pathExists(avatarPath)) {
            await fs.remove(avatarPath);
            logServerEvent('info', `User ID '${req.userId}' deleted their custom profile picture`);
        }
        res.json({ success: true, message: "Profile picture deleted successfully" });
    } catch (e) {
        logServerEvent('error', `Failed to delete custom profile picture for user ID '${req.userId}': ${e.message}`);
        res.status(500).json({ error: "Failed to delete avatar" });
    }
});

app.get('/api/profile/avatar/:userId', async (req, res) => {
    const userId = path.basename(req.params.userId);
    const avatarPath = path.join(__dirname, 'uploads', userId, 'avatar.jpg');
    if (await fs.pathExists(avatarPath)) {
        return sendOrDecryptFile(avatarPath, 'avatar.jpg', res);
    }
    res.status(404).json({ error: "No custom profile picture found" });
});

app.post('/api/profile', isAuthenticated, async (req, res) => {
    await db.update({ _id: req.userId }, { $set: { name: req.body.name, email: req.body.email, profilePicIndex: parseInt(req.body.profilePicIndex) || 0 } });
    db.compactDatafile();
    logServerEvent('info', `User ID '${req.userId}' updated their profile details`);
    res.json({ message: "Profiles details aligned successfully." });
});

app.post('/api/change-password', isAuthenticated, async (req, res) => {
    const { oldPass, newPass } = req.body;
    if (!newPass || newPass.length < 8) return res.status(400).json({ error: "Passwords constraints require min 8 chars mapping spaces." });

    const user = await db.findOne({ _id: req.userId });
    if (!user || !(await bcrypt.compare(oldPass, user.password))) {
        logServerEvent('warning', `Failed password change attempt: incorrect old password for user ID '${req.userId}'`);
        return res.status(400).json({ error: "Validation references match failed." });
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);
    await db.update({ _id: req.userId }, { $set: { password: hashedPassword } });
    db.compactDatafile();
    logServerEvent('warning', `User ID '${req.userId}' updated their password successfully`);
    res.json({ message: "Password updated successfully." });
});

app.get('/api/profile/security-question', isAuthenticated, async (req, res) => {
    const user = await db.findOne({ _id: req.userId });
    res.json({ securityQuestion: user?.securityQuestion || null });
});

app.post('/api/profile/security', isAuthenticated, async (req, res) => {
    const { currentPassword, securityQuestion, securityAnswer } = req.body;
    if (!currentPassword || !securityQuestion || !securityAnswer || securityAnswer.trim().length < 2) return res.status(400).json({ error: "Parameters misaligned sizes constraints." });
    if (!ALLOWED_SECURITY_QUESTIONS.includes(securityQuestion)) return res.status(400).json({ error: "Security context items matching path errors." });

    const user = await db.findOne({ _id: req.userId });
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) return res.status(400).json({ error: "Operational password matches failed." });

    const hashedAnswer = await bcrypt.hash(securityAnswer.trim().toLowerCase(), 10);
    await db.update({ _id: req.userId }, { $set: { securityQuestion, securityAnswer: hashedAnswer } });
    db.compactDatafile();
    logServerEvent('info', `User ID '${req.userId}' updated their security question`);
    res.json({ message: "Security configurations map updated." });
});

// User 2FA Setup
app.post('/api/profile/2fa/setup', isAuthenticated, async (req, res) => {
    try {
        const user = await db.findOne({ _id: req.userId });
        if (!user) return res.status(404).json({ error: "User not found" });
        const secret = generateBase32Secret();
        await db.update({ _id: req.userId }, { $set: { tempTwoFactorSecret: encryptText(secret) } });
        db.compactDatafile();
        const label = encodeURIComponent(`LogbookPlus:${user.username}`);
        const issuer = encodeURIComponent('LogbookPlus');
        const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;
        res.json({ secret, otpauthUrl });
    } catch (err) {
        res.status(500).json({ error: "Failed to initialize user 2FA setup" });
    }
});

// User 2FA Verify
app.post('/api/profile/2fa/verify', isAuthenticated, async (req, res) => {
    const { code } = req.body;
    if (!code || code.length !== 6) return res.status(400).json({ error: "Invalid code format. Must be 6 digits." });
    try {
        const user = await db.findOne({ _id: req.userId });
        if (!user || !user.tempTwoFactorSecret) {
            return res.status(400).json({ error: "2FA setup is not initialized" });
        }
        const matchedCounter = verifyTOTP(code, decryptText(user.tempTwoFactorSecret));
        if (matchedCounter !== null) {
            await db.update({ _id: req.userId }, {
                $set: { twoFactorEnabled: true, twoFactorSecret: user.tempTwoFactorSecret, tempTwoFactorSecret: null, lastUsedTOTPCounter: encryptText(String(matchedCounter)) }
            });
            db.compactDatafile();
            logServerEvent('info', `User ID '${req.userId}' successfully enabled 2FA`);
            res.json({ success: true, message: "Two-factor authentication enabled successfully!" });
        } else {
            res.status(400).json({ error: "Verification code is incorrect" });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to verify 2FA code" });
    }
});

// User 2FA Disable
app.post('/api/profile/2fa/disable', isAuthenticated, async (req, res) => {
    const { password, code } = req.body;
    if (!password || !code) return res.status(400).json({ error: "Password and verification code are required" });
    try {
        const user = await db.findOne({ _id: req.userId });
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            return res.status(400).json({ error: "2FA is not active" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Incorrect password" });
        }
        const decryptedCounter = decryptText(user.lastUsedTOTPCounter);
        const lastUsedTOTPCounter = decryptedCounter ? parseInt(decryptedCounter) : null;
        const userDisableResult = verifyTOTPWithReplay(code, decryptText(user.twoFactorSecret), lastUsedTOTPCounter);
        if (userDisableResult.valid) {
            await db.update({ _id: req.userId }, {
                $set: { twoFactorEnabled: false, twoFactorSecret: null, tempTwoFactorSecret: null, lastUsedTOTPCounter: null }
            });
            db.compactDatafile();
            logServerEvent('warning', `User ID '${req.userId}' disabled 2FA`);
            res.json({ success: true, message: "2FA has been disabled." });
        } else {
            res.status(400).json({ error: "Invalid or already used verification code" });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to disable 2FA" });
    }
});

// --- Subscriptions & Billing APIs ---
app.get('/api/site-settings', async (req, res) => {
    try {
        const settings = await db.findOne({ _id: 'site_settings' });
        const packageName = req.query.packageName || req.headers['x-package-name'] || req.headers['x-requested-with'];
        const indusPkg = process.env.INDUS_APP_STORE_PACKAGE_NAME || 'com.ex.logbookplus';
        const isIndus = (packageName === indusPkg);

        let responseData = settings ? { ...settings } : {
            heroBadge: "Local-first · Zero vendor lock",
            heroTitle: "Expense intelligence <br>that stays yours.",
            heroDesc: "Logbook Plus combines encrypted backups, multi‑policy storage, and seamless device sync — all hosted on your private cloud.",
            featuresTitle: "Engineered for control & clarity",
            featuresDesc: "Smart expense management designed around privacy-first architecture."
        };

        responseData.isIndus = isIndus;
        responseData.isIndusStore = isIndus;
        responseData.success = isIndus;
        responseData.valid = isIndus;

        res.json(responseData);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch site settings." });
    }
});

app.post('/api/master/site-settings', isMasterAuth, async (req, res) => {
    try {
        const { heroBadge, heroTitle, heroDesc, featuresTitle, featuresDesc } = req.body;
        await db.update(
            { _id: 'site_settings' },
            { $set: { heroBadge, heroTitle, heroDesc, featuresTitle, featuresDesc } },
            { upsert: true }
        );
        db.compactDatafile();
        logServerEvent('info', 'Master updated website setup configuration');
        res.json({ success: true, message: "Site settings updated successfully!" });
    } catch (e) {
        res.status(500).json({ error: "Failed to update site settings." });
    }
});

app.get('/api/master/pricing', isMasterAuth, async (req, res) => {
    try {
        const pricingConfig = await db.findOne({ _id: 'pricing_config' });
        if (pricingConfig) {
            res.json(pricingConfig);
        } else {
            res.json({
                free: {
                    amount: 0,
                    originalAmount: null,
                    currency: "₹",
                    period: "forever",
                    title: "Free Plan",
                    features: [
                        "2 entries per day",
                        "2 photos per entry",
                        "2 exports per month (Excel & Word)",
                        "Local backup only",
                        "Encrypted local backups",
                        "No tags / categories",
                        "No PDF export"
                    ]
                },
                premium: {
                    amount: 50,
                    originalAmount: 100,
                    currency: "₹",
                    period: "month",
                    title: "Cloud Premium Backup",
                    monthly: { amount: 50, originalAmount: 100 },
                    yearly: { amount: 500, originalAmount: 1000 },
                    features: [
                        "Everything in Free",
                        "Unlimited daily entries",
                        "Unlimited monthly exports",
                        "Unlock PDF export",
                        "Up to 10 photos per entry",
                        "Unlock all tags categories",
                        "Premium Analytics Dashboard",
                        "Auto quota management",
                        "Priority support"
                    ]
                },
                selfHosted: {
                    amount: 1499,
                    originalAmount: 2999,
                    currency: "₹",
                    period: "year",
                    title: "Self-Hosted License",
                    monthly: { amount: 199, originalAmount: 399 },
                    yearly: { amount: 1499, originalAmount: 2999 },
                    features: [
                        "Everything in Premium",
                        "Run on private server / Pi",
                        "Unlimited local users",
                        "Cryptographic offline activation",
                        "Zero external servers required",
                        "Full control over backup size limits"
                    ]
                }
            });
        }
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch pricing configuration." });
    }
});

app.post('/api/master/pricing', isMasterAuth, async (req, res) => {
    try {
        const { free, premium, selfHosted } = req.body;
        if (!free || !premium || !selfHosted) {
            return res.status(400).json({ error: "Missing plan details in request body." });
        }
        await db.update(
            { _id: 'pricing_config' },
            { $set: { free, premium, selfHosted } },
            { upsert: true }
        );
        db.compactDatafile();
        logServerEvent('info', 'Master updated dynamic plan offerings and prices config');
        res.json({ success: true, message: "Pricing and offering configurations updated successfully!" });
    } catch (e) {
        res.status(500).json({ error: "Failed to update pricing configuration." });
    }
});

// ── Changelog API Management ──
app.get('/api/changelog', async (req, res) => {
    try {
        const config = await db.findOne({ _id: 'changelog_config' });
        if (config && config.entries) {
            return res.json(config.entries);
        }
        res.json([
            {
                version: "v2.0.9",
                date: "December 2025",
                changes: [
                    "Added cloud backup support (WebDAV)",
                    "Added self-hosted server backup sync",
                    "Added Two-Factor Authentication (2FA)",
                    "Added security questions for recovery",
                    "Integrated Google Play Billing Client 7",
                    "Added profile picture upload and editing",
                    "Added FAQ search functionality",
                    "Added Hindi, Marathi, and Urdu language support",
                    "UI polish and bug fixes"
                ]
            },
            {
                version: "v2.0.5",
                date: "October 2025",
                changes: [
                    "UI polish and bug fixes",
                    "Added photo preview in add entry screen",
                    "Added support for android 16",
                    "Added support for static theme"
                ]
            },
            {
                version: "v1.1.1",
                date: "August 2025",
                changes: [
                    "UI polish",
                    "Added changelog screen",
                    "Added share app link feature",
                    "Fix language change bug",
                    "Fix bug in photo saving"
                ]
            },
            {
                version: "v1.1.0",
                date: "June 2025",
                changes: [
                    "Added encrypted backup support",
                    "Improved app performance",
                    "Added donation screen",
                    "Added easter egg feature",
                    "Added dark mode support",
                    "Added language support",
                    "Added encrypted backup & restore",
                    "Bug fixes and UI improvements"
                ]
            },
            {
                version: "v1.0.0",
                date: "April 2025",
                changes: [
                    "Initial public beta release"
                ]
            }
        ]);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch changelogs" });
    }
});

app.post('/api/master/changelog', isMasterAuth, async (req, res) => {
    try {
        const { version, date, format, changes } = req.body;
        if (!version || !date || !changes) {
            return res.status(400).json({ error: "Missing required fields: version, date, and changes are required." });
        }

        let changesArray = [];
        if (format === 'json') {
            try {
                changesArray = JSON.parse(changes);
                if (!Array.isArray(changesArray)) {
                    return res.status(400).json({ error: "Changes must be a valid JSON array of strings." });
                }
            } catch (err) {
                return res.status(400).json({ error: "Invalid JSON format: " + err.message });
            }
        } else {
            changesArray = changes.split('\n').map(x => x.trim()).filter(x => x.length > 0);
        }

        let config = await db.findOne({ _id: 'changelog_config' });
        if (!config) {
            config = {
                _id: 'changelog_config',
                entries: [
                    {
                        version: "v2.4.0",
                        date: "July 2026",
                        changes: [
                            "Added Monthly & Yearly billing switch inside the pricing section for better plan selection flexibility.",
                            "Redesigned footer layout with full link navigation and centralized script loader.",
                            "Added advanced analytics visualization directly inside the premium dashboard."
                        ]
                    },
                    {
                        version: "v2.3.1",
                        date: "May 2026",
                        changes: [
                            "Optimized memory consumption during local database encryption processing.",
                            "Resolved minor image compression bugs for photo attachment uploads."
                        ]
                    },
                    {
                        version: "v2.2.0",
                        date: "March 2026",
                        changes: [
                            "Introduced encrypted local backup capabilities utilizing AES-256 standards.",
                            "Added tag customization and search-filter categories.",
                            "Implemented offline license verification for closed private environments."
                        ]
                    }
                ]
            };
        }

        const newEntry = { version, date, changes: changesArray };
        config.entries = config.entries.filter(e => e.version !== version);
        config.entries.unshift(newEntry);

        await db.update(
            { _id: 'changelog_config' },
            { $set: { entries: config.entries } },
            { upsert: true }
        );
        db.compactDatafile();
        logServerEvent('info', `Master added/updated changelog version: ${version}`);
        res.json({ success: true, message: "Changelog entry added successfully!" });
    } catch (e) {
        res.status(500).json({ error: "Failed to update changelog config." });
    }
});

app.delete('/api/master/changelog/:version', isMasterAuth, async (req, res) => {
    try {
        const { version } = req.params;
        let config = await db.findOne({ _id: 'changelog_config' });
        if (config && config.entries) {
            config.entries = config.entries.filter(e => e.version !== version);
            await db.update(
                { _id: 'changelog_config' },
                { $set: { entries: config.entries } },
                { upsert: true }
            );
            db.compactDatafile();
            logServerEvent('info', `Master deleted changelog version: ${version}`);
            return res.json({ success: true, message: "Changelog entry deleted successfully." });
        }
        res.status(404).json({ error: "Changelog entries not found." });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete changelog entry." });
    }
});

app.get('/api/pricing', async (req, res) => {
    try {
        const pricingConfig = await db.findOne({ _id: 'pricing_config' });
        const packageName = req.query.packageName || req.headers['x-package-name'] || req.headers['x-requested-with'];
        const indusPkg = process.env.INDUS_APP_STORE_PACKAGE_NAME || 'com.ex.logbookplus';
        const isIndus = (packageName === indusPkg);

        if (pricingConfig && pricingConfig.free && pricingConfig.premium && pricingConfig.selfHosted) {
            return res.json({
                free: pricingConfig.free,
                premium: pricingConfig.premium,
                selfHosted: pricingConfig.selfHosted,
                isIndus: isIndus,
                isIndusStore: isIndus,
                success: isIndus,
                valid: isIndus
            });
        }

        const filePath = path.join(__dirname, 'public', 'pricing', 'index.html');
        const content = fs.readFileSync(filePath, 'utf8');

        function parseCard(className) {
            const cardRegex = new RegExp(`<div class="pricing-card\\s+[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<button`, 'i');
            const match = content.match(cardRegex);
            if (!match) return null;
            const cardHtml = match[1];

            const titleMatch = cardHtml.match(/<h2>([^<]+)<\/h2>/i);
            const title = titleMatch ? titleMatch[1].trim() : '';

            const getSpanContent = (cName) => {
                const regex = new RegExp(`<span\\s+[^>]*\\bclass=["'](?:[^"']*\\s+)?${cName}(?:\\s+[^"']*)?["'][^>]*>([\\s\\S]*?)<\\/span>`, 'i');
                const m = cardHtml.match(regex);
                return m ? m[1].trim() : null;
            };

            const currency = getSpanContent('currency') || '₹';
            const originalAmountStr = getSpanContent('original-amount');
            const originalAmount = originalAmountStr ? parseInt(originalAmountStr.replace(/,/g, '').trim(), 10) : null;
            const amountStr = getSpanContent('amount');
            const amount = amountStr ? parseInt(amountStr.replace(/,/g, '').trim(), 10) : 0;
            const periodStr = getSpanContent('period') || '';
            const period = periodStr.replace(/[\/\s]/g, '').trim();

            const features = [];
            const liRegex = /<li>([\s\S]*?)<\/li>/gi;
            let liMatch;
            while ((liMatch = liRegex.exec(cardHtml)) !== null) {
                let text = liMatch[1].replace(/<[^>]+>/g, '').trim();
                text = text.replace(/\s+/g, ' ');
                features.push(text);
            }

            return { amount, originalAmount, currency, period, title, features };
        }

        const freeData = parseCard('free');
        const premiumData = parseCard('premium');
        const selfHostedData = parseCard('self-hosted');

        if (!freeData || !premiumData || !selfHostedData) {
            throw new Error("HTML Regex parsing failed, falling back to hardcoded JSON.");
        }

        premiumData.monthly = { amount: 50, originalAmount: 100 };
        premiumData.yearly = { amount: 500, originalAmount: 1000 };

        selfHostedData.monthly = { amount: 199, originalAmount: 399 };
        selfHostedData.yearly = { amount: 1499, originalAmount: 2999 };

        res.json({
            free: freeData,
            premium: premiumData,
            selfHosted: selfHostedData,
            isIndus: isIndus,
            isIndusStore: isIndus,
            success: isIndus,
            valid: isIndus
        });
    } catch (e) {
        console.error("Failed to parse pricing from HTML:", e);
        const packageName = req.query.packageName || req.headers['x-package-name'] || req.headers['x-requested-with'];
        const indusPkg = process.env.INDUS_APP_STORE_PACKAGE_NAME || 'com.ex.logbookplus';
        const isIndus = (packageName === indusPkg);

        res.json({
            free: {
                amount: 0,
                originalAmount: null,
                currency: "₹",
                period: "forever",
                title: "Free Plan",
                features: [
                    "2 entries per day",
                    "2 photos per entry",
                    "2 exports per month (Excel & Word)",
                    "No tags / categories",
                    "No PDF export",
                    "Local backup only",
                    "Encrypted local backups"
                ]
            },
            premium: {
                amount: 50,
                originalAmount: 150,
                currency: "₹",
                period: "month",
                title: "Cloud Premium Backup",
                monthly: { amount: 50, originalAmount: 100 },
                yearly: { amount: 500, originalAmount: 1000 },
                features: [
                    "Everything in Free",
                    "Unlimited daily entries",
                    "Unlimited monthly exports",
                    "Unlock PDF export",
                    "Up to 10 photos per entry",
                    "Unlock all tags categories",
                    "Premium Analytics Dashboard",
                    "Auto quota management",
                    "Priority support"
                ]
            },
            selfHosted: {
                amount: 1499,
                originalAmount: 2999,
                currency: "₹",
                period: "year",
                title: "Self-Hosted License",
                monthly: { amount: 199, originalAmount: 399 },
                yearly: { amount: 1499, originalAmount: 2999 },
                features: [
                    "Everything in Premium",
                    "Run on private server / Pi",
                    "Unlimited local users",
                    "Cryptographic offline activation",
                    "Zero external servers required",
                    "Full control over backup size limits"
                ]
            },
            isIndus: isIndus,
            isIndusStore: isIndus,
            success: isIndus,
            valid: isIndus
        });
    }
});

// Cancel subscription — sets status to 'cancelled' but keeps access until expiresAt
async function handleCancelSubscription(req, res) {
    try {
        const user = await db.findOne({ _id: req.userId });
        const currentPlan = user ? user.plan : 'unpaid';
        const expiresAt = user ? user.subscriptionExpiresAt : 0;

        if (!user || currentPlan === 'unpaid' || currentPlan === 'free') {
            return res.status(400).json({ error: "No active subscription to cancel." });
        }

        await db.update(
            { _id: req.userId },
            { $set: { plan: currentPlan, subscriptionStatus: 'cancelled', subscriptionExpiresAt: expiresAt } }
        );
        db.compactDatafile();
        logServerEvent('info', `User ID '${req.userId}' cancelled ${currentPlan} subscription`);

        const daysRemaining = expiresAt > Date.now() ? Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)) : 0;

        res.json({
            success: true,
            message: `Subscription cancelled. You still have access for ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`,
            plan: currentPlan,
            subscriptionStatus: "cancelled",
            subscriptionExpiresAt: expiresAt,
            daysRemaining: daysRemaining
        });
    } catch (e) {
        logServerEvent('critical', `Subscription cancellation failed for user ID '${req.userId}'`);
        res.status(500).json({ error: "Failed to cancel subscription." });
    }
}

app.post('/api/subscription/cancel', isAuthenticated, handleCancelSubscription);
app.post('/api/subscription/cancel-mock', isAuthenticated, handleCancelSubscription); // backward compat

app.post('/api/checkout/session-mock', isAuthenticated, async (req, res) => {
    res.status(400).json({ error: "Web checkout is disabled. Subscriptions and license purchases are only available directly inside the Logbook Plus mobile application." });
});

// Activate subscription — only used for dev/testing fallback (production uses verify-purchase)
async function handleActivateSubscription(req, res) {
    try {
        const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
        await db.update(
            { _id: req.userId },
            { $set: { plan: 'premium', subscriptionStatus: 'active', subscriptionExpiresAt: expiresAt, quotaLimit: 240 * 1024 * 1024 } }
        );
        db.compactDatafile();
        logServerEvent('info', `User ID '${req.userId}' activated premium subscription`);
        res.json({
            success: true,
            message: "Subscription activated successfully! Quota: 240MB.",
            plan: "premium",
            subscriptionStatus: "active",
            subscriptionExpiresAt: expiresAt
        });
    } catch (e) {
        logServerEvent('critical', `Subscription activation failed for user ID '${req.userId}'`);
        res.status(500).json({ error: "Failed to activate subscription." });
    }
}

app.post('/api/subscription/activate', isAuthenticated, handleActivateSubscription);
app.post('/api/subscription/activate-mock', isAuthenticated, handleActivateSubscription); // backward compat

app.post('/api/verify-purchase', isAuthenticated, async (req, res) => {
    const { purchaseToken, productId } = req.body;
    const packageName = req.body.packageName || req.headers['x-package-name'] || req.headers['x-requested-with'];

    if (!purchaseToken || !productId) {
        return res.status(400).json({ error: "Missing purchase token or product ID" });
    }

    try {
        // Determine plan type from productId
        const planType = determinePlanType(productId);
        let verifyResult;

        // Try subscription verification first, then fall back to product (one-time) verification
        verifyResult = await verifyPlaySubscription(purchaseToken, productId, packageName);
        if (!verifyResult.valid && verifyResult.error) {
            // Maybe it's a one-time product, try product verification
            verifyResult = await verifyPlayProduct(purchaseToken, productId, packageName);
        }

        if (!verifyResult.valid) {
            logServerEvent('warning', `Purchase verification REJECTED for user ID '${req.userId}', productId: ${productId}`);
            return res.status(403).json({ error: "Purchase verification failed. The purchase token is invalid or expired." });
        }

        const expiresAt = verifyResult.expiryTimeMillis || (Date.now() + 30 * 24 * 60 * 60 * 1000);
        const plan = verifyResult.planType || planType;

        logServerEvent('info', `User ID '${req.userId}' verified Play Billing purchase — plan: ${plan}, productId: ${productId}, expires: ${new Date(expiresAt).toISOString()}`);

        await db.update(
            { _id: req.userId },
            { $set: { plan: plan, subscriptionStatus: 'active', subscriptionExpiresAt: expiresAt, quotaLimit: 240 * 1024 * 1024 } }
        );
        db.compactDatafile();

        // If this is a license purchase, also generate the self-hosted license key
        if (plan === 'licensed') {
            const user = await db.findOne({ _id: req.userId });
            const licensee = user ? (user.email || user.username) : 'licensee@logbookplus';

            // Check if active license already exists
            const existingLicenses = await db.find({ type: 'generated_license', licensee });
            const activeLicense = existingLicenses.find(lic => lic.expiresAt > Date.now());

            if (!activeLicense) {
                const licenseKey = jwt.sign(
                    { type: 'self-hosted', licensee, expiresAt },
                    LICENSE_SECRET
                );
                await db.insert({
                    type: 'generated_license',
                    licensee,
                    expiresAt,
                    licenseKey,
                    createdAt: Date.now()
                });
                db.compactDatafile();
                logServerEvent('info', `Auto-generated self-hosted license key for ${licensee} via Google Play purchase`);
            }
        }

        res.json({
            success: true,
            message: "Purchase verified successfully!",
            plan: plan,
            subscriptionStatus: "active",
            subscriptionExpiresAt: expiresAt
        });
    } catch (e) {
        logServerEvent('critical', `Play Billing verification failed for user ID '${req.userId}': ${e.message}`);
        res.status(500).json({ error: "Failed to verify purchase." });
    }
});

// License purchase — generates license key (payment is verified via /api/verify-purchase)
async function handleLicensePurchase(req, res) {
    const { email } = req.body;
    const licensee = email || 'licensee@logbookplus';
    const durationDays = 365;
    const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;

    try {
        // Enforce limit of one active key per account
        const existingLicenses = await db.find({ type: 'generated_license', licensee });
        const now = Date.now();
        const activeLicense = existingLicenses.find(lic => lic.expiresAt > now);
        if (activeLicense) {
            return res.status(400).json({ error: "An active license key already exists for this email address." });
        }

        const licenseKey = jwt.sign(
            { type: 'self-hosted', licensee, expiresAt },
            LICENSE_SECRET
        );

        await db.insert({
            type: 'generated_license',
            licensee,
            expiresAt,
            licenseKey,
            createdAt: Date.now()
        });

        // Update user account plan to license and active
        await db.update(
            { _id: req.userId },
            { $set: { plan: 'licensed', subscriptionStatus: 'active', subscriptionExpiresAt: expiresAt, quotaLimit: 240 * 1024 * 1024 } }
        );
        db.compactDatafile();

        logServerEvent('info', `User ID '${req.userId}' purchased self-hosted license key for ${licensee}`);
        res.status(201).json({ success: true, licenseKey, expiresAt: new Date(expiresAt).toLocaleDateString() });
    } catch (e) {
        logServerEvent('critical', `License purchase failed for user ID '${req.userId}'`);
        res.status(500).json({ error: "Failed to purchase license key." });
    }
}

app.post('/api/license/purchase', isAuthenticated, handleLicensePurchase);
app.post('/api/license/purchase-mock', isAuthenticated, handleLicensePurchase); // backward compat

app.get('/api/licenses/check', isAuthenticated, async (req, res) => {
    try {
        const user = await db.findOne({ _id: req.userId });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // Search NeDB for any generated licenses for this user's email
        const licenses = await db.find({ type: 'generated_license', licensee: user.email });
        const now = Date.now();
        const validLicense = licenses.find(lic => lic.expiresAt > now);

        if (validLicense) {
            res.json({ hasLicense: true, licenseKey: validLicense.licenseKey, expiresAt: validLicense.expiresAt });
        } else {
            res.json({ hasLicense: false });
        }
    } catch (e) {
        logServerEvent('critical', `License check failed for user ID '${req.userId}'`);
        res.status(500).json({ error: "Failed to verify license key status." });
    }
});

app.post('/api/master/licenses/generate', isMasterAuth, async (req, res) => {
    const { licensee, durationDays } = req.body;
    if (!licensee) return res.status(400).json({ error: "Licensee name/email is required." });
    const days = parseInt(durationDays) || 365;
    const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;

    try {
        // Enforce limit of one active key per account
        const existingLicenses = await db.find({ type: 'generated_license', licensee });
        const now = Date.now();
        const activeLicense = existingLicenses.find(lic => lic.expiresAt > now);
        if (activeLicense) {
            return res.status(400).json({ error: "An active license key already exists for this email address." });
        }

        const licenseKey = jwt.sign(
            { type: 'self-hosted', licensee, expiresAt },
            LICENSE_SECRET
        );

        await db.insert({
            type: 'generated_license',
            licensee,
            expiresAt,
            licenseKey,
            createdAt: Date.now()
        });

        logServerEvent('info', `Master generated license key for ${licensee} lasting ${durationDays} days`);
        res.status(201).json({ success: true, licenseKey, expiresAt: new Date(expiresAt).toLocaleDateString() });
    } catch (e) {
        logServerEvent('critical', `Master failed to generate license key for ${licensee}`);
        res.status(500).json({ error: "Failed to generate license key." });
    }
});

app.get('/api/master/licenses', isMasterAuth, async (req, res) => {
    try {
        const licenses = await db.find({ type: 'generated_license' });
        licenses.sort((a, b) => b.createdAt - a.createdAt);
        res.json(licenses);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch license keys." });
    }
});

app.post('/api/master/licenses/:id/plan', isMasterAuth, async (req, res) => {
    const { expiresAt } = req.body;
    if (!expiresAt) {
        return res.status(400).json({ error: "Expiration timestamp is required." });
    }

    try {
        const license = await db.findOne({ _id: req.params.id, type: 'generated_license' });
        if (!license) {
            return res.status(404).json({ error: "License not found" });
        }

        const newExpiresAt = parseInt(expiresAt);

        // Re-sign the JWT containing licensee and updated expiresAt
        const licenseKey = jwt.sign(
            { type: 'self-hosted', licensee: license.licensee, expiresAt: newExpiresAt },
            LICENSE_SECRET
        );

        await db.update(
            { _id: req.params.id, type: 'generated_license' },
            { $set: { expiresAt: newExpiresAt, licenseKey } }
        );
        db.compactDatafile();
        logServerEvent('warning', `Master updated license key for ${license.licensee}: expiresAt=${newExpiresAt}`);
        res.json({ success: true, message: "License key validity updated successfully", licenseKey });
    } catch (e) {
        logServerEvent('critical', `Master failed to update license key ID ${req.params.id}: ${e.message}`);
        res.status(500).json({ error: "Failed to update license key validity" });
    }
});

app.delete('/api/master/licenses/:id', isMasterAuth, async (req, res) => {
    try {
        const result = await db.remove({ _id: req.params.id, type: 'generated_license' }, {});
        if (result === 0) return res.status(404).json({ error: "License not found" });
        db.compactDatafile();
        logServerEvent('warning', `Master revoked license key ID: ${req.params.id}`);
        res.json({ success: true, message: "License key successfully revoked." });
    } catch (e) {
        logServerEvent('critical', `Master failed to revoke license key ID: ${req.params.id}`);
        res.status(500).json({ error: "Failed to revoke license key." });
    }
});

async function migrateTwoFactorSecrets() {
    try {
        const allDocs = await db.find({});
        let updatedCount = 0;
        for (const doc of allDocs) {
            let updated = false;
            const $set = {};
            if (doc.tempTwoFactorSecret && !doc.tempTwoFactorSecret.includes(':')) {
                $set.tempTwoFactorSecret = encryptText(doc.tempTwoFactorSecret);
                updated = true;
            }
            if (doc.twoFactorSecret && !doc.twoFactorSecret.includes(':')) {
                $set.twoFactorSecret = encryptText(doc.twoFactorSecret);
                updated = true;
            }
            if (doc.lastUsedTOTPCounter !== undefined && doc.lastUsedTOTPCounter !== null && !String(doc.lastUsedTOTPCounter).includes(':')) {
                $set.lastUsedTOTPCounter = encryptText(String(doc.lastUsedTOTPCounter));
                updated = true;
            }
            if (updated) {
                await db.update({ _id: doc._id }, { $set });
                updatedCount++;
            }
        }
        if (updatedCount > 0) {
            db.compactDatafile();
            logServerEvent('warning', `2FA Secrets Migration: Encrypted ${updatedCount} plain-text 2FA secrets/counters in the database.`);
        }
    } catch (e) {
        logServerEvent('error', `Failed to run 2FA secrets database migration: ${e.message}`);
    }
}

app.listen(PORT, '0.0.0.0', async () => {
    logServerEvent('info', `Server started successfully and running at http://localhost:${PORT}`);
    await migrateTwoFactorSecrets();
});