// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Custom encapsulated modules
const { db } = require('./config/db');
const { logServerEvent } = require('./utils/logger');
const {
    activeUserSessions,
    networkStats,
    networkEndpointStats,
    networkClientIpStats,
    networkMethodStats,
    recordUserActivity
} = require('./utils/serverState');
const { getSubscriptionForSchool } = require('./utils/dbHelper');

// API Router
const apiRouter = require('./api');

const app = express();
const PORT = process.env.PORT || 8080;

// --- Security / Proxy Configuration ---
app.set('trust proxy', 1);

const compression = require('compression');

// --- Global Middleware Setup ---
app.use(compression());
app.use(cors());
app.use((req, res, next) => {
    res.setHeader('serveo-skip-browser-warning', 'true');
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger & Network Diagnostics Middleware
app.use((req, res, next) => {
    const start = Date.now();
    networkStats.totalRequests++;
    const reqLen = parseInt(req.headers['content-length'] || 0, 10);
    if (!isNaN(reqLen)) networkStats.bytesRx += reqLen;

    const urlPath = (req.originalUrl || req.url || '').split('?')[0];
    const sanitizedRoute = urlPath.replace(/\/[0-9a-f]{8,32}/gi, '/:id').replace(/\/\d+/g, '/:id');
    if (sanitizedRoute) {
        const epData = networkEndpointStats.get(sanitizedRoute) || { count: 0, bytesRx: 0, bytesTx: 0 };
        epData.count++;
        if (!isNaN(reqLen)) epData.bytesRx += reqLen;
        networkEndpointStats.set(sanitizedRoute, epData);
    }

    const clientIp = (req.ip || '127.0.0.1').replace('::ffff:', '');
    const ipData = networkClientIpStats.get(clientIp) || { count: 0, lastActiveAt: Date.now() };
    ipData.count++;
    ipData.lastActiveAt = Date.now();
    networkClientIpStats.set(clientIp, ipData);

    const m = (req.method || 'GET').toUpperCase();
    if (networkMethodStats[m] !== undefined) {
        networkMethodStats[m]++;
    } else {
        networkMethodStats.OTHER++;
    }

    res.on('finish', () => {
        const duration = Date.now() - start;
        const url = req.originalUrl || req.url;
        const resLen = parseInt(res.getHeader('content-length') || 512, 10);
        if (!isNaN(resLen)) {
            networkStats.bytesTx += resLen;
            if (sanitizedRoute && networkEndpointStats.has(sanitizedRoute)) {
                const ep = networkEndpointStats.get(sanitizedRoute);
                ep.bytesTx += resLen;
            }
        }

        console.log(`[HTTP] ${req.method} ${url} - ${res.statusCode} (${duration}ms)`);
        if (req.method === 'POST' && (url.includes('login') || url.includes('signup'))) {
            console.log(`  User: ${req.body?.username || req.body?.email}`);
        }

        const activeUser = req.headers['x-caller-username'] || req.body?.username || req.query?.username || req.body?.email;
        if (activeUser && typeof activeUser === 'string') {
            recordUserActivity(
                activeUser,
                req.headers['x-caller-role'] || req.body?.role || 'USER',
                req.headers['x-school-key'] || req.body?.school || 'LOGBOOK',
                req.ip
            );
        }

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

// Subdomain routing for master dashboard & helpdesk
app.use((req, res, next) => {
    const raw = req.headers['x-forwarded-host'] || req.headers.host || '';
    const host = raw.split(':')[0].toLowerCase();

    if (host.startsWith('master.')) {
        if (!req.url.startsWith('/api/') &&
            !req.url.startsWith('/assets/') &&
            !req.url.startsWith('/dist-assets/') &&
            !req.url.startsWith('/master/')) {
            req.url = '/master' + req.url;
        }
    } else if (host.startsWith('helpdesk.')) {
        if (!req.url.startsWith('/api/') &&
            !req.url.startsWith('/assets/') &&
            !req.url.startsWith('/dist-assets/') &&
            !req.url.startsWith('/helpdesk/')) {
            req.url = '/helpdesk' + req.url;
        }
    }
    next();
});

// Block direct access to /master path on non-subdomain host
app.use((req, res, next) => {
    const raw = req.headers['x-forwarded-host'] || req.headers.host || '';
    const host = raw.split(':')[0].toLowerCase();
    const url = req.url.toLowerCase();
    if ((url === '/master' || url.startsWith('/master/')) && !host.startsWith('master.')) {
        return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    }
    next();
});

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Helpdesk Subscription Suspension Guard Middleware (Applies only to Helpdesk subdomain & routes)
app.use((req, res, next) => {
    const raw = req.headers['x-forwarded-host'] || req.headers.host || '';
    const host = raw.split(':')[0].toLowerCase();
    const url = req.url;

    // Skip guard for main domain, master console, assets, health, and standard SaaS routes
    if (
        !host.startsWith('helpdesk.') &&
        !url.startsWith('/helpdesk') &&
        !url.startsWith('/api/v1/tickets') &&
        !url.startsWith('/api/v1/auth')
    ) {
        return next();
    }

    if (
        host.startsWith('master.') ||
        url.startsWith('/master') ||
        url.startsWith('/api/master') ||
        url.startsWith('/api/v1/master') ||
        url.startsWith('/api/v1/auth/login') ||
        url.startsWith('/api/v1/auth/config') ||
        url === '/health'
    ) {
        return next();
    }

    const targetSchool = req.headers['x-school-key'] || req.query.school || (req.body && req.body.school) || 'NHSST';

    const callerRole = req.headers['x-caller-role'] || '';
    if (callerRole === 'SUPER_ADMIN') {
        return next();
    }

    const schoolSub = getSubscriptionForSchool(targetSchool);
    const isExpired = schoolSub.expiresAt && new Date(schoolSub.expiresAt) < new Date();

    if (schoolSub.status === 'SUSPENDED' || isExpired) {
        const errorMsg = isExpired
            ? 'This campus database subscription license has expired. Please contact master@localhost for renewal support.'
            : 'This campus database subscription is suspended. Please contact master@localhost for support.';
        return res.status(403).json({
            success: false,
            error: errorMsg,
            isSuspended: true,
            isExpired: isExpired
        });
    }
    next();
});

// --- Mount Modular API Router ---
app.use('/api', apiRouter);

// SPA Wildcard Route Fallback for React paths
app.use((req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }
    if (req.path.startsWith('/api') || req.path.includes('.')) {
        return next();
    }
    if (req.path.startsWith('/master')) {
        return res.sendFile(path.join(__dirname, 'public', 'master', 'index.html'));
    }
    if (req.path.startsWith('/helpdesk')) {
        return res.sendFile(path.join(__dirname, 'public', 'helpdesk', 'index.html'));
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Database Migration Utility ---
const DB_ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY;
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

// --- Bootstrap Server ---
app.listen(PORT, '0.0.0.0', async () => {
    logServerEvent('info', `Server started successfully and running at http://localhost:${PORT}`);
    await migrateTwoFactorSecrets();
});