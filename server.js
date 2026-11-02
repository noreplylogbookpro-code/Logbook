// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { ROUTE_ALIASES, getSeoForPath } = require('./utils/seoData');
const { renderHtmlForRoute } = require('./utils/seoEngine');
require('dotenv').config();
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Fail-safe security configuration validation
const { validateSecurityConfiguration, encryptDatabaseText } = require('./config/security');
validateSecurityConfiguration({ exitOnError: true });

// Custom encapsulated modules
const { db, twoFactorDb, logsDb } = require('./config/db');
const { logServerEvent } = require('./utils/logger');
const {
    activeUserSessions,
    networkStats,
    networkEndpointStats,
    networkClientIpStats,
    networkMethodStats,
    recordUserActivity,
    markUserOffline,
    initSessionsFromLogs
} = require('./utils/serverState');
const { getSubscriptionForSchool } = require('./utils/dbHelper');

// API Router & Client User-Agent Guard
const apiRouter = require('./api');
const { classifyClient } = require('./middleware/userAgentGuard');
const { startTelegramPolling } = require('./utils/telegramBotService');

const app = express();
const PORT = process.env.PORT || 8080;

// --- Security / Proxy Configuration ---
app.set('trust proxy', 1);

const helmet = require('helmet');
const compression = require('compression');

// --- Privacy Helpers for Log Sanitization ---
function anonymizeIdentifier(id) {
    if (!id || typeof id !== 'string') return undefined;
    const clean = id.trim();
    if (clean.includes('@')) {
        return clean.replace(/^([^@]{1,2})[^@]*@(.*)$/, '$1***@$2');
    }
    if (clean.length > 4) {
        return clean.substring(0, 2) + '***' + clean.substring(clean.length - 2);
    }
    return clean.substring(0, 1) + '***';
}

function anonymizeIp(ip) {
    if (!ip || typeof ip !== 'string') return 'masked-ip';
    const clean = ip.replace('::ffff:', '').trim();
    if (clean === '127.0.0.1' || clean === '::1') return clean;
    if (clean.includes('.')) {
        return clean.replace(/\.\d+$/, '.xxx');
    }
    return 'masked-ip';
}

// --- CORS Configuration: Whitelist allowed origins ---
const PRODUCTION_ALLOWED_ORIGINS = [
    'https://logbookplus.co.in',
    'https://www.logbookplus.co.in',
    'https://master.logbookplus.co.in',
    'https://helpdesk.logbookplus.co.in',
];

const DEV_ALLOWED_ORIGINS = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

const isAllowedOrigin = (origin) => {
    // Non-browser requests (native mobile apps, server-to-server, curl) have no Origin header
    if (!origin) return true;

    // Check exact production whitelist match
    if (PRODUCTION_ALLOWED_ORIGINS.includes(origin)) return true;

    // Custom origins explicitly configured via environment
    if (process.env.ALLOWED_ORIGINS) {
        const extra = process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
        if (extra.includes(origin)) return true;
    }

    const isProduction = process.env.NODE_ENV === 'production';

    // Production: Allow HTTPS subdomains of logbookplus.co.in
    if (isProduction) {
        if (/^https:\/\/([a-zA-Z0-9-]+\.)*logbookplus\.co\.in$/i.test(origin)) {
            return true;
        }
        // Dev tunnels in production only if explicitly opted in
        if (process.env.ENABLE_DEV_TUNNELS === 'true') {
            if (
                origin.endsWith('.serveo.net') ||
                origin.endsWith('.ngrok-free.app') ||
                origin.endsWith('.ngrok.io') ||
                origin.endsWith('.trycloudflare.com')
            ) {
                return true;
            }
        }
        return false;
    }

    // Development mode: Allow local development origins & dev tunnels
    if (DEV_ALLOWED_ORIGINS.includes(origin)) return true;

    if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i.test(origin)) {
        return true;
    }

    if (
        /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/i.test(origin) ||
        /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/i.test(origin) ||
        /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/i.test(origin)
    ) {
        return true;
    }

    if (
        origin.endsWith('.serveo.net') ||
        origin.endsWith('.ngrok-free.app') ||
        origin.endsWith('.ngrok.io') ||
        origin.endsWith('.trycloudflare.com')
    ) {
        return true;
    }

    return false;
};

