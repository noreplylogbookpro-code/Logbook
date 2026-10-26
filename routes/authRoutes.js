const express = require('express');
const router = express.Router();
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const authController = require('../controllers/authController');
const { logServerEvent } = require('../utils/logger');

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

// --- Middleware: Verify Administrative Role (ADMIN or SUPER_ADMIN) ---
const requireAdminRole = (req, res, next) => {
    const callerRole = (req.headers['x-caller-role'] || req.query.role || req.body?.callerRole || '').toUpperCase();
    if (callerRole !== 'ADMIN' && callerRole !== 'SUPER_ADMIN') {
        const clientIp = getClientIp(req);
        logServerEvent('warning', `Unauthorized administrative action attempted on ${req.originalUrl || req.url} from IP: ${clientIp}`);
        return res.status(403).json({
            success: false,
            error: 'Access denied: Administrative privileges (ADMIN or SUPER_ADMIN) are required.'
        });
    }
    next();
};

// --- Authentication Endpoint ---
router.post('/login', authLoginLimiter, authController.login);

// --- User Management (Admin Dashboard) ---
router.put('/profile', authController.updateProfile);
router.post('/users', authCreateUserLimiter, requireAdminRole, authController.createUser);
router.get('/users', requireAdminRole, authController.getUsers);
router.delete('/users/:id', requireAdminRole, authController.deleteUser);
router.patch('/users/:id/role', requireAdminRole, authController.updateUserRole);
router.post('/reset-password', authResetPasswordLimiter, requireAdminRole, authController.resetPassword);

// --- Config details endpoint to retrieve dynamic env credentials on login card ---
router.get('/config', (req, res) => {
    return res.status(200).json({
        superAdminUser: process.env.SUPER_ADMIN_USER,
        superAdminPass: process.env.SUPER_ADMIN_PASS,
        defaultAdminUser: process.env.DEFAULT_ADMIN_USER,
        defaultAdminPass: process.env.DEFAULT_ADMIN_PASS,
        defaultStaffUser: process.env.DEFAULT_STAFF_USER,
        defaultStaffPass: process.env.DEFAULT_STAFF_PASS
    });
});

module.exports = router;
