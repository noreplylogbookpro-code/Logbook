const { logsDb } = require('../config/db');

/**
 * Sanitizes log messages to ensure sensitive data (OTP codes, passwords, raw HTML)
 * is never written to console or database logs.
 */
function sanitizeLogMessage(message) {
    if (typeof message !== 'string') return message;

    let sanitized = message;

    // 1. Redact OTP / Verification codes: e.g. "code: 123456" or "OTP ...: 123456" or ": 123456"
    sanitized = sanitized.replace(/(\b(?:otp|code|verification|token)\b[^0-9\n\r]{1,20})(\d{4,8})\b/gi, '$1[REDACTED]');
    sanitized = sanitized.replace(/(\b(?:is|was|generated|sent)\b[^0-9\n\r]{1,15})(\d{6})\b/gi, '$1[REDACTED]');
    sanitized = sanitized.replace(/(:\s*)(\d{6})\b/g, '$1[REDACTED]');

    // 2. Strip / Redact any raw HTML markup (email templates, tags, MIME bodies)
    if (sanitized.includes('<!DOCTYPE') || sanitized.includes('<html') || sanitized.includes('<body') || sanitized.includes('<table') || sanitized.includes('<div')) {
        sanitized = sanitized.replace(/<!DOCTYPE[\s\S]*?<\/html>/gi, '[HTML_EMAIL_PAYLOAD_REDACTED]');
        sanitized = sanitized.replace(/<style[\s\S]*?<\/style>/gi, '');
        sanitized = sanitized.replace(/<[^>]+>/g, '');
    }

    // 3. Redact passwords and secret tokens
    sanitized = sanitized.replace(/((?:password|pass|secret|auth)\s*[:=]\s*['"]?)[^\s'",;]+/gi, '$1[REDACTED]');

    return sanitized.trim();
}

/**
 * Sanitizes metadata objects before persisting
 */
function sanitizeMetadata(metadata = {}) {
    if (!metadata || typeof metadata !== 'object') return {};
    const sanitized = { ...metadata };

    for (const key of Object.keys(sanitized)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('otp') || lowerKey.includes('code') || lowerKey.includes('pass') || lowerKey.includes('secret')) {
            sanitized[key] = '[REDACTED]';
        } else if (lowerKey.includes('html') || lowerKey.includes('body')) {
            if (typeof sanitized[key] === 'string' && (sanitized[key].includes('<') || sanitized[key].length > 200)) {
                sanitized[key] = '[PAYLOAD_REDACTED]';
            }
        }
    }
    return sanitized;
}

function logServerEvent(level, message, metadata = {}) {
    const timestamp = Date.now();
    const formattedTime = new Date(timestamp).toISOString();
    const cleanMessage = sanitizeLogMessage(message);
    const cleanMetadata = sanitizeMetadata(metadata);

    console.log(`[${level.toUpperCase()}] [${formattedTime}] ${cleanMessage}`);

    // Non-blocking database insertion
    logsDb.insert({
        type: 'server_log',
        level: level.toLowerCase(),
        message: cleanMessage,
        metadata: cleanMetadata,
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

    // Automated Telegram Alerts for Alarm, Critical, Error, and Warning events
    const normalizedLevel = (level || '').toLowerCase();
    const alertLevels = ['alarm', 'critical', 'warning', 'error'];

    if (alertLevels.includes(normalizedLevel)) {
        try {
            const { sendEventAlertTelegram } = require('./telegramBotService');
            const ipMatch = cleanMessage.match(/(?:from\s+IP:\s*|client\s+IP:\s*)([^\s,]+)/i);
            const ip = cleanMetadata.ip || (ipMatch ? ipMatch[1] : undefined);
            const epMatch = cleanMessage.match(/(?:endpoint:\s*|on\s+endpoint:\s*)([^\s,]+)/i);
            const endpoint = cleanMetadata.url || (epMatch ? epMatch[1] : undefined);

            const detailsParts = [];
            if (cleanMetadata.status) detailsParts.push(`Status: ${cleanMetadata.status}`);
            if (cleanMetadata.username) detailsParts.push(`User: @${cleanMetadata.username}`);
            if (cleanMetadata.school) detailsParts.push(`School: ${cleanMetadata.school}`);

            sendEventAlertTelegram({
                level: normalizedLevel,
                ip,
                endpoint,
                reason: cleanMessage,
                details: detailsParts.length > 0 ? detailsParts.join(' | ') : undefined
            }).catch(err => {
                console.error('[TELEGRAM ALERT ERROR]', err.message);
            });
        } catch (err) {
            console.error('[TELEGRAM ALERT DISPATCH FAILURE]', err.message);
        }
    }
}

module.exports = {
    logServerEvent,
    sanitizeLogMessage,
    sanitizeMetadata
};