const corsOptions = {
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

// --- Global Middleware Setup ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // Strict CSP: removed unsafe-inline, added exact sha256 for the inline theme switcher
            scriptSrc: ["'self'", "'sha256-7of+l5rYmsUuabf+eBX4CXRadrhf7gCG61f9UJUCy14='"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "https://api.telegram.org", "https://api.callmebot.com"],
            frameAncestors: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());
app.use(cors(corsOptions));
app.use((req, res, next) => {
    res.setHeader('serveo-skip-browser-warning', 'true');
    next();
});

// Lightweight cookie parsing middleware for dual-mode auth
app.use((req, res, next) => {
    if (!req.cookies && req.headers['cookie']) {
        const list = {};
        req.headers['cookie'].split(';').forEach(cookie => {
            const parts = cookie.split('=');
            const name = parts[0]?.trim();
            if (name) {
                try {
                    list[name] = decodeURIComponent(parts.slice(1).join('=').trim());
                } catch (_) {
                    list[name] = parts.slice(1).join('=').trim();
                }
            }
        });
        req.cookies = list;
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger & Network Diagnostics Middleware (with DPDP / GDPR Privacy Redaction)
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
            const rawUser = req.body?.username || req.body?.email;
            if (rawUser) {
                console.log(`  User: ${anonymizeIdentifier(rawUser)}`);
            }
        }

        const isLogoutRequest = url.includes('/logout');
        const activeUser = req.tokenPayload?.username || req.headers['x-caller-username'] || req.body?.username || req.query?.username || req.body?.email;
        const callerRole = req.tokenPayload?.role || req.helpdeskAuth?.role || 'USER';
        const targetSchool = req.helpdeskAuth?.school || req.headers['x-school-key'] || req.body?.school || 'LOGBOOK';

        if (isLogoutRequest && activeUser && typeof activeUser === 'string') {
            markUserOffline(activeUser);
        } else if (activeUser && typeof activeUser === 'string' && res.statusCode < 400 && !isLogoutRequest) {
            recordUserActivity(
                activeUser,
                callerRole,
                targetSchool,
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

            const safeUserLabel = activeUser ? anonymizeIdentifier(activeUser) : undefined;
            let msg = isLogoutRequest && res.statusCode < 400
                ? `User logged out: '${safeUserLabel || 'unknown'}'`
                : `[HTTP] ${req.method} ${url} - ${res.statusCode} (${duration}ms)`;
            if (!isLogoutRequest && safeUserLabel) {
                msg += ` (User: ${safeUserLabel})`;
            }

            logServerEvent(level, msg, {
                method: req.method,
                url,
                status: res.statusCode,
                durationMs: duration,
                ip: anonymizeIp(req.ip),
                username: safeUserLabel,
                school: targetSchool,
                isLogout: isLogoutRequest && res.statusCode < 400
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

// Search engine optimization & crawler endpoints
app.get('/robots.txt', (req, res) => {
    res.type('text/plain; charset=utf-8');
    res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml; charset=utf-8');
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

app.get('/llms.txt', (req, res) => {
    res.type('text/plain; charset=utf-8');
    res.sendFile(path.join(__dirname, 'public', 'llms.txt'));
});

app.get('/favicon.ico', (req, res) => {
    res.redirect(301, '/assets/images/app_logo.webp');
});

// Canonical Hostname & Protocol Enforcer (301 Permanent Redirect)
app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const rawHost = req.headers['x-forwarded-host'] || req.headers.host || '';
    const host = rawHost.split(':')[0].toLowerCase();

    // www -> non-www redirect (e.g. www.logbookplus.co.in -> logbookplus.co.in)
    if (host.startsWith('www.')) {
        const canonicalHost = host.replace(/^www\./, '');
        return res.redirect(301, `https://${canonicalHost}${req.originalUrl}`);
    }

    // HTTP -> HTTPS redirect in production behind proxies
    const proto = req.headers['x-forwarded-proto'];
    if (process.env.NODE_ENV === 'production' && proto === 'http' && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        return res.redirect(301, `https://${host}${req.originalUrl}`);
    }

    next();
});

// Trailing Slash Normalization & Route Aliases Enforcer (301 Permanent Redirect)
app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const rawPath = req.path;

    // Skip API, assets, dist-assets, and static files
    if (rawPath.startsWith('/api') || rawPath.startsWith('/assets') || rawPath.startsWith('/dist-assets') || rawPath.includes('.')) {
        return next();
    }
    const rawHost = req.headers['x-forwarded-host'] || req.headers.host || '';
    const host = rawHost.split(':')[0].toLowerCase();
    if (host.startsWith('master.') || host.startsWith('helpdesk.')) {
        return next();
    }

    // Trailing slash redirect: /pricing/ -> /pricing
    if (rawPath.length > 1 && rawPath.endsWith('/')) {
        const cleanPath = rawPath.replace(/\/+$/, '');
        const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        return res.redirect(301, cleanPath + queryString);
    }

    // Alias 301 redirects: /faq -> /help-center, /docs -> /documentation, etc.
    const cleanLower = rawPath.toLowerCase();
    if (ROUTE_ALIASES[cleanLower]) {
        const target = ROUTE_ALIASES[cleanLower];
        const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        return res.redirect(301, target + queryString);
    }

    next();
});

// Serve static assets with production caching policies
app.use('/dist-assets', express.static(path.join(__dirname, 'public', 'dist-assets'), {
    maxAge: '1y',
    immutable: true
}));
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
    maxAge: '1d'
}));
app.use(express.static(path.join(__dirname, 'public'), { redirect: false, index: false }));

// Helpdesk Subscription Suspension Guard Middleware (Applies only to Helpdesk subdomain & routes)
app.use((req, res, next) => {
    const raw = req.headers['x-forwarded-host'] || req.headers.host || '';
    const host = raw.split(':')[0].toLowerCase();
    const url = req.url;

    // Allow HTML page delivery (GET non-API requests) so login UI can load
    if (req.method === 'GET' && !url.startsWith('/api/')) {
        return next();
    }

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
    const callerRole = req.headers['x-caller-role'] || req.query.role || (req.body && req.body.role) || '';
    if (callerRole === 'SUPER_ADMIN') {
        return next();
    }

    const schoolSub = getSubscriptionForSchool(targetSchool);
    const isExpired = schoolSub.expiresAt && new Date(schoolSub.expiresAt) < new Date();

    if (schoolSub.status === 'SUSPENDED' || isExpired) {
        const errorMsg = isExpired
            ? 'This campus database subscription license has expired. Please contact support@logbookplus.co.in for renewal support.'
            : 'This campus database subscription is suspended. Please contact support@logbookplus.co.in for support.';
        return res.status(403).json({
            success: false,
            error: errorMsg,
            isSuspended: true,
            isExpired: isExpired
        });
    }
    next();
});

// --- Mount Modular API Router with Client User-Agent Classifier ---
app.use('/api', classifyClient);
app.use('/api', apiRouter);

// SPA Wildcard Route Fallback with Dynamic SEO Injection & True 404 Status
app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
    }
    if (req.path.startsWith('/api') || req.path.includes('.')) {
        return next();
    }

    // Set standard HTML revalidation header for all SPA and prerendered routes
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

    if (req.path.startsWith('/master')) {
        return res.sendFile(path.join(__dirname, 'public', 'master', 'index.html'));
    }
    if (req.path.startsWith('/helpdesk')) {
        return res.sendFile(path.join(__dirname, 'public', 'helpdesk', 'index.html'));
    }

    // Private authenticated client dashboard
    const cleanPath = req.path.replace(/^\/|\/$/g, '');
    if (cleanPath === 'app/dashboard') {
        return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }

    // Check if route has tailored SEO metadata (static pages or blog posts)
    const seo = getSeoForPath(req.path);
    if (seo) {
        // 1. If prerendered static HTML file exists on disk, serve it
        const prerenderFile = req.path === '/'
            ? path.join(__dirname, 'public', 'index.html')
            : path.join(__dirname, 'public', cleanPath, 'index.html');

        if (fs.existsSync(prerenderFile)) {
            return res.sendFile(prerenderFile);
        }

        // 2. Otherwise dynamically render SEO HTML
        try {
            const baseTemplate = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
            const renderedHtml = renderHtmlForRoute(baseTemplate, req.path);
            if (renderedHtml) {
                res.type('text/html; charset=utf-8');
                return res.send(renderedHtml);
            }
        } catch (e) {
            console.error(`[SEO Render Error] ${e.message}`);
        }
        return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }

    // Unrecognized route -> Return True HTTP 404 status (prevents Soft 404s)
    res.status(404);
    const notFoundPage = path.join(__dirname, 'public', '404.html');
    if (fs.existsSync(notFoundPage)) {
        return res.sendFile(notFoundPage);
    }
    res.type('text/html; charset=utf-8').send('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1><p>The requested page does not exist.</p><a href="/">Return Home</a></body></html>');
});

