const express = require('express');
const router = express.Router();
const os = require('os');
const crypto = require('crypto');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const path = require('path');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { google } = require('googleapis');
require('dotenv').config({ quiet: true });

// Custom encapsulated modules
const { db, usersDb, logsDb, changelogDb, licensesDb, twoFactorDb } = require('./config/db');
const { JWT_SECRET, isAuthenticated, isMasterAuth } = require('./middleware/auth');
const { logServerEvent } = require('./utils/logger');
const {
    serverConfig,
    activeUserSessions,
    networkStats,
    networkEndpointStats,
    networkClientIpStats,
    networkMethodStats,
    getCpuUsagePercent,
    recordUserActivity
} = require('./utils/serverState');

const { readSubscriptions, writeSubscriptions, SCHOOLS, readUsers, readTickets, getSubscriptionForSchool, readLicenses, writeLicenses } = require('./utils/dbHelper');
const ticketRoutes = require('./routes/ticketRoutes');
const helpdeskAuthRoutes = require('./routes/authRoutes');

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

// --- Security / Limiter Configurations ---
// keyGenerator extracts the real client IP from X-Forwarded-For (set by Apache/Nginx reverse proxy)
// This ensures rate limiting is PER-CLIENT-IP, not global for the whole server.
const getClientIp = (req) => {
    // Cloudflare Tunnel (cloudflared) sets CF-Connecting-IP for the real client
    const cfIp = req.headers['cf-connecting-ip'];
    let rawIp = 'unknown';
    if (cfIp) {
        rawIp = cfIp.trim();
    } else {
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
            rawIp = forwarded.split(',')[0].trim();
        } else {
            rawIp = req.ip || req.connection?.remoteAddress || 'unknown';
        }
    }
    return ipKeyGenerator(rawIp);
};

const createLimiter = (windowMins, maxRequests, errMsg) => rateLimit({
    windowMs: windowMins * 60 * 1000,
    max: maxRequests,
    keyGenerator: getClientIp,
    message: { error: errMsg },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        const clientIp = getClientIp(req);
        logServerEvent('alarm', `Rate limit hit on endpoint: ${req.originalUrl || req.url} from IP: ${clientIp}`);
        res.status(options.statusCode).send(options.message);
    }
});

const loginLimiter = createLimiter(15, 10, "Too many attempts. Try again in 15 minutes.");
const mfaLimiter = createLimiter(15, 20, "Too many 2FA verification attempts. Try again in 15 minutes.");
const signupLimiter = createLimiter(60, 5, "Too many accounts created. Try again after an hour.");
const forgotLimiter = createLimiter(60, 8, "Too many reset attempts. Try again after an hour.");

// Router-level cache headers middleware
router.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Helpdesk Master Control API Endpoints
const handleGetSubscriptions = (req, res) => {
    try {
        const subscriptions = readSubscriptions();
        const result = SCHOOLS.map(school => {
            let admins = 0;
            let ticketsCount = 0;
            try {
                const users = readUsers(school);
                admins = users.filter(u => u.role === 'ADMIN').length;
            } catch (e) { }
            try {
                const tkts = readTickets(school);
                ticketsCount = tkts.filter(t => t.status !== 'CLOSED').length;
            } catch (e) { }

            const subObj = getSubscriptionForSchool(school);
            return {
                school,
                status: subObj.status || 'ACTIVE',
                expiresAt: subObj.expiresAt || null,
                activeAdmins: admins,
                activeTickets: ticketsCount
            };
        });
        return res.status(200).json({ success: true, subscriptions: result });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

const handleToggleSubscription = (req, res) => {
    try {
        const { school, status, expiresAt } = req.body;
        if (!school) {
            return res.status(400).json({ success: false, error: 'School key is required.' });
        }
        const schoolKey = school.toString().toUpperCase().trim();
        const subscriptions = readSubscriptions();
        subscriptions[schoolKey] = {
            ...(subscriptions[schoolKey] || {}),
        };
        if (status !== undefined) {
            subscriptions[schoolKey].status = status;
        }
        if (expiresAt !== undefined) {
            subscriptions[schoolKey].expiresAt = expiresAt ? new Date(expiresAt).toISOString() : null;
        }
        writeSubscriptions(subscriptions);
        return res.status(200).json({ success: true, message: `Subscription for ${schoolKey} updated successfully.` });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

router.get('/v1/master/subscriptions', handleGetSubscriptions);
router.get('/master/subscriptions', handleGetSubscriptions);
router.post('/v1/master/subscriptions/toggle', handleToggleSubscription);
router.post('/master/subscriptions/toggle', handleToggleSubscription);

// Sub-router mounts
router.use('/v1/tickets', ticketRoutes);
router.use('/v1/auth', helpdeskAuthRoutes);

// File Encryption Configuration & Helpers
const FILE_ENCRYPTION_KEY = process.env.FILE_ENCRYPTION_KEY || 'logbookplus_default_file_key_32b';
const fileEncryptionKeyBuffer = crypto.createHash('sha256').update(FILE_ENCRYPTION_KEY).digest();

const DB_ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || 'logbookplus_default_db_key_32b_';
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
            return encryptedText;
        }
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv('aes-256-cbc', dbEncryptionKeyBuffer, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return encryptedText;
    }
}

async function encryptFile(filePath) {
    const tempPath = filePath + '.tmp';
    const readStream = fs.createReadStream(filePath);
    const writeStream = fs.createWriteStream(tempPath);

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', fileEncryptionKeyBuffer, iv);

    writeStream.write(Buffer.from('LOGBOOK_CRYPT\0', 'utf8'));
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

// Storage Setup
const ALLOWED_MIME_TYPES = ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
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
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const mimeOk = file.mimetype && file.mimetype.startsWith('image/');
        const ext = path.extname(file.originalname || '').toLowerCase();
        const extOk = !ext || ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'].includes(ext);
        if (mimeOk || extOk) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed (.jpg, .jpeg, .png, .webp, .gif)'));
    }
});

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

async function verifyPlaySubscription(purchaseToken, productId, packageName) {
    const indusPkg = process.env.INDUS_APP_STORE_PACKAGE_NAME || 'com.ex.logbookplus';
    if (packageName === indusPkg) {
        logServerEvent('info', `Indus App Store subscription bypass for ${productId}`);
        return { valid: true, expiryTimeMillis: Date.now() + 30 * 24 * 60 * 60 * 1000, planType: determinePlanType(productId) };
    }
    if (!androidPublisher) {
        if (process.env.NODE_ENV === 'production') {
            logServerEvent('critical', `Google Play API not configured — rejecting purchase token for ${productId} in production mode.`);
            return { valid: false, error: 'Google Play API not configured on this server. Contact support.' };
        }
        logServerEvent('warning', `Google Play API not available — accepting purchase token for ${productId} without verification`);
        return { valid: true, expiryTimeMillis: Date.now() + 30 * 24 * 60 * 60 * 1000, planType: determinePlanType(productId) };
    }
    try {
        const response = await androidPublisher.purchases.subscriptions.get({
            packageName: GOOGLE_PLAY_PACKAGE_NAME,
            subscriptionId: productId,
            token: purchaseToken
        });
        const data = response.data;
        const isValid = data.paymentState !== undefined && parseInt(data.paymentState) >= 0;
        const expiryTimeMillis = parseInt(data.expiryTimeMillis) || (Date.now() + 30 * 24 * 60 * 60 * 1000);
        return { valid: isValid, expiryTimeMillis, planType: determinePlanType(productId), rawData: data };
    } catch (e) {
        logServerEvent('critical', `Google Play subscription verification failed for ${productId}: ${e.message}`);
        return { valid: false, error: e.message };
    }
}

async function verifyPlayProduct(purchaseToken, productId, packageName) {
    const indusPkg = process.env.INDUS_APP_STORE_PACKAGE_NAME || 'com.ex.logbookplus';
    if (packageName === indusPkg) {
        logServerEvent('info', `Indus App Store product bypass for ${productId}`);
        return { valid: true, expiryTimeMillis: Date.now() + 365 * 24 * 60 * 60 * 1000, planType: determinePlanType(productId) };
    }
    if (!androidPublisher) {
        if (process.env.NODE_ENV === 'production') {
            logServerEvent('critical', `Google Play API not configured — rejecting product purchase for ${productId} in production mode.`);
            return { valid: false, error: 'Google Play API not configured on this server. Contact support.' };
        }
        logServerEvent('warning', `Google Play API not available — accepting product purchase for ${productId} without verification`);
        return { valid: true, expiryTimeMillis: Date.now() + 365 * 24 * 60 * 60 * 1000, planType: determinePlanType(productId) };
    }
    try {
        const response = await androidPublisher.purchases.products.get({
            packageName: GOOGLE_PLAY_PACKAGE_NAME,
            productId: productId,
            token: purchaseToken
        });
        const data = response.data;
        const isValid = data.purchaseState === 0;
        const purchaseTime = parseInt(data.purchaseTimeMillis) || Date.now();
        const expiryTimeMillis = purchaseTime + 365 * 24 * 60 * 60 * 1000;
        return { valid: isValid, expiryTimeMillis, planType: determinePlanType(productId), rawData: data };
    } catch (e) {
        logServerEvent('critical', `Google Play product verification failed for ${productId}: ${e.message}`);
        return { valid: false, error: e.message };
    }
}

function determinePlanType(productId) {
    if (productId.includes('license') || productId.includes('selfhosted') || productId.includes('self_hosted')) {
        return 'licensed';
    }
    return 'premium';
}

async function isSubscribed(req, res, next) {
    if (process.env.IS_SELF_HOSTED === 'true') {
        const key = process.env.LICENSE_KEY || serverConfig.licenseKey;
        if (!verifyLicenseKey(key)) {
            logServerEvent('alarm', 'Blocked access: unlicensed self-hosted instance or expired license key detected');
            return res.status(402).json({ error: "Unlicensed self-hosted instance. Please configure a valid LICENSE_KEY in your server settings." });
        }
        return next();
    }

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

            const quotaLimit = 240 * 1024 * 1024;
            const maxBackupCount = 3;

            const fileStats = await Promise.all(
                backupFiles.map(async f => ({ name: f, mtime: (await fs.stat(path.join(userDir, f))).mtimeMs, size: (await fs.stat(path.join(userDir, f))).size }))
            );
            fileStats.sort((a, b) => a.mtime - b.mtime);

            let currentCount = backupFiles.length;
            while (currentCount >= maxBackupCount && fileStats.length > 0) {
                const oldest = fileStats.shift();
                await fs.remove(path.join(userDir, oldest.name));
                size -= oldest.size;
                currentCount--;
            }

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

// Health Check Endpoint
router.get('/health', async (req, res) => {
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

// Contact Form
router.post('/contact', async (req, res) => {
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

// Newsletter Subscription
router.post('/subscribe', async (req, res) => {
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

// TOTP / 2FA Utilities
function base32Decode(base32Str) {
    if (!base32Str) throw new Error("Base32 secret is required");
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let cleanStr = String(base32Str).replace(/[\s\-\=]/g, '').toUpperCase();
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
        const cleanToken = String(token).replace(/[\s\-]/g, '').trim();
        const secretBuffer = base32Decode(base32Secret);
        const currentCounter = Math.floor(Date.now() / 30000);
        for (let i = -window; i <= window; i++) {
            if (generateHOTP(secretBuffer, currentCounter + i) === cleanToken) {
                return currentCounter + i;
            }
        }
    } catch (e) {
        console.error("TOTP verification error:", e);
    }
    return null;
}

function verifyTOTPWithReplay(code, base32Secret, lastUsedCounter) {
    const matchedCounter = verifyTOTP(code, base32Secret);
    if (matchedCounter === null) {
        return { valid: false, counter: null };
    }
    if (lastUsedCounter !== null && lastUsedCounter !== undefined && !isNaN(lastUsedCounter) && matchedCounter <= lastUsedCounter) {
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

// Master Auth Endpoints
router.post('/master/login', loginLimiter, async (req, res) => {
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
        const master2FA = await twoFactorDb.findOne({ _id: 'master_profile' });
        const isMatch = masterProfile?.password ? await bcrypt.compare(password, masterProfile.password) : (password === MASTER_PASS);

        if (isMatch) {
            if (master2FA && master2FA.twoFactorEnabled && master2FA.twoFactorSecret) {
                const mfaToken = jwt.sign({ isMasterTemp: true }, JWT_SECRET, { expiresIn: '5m' });
                return res.json({ requires2FA: true, mfaToken });
            }
            logServerEvent('info', `Master admin logged in successfully from IP: ${req.ip}`);
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

router.post('/master/login/verify', mfaLimiter, async (req, res) => {
    const { mfaToken, code } = req.body;
    if (!mfaToken || !code) return res.status(400).json({ error: "MFA token and verification code are required" });
    try {
        const decoded = jwt.verify(mfaToken, JWT_SECRET);
        if (!decoded.isMasterTemp) {
            return res.status(401).json({ error: "Invalid MFA session" });
        }
        const master2FA = await twoFactorDb.findOne({ _id: 'master_profile' });
        if (!master2FA || !master2FA.twoFactorEnabled || !master2FA.twoFactorSecret) {
            return res.status(400).json({ error: "2FA is not enabled on master account" });
        }
        const decryptedCounter = decryptText(master2FA.lastUsedTOTPCounter);
        const lastUsedTOTPCounter = decryptedCounter ? parseInt(decryptedCounter) : null;
        const mfaResult = verifyTOTPWithReplay(code, decryptText(master2FA.twoFactorSecret), lastUsedTOTPCounter);
        if (mfaResult.valid) {
            await twoFactorDb.update({ _id: 'master_profile' }, { $set: { lastUsedTOTPCounter: encryptText(String(mfaResult.counter)) } }, { upsert: true });
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

router.post('/master/2fa/setup', isMasterAuth, async (req, res) => {
    try {
        const secret = generateBase32Secret();
        await twoFactorDb.update({ _id: 'master_profile' }, { $set: { tempTwoFactorSecret: encryptText(secret) } }, { upsert: true });
        const label = encodeURIComponent('LogbookPlus:MasterAdmin');
        const issuer = encodeURIComponent('LogbookPlus');
        const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;
        res.json({ secret, otpauthUrl });
    } catch (err) {
        res.status(500).json({ error: "Failed to initialize master 2FA setup" });
    }
});

router.post('/master/2fa/verify', isMasterAuth, async (req, res) => {
    const { code } = req.body;
    if (!code || code.length !== 6) return res.status(400).json({ error: "Invalid code format" });
    try {
        const twoFactor = await twoFactorDb.findOne({ _id: 'master_profile' });
        if (!twoFactor || !twoFactor.tempTwoFactorSecret) {
            return res.status(400).json({ error: "2FA setup is not initialized" });
        }
        const matchedCounter = verifyTOTP(code, decryptText(twoFactor.tempTwoFactorSecret));
        if (matchedCounter !== null) {
            await twoFactorDb.update({ _id: 'master_profile' }, {
                $set: { twoFactorEnabled: true, twoFactorSecret: twoFactor.tempTwoFactorSecret, tempTwoFactorSecret: null, lastUsedTOTPCounter: encryptText(String(matchedCounter)) }
            }, { upsert: true });
            logServerEvent('info', 'Master admin successfully enabled 2FA');
            res.json({ success: true, message: "Two-factor authentication enabled successfully!" });
        } else {
            res.status(400).json({ error: "Verification code is incorrect" });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to verify 2FA code" });
    }
});

router.post('/master/2fa/disable', isMasterAuth, async (req, res) => {
    const { password, code } = req.body;
    if (!password || !code) return res.status(400).json({ error: "Password and verification code are required" });
    try {
        const masterProfile = await db.findOne({ _id: 'master_profile' });
        const master2FA = await twoFactorDb.findOne({ _id: 'master_profile' });
        const isMatch = masterProfile?.password ? await bcrypt.compare(password, masterProfile.password) : (password === MASTER_PASS);
        if (!isMatch) {
            return res.status(400).json({ error: "Incorrect password" });
        }
        if (!master2FA || !master2FA.twoFactorEnabled || !master2FA.twoFactorSecret) {
            return res.status(400).json({ error: "2FA is not active" });
        }
        const decryptedCounter = decryptText(master2FA.lastUsedTOTPCounter);
        const lastUsedTOTPCounter = decryptedCounter ? parseInt(decryptedCounter) : null;
        const disableResult = verifyTOTPWithReplay(code, decryptText(master2FA.twoFactorSecret), lastUsedTOTPCounter);
        if (disableResult.valid) {
            await twoFactorDb.update({ _id: 'master_profile' }, {
                $set: { twoFactorEnabled: false, twoFactorSecret: null, tempTwoFactorSecret: null, lastUsedTOTPCounter: null }
            }, { upsert: true });
            logServerEvent('warning', 'Master admin disabled 2FA');
            res.json({ success: true, message: "2FA has been disabled." });
        } else {
            res.status(400).json({ error: "Invalid or already used verification code" });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to disable 2FA" });
    }
});

router.get('/master/config', isMasterAuth, (req, res) => {
    res.json({
        ...serverConfig,
        isSelfHosted: process.env.IS_SELF_HOSTED === 'true',
        isLicenseValid: verifyLicenseKey(process.env.LICENSE_KEY || serverConfig.licenseKey)
    });
});

router.post('/master/config', isMasterAuth, (req, res) => {
    if (req.body.quotaLimit !== undefined) serverConfig.quotaLimit = parseInt(req.body.quotaLimit) || serverConfig.quotaLimit;
    if (req.body.signupsEnabled !== undefined) serverConfig.signupsEnabled = !!req.body.signupsEnabled;
    if (req.body.licenseKey !== undefined) serverConfig.licenseKey = req.body.licenseKey;
    logServerEvent('info', `Master config updated: quotaLimit=${Math.floor(serverConfig.quotaLimit / (1024 * 1024))}MB, signupsEnabled=${serverConfig.signupsEnabled}`);
    res.json({ message: "Server configuration updated live", config: serverConfig });
});

router.get('/master/profile', isMasterAuth, async (req, res) => {
    const profile = (await db.findOne({ _id: 'master_profile' })) || { name: 'Master Admin', email: 'admin@logbook', profilePicIndex: 0 };
    const master2FA = await twoFactorDb.findOne({ _id: 'master_profile' });
    res.json({
        name: profile.name,
        email: profile.email,
        profilePicIndex: profile.profilePicIndex || 0,
        twoFactorEnabled: !!master2FA?.twoFactorEnabled
    });
});

router.post('/master/profile', isMasterAuth, async (req, res) => {
    const { name, email, profilePicIndex } = req.body;
    await db.update({ _id: 'master_profile' }, { $set: { name, email, profilePicIndex: parseInt(profilePicIndex) || 0 } }, { upsert: true });
    db.compactDatafile();
    logServerEvent('info', `Master profile updated: name='${name}', email='${email}'`);
    res.json({ success: true, message: "Master profile updated" });
});

router.post('/master/change-password', isMasterAuth, async (req, res) => {
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

router.get('/master/users', isMasterAuth, async (req, res) => {
    try {
        const dbUsers = await db.find({ username: { $exists: true } }, { password: 0 });
        const now = Date.now();
        const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

        const allUsersMap = new Map();

        dbUsers.forEach(u => {
            if (!u.username) return;
            const key = u.username.toLowerCase();
            const session = activeUserSessions.get(key);
            const lastActive = session ? session.lastActiveAt : (u.lastActiveAt || u.createdAt || 0);
            const isOnline = (now - lastActive) < ONLINE_THRESHOLD_MS;
            allUsersMap.set(key, {
                ...u,
                name: u.fullName || u.name || u.username,
                isOnline,
                lastActiveAt: lastActive,
                lastIp: session ? session.ip : (u.lastIp || ''),
                source: 'Main Vault'
            });
        });

        try {
            SCHOOLS.forEach(school => {
                const schoolUsers = readUsers(school);
                schoolUsers.forEach(u => {
                    if (!u.username) return;
                    const key = u.username.toLowerCase();
                    const session = activeUserSessions.get(key);
                    const lastActive = session ? session.lastActiveAt : (u.lastActiveAt || 0);
                    const isOnline = (now - lastActive) < ONLINE_THRESHOLD_MS;

                    if (!allUsersMap.has(key)) {
                        allUsersMap.set(key, {
                            _id: `school_${school}_${u.id}`,
                            id: u.id,
                            username: u.username,
                            name: u.fullName || u.username,
                            role: u.role || 'USER',
                            plan: 'campus',
                            school: school,
                            isOnline,
                            lastActiveAt: lastActive,
                            lastIp: session ? session.ip : '',
                            source: school
                        });
                    } else {
                        const existing = allUsersMap.get(key);
                        existing.isOnline = existing.isOnline || isOnline;
                        if (lastActive > (existing.lastActiveAt || 0)) {
                            existing.lastActiveAt = lastActive;
                        }
                    }
                });
            });
        } catch (e) {
            console.error('Error merging school users for master view:', e);
        }

        const usersList = Array.from(allUsersMap.values());
        usersList.sort((a, b) => {
            if (a.isOnline && !b.isOnline) return -1;
            if (!a.isOnline && b.isOnline) return 1;
            return (b.lastActiveAt || 0) - (a.lastActiveAt || 0);
        });

        res.json(usersList);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch master users list" });
    }
});

router.delete('/master/users/:id', isMasterAuth, async (req, res) => {
    const userDir = path.join(__dirname, 'uploads', req.params.id);
    if (await fs.pathExists(userDir)) await fs.remove(userDir);
    await db.remove({ _id: req.params.id }, {});
    db.compactDatafile();
    logServerEvent('warning', `Master deleted user completely: user ID '${req.params.id}' and uploads wiped.`);
    res.json({ message: "User and data completely purged" });
});

router.post('/master/users/:id/disable-2fa', isMasterAuth, async (req, res) => {
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

router.post('/master/reboot', isMasterAuth, async (req, res) => {
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

router.post('/master/users/:id/revoke-subscription', isMasterAuth, async (req, res) => {
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

router.post('/master/users/:id/plan', isMasterAuth, async (req, res) => {
    const { plan, subscriptionStatus, subscriptionExpiresAt } = req.body;
    if (!plan || !subscriptionStatus) {
        return res.status(400).json({ error: "Plan and status are required." });
    }

    try {
        const expiresAt = subscriptionExpiresAt ? parseInt(subscriptionExpiresAt) : 0;
        const quotaLimit = 240 * 1024 * 1024;

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

const handleGetMasterStats = async (req, res) => {
    try {
        let userCount = 0;
        try {
            const usersList = await db.find({ username: { $exists: true } });
            userCount = Array.isArray(usersList) ? usersList.length : 0;
        } catch (e) { }

        const uploadsDir = path.join(__dirname, 'uploads');
        let totalStorageBytes = 0;

        try {
            if (await fs.pathExists(uploadsDir)) {
                const getDirSize = async (dir) => {
                    let size = 0;
                    try {
                        const files = await fs.readdir(dir);
                        for (const f of files) {
                            try {
                                const filePath = path.join(dir, f);
                                const stat = await fs.stat(filePath);
                                if (stat.isDirectory()) {
                                    size += await getDirSize(filePath);
                                } else {
                                    size += stat.size;
                                }
                            } catch (e) { }
                        }
                    } catch (e) { }
                    return size;
                };
                totalStorageBytes = await getDirSize(uploadsDir);
            }
        } catch (e) { }

        const cpuPercent = getCpuUsagePercent();
        const cpus = os.cpus() || [];
        const memRssMB = Math.round(process.memoryUsage().rss / (1024 * 1024));
        const memTotalMB = Math.round(os.totalmem() / (1024 * 1024));
        const memFreeMB = Math.round(os.freemem() / (1024 * 1024));
        const memUsedPercent = Math.round(((memTotalMB - memFreeMB) / memTotalMB) * 100);

        const topEndpoints = Array.from(networkEndpointStats.entries())
            .map(([endpoint, data]) => ({
                endpoint,
                count: data.count,
                rxKB: (data.bytesRx / 1024).toFixed(1),
                txKB: (data.bytesTx / 1024).toFixed(1),
                pct: networkStats.totalRequests > 0 ? Math.round((data.count / networkStats.totalRequests) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        const topClients = Array.from(networkClientIpStats.entries())
            .map(([ip, data]) => ({
                ip,
                count: data.count,
                lastActiveAt: data.lastActiveAt
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return res.status(200).json({
            totalUsers: userCount,
            totalStorageMB: (totalStorageBytes / 1024 / 1024).toFixed(2),
            uptimeSeconds: Math.floor(process.uptime()),
            masterUser: (process.env.SUPER_ADMIN_USER || 'master'),
            quotaLimitMB: 240,
            cpuUsage: cpuPercent,
            cpuCores: cpus.length,
            cpuModel: cpus[0]?.model ? cpus[0].model.trim() : 'Standard System CPU',
            ramUsageMB: memRssMB,
            ramTotalMB: memTotalMB,
            ramUsedPercent: memUsedPercent,
            network: {
                totalRequests: networkStats.totalRequests,
                rxMB: (networkStats.bytesRx / (1024 * 1024)).toFixed(2),
                txMB: (networkStats.bytesTx / (1024 * 1024)).toFixed(2),
                rxKB: (networkStats.bytesRx / 1024).toFixed(1),
                txKB: (networkStats.bytesTx / 1024).toFixed(1),
                topEndpoints,
                topClients,
                methodStats: networkMethodStats
            }
        });
    } catch (err) {
        console.error("Error in handleGetMasterStats:", err);
        return res.status(200).json({
            totalUsers: 0,
            totalStorageMB: "0.00",
            uptimeSeconds: Math.floor(process.uptime()),
            masterUser: (process.env.SUPER_ADMIN_USER || 'master'),
            quotaLimitMB: 240,
            cpuUsage: 0,
            cpuCores: 1,
            cpuModel: 'System CPU',
            ramUsageMB: 0,
            ramTotalMB: 0,
            ramUsedPercent: 0,
            network: {
                totalRequests: 0,
                rxMB: "0.00",
                txMB: "0.00",
                rxKB: "0.0",
                txKB: "0.0",
                topEndpoints: [],
                topClients: [],
                methodStats: { GET: 0, POST: 0, PUT: 0, DELETE: 0, OTHER: 0 }
            }
        });
    }
};

router.get('/master/stats', isMasterAuth, handleGetMasterStats);
router.all('/master/users/reset-password', isMasterAuth, async (req, res) => {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "User ID and a new password (min 6 chars) are required." });
    }
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.update({ _id: userId }, { $set: { password: hashedPassword } });
        db.compactDatafile();
        logServerEvent('warning', `Master forcibly reset password for user ID: '${userId}'`);
        res.json({ success: true, message: "User password reset successfully." });
    } catch (e) {
        logServerEvent('critical', `Master failed to reset password for user ID '${userId}': ${e.message}`);
        res.status(500).json({ error: "Failed to reset password" });
    }
});

router.post('/master/cleanup', isMasterAuth, async (req, res) => {
    try {
        const threshold = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const oldUsers = await db.find({ plan: 'unpaid', createdAt: { $lt: threshold } });
        let purgedCount = 0;
        for (const u of oldUsers) {
            const userDir = path.join(__dirname, 'uploads', u._id);
            if (await fs.pathExists(userDir)) await fs.remove(userDir);
            await db.remove({ _id: u._id }, {});
            purgedCount++;
        }
        if (purgedCount > 0) db.compactDatafile();
        logServerEvent('warning', `Master cleanup: purged ${purgedCount} inactive expired unpaid accounts older than 30 days.`);
        res.json({ success: true, message: `Purged ${purgedCount} inactive accounts.` });
    } catch (e) {
        logServerEvent('critical', `Master cleanup failed: ${e.message}`);
        res.status(500).json({ error: "Failed to run system cleanup." });
    }
});

router.get('/master/logs', isMasterAuth, async (req, res) => {
    try {
        const logs = await logsDb.find({ type: 'server_log' });
        logs.sort((a, b) => b.timestamp - a.timestamp);
        res.json(logs.slice(0, 200));
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch logs" });
    }
});

router.post('/master/logs/clear', isMasterAuth, async (req, res) => {
    try {
        await logsDb.remove({ type: 'server_log' }, { multi: true });
        logsDb.compactDatafile();
        logServerEvent('warning', 'Master cleared all server logs');
        res.json({ success: true, message: "All system logs cleared." });
    } catch (e) {
        res.status(500).json({ error: "Failed to clear logs" });
    }
});

router.get('/master/licenses', isMasterAuth, async (req, res) => {
    try {
        const licenses = readLicenses();
        res.json(licenses);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch licenses" });
    }
});

router.post('/master/licenses/generate', isMasterAuth, async (req, res) => {
    const { clientName, licensee, daysValid, durationDays } = req.body;
    const finalClientName = clientName || licensee;
    const finalDaysValid = daysValid || durationDays;

    if (!finalClientName) return res.status(400).json({ error: "Client name is required" });
    try {
        const expiresAt = Date.now() + (parseInt(finalDaysValid || 365) * 24 * 60 * 60 * 1000);
        const payload = { type: 'self-hosted', clientName: finalClientName, expiresAt };
        const key = jwt.sign(payload, LICENSE_SECRET);
        const doc = {
            _id: crypto.randomBytes(8).toString('hex'),
            type: 'license_key',
            key,
            licenseKey: key, // frontend support
            clientName: finalClientName,
            licensee: finalClientName, // frontend support
            expiresAt,
            createdAt: Date.now()
        };
        const licenses = readLicenses();
        licenses.push(doc);
        writeLicenses(licenses);
        logServerEvent('info', `Master generated self-hosted license for '${finalClientName}' valid for ${finalDaysValid || 365} days`);
        res.json({ success: true, license: doc, licenseKey: key }); // respond with both formats
    } catch (e) {
        res.status(500).json({ error: "Failed to generate license key" });
    }
});

router.delete('/master/licenses/:id', isMasterAuth, async (req, res) => {
    try {
        const licenses = readLicenses();
        const updated = licenses.filter(lic => lic._id !== req.params.id);
        writeLicenses(updated);
        logServerEvent('warning', `Master revoked license key ID: ${req.params.id}`);
        res.json({ success: true, message: "License key revoked" });
    } catch (e) {
        res.status(500).json({ error: "Failed to revoke license" });
    }
});

router.patch('/master/licenses/:id/extend', isMasterAuth, async (req, res) => {
    const { daysValid, durationDays } = req.body;
    const finalDaysValid = parseInt(daysValid || durationDays || 365, 10);
    try {
        const licenses = readLicenses();
        const index = licenses.findIndex(lic => lic._id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: "License not found" });
        }

        const lic = licenses[index];
        const currentExpiry = lic.expiresAt || Date.now();
        const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
        const newExpiresAt = baseTime + (finalDaysValid * 24 * 60 * 60 * 1000);

        const payload = { type: 'self-hosted', clientName: lic.clientName || lic.licensee, expiresAt: newExpiresAt };
        const newKey = jwt.sign(payload, LICENSE_SECRET);

        lic.expiresAt = newExpiresAt;
        lic.key = newKey;
        lic.licenseKey = newKey;

        licenses[index] = lic;
        writeLicenses(licenses);

        logServerEvent('info', `Master extended license ID ${req.params.id} for '${lic.clientName || lic.licensee}' by ${finalDaysValid} days`);
        res.json({ success: true, license: lic });
    } catch (e) {
        res.status(500).json({ error: "Failed to extend license" });
    }
});

router.post('/master/blogs', isMasterAuth, async (req, res) => {
    const { title, slug, summary, content, author, tag, readTime } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Title and content are required." });

    const blogDoc = {
        type: 'blog_post',
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        summary: summary || content.slice(0, 150) + '...',
        content,
        author: author || 'Logbook Team',
        tag: tag || 'Updates',
        readTime: readTime || '3 min read',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    try {
        const inserted = await db.insert(blogDoc);
        db.compactDatafile();
        logServerEvent('info', `Master published new blog post: '${title}'`);
        res.json({ success: true, blog: inserted });
    } catch (e) {
        res.status(500).json({ error: "Failed to save blog post" });
    }
});

router.put('/master/blogs/:id', isMasterAuth, async (req, res) => {
    const { title, slug, summary, content, author, tag, readTime } = req.body;
    try {
        await db.update({ _id: req.params.id, type: 'blog_post' }, {
            $set: { title, slug, summary, content, author, tag, readTime, updatedAt: Date.now() }
        });
        db.compactDatafile();
        logServerEvent('info', `Master updated blog post ID: '${req.params.id}'`);
        res.json({ success: true, message: "Blog post updated successfully" });
    } catch (e) {
        res.status(500).json({ error: "Failed to update blog post" });
    }
});

router.delete('/master/blogs/:id', isMasterAuth, async (req, res) => {
    try {
        await db.remove({ _id: req.params.id, type: 'blog_post' }, {});
        db.compactDatafile();
        logServerEvent('warning', `Master deleted blog post ID: '${req.params.id}'`);
        res.json({ success: true, message: "Blog post deleted" });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete blog post" });
    }
});

router.get('/blogs', async (req, res) => {
    try {
        const posts = await db.find({ type: 'blog_post' });
        posts.sort((a, b) => b.createdAt - a.createdAt);
        res.json(posts);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch blog posts" });
    }
});

// --- CHANGELOG MANAGEMENT SYSTEM ---
const DEFAULT_CHANGELOGS = [
    {
        type: 'changelog_item',
        version: 'v2.0.9',
        date: 'December 2025',
        description: 'Major Cloud Sync & Security Release',
        isMajor: true,
        items: [
            'Added cloud backup support (WebDAV / Nextcloud)',
            'Added self-hosted server backup sync protocols',
            'Added Two-Factor Authentication (2FA) for admin dashboard consoles',
            'Added security questions for local recovery verification',
            'Integrated Google Play Billing Client 7',
            'Added profile picture upload and editing features',
            'Added Hindi, Marathi, and Urdu language layouts'
        ],
        createdAt: Date.now() - 100000
    },
    {
        type: 'changelog_item',
        version: 'v2.0.8',
        date: 'October 2025',
        description: 'Performance Optimization & Export Enhancements',
        isMajor: false,
        items: [
            'Optimized SQLite cache writing times (Sub-5ms paint times)',
            'Implemented dynamic bento showcase cards',
            'Added multi-format export indicators'
        ],
        createdAt: Date.now() - 200000
    }
];

router.get('/changelogs', async (req, res) => {
    try {
        let logs = await changelogDb.find({});
        if (!logs || logs.length === 0) {
            for (const item of DEFAULT_CHANGELOGS) {
                await changelogDb.insert(item);
            }
            logs = await changelogDb.find({});
        }
        logs.sort((a, b) => b.createdAt - a.createdAt);
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch changelogs" });
    }
});

router.post('/master/changelogs', isMasterAuth, async (req, res) => {
    const { version, date, description, items, isMajor } = req.body;
    if (!version || !date) return res.status(400).json({ error: "Version and date are required." });

    const changelogDoc = {
        type: 'changelog_item',
        version,
        date,
        description: description || '',
        items: Array.isArray(items) ? items : (items ? items.split('\n').map(i => i.trim()).filter(Boolean) : []),
        isMajor: !!isMajor,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    try {
        const inserted = await changelogDb.insert(changelogDoc);
        logServerEvent('info', `Master published new changelog: '${version}'`);
        res.json({ success: true, changelog: inserted });
    } catch (e) {
        res.status(500).json({ error: "Failed to save changelog entry" });
    }
});

router.put('/master/changelogs/:id', isMasterAuth, async (req, res) => {
    const { version, date, description, items, isMajor } = req.body;
    try {
        const parsedItems = Array.isArray(items) ? items : (items ? items.split('\n').map(i => i.trim()).filter(Boolean) : []);
        await changelogDb.update({ _id: req.params.id }, {
            $set: { version, date, description, items: parsedItems, isMajor: !!isMajor, updatedAt: Date.now() }
        });
        logServerEvent('info', `Master updated changelog ID: '${req.params.id}'`);
        res.json({ success: true, message: "Changelog updated successfully" });
    } catch (e) {
        res.status(500).json({ error: "Failed to update changelog entry" });
    }
});

router.delete('/master/changelogs/:id', isMasterAuth, async (req, res) => {
    try {
        await changelogDb.remove({ _id: req.params.id }, {});
        logServerEvent('warning', `Master deleted changelog ID: '${req.params.id}'`);
        res.json({ success: true, message: "Changelog entry deleted" });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete changelog entry" });
    }
});

router.post('/check-email', signupLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    const user = await db.findOne({ email: email.toLowerCase().trim() });
    res.json({ available: !user });
});

router.post('/check-username', signupLimiter, async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username is required" });
    const user = await db.findOne({ username: username.toLowerCase().trim() });
    res.json({ available: !user });
});

const handleCheckStore = (req, res) => {
    const defaultPlayStore = 'https://play.google.com/store/apps/details?id=com.ex.logbookplus';
    const playStoreUrl = process.env.PLAY_STORE_URL || defaultPlayStore;
    const indusStoreUrl = process.env.INDUS_STORE_URL || 'https://www.indusappstore.com';

    return res.status(200).json({
        available: true,
        playStoreUrl,
        indusStoreUrl,
        appPackageName: process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.ex.logbookplus',
        indusPackageName: process.env.INDUS_APP_STORE_PACKAGE_NAME || 'com.ex.logbookplus'
    });
};

router.get('/check-store', handleCheckStore);
router.post('/check-store', handleCheckStore);
router.get('/check-package', handleCheckStore);
router.post('/check-package', handleCheckStore);

router.post('/signup/check-availability', async (req, res) => {
    const { email, username } = req.body;
    const result = { emailAvailable: true, usernameAvailable: true };
    if (email) {
        const u = await db.findOne({ email: email.toLowerCase().trim() });
        if (u) result.emailAvailable = false;
    }
    if (username) {
        const u = await db.findOne({ username: username.toLowerCase().trim() });
        if (u) result.usernameAvailable = false;
    }
    res.json(result);
});

router.post('/signup', signupLimiter, async (req, res) => {
    if (!serverConfig.signupsEnabled) {
        logServerEvent('alarm', `Blocked signup attempt from IP: ${req.ip} — signups disabled by administrator`);
        return res.status(403).json({ error: "New user registrations are currently disabled by the server administrator." });
    }

    const { username, email, password, securityQuestion, securityAnswer } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Username, email, and password are required." });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }
    if (securityQuestion && !ALLOWED_SECURITY_QUESTIONS.includes(securityQuestion)) {
        return res.status(400).json({ error: "Selected security question is not valid." });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    try {
        const existingUser = await db.findOne({ $or: [{ username: cleanUsername }, { email: cleanEmail }] });
        if (existingUser) {
            logServerEvent('warning', `Signup attempt failed: username or email already registered (${cleanUsername} / ${cleanEmail})`);
            return res.status(400).json({ error: "Username or email is already registered." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let hashedAnswer = null;
        if (securityQuestion && securityAnswer) {
            hashedAnswer = await bcrypt.hash(securityAnswer.trim().toLowerCase(), 10);
        }

        const newUser = {
            username: cleanUsername,
            email: cleanEmail,
            password: hashedPassword,
            securityQuestion: securityQuestion || null,
            securityAnswer: hashedAnswer,
            plan: 'unpaid',
            subscriptionStatus: 'inactive',
            subscriptionExpiresAt: 0,
            quotaLimit: serverConfig.quotaLimit,
            createdAt: Date.now(),
            lastActiveAt: Date.now()
        };

        const inserted = await db.insert(newUser);
        db.compactDatafile();

        logServerEvent('info', `New user registered successfully: '${cleanUsername}' (${cleanEmail}) from IP: ${req.ip}`);
        const token = jwt.sign({ userId: inserted._id, username: cleanUsername }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ success: true, token, user: { id: inserted._id, username: cleanUsername, email: cleanEmail, plan: 'unpaid' } });
    } catch (e) {
        logServerEvent('critical', `Signup error for '${cleanUsername}': ${e.message}`);
        res.status(500).json({ error: "Failed to create account" });
    }
});

router.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    const cleanUser = username.trim().toLowerCase();
    try {
        const user = await db.findOne({ $or: [{ username: cleanUser }, { email: cleanUser }] });
        if (!user) {
            logServerEvent('alarm', `Failed user login attempt: unknown username/email '${cleanUser}' from IP: ${req.ip}`);
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logServerEvent('alarm', `Failed user login attempt: incorrect password for user '${user.username}' from IP: ${req.ip}`);
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const twoFactor = await twoFactorDb.findOne({ _id: user._id });
        if (twoFactor && twoFactor.twoFactorEnabled && twoFactor.twoFactorSecret) {
            const mfaToken = jwt.sign({ userId: user._id, isTempMFA: true }, JWT_SECRET, { expiresIn: '5m' });
            return res.json({ requires2FA: true, mfaToken });
        }

        await db.update({ _id: user._id }, { $set: { lastActiveAt: Date.now(), lastIp: req.ip } });

        recordUserActivity(user.username, 'USER', 'LOGBOOK', req.ip);
        logServerEvent('info', `User logged in successfully: '${user.username}' from IP: ${req.ip}`);

        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                plan: user.plan,
                subscriptionStatus: user.subscriptionStatus,
                subscriptionExpiresAt: user.subscriptionExpiresAt
            }
        });
    } catch (e) {
        logServerEvent('critical', `Login failure for user '${cleanUser}': ${e.message}`);
        res.status(500).json({ error: "Internal server error during login" });
    }
});

router.post('/login/verify', mfaLimiter, async (req, res) => {
    const { mfaToken, code } = req.body;
    if (!mfaToken || !code) return res.status(400).json({ error: "MFA session token and verification code are required" });

    try {
        const decoded = jwt.verify(mfaToken, JWT_SECRET);
        if (!decoded.isTempMFA) return res.status(401).json({ error: "Invalid MFA session" });

        const user = await db.findOne({ _id: decoded.userId });
        const twoFactor = await twoFactorDb.findOne({ _id: decoded.userId });
        if (!user || !twoFactor || !twoFactor.twoFactorEnabled || !twoFactor.twoFactorSecret) {
            return res.status(400).json({ error: "2FA is not enabled on this account" });
        }

        const decryptedCounter = decryptText(twoFactor.lastUsedTOTPCounter);
        const lastUsedTOTPCounter = decryptedCounter ? parseInt(decryptedCounter) : null;
        const mfaResult = verifyTOTPWithReplay(code, decryptText(twoFactor.twoFactorSecret), lastUsedTOTPCounter);

        if (mfaResult.valid) {
            await db.update({ _id: user._id }, { $set: { lastActiveAt: Date.now(), lastIp: req.ip } });
            await twoFactorDb.update({ _id: user._id }, { $set: { lastUsedTOTPCounter: encryptText(String(mfaResult.counter)) } }, { upsert: true });

            recordUserActivity(user.username, 'USER', 'LOGBOOK', req.ip);
            logServerEvent('info', `User logged in via 2FA successfully: '${user.username}' from IP: ${req.ip}`);

            const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
            res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    plan: user.plan,
                    subscriptionStatus: user.subscriptionStatus,
                    subscriptionExpiresAt: user.subscriptionExpiresAt
                }
            });
        } else {
            logServerEvent('alarm', `Failed 2FA code verification for user '${user.username}' from IP: ${req.ip}`);
            res.status(401).json({ error: "Invalid or already used 2FA verification code" });
        }
    } catch (e) {
        res.status(401).json({ error: "MFA session expired or invalid" });
    }
});

router.post('/logout', (req, res) => {
    res.json({ success: true, message: "Logged out successfully" });
});

router.post('/forgot/question', forgotLimiter, async (req, res) => {
    let body = req.body || {};
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {}
    }
    const input = body.usernameOrEmail || body.username || body.email;
    if (!input) return res.status(400).json({ error: "Username or email is required" });

    const cleanInput = String(input).trim().toLowerCase();
    const user = await db.findOne({ $or: [{ username: cleanInput }, { email: cleanInput }] });
    if (!user || !user.securityQuestion) {
        return res.status(404).json({ error: "No security question configured for this account." });
    }

    res.json({ success: true, question: user.securityQuestion });
});

router.post('/forgot/reset', forgotLimiter, async (req, res) => {
    const { usernameOrEmail, answer, newPassword } = req.body;
    const input = usernameOrEmail || req.body.username || req.body.email;
    if (!input || !answer || !newPassword) {
        return res.status(400).json({ error: "All fields are required." });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    const cleanInput = input.trim().toLowerCase();
    const user = await db.findOne({ $or: [{ username: cleanInput }, { email: cleanInput }] });

    if (!user || !user.securityAnswer) {
        return res.status(400).json({ error: "Invalid request or security answer not set." });
    }

    const isMatch = await bcrypt.compare(answer.trim().toLowerCase(), user.securityAnswer);
    if (!isMatch) {
        logServerEvent('alarm', `Failed password reset attempt for '${user.username}': incorrect security answer from IP: ${req.ip}`);
        return res.status(400).json({ error: "Incorrect security answer." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update({ _id: user._id }, { $set: { password: hashedPassword } });

    // Automatically disable 2FA on security question recovery so user is not locked out
    await twoFactorDb.update({ _id: user._id }, {
        $set: { twoFactorEnabled: false, twoFactorSecret: null, tempTwoFactorSecret: null, lastUsedTOTPCounter: null }
    }, { upsert: true });

    logServerEvent('warning', `Password and 2FA reset successfully via security question for user '${user.username}' from IP: ${req.ip}`);
    res.json({ success: true, message: "Password updated and 2FA disabled successfully! You can now log in with your new password." });
});

router.post('/forgot/reset-2fa', forgotLimiter, async (req, res) => {
    const { usernameOrEmail, answer } = req.body;
    const input = usernameOrEmail || req.body.username || req.body.email;
    if (!input || !answer) {
        return res.status(400).json({ error: "Username/email and security answer are required." });
    }

    const cleanInput = input.trim().toLowerCase();
    const user = await db.findOne({ $or: [{ username: cleanInput }, { email: cleanInput }] });

    if (!user || !user.securityAnswer) {
        return res.status(400).json({ error: "Invalid request or security answer not set." });
    }

    const isMatch = await bcrypt.compare(answer.trim().toLowerCase(), user.securityAnswer);
    if (!isMatch) {
        logServerEvent('alarm', `Failed 2FA reset attempt for '${user.username}': incorrect security answer from IP: ${req.ip}`);
        return res.status(400).json({ error: "Incorrect security answer." });
    }

    await twoFactorDb.update({ _id: user._id }, {
        $set: { twoFactorEnabled: false, twoFactorSecret: null, tempTwoFactorSecret: null, lastUsedTOTPCounter: null }
    }, { upsert: true });

    logServerEvent('warning', `2FA disabled via security question for user '${user.username}' from IP: ${req.ip}`);
    res.json({ success: true, message: "2FA has been disabled successfully. You can now log in with your password." });
});

router.post('/backup', isAuthenticated, isSubscribed, checkQuota, upload.single('file'), async (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: "No file payload received" });
    const userDir = path.join(__dirname, 'uploads', req.userId);
    const finalPath = path.join(userDir, req.file.filename);

    try {
        await encryptFile(finalPath);
        logServerEvent('info', `Backup uploaded & encrypted for user ID '${req.userId}': ${req.file.filename}`);

        await db.update({ _id: req.userId }, { $set: { lastActiveAt: Date.now(), lastIp: req.ip } });
        res.json({ success: true, filename: req.file.filename });
    } catch (e) {
        logServerEvent('critical', `Encryption failed for upload '${req.file.filename}' (User: ${req.userId}): ${e.message}`);
        res.status(500).json({ error: "Failed to secure backup payload" });
    }
});

router.get('/info', isAuthenticated, isSubscribed, async (req, res) => {
    const userDir = path.join(__dirname, 'uploads', req.userId);
    let size = 0;
    let count = 0;

    try {
        if (await fs.pathExists(userDir)) {
            const files = await fs.readdir(userDir);
            const backupFiles = files.filter(f => f !== 'avatar.jpg');
            count = backupFiles.length;
            for (const f of backupFiles) {
                size += (await fs.stat(path.join(userDir, f))).size;
            }
        }
        const sizeMBVal = (size / (1024 * 1024)).toFixed(2);
        res.json({
            count,
            totalBackups: count,
            sizeMB: sizeMBVal,
            storageUsedMB: sizeMBVal,
            quotaMB: 240,
            quotaLimitMB: 240
        });
    } catch (e) {
        res.status(500).json({ error: "Failed to calculate storage info" });
    }
});

router.get('/backups', isAuthenticated, isSubscribed, async (req, res) => {
    const userDir = path.join(__dirname, 'uploads', req.userId);
    try {
        if (!await fs.pathExists(userDir)) return res.json([]);
        const files = await fs.readdir(userDir);
        const backupFiles = files.filter(f => f !== 'avatar.jpg');
        const fileStats = await Promise.all(
            backupFiles.map(async f => {
                const stat = await fs.stat(path.join(userDir, f));
                const mb = (stat.size / (1024 * 1024)).toFixed(2);
                return {
                    name: f,
                    sizeMB: mb,
                    size: `${mb} MB`,
                    mtime: stat.mtime,
                    time: stat.mtime
                };
            })
        );
        fileStats.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
        res.json(fileStats);
    } catch (e) {
        res.status(500).json({ error: "Failed to list backups" });
    }
});

router.get('/restore/:filename', isAuthenticated, isSubscribed, async (req, res) => {
    const safeFilename = path.basename(req.params.filename);
    const filePath = path.join(__dirname, 'uploads', req.userId, safeFilename);

    if (!await fs.pathExists(filePath)) {
        return res.status(404).json({ error: "File not found" });
    }
    await sendOrDecryptFile(filePath, safeFilename, res);
});

router.delete('/backup/:filename', isAuthenticated, isSubscribed, async (req, res) => {
    const safeFilename = path.basename(req.params.filename);
    const filePath = path.join(__dirname, 'uploads', req.userId, safeFilename);

    try {
        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
            logServerEvent('info', `Backup deleted by user ID '${req.userId}': ${safeFilename}`);
            res.json({ success: true, message: "Backup deleted successfully" });
        } else {
            res.status(404).json({ error: "Backup file not found" });
        }
    } catch (e) {
        logServerEvent('error', `Failed to delete backup file '${safeFilename}' (User: ${req.userId}): ${e.message}`);
        res.status(500).json({ error: "Failed to delete backup file" });
    }
});

router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await db.findOne({ _id: req.userId }, { password: 0, securityAnswer: 0 });
        if (!user) return res.status(404).json({ error: "User not found" });

        const userDir = path.join(__dirname, 'uploads', req.userId);
        const avatarPath = path.join(userDir, 'avatar.jpg');
        const hasAvatar = await fs.pathExists(avatarPath);

        const twoFactor = await twoFactorDb.findOne({ _id: req.userId });

        res.json({
            ...user,
            userId: user._id,
            hasAvatar: !!hasAvatar,
            avatarUrl: hasAvatar ? `/api/profile/avatar/${user._id}?t=${Date.now()}` : null,
            twoFactorEnabled: !!twoFactor?.twoFactorEnabled
        });
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
});

router.post('/profile/avatar', isAuthenticated, uploadAvatar.single('avatar'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No image file uploaded" });
    try {
        await db.update({ _id: req.userId }, { $set: { hasAvatar: true, updatedAt: Date.now() } });
        logServerEvent('info', `Profile avatar updated for user ID: ${req.userId}`);
        res.json({ success: true, avatarUrl: `/api/profile/avatar/${req.userId}?t=${Date.now()}` });
    } catch (e) {
        res.status(500).json({ error: "Failed to save profile picture" });
    }
});

router.delete('/profile/avatar', isAuthenticated, async (req, res) => {
    try {
        const avatarPath = path.join(__dirname, 'uploads', req.userId, 'avatar.jpg');
        if (await fs.pathExists(avatarPath)) {
            await fs.remove(avatarPath);
        }
        await db.update({ _id: req.userId }, { $set: { hasAvatar: false, updatedAt: Date.now() } });
        logServerEvent('info', `Profile avatar deleted for user ID: ${req.userId}`);
        res.json({ success: true, message: "Avatar deleted successfully" });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete avatar" });
    }
});

router.get('/profile/avatar', isAuthenticated, async (req, res) => {
    const avatarPath = path.join(__dirname, 'uploads', req.userId, 'avatar.jpg');
    if (await fs.pathExists(avatarPath)) {
        res.sendFile(avatarPath);
    } else {
        res.status(404).send('Avatar not found');
    }
});

router.get('/profile/avatar/:userId', async (req, res) => {
    const safeUserId = path.basename(req.params.userId);
    const avatarPath = path.join(__dirname, 'uploads', safeUserId, 'avatar.jpg');
    if (await fs.pathExists(avatarPath)) {
        res.sendFile(avatarPath);
    } else {
        res.status(404).send('Avatar not found');
    }
});

router.post('/profile', isAuthenticated, async (req, res) => {
    const { fullName, phone } = req.body;
    try {
        await db.update({ _id: req.userId }, { $set: { fullName, phone, updatedAt: Date.now() } });
        db.compactDatafile();
        logServerEvent('info', `User profile updated for user ID: ${req.userId}`);
        res.json({ success: true, message: "Profile details updated successfully." });
    } catch (e) {
        res.status(500).json({ error: "Failed to update profile." });
    }
});

router.post('/change-password', isAuthenticated, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    try {
        const user = await db.findOne({ _id: req.userId });
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ error: "Current password is incorrect." });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.update({ _id: req.userId }, { $set: { password: hashedPassword } });
        db.compactDatafile();

        logServerEvent('info', `Password changed successfully for user '${user.username}'`);
        res.json({ success: true, message: "Password changed successfully." });
    } catch (e) {
        res.status(500).json({ error: "Failed to change password." });
    }
});

router.get('/profile/security-question', isAuthenticated, async (req, res) => {
    const user = await db.findOne({ _id: req.userId });
    res.json({ question: user?.securityQuestion || null, questionsList: ALLOWED_SECURITY_QUESTIONS });
});

router.post('/profile/security', isAuthenticated, async (req, res) => {
    let body = req.body || {};
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {}
    }

    const question = body.question || body.securityQuestion || body.secQuestion || body.security_question;
    const answer = body.answer || body.securityAnswer || body.secAnswer || body.security_answer;

    if (!question || !answer) return res.status(400).json({ error: "Question and answer are required." });
    if (!ALLOWED_SECURITY_QUESTIONS.includes(question)) {
        return res.status(400).json({ error: "Selected security question is not valid." });
    }

    try {
        const hashedAnswer = await bcrypt.hash(String(answer).trim().toLowerCase(), 10);
        await db.update({ _id: req.userId }, { $set: { securityQuestion: question, securityAnswer: hashedAnswer } });

        logServerEvent('info', `Security question configured for user ID: ${req.userId}`);
        res.json({ success: true, message: "Security question configured successfully." });
    } catch (e) {
        res.status(500).json({ error: "Failed to set security question." });
    }
});

router.post('/profile/2fa/setup', isAuthenticated, async (req, res) => {
    try {
        const user = await db.findOne({ _id: req.userId });
        const secret = generateBase32Secret();
        await twoFactorDb.update({ _id: req.userId }, { $set: { tempTwoFactorSecret: encryptText(secret) } }, { upsert: true });

        const label = encodeURIComponent(`LogbookPlus:${user.username}`);
        const issuer = encodeURIComponent('LogbookPlus');
        const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;
        res.json({ secret, otpauthUrl });
    } catch (e) {
        res.status(500).json({ error: "Failed to setup 2FA" });
    }
});

router.post('/profile/2fa/verify', isAuthenticated, async (req, res) => {
    const { code } = req.body;
    if (!code || code.length !== 6) return res.status(400).json({ error: "Invalid verification code" });

    try {
        const user = await db.findOne({ _id: req.userId });
        const twoFactor = await twoFactorDb.findOne({ _id: req.userId });
        if (!user || !twoFactor || !twoFactor.tempTwoFactorSecret) {
            return res.status(400).json({ error: "2FA setup is not initialized" });
        }

        const matchedCounter = verifyTOTP(code, decryptText(twoFactor.tempTwoFactorSecret));
        if (matchedCounter !== null) {
            await twoFactorDb.update({ _id: req.userId }, {
                $set: {
                    twoFactorEnabled: true,
                    twoFactorSecret: twoFactor.tempTwoFactorSecret,
                    tempTwoFactorSecret: null,
                    lastUsedTOTPCounter: encryptText(String(matchedCounter))
                }
            }, { upsert: true });
            logServerEvent('info', `2FA enabled successfully for user '${user.username}'`);
            res.json({ success: true, message: "2FA enabled successfully!" });
        } else {
            res.status(400).json({ error: "Verification code is incorrect" });
        }
    } catch (e) {
        res.status(500).json({ error: "Failed to verify 2FA code" });
    }
});

router.post('/profile/2fa/disable', isAuthenticated, async (req, res) => {
    const { password, code } = req.body;
    if (!password || !code) return res.status(400).json({ error: "Password and 2FA code are required" });

    try {
        const user = await db.findOne({ _id: req.userId });
        const twoFactor = await twoFactorDb.findOne({ _id: req.userId });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Incorrect password" });

        if (!twoFactor || !twoFactor.twoFactorEnabled || !twoFactor.twoFactorSecret) {
            return res.status(400).json({ error: "2FA is not active" });
        }

        const decryptedCounter = decryptText(twoFactor.lastUsedTOTPCounter);
        const lastUsedTOTPCounter = decryptedCounter ? parseInt(decryptedCounter) : null;
        const disableResult = verifyTOTPWithReplay(code, decryptText(twoFactor.twoFactorSecret), lastUsedTOTPCounter);

        if (disableResult.valid) {
            await twoFactorDb.update({ _id: req.userId }, {
                $set: { twoFactorEnabled: false, twoFactorSecret: null, tempTwoFactorSecret: null, lastUsedTOTPCounter: null }
            }, { upsert: true });
            logServerEvent('warning', `2FA disabled for user '${user.username}'`);
            res.json({ success: true, message: "2FA disabled successfully" });
        } else {
            res.status(400).json({ error: "Invalid or already used 2FA code" });
        }
    } catch (e) {
        res.status(500).json({ error: "Failed to disable 2FA" });
    }
});

router.get('/site-settings', async (req, res) => {
    try {
        const settings = (await db.findOne({ _id: 'site_settings' })) || {
            maintenanceMode: false,
            bannerMessage: '',
            contactEmail: 'support@logbook',
            androidAppVersion: '1.0.0'
        };
        res.json(settings);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch site settings" });
    }
});

router.post('/master/site-settings', isMasterAuth, async (req, res) => {
    const { maintenanceMode, bannerMessage, contactEmail, androidAppVersion } = req.body;
    try {
        await db.update({ _id: 'site_settings' }, {
            $set: { maintenanceMode: !!maintenanceMode, bannerMessage, contactEmail, androidAppVersion, updatedAt: Date.now() }
        }, { upsert: true });
        db.compactDatafile();
        logServerEvent('info', 'Master updated site-wide operational settings');
        res.json({ success: true, message: "Site settings updated successfully" });
    } catch (e) {
        res.status(500).json({ error: "Failed to update site settings" });
    }
});

router.get('/master/pricing', isMasterAuth, async (req, res) => {
    try {
        const pricing = (await db.findOne({ _id: 'pricing_plans' })) || {
            monthlyPrice: "₹149",
            yearlyPrice: "₹999",
            currency: "INR",
            features: [
                "300 MB Encrypted Storage Quota",
                "AES-256 Cloud Backup Encryption",
                "Automated Daily Backup Rotation",
                "Multi-device Sync Support",
                "Priority Support Access"
            ]
        };
        res.json(pricing);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch pricing plans" });
    }
});

router.post('/master/pricing', isMasterAuth, async (req, res) => {
    const { monthlyPrice, yearlyPrice, currency, features } = req.body;
    try {
        await db.update({ _id: 'pricing_plans' }, {
            $set: { monthlyPrice, yearlyPrice, currency, features: Array.isArray(features) ? features : [], updatedAt: Date.now() }
        }, { upsert: true });
        db.compactDatafile();
        logServerEvent('info', 'Master updated dynamic pricing plans configuration');
        res.json({ success: true, message: "Pricing plans updated" });
    } catch (e) {
        res.status(500).json({ error: "Failed to update pricing plans" });
    }
});

router.get('/changelog', async (req, res) => {
    try {
        const logs = await db.find({ type: 'changelog_entry' });
        logs.sort((a, b) => b.createdAt - a.createdAt);
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch changelogs" });
    }
});

router.post('/master/changelog', isMasterAuth, async (req, res) => {
    const { version, releaseNotes, isMajor } = req.body;
    if (!version || !releaseNotes) return res.status(400).json({ error: "Version and release notes required" });
    try {
        const doc = {
            type: 'changelog_entry',
            version,
            releaseNotes,
            isMajor: !!isMajor,
            createdAt: Date.now()
        };
        await db.insert(doc);
        db.compactDatafile();
        logServerEvent('info', `Master published changelog for version ${version}`);
        res.json({ success: true, entry: doc });
    } catch (e) {
        res.status(500).json({ error: "Failed to publish changelog" });
    }
});

router.get('/pricing', async (req, res) => {
    try {
        const pricing = (await db.findOne({ _id: 'pricing_plans' })) || {
            monthlyPrice: "₹149",
            yearlyPrice: "₹999",
            currency: "INR",
            features: [
                "300 MB Encrypted Storage Quota",
                "AES-256 Cloud Backup Encryption",
                "Automated Daily Backup Rotation",
                "Multi-device Sync Support"
            ]
        };
        res.json(pricing);
    } catch (e) {
        res.status(500).json({ error: "Failed to load pricing details" });
    }
});

const handleCancelSubscription = async (req, res) => {
    try {
        await db.update(
            { _id: req.userId },
            { $set: { subscriptionStatus: 'cancelled' } }
        );
        db.compactDatafile();
        logServerEvent('warning', `Subscription auto-renewal cancelled for user ID '${req.userId}'`);
        res.json({ success: true, message: "Subscription auto-renewal cancelled." });
    } catch (e) {
        res.status(500).json({ error: "Failed to cancel subscription renewal" });
    }
};

const handleActivateSubscription = async (req, res) => {
    const days = parseInt(req.body.days) || 30;
    const expiresAt = Date.now() + (days * 24 * 60 * 60 * 1000);
    try {
        await db.update(
            { _id: req.userId },
            { $set: { plan: 'premium', subscriptionStatus: 'active', subscriptionExpiresAt: expiresAt, quotaLimit: serverConfig.quotaLimit } }
        );
        db.compactDatafile();
        logServerEvent('info', `Subscription activated for user ID '${req.userId}' for ${days} days`);
        res.json({ success: true, plan: 'premium', expiresAt });
    } catch (e) {
        res.status(500).json({ error: "Failed to activate subscription" });
    }
};

const handleLicensePurchase = async (req, res) => {
    const expiresAt = Date.now() + (365 * 24 * 60 * 60 * 1000);
    try {
        await db.update(
            { _id: req.userId },
            { $set: { plan: 'licensed', subscriptionStatus: 'active', subscriptionExpiresAt: expiresAt, quotaLimit: serverConfig.quotaLimit } }
        );
        db.compactDatafile();
        logServerEvent('info', `One-time self-hosted license activated for user ID '${req.userId}' valid until ${new Date(expiresAt).toISOString()}`);
        res.json({ success: true, plan: 'licensed', expiresAt });
    } catch (e) {
        res.status(500).json({ error: "Failed to activate license" });
    }
};

router.post('/subscription/cancel', isAuthenticated, handleCancelSubscription);
router.post('/subscription/cancel-mock', isAuthenticated, handleCancelSubscription);

router.post('/checkout/session-mock', isAuthenticated, async (req, res) => {
    const days = 30;
    const expiresAt = Date.now() + (days * 24 * 60 * 60 * 1000);
    try {
        await db.update(
            { _id: req.userId },
            { $set: { plan: 'premium', subscriptionStatus: 'active', subscriptionExpiresAt: expiresAt, quotaLimit: serverConfig.quotaLimit } }
        );
        db.compactDatafile();
        logServerEvent('info', `Mock subscription activated for user ID '${req.userId}'`);
        res.json({ success: true, checkoutUrl: '#success', plan: 'premium', expiresAt });
    } catch (e) {
        res.status(500).json({ error: "Failed mock checkout" });
    }
});

router.post('/subscription/activate', isAuthenticated, handleActivateSubscription);
router.post('/subscription/activate-mock', isAuthenticated, handleActivateSubscription);

router.post('/verify-purchase', isAuthenticated, async (req, res) => {
    const { purchaseToken, productId, packageName, productType } = req.body;
    if (!purchaseToken || !productId) {
        return res.status(400).json({ error: 'Purchase token and product ID are required' });
    }

    try {
        let result;
        if (productType === 'inapp' || productId.includes('license') || productId.includes('selfhosted')) {
            result = await verifyPlayProduct(purchaseToken, productId, packageName);
        } else {
            result = await verifyPlaySubscription(purchaseToken, productId, packageName);
        }

        if (!result.valid) {
            logServerEvent('alarm', `Purchase verification failed for user ID '${req.userId}': ${result.error || 'Invalid token'}`);
            return res.status(400).json({ error: result.error || 'Purchase verification failed with Google Play services' });
        }

        const plan = result.planType || determinePlanType(productId);
        const expiresAt = result.expiryTimeMillis;

        await db.update(
            { _id: req.userId },
            {
                $set: {
                    plan,
                    subscriptionStatus: 'active',
                    subscriptionExpiresAt: expiresAt,
                    quotaLimit: serverConfig.quotaLimit,
                    lastPurchaseToken: purchaseToken,
                    lastProductId: productId,
                    purchasedAt: Date.now()
                }
            }
        );
        db.compactDatafile();

        logServerEvent('info', `Google Play purchase verified & activated for user ID '${req.userId}': plan=${plan}, productId=${productId}, expires=${new Date(expiresAt).toISOString()}`);
        res.json({ success: true, plan, subscriptionStatus: 'active', subscriptionExpiresAt: expiresAt });
    } catch (e) {
        logServerEvent('critical', `Purchase verification error for user ID '${req.userId}': ${e.message}`);
        res.status(500).json({ error: 'Failed to verify purchase: ' + e.message });
    }
});

router.post('/license/purchase', isAuthenticated, handleLicensePurchase);
router.post('/license/purchase-mock', isAuthenticated, handleLicensePurchase);

router.get('/licenses/check', isAuthenticated, async (req, res) => {
    try {
        const user = await db.findOne({ _id: req.userId }, { password: 0 });
        if (!user) return res.status(404).json({ error: 'User not found' });
        const hasLicense = user.plan === 'licensed' || user.plan === 'license' || user.plan === 'licenced';
        const isExpired = user.subscriptionExpiresAt && Date.now() > user.subscriptionExpiresAt;
        res.json({
            licensed: hasLicense && !isExpired,
            plan: user.plan || 'unpaid',
            expiresAt: user.subscriptionExpiresAt || null,
            isExpired: !!isExpired
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to check license status' });
    }
});

router.get('/master/licenses', isMasterAuth, async (req, res) => {
    try {
        const users = await db.find({ plan: { $in: ['licensed', 'license', 'licenced'] } }, { password: 0 });
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch licenses' });
    }
});

const BACKUP_EXCLUDE_DIRS = new Set(['node_modules', '.git', '.idea', '.agents']);
const BACKUP_EXCLUDE_FILES = new Set([]);

const BACKUP_CATEGORIES = [
    { id: 'databases', label: 'Databases', icon: 'HardDrive', patterns: [/\.db$/], prefixes: ['database/'] },
    { id: 'user_data', label: 'User Uploads', icon: 'FolderOpen', prefixes: ['uploads/'] },
    { id: 'configuration', label: 'Configuration', icon: 'Settings', exact: ['.env', 'config.yml'], prefixes: ['google_auth/'] },
    { id: 'csv_exports', label: 'CSV / Exports', icon: 'FileCheck', patterns: [/\.csv$/] },
    { id: 'server_code', label: 'Server Code', icon: 'Terminal', exact: ['server.js', 'api.js'], prefixes: ['config/', 'controllers/', 'routes/', 'middleware/', 'scripts/', 'utils/'] },
    { id: 'frontend_source', label: 'Frontend Source', icon: 'Cloud', prefixes: ['src/'] },
    { id: 'static_assets', label: 'Static Assets', icon: 'FolderOpen', prefixes: ['public/', 'assets/'] },
    { id: 'project_files', label: 'Project Files', icon: 'BookOpen', exact: ['package.json', 'package-lock.json', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js', '.htaccess', '.gitignore', 'index.html', 'README.md'] },
    { id: 'other_files', label: 'Other Files', icon: 'FileText' }
];

async function scanDirectory(dirPath, rootDir, results = []) {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            if (BACKUP_EXCLUDE_DIRS.has(entry.name)) continue;
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                await scanDirectory(fullPath, rootDir, results);
            } else if (entry.isFile()) {
                const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
                if (BACKUP_EXCLUDE_FILES.has(relativePath)) continue;
                try {
                    const stat = await fs.stat(fullPath);
                    results.push({
                        path: relativePath,
                        size: stat.size,
                        modified: stat.mtime.toISOString()
                    });
                } catch (e) { /* skip inaccessible files */ }
            }
        }
    } catch (e) { /* skip unreadable dirs */ }
    return results;
}

function categorizeFile(filePath) {
    for (const cat of BACKUP_CATEGORIES) {
        if (cat.id === 'other_files') continue;
        if (cat.exact && cat.exact.includes(filePath)) return cat.id;
        if (cat.prefixes && cat.prefixes.some(p => filePath.startsWith(p))) return cat.id;
        if (cat.patterns && cat.patterns.some(r => r.test(filePath))) return cat.id;
    }
    return 'other_files';
}

router.get('/master/backup/files', isMasterAuth, async (req, res) => {
    try {
        const rootDir = __dirname;
        const allFiles = await scanDirectory(rootDir, rootDir);

        const categoryMap = {};
        for (const cat of BACKUP_CATEGORIES) {
            categoryMap[cat.id] = { id: cat.id, label: cat.label, icon: cat.icon, files: [] };
        }

        let totalSize = 0;
        for (const file of allFiles) {
            const catId = categorizeFile(file.path);
            if (catId && categoryMap[catId]) {
                categoryMap[catId].files.push(file);
                totalSize += file.size;
            }
        }

        const categories = Object.values(categoryMap).filter(c => c.files.length > 0);
        res.json({ categories, totalSize });
    } catch (e) {
        logServerEvent('critical', `Backup file scan failed: ${e.message}`);
        res.status(500).json({ error: 'Failed to scan server files' });
    }
});

router.all('/master/backup/export', isMasterAuth, async (req, res) => {
    try {
        const rootDir = __dirname;
        const requestedFiles = req.body && Array.isArray(req.body.files) && req.body.files.length > 0 ? req.body.files : null;
        const manifestFiles = [];

        if (requestedFiles) {
            for (const relPath of requestedFiles) {
                if (typeof relPath !== 'string') continue;
                const normalized = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '');
                if (normalized.includes('..') || path.isAbsolute(normalized)) continue;

                const fullPath = path.join(rootDir, normalized);
                if (await fs.pathExists(fullPath)) {
                    const stat = await fs.stat(fullPath);
                    if (stat.isFile()) {
                        manifestFiles.push({ relativePath: normalized.replace(/\\/g, '/'), fullPath });
                    }
                }
            }
        } else {
            const includePaths = [
                'assets',
                'config',
                'controllers',
                'database',
                'google_auth',
                'middleware',
                'public',
                'routes',
                'scripts',
                'src',
                'uploads',
                'utils',
                '.env',
                '.gitignore',
                '.htaccess',
                'api.js',
                'config.yml',
                'index.html',
                'package-lock.json',
                'package.json',
                'postcss.config.js',
                'quary.csv',
                'README.md',
                'server.js',
                'subscribers.csv',
                'tailwind.config.js',
                'vite.config.js'
            ];

            for (const item of includePaths) {
                const itemPath = path.join(rootDir, item);
                if (!await fs.pathExists(itemPath)) continue;

                const stat = await fs.stat(itemPath);
                if (stat.isDirectory()) {
                    const scan = async (dir, rel) => {
                        const entries = await fs.readdir(dir, { withFileTypes: true });
                        for (const entry of entries) {
                            const fp = path.join(dir, entry.name);
                            const rp = path.join(rel, entry.name);
                            if (entry.isDirectory()) {
                                if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.idea' || entry.name === '.agents') continue;
                                await scan(fp, rp);
                            } else {
                                manifestFiles.push({ relativePath: rp.replace(/\\/g, '/'), fullPath: fp });
                            }
                        }
                    };
                    await scan(itemPath, item);
                } else {
                    manifestFiles.push({ relativePath: item.replace(/\\/g, '/'), fullPath: itemPath });
                }
            }
        }

        const manifest = {
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            totalFiles: manifestFiles.length,
            files: []
        };

        const fileBuffers = [];
        for (const f of manifestFiles) {
            try {
                const data = await fs.readFile(f.fullPath);
                manifest.files.push({ path: f.relativePath, size: data.length });
                fileBuffers.push({ path: f.relativePath, data });
            } catch (e) {
                logServerEvent('warning', `Backup export: skipped reading ${f.relativePath}: ${e.message}`);
            }
        }

        manifest.totalFiles = manifest.files.length;
        const manifestJson = Buffer.from(JSON.stringify(manifest), 'utf8');

        const fileEncryptionKeyBuffer = crypto.createHash('sha256').update(process.env.FILE_ENCRYPTION_KEY).digest();

        const manifestIv = crypto.randomBytes(16);
        const manifestCipher = crypto.createCipheriv('aes-256-cbc', fileEncryptionKeyBuffer, manifestIv);
        const encryptedManifest = Buffer.concat([manifestCipher.update(manifestJson), manifestCipher.final()]);

        const parts = [];

        const magic = Buffer.from('LOGBOOK_BAK\0', 'utf8');
        parts.push(magic);
        parts.push(manifestIv);

        const manifestLenBuf = Buffer.alloc(4);
        manifestLenBuf.writeUInt32BE(encryptedManifest.length, 0);
        parts.push(manifestLenBuf);
        parts.push(encryptedManifest);

        for (const fb of fileBuffers) {
            const pathBuf = Buffer.from(fb.path, 'utf8');
            const pathLenBuf = Buffer.alloc(2);
            pathLenBuf.writeUInt16BE(pathBuf.length, 0);

            const fileIv = crypto.randomBytes(16);
            const fileCipher = crypto.createCipheriv('aes-256-cbc', fileEncryptionKeyBuffer, fileIv);
            const encryptedData = Buffer.concat([fileCipher.update(fb.data), fileCipher.final()]);

            const fileLenBuf = Buffer.alloc(4);
            fileLenBuf.writeUInt32BE(encryptedData.length, 0);

            parts.push(pathLenBuf);
            parts.push(pathBuf);
            parts.push(fileIv);
            parts.push(fileLenBuf);
            parts.push(encryptedData);
        }

        const bakFile = Buffer.concat(parts);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `logbook-backup-${timestamp}.bak`;

        logServerEvent('info', `Master exported server backup (${(bakFile.length / (1024 * 1024)).toFixed(2)} MB, ${manifest.totalFiles} files)`);

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', bakFile.length);
        res.send(bakFile);
    } catch (e) {
        logServerEvent('critical', `Backup export failed: ${e.message}`);
        res.status(500).json({ error: 'Backup export failed: ' + e.message });
    }
});

const backupUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.bak') return cb(null, true);
        cb(new Error('Only .bak backup files are allowed'));
    }
});

router.post('/master/backup/import', isMasterAuth, backupUpload.single('backup'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No backup file uploaded' });
        }

        const data = req.file.buffer;
        const isPreview = req.query.preview === 'true';

        if (data.length < 48) {
            return res.status(400).json({ error: 'Invalid backup file: too small' });
        }
        const magic = data.subarray(0, 12).toString('utf8');
        if (magic !== 'LOGBOOK_BAK\0') {
            return res.status(400).json({ error: 'Invalid backup file: missing signature' });
        }

        const manifestIv = data.subarray(12, 28);
        const manifestLen = data.readUInt32BE(28);
        const encryptedManifest = data.subarray(32, 32 + manifestLen);

        const fileEncryptionKeyBuffer = crypto.createHash('sha256').update(process.env.FILE_ENCRYPTION_KEY).digest();

        let manifest;
        try {
            const decipher = crypto.createDecipheriv('aes-256-cbc', fileEncryptionKeyBuffer, manifestIv);
            const decryptedManifest = Buffer.concat([decipher.update(encryptedManifest), decipher.final()]);
            manifest = JSON.parse(decryptedManifest.toString('utf8'));
        } catch (e) {
            return res.status(400).json({ error: 'Failed to decrypt backup manifest: invalid encryption key or corrupted file' });
        }

        if (isPreview) {
            const categoryMap = {};
            for (const cat of BACKUP_CATEGORIES) {
                categoryMap[cat.id] = { id: cat.id, label: cat.label, icon: cat.icon, files: [] };
            }

            const manifestFiles = manifest.files || [];
            for (const file of manifestFiles) {
                const catId = categorizeFile(file.path);
                if (catId && categoryMap[catId]) {
                    categoryMap[catId].files.push(file);
                }
            }

            const categories = Object.values(categoryMap).filter(c => c.files.length > 0);
            const totalCount = manifest.totalFiles || manifestFiles.length;

            return res.json({
                success: true,
                preview: true,
                manifest: {
                    version: manifest.version,
                    createdAt: manifest.createdAt,
                    totalFiles: totalCount,
                    fileCount: totalCount,
                    files: manifestFiles,
                    categories
                }
            });
        }

        const selectedFiles = (req.body && req.body.files) ? (typeof req.body.files === 'string' ? JSON.parse(req.body.files) : req.body.files) : null;
        const filterSet = Array.isArray(selectedFiles) && selectedFiles.length > 0 ? new Set(selectedFiles) : null;

        let offset = 32 + manifestLen;
        let restoredCount = 0;
        let skippedCount = 0;
        const restoredFiles = [];
        const rootDir = __dirname;

        while (offset < data.length) {
            if (offset + 2 > data.length) break;
            const pathLen = data.readUInt16BE(offset);
            offset += 2;

            if (offset + pathLen + 16 + 4 > data.length) break;
            const relPath = data.subarray(offset, offset + pathLen).toString('utf8');
            offset += pathLen;

            const fileIv = data.subarray(offset, offset + 16);
            offset += 16;

            const fileLen = data.readUInt32BE(offset);
            offset += 4;

            if (offset + fileLen > data.length) break;
            const encryptedData = data.subarray(offset, offset + fileLen);
            offset += fileLen;

            const normalized = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '');
            if (normalized.includes('..') || path.isAbsolute(normalized)) {
                logServerEvent('warning', `Backup import: blocked suspicious relative path '${relPath}'`);
                skippedCount++;
                continue;
            }

            if (filterSet && !filterSet.has(normalized) && !filterSet.has(relPath)) {
                skippedCount++;
                continue;
            }

            let fileData;
            try {
                const decipher = crypto.createDecipheriv('aes-256-cbc', fileEncryptionKeyBuffer, fileIv);
                fileData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
            } catch (e) {
                logServerEvent('warning', `Backup import: failed to decrypt '${normalized}': ${e.message}`);
                skippedCount++;
                continue;
            }

            const fullPath = path.join(rootDir, normalized);
            try {
                await fs.ensureDir(path.dirname(fullPath));
                await fs.writeFile(fullPath, fileData);
                restoredCount++;
                restoredFiles.push(normalized);
            } catch (e) {
                logServerEvent('warning', `Backup import: failed to restore '${normalized}': ${e.message}`);
                skippedCount++;
            }
        }

        logServerEvent('warning', `Master imported server backup: ${restoredCount} files restored, ${skippedCount} skipped from backup created ${manifest.createdAt}`);

        res.json({
            success: true,
            message: `Backup restored successfully`,
            restoredCount,
            skippedCount,
            restoredFiles
        });
    } catch (e) {
        logServerEvent('critical', `Backup import failed: ${e.message}`);
        res.status(500).json({ error: 'Backup import failed: ' + e.message });
    }
});

module.exports = router;
