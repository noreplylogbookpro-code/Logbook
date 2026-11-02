// middleware/auth.js
require('dotenv').config({ quiet: true });
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('[FATAL SECURITY ERROR] JWT_SECRET is not configured in environment variables.');
}

/**
 * Helper to safely extract cookies from request header without extra dependencies
 */
function extractCookie(req, cookieName) {
    if (req.cookies && req.cookies[cookieName]) {
        return req.cookies[cookieName];
    }
    const cookieHeader = req.headers['cookie'];
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const c of cookies) {
        const [name, ...val] = c.split('=');
        if (name === cookieName) {
            try {
                return decodeURIComponent(val.join('='));
            } catch (_) {
                return val.join('=');
            }
        }
    }
    return null;
}

/**
 * Extracts and verifies JWT from Authorization header or HttpOnly Cookie
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1]; // Expects: "Bearer <token>"

    // Fallback: check HttpOnly auth cookie if header is not present
    if (!token) {
        token = extractCookie(req, 'authToken') || extractCookie(req, 'masterToken');
    }

    if (!token) {
        return res.status(401).json({ error: "Access token required. Please log in." });
    }

    if (!JWT_SECRET) {
        return res.status(500).json({ error: "Server authentication service configuration error." });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Invalid or expired session token." });
        }
        // Attach decoded variables cleanly to the request context
        req.tokenPayload = decoded;
        next();
    });
};

/**
 * Ensures user context exists within the verified token
 */
const isAuthenticated = [
    verifyToken,
    (req, res, next) => {
        if (req.tokenPayload && req.tokenPayload.userId) {
            // Map token payload properties to match existing logic downstream
            req.userId = req.tokenPayload.userId;
            return next();
        }
        res.status(401).json({ error: "Unauthorized user identity" });
    }
];

/**
 * Ensures master admin privileges exist within the verified token
 */
const isMasterAuth = [
    verifyToken,
    (req, res, next) => {
        if (req.tokenPayload && (req.tokenPayload.isMaster || req.tokenPayload.role === 'SUPER_ADMIN')) {
            return next();
        }
        res.status(403).json({ error: "Master administrative access required" });
    }
];

module.exports = {
    JWT_SECRET,
    verifyToken,
    isAuthenticated,
    isMasterAuth,
    extractCookie
};
