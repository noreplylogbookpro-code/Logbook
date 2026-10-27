const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const authController = require('../controllers/authController');
const { logServerEvent } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;

// --- Helper to extract client IP safely behind reverse proxies & Cloudflare ---
const getClientIp = (req) => {
    const cfIp = req.headers['cf-connecting-ip'];
    let rawIp = 'unknown';
    if (cfIp) {
        rawIp = cfIp.trim();
    } else {
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            rawIp = forwarded.split(',')[0].trim();
        } else {
            rawIp = req.ip || req.connection?.remoteAddress || 'unknown';
        }
    }
    return ipKeyGenerator(rawIp);
};

// --- Reusable Rate Limiter Factory with Alarm Logging ---
const createLimiter = (windowMins, maxRequests, errMsg) => rateLimit({
    windowMs: windowMins * 60 * 1000,
    max: maxRequests,
    keyGenerator: getClientIp,
    message: { success: false, error: errMsg },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        const clientIp = getClientIp(req);
        logServerEvent('alarm', `Rate limit exceeded on Helpdesk Auth endpoint: ${req.originalUrl || req.url} from IP: ${clientIp}`);
        res.status(options.statusCode).json(options.message);
    }
});

// Dedicated rate limiters for auth endpoints
const authLoginLimiter = createLimiter(15, 10, 'Too many login attempts. Try again in 15 minutes.');
const authCreateUserLimiter = createLimiter(60, 20, 'Too many user creation attempts. Try again after an hour.');

// Updated to limit to 3 attempts per 24 hours to prevent abuse
const authResetPasswordLimiter = createLimiter(1440, 3, 'Too many password reset attempts. Please try again after 24 hours.');

// --- Middleware: Verify Helpdesk JWT and extract role from token ---
const verifyHelpdeskToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded.helpdeskUser) {
            return res.status(403).json({ success: false, error: 'Invalid helpdesk session token.' });
        }
        // Attach verified token data to request — this is the ONLY trusted source of role
        req.helpdeskAuth = {
            username: decoded.username,
            role: decoded.role,
            school: decoded.school
        };
        // Also set headers from verified token so controllers read correct values
        req.headers['x-caller-role'] = decoded.role;
        req.headers['x-caller-username'] = decoded.username;
        if (decoded.school) req.headers['x-school-key'] = decoded.school;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Session expired or invalid. Please log in again.' });
    }
};

// --- Middleware: Verify Administrative Role (ADMIN or SUPER_ADMIN) from VERIFIED JWT ---
const requireAdminRole = [
    verifyHelpdeskToken,
    (req, res, next) => {
        const callerRole = req.helpdeskAuth.role;
        if (callerRole !== 'ADMIN' && callerRole !== 'SUPER_ADMIN') {
            const clientIp = getClientIp(req);
            logServerEvent('warning', `Unauthorized administrative action attempted on ${req.originalUrl || req.url} by '${req.helpdeskAuth.username}' from IP: ${clientIp}`);
            return res.status(403).json({
                success: false,
                error: 'Access denied: Administrative privileges (ADMIN or SUPER_ADMIN) are required.'
            });
        }
        next();
    }
];

// --- Authentication Endpoint ---
router.post('/login', authLoginLimiter, authController.login);

// --- User Management (Admin Dashboard) — all protected by JWT verification ---
router.put('/profile', verifyHelpdeskToken, authController.updateProfile);
router.post('/users', authCreateUserLimiter, requireAdminRole, authController.createUser);
router.get('/users', requireAdminRole, authController.getUsers);
router.delete('/users/:id', requireAdminRole, authController.deleteUser);
router.patch('/users/:id/role', requireAdminRole, authController.updateUserRole);
router.post('/reset-password', authResetPasswordLimiter, requireAdminRole, authController.resetPassword);

// SECURITY: /config endpoint removed — it previously leaked ALL admin credentials publicly.
// Default usernames (NOT passwords) are available only to authenticated master admins if needed.

module.exports = router;
module.exports.verifyHelpdeskToken = verifyHelpdeskToken;
module.exports.requireAdminRole = requireAdminRole;
