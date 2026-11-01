// middleware/userAgentGuard.js
/**
 * Logbook Plus - Client User-Agent Classifier & Access Guard
 * 
 * Supports:
 * - Android App via OkHttp: "okhttp/5.5.0"
 * - Android App custom signature: Ends with "LogbookPlusApp/1.0"
 * - Android App via Ktor: "ktor-client"
 * - Web Browsers: Verified same-origin / referer / standard browser clients
 */

/**
 * Checks if the request User-Agent matches authorized Android App clients.
 * Matches Cloudflare WAF rule expressions:
 * 1. (http.user_agent eq "okhttp/5.5.0")
 * 2. (ends_with(http.user_agent, "LogbookPlusApp/1.0"))
 * 3. (http.user_agent eq "ktor-client")
 *
 * @param {string} ua
 * @returns {boolean}
 */
function isAllowedAndroidUserAgent(ua) {
    if (!ua || typeof ua !== 'string') return false;
    const cleanUa = ua.trim();
    return (
        cleanUa === 'okhttp/5.5.0' ||
        cleanUa.endsWith('LogbookPlusApp/1.0') ||
        cleanUa === 'ktor-client'
    );
}

/**
 * Checks if the request originates from a valid web browser.
 * Note: Web browsers prohibit client-side JavaScript from modifying the 'User-Agent'
 * header (W3C Forbidden Header Name). Browser requests are identified via Origin/Referer
 * and standard browser User-Agent signatures.
 *
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function isBrowserRequest(req) {
    const ua = (req.headers['user-agent'] || '').trim();
    const isBrowserUa = ua.startsWith('Mozilla/') || ua.includes('Chrome/') || ua.includes('Safari/') || ua.includes('Firefox/');
    const origin = req.headers['origin'] || '';
    const referer = req.headers['referer'] || '';
    const secFetchSite = req.headers['sec-fetch-site'] || '';

    const allowedHosts = [
        'logbookplus.co.in',
        'master.logbookplus.co.in',
        'helpdesk.logbookplus.co.in',
        'localhost',
        '127.0.0.1'
    ];

    const hasValidOrigin = allowedHosts.some(host => origin.includes(host) || referer.includes(host));
    const isSameOrigin = secFetchSite === 'same-origin' || secFetchSite === 'same-site';

    return isBrowserUa && (hasValidOrigin || isSameOrigin || req.headers['x-client-platform'] === 'web');
}

/**
 * Express Middleware: Classify client type on all incoming requests
 * Injects:
 * - req.isAndroidApp (boolean)
 * - req.isBrowser (boolean)
 * - req.clientPlatform ('ANDROID_APP' | 'WEB_BROWSER' | 'UNKNOWN')
 */
const classifyClient = (req, res, next) => {
    const ua = req.headers['user-agent'] || '';
    const isAndroid = isAllowedAndroidUserAgent(ua);
    const isBrowser = !isAndroid && isBrowserRequest(req);

    req.isAndroidApp = isAndroid;
    req.isBrowser = isBrowser;

    if (isAndroid) {
        req.clientPlatform = 'ANDROID_APP';
    } else if (isBrowser) {
        req.clientPlatform = 'WEB_BROWSER';
    } else {
        req.clientPlatform = 'UNKNOWN';
    }

    // Attach client platform header in debug/response if needed
    res.setHeader('X-Client-Type', req.clientPlatform);
    next();
};

/**
 * Express Middleware: Strictly enforces Android App User-Agent.
 * Use this on endpoints that should ONLY be called by the native Android application.
 */
const requireAndroidApp = (req, res, next) => {
    const ua = req.headers['user-agent'] || '';
    if (isAllowedAndroidUserAgent(ua)) {
        return next();
    }

    return res.status(403).json({
        success: false,
        error: 'Forbidden: Request must originate from an authorized Logbook Plus Android client application.',
        requiredUserAgentPatterns: [
            'okhttp/5.5.0',
            '*LogbookPlusApp/1.0',
            'ktor-client'
        ]
    });
};

/**
 * Express Middleware: Dual-channel guard.
 * Allows requests if:
 * 1. The client is a verified Android app (matches User-Agent), OR
 * 2. The client is a legitimate web browser from an authorized origin, OR
 * 3. STRICT_ANDROID_ONLY is disabled (configurable via process.env.STRICT_ANDROID_ONLY)
 */
const dualChannelGuard = (req, res, next) => {
    const ua = req.headers['user-agent'] || '';
    const isAndroid = isAllowedAndroidUserAgent(ua);

    if (isAndroid) {
        req.isAndroidApp = true;
        req.clientPlatform = 'ANDROID_APP';
        return next();
    }

    // If strictly enforcing mobile-only mode across all guarded APIs
    if (process.env.STRICT_ANDROID_ONLY === 'true') {
        return res.status(403).json({
            success: false,
            error: 'Access restricted strictly to authorized Logbook Plus Android mobile app.'
        });
    }

    // Permit browser requests from verified web application origins
    if (isBrowserRequest(req)) {
        req.isBrowser = true;
        req.clientPlatform = 'WEB_BROWSER';
        return next();
    }

    // If client is neither Android App nor verified Browser, reject suspicious bots / scrapers
    return res.status(403).json({
        success: false,
        error: 'Access denied: Unrecognized client user-agent or origin.',
        code: 'CLIENT_UA_RESTRICTED'
    });
};

module.exports = {
    isAllowedAndroidUserAgent,
    isBrowserRequest,
    classifyClient,
    requireAndroidApp,
    dualChannelGuard
};