// --- Database Migration Utility (Transparent AES-256-GCM / CBC Migration) ---
async function migrateTwoFactorSecrets() {
    try {
        if (process.env.DISABLE_MASTER_2FA === 'true') {
            await twoFactorDb.update({ _id: 'master_profile' }, {
                $set: { twoFactorEnabled: false, twoFactorSecret: null, tempTwoFactorSecret: null, lastUsedTOTPCounter: null }
            }, { upsert: true });
            logServerEvent('warning', 'Master 2FA Emergency Reset: Master Admin 2FA disabled via environment variable setting.');
        }

        const allDocs = await twoFactorDb.find({});
        let updatedCount = 0;
        for (const doc of allDocs) {
            let updated = false;
            const $set = {};
            if (doc.tempTwoFactorSecret && !doc.tempTwoFactorSecret.includes(':')) {
                $set.tempTwoFactorSecret = encryptDatabaseText(doc.tempTwoFactorSecret);
                updated = true;
            }
            if (doc.twoFactorSecret && !doc.twoFactorSecret.includes(':')) {
                $set.twoFactorSecret = encryptDatabaseText(doc.twoFactorSecret);
                updated = true;
            }
            if (doc.lastUsedTOTPCounter !== undefined && doc.lastUsedTOTPCounter !== null && !String(doc.lastUsedTOTPCounter).includes(':')) {
                $set.lastUsedTOTPCounter = encryptDatabaseText(String(doc.lastUsedTOTPCounter));
                updated = true;
            }
            if (updated) {
                await twoFactorDb.update({ _id: doc._id }, { $set });
                updatedCount++;
            }
        }
        if (updatedCount > 0) {
            twoFactorDb.compactDatafile();
            logServerEvent('warning', `2FA Secrets Migration: Encrypted ${updatedCount} plain-text 2FA secrets/counters in the database.`);
        }
    } catch (e) {
        logServerEvent('error', `Failed to run 2FA secrets database migration: ${e.message}`);
    }
}

// --- Bootstrap Server ---
app.listen(PORT, '0.0.0.0', async () => {
    logServerEvent('info', `Server started successfully and running on port ${PORT}`);
    await migrateTwoFactorSecrets();
    const restored = await initSessionsFromLogs(logsDb);
    if (restored > 0) {
        logServerEvent('info', `Restored ${restored} online user session(s) from server logs.`);
    }

    if (process.env.ENABLE_TELEGRAM_BOT_POLLING === 'true') {
        startTelegramPolling();
    }
});
