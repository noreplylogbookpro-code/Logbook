const crypto = require('crypto');

/**
 * Generates a human-readable unique tracking token.
 * Format: NH-YYYYMMDD-XXXX
 */
function generateTicketToken() {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `NH-${dateStr}-${randomSuffix}`;
}

module.exports = { generateTicketToken };