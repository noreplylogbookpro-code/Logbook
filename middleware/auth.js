// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Extracts and verifies JWT from Authorization header
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Expects: "Bearer <token>"

    if (!token) {
        return res.status(401).json({ error: "Access token required. Please log in." });
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
            // Map token payload properties to match your existing logic downstream
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
        if (req.tokenPayload && req.tokenPayload.isMaster) {
            return next();
        }
        res.status(403).json({ error: "Master administrative access required" });
    }
];

module.exports = {
    JWT_SECRET,
    isAuthenticated,
    isMasterAuth
};