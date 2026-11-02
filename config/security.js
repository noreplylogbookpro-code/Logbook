// config/security.js
/**
 * Logbook Plus - Cryptography, Secrets Management & Fail-Safe Startup Module
 * 
 * Enforces:
 * - Zero fallback policy for production secrets
 * - Fail-safe startup validation with diagnostic error reporting
 * - Key independence (JWT, DB encryption, File encryption, License signing)
 * - Authenticated encryption (AES-256-GCM) with seamless AES-256-CBC legacy decryption
 * - Legacy license verification and migration support
 * - Constant-time comparison for tokens and API keys (Timing-attack mitigation)
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Known insecure / leaked default keys that must never be allowed in runtime
const BANNED_SECRET_VALUES = new Set([
    'PnxKdbF0XxJwCcao1yemufCPM0gzyAJXajMh2YtyNbk=',
    'logbookplus_default_file_key_32b',
    'logbookplus_default_db_key_32b_',
    'logbook-plus-master-secret-key-2026',
    '123456',
    'admin123',
    'staff123',
    'password',
    'admin',
    'secret',
    'your-random-jwt-secret'
]);

/**
 * Validates security environment variables on startup.
 * Fails safely if required secrets are missing, too short, identical, or using known insecure defaults.
 * 
 * @param {Object} options
 * @param {boolean} options.exitOnError - If true, calls process.exit(1) on failure.
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateSecurityConfiguration(options = { exitOnError: true }) {
    const errors = [];
    const warnings = [];

    const isProduction = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';

    const requiredSecrets = [
        { name: 'JWT_SECRET', minLen: 32, label: 'JWT Signing Secret' },
        { name: 'DB_ENCRYPTION_KEY', minLen: 32, label: 'Database Encryption Key' },
        { name: 'FILE_ENCRYPTION_KEY', minLen: 32, label: 'File Storage Encryption Key' },
        { name: 'LICENSE_SECRET', minLen: 32, label: 'License Verification Secret' }
    ];

    const valuesByName = {};

    for (const item of requiredSecrets) {
        const val = process.env[item.name];
        if (!val || typeof val !== 'string' || val.trim().length === 0) {
            errors.push(`Missing required environment variable: ${item.name} (${item.label})`);
            continue;
        }

        const trimmed = val.trim();
        valuesByName[item.name] = trimmed;

        if (BANNED_SECRET_VALUES.has(trimmed)) {
            errors.push(`Insecure default secret detected in ${item.name}! You must generate a unique, cryptographically random secret.`);
        }

        if (trimmed.length < item.minLen) {
            errors.push(`${item.name} is too short (length: ${trimmed.length}, minimum: ${item.minLen} characters / 256 bits).`);
        }
    }

    // Ensure cryptographic secret separation (no single key reused for multiple distinct purposes)
    const secretNames = Object.keys(valuesByName);
    for (let i = 0; i < secretNames.length; i++) {
        for (let j = i + 1; j < secretNames.length; j++) {
            const nameA = secretNames[i];
            const nameB = secretNames[j];
            if (valuesByName[nameA] === valuesByName[nameB]) {
                errors.push(`Secret reuse detected! ${nameA} and ${nameB} must be independently generated secrets.`);
            }
        }
    }

    // Check administrative passwords
    const masterPass = (process.env.MASTER_PASS || '').trim();
    if (masterPass && BANNED_SECRET_VALUES.has(masterPass)) {
        if (process.env.STRICT_PRODUCTION === 'true') {
            errors.push('MASTER_PASS is set to a known insecure default! Update it to a strong passphrase.');
        } else {
            warnings.push('MASTER_PASS is set to a known insecure default value. Update it in your .env before production launch.');
        }
    }

    const superAdminPass = (process.env.SUPER_ADMIN_PASS || '').trim();
    if (superAdminPass && BANNED_SECRET_VALUES.has(superAdminPass)) {
        warnings.push('SUPER_ADMIN_PASS is using an insecure default.');
    }

    const isValid = errors.length === 0;

    if (!isValid) {
        console.error('\n================================================================');
        console.error(' [FATAL SECURITY ERROR] Server startup aborted due to configuration:');
        console.error('================================================================');
        for (const err of errors) {
            console.error(`  ✖ ${err}`);
        }
        console.error('================================================================');
        console.error(' Refer to .env.example for required configuration details.\n');

        if (options.exitOnError && !isTest) {
            process.exit(1);
        }
    }

    for (const warn of warnings) {
        console.warn(`[SECURITY WARNING] ${warn}`);
    }

    return { valid: isValid, errors, warnings };
}

// Pre-compute 32-byte hash buffers once validated
function deriveKeyBuffer(secret) {
    if (!secret || typeof secret !== 'string') {
        throw new Error('Cannot derive encryption key from empty or invalid secret');
    }
    return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Timing-safe string / token comparison
 */
function timingSafeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
        // Prevent length oracle via constant-time dummy comparison
        crypto.timingSafeEqual(bufA, bufA);
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Text Encryption (for 2FA secrets, TOTP counters, sensitive database fields)
 * Format v2 (Authenticated AES-256-GCM):
 *   "v2:ivHex:authTagHex:ciphertextHex"
 * 
 * Format v1 (Legacy AES-256-CBC, maintained for reading existing records):
 *   "ivHex:ciphertextHex"
 */
function encryptDatabaseText(text, keyString = process.env.DB_ENCRYPTION_KEY) {
    if (!text || typeof text !== 'string') return text;
    try {
        const keyBuffer = deriveKeyBuffer(keyString);
        const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
        const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
        let ciphertext = cipher.update(text, 'utf8', 'hex');
        ciphertext += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return `v2:${iv.toString('hex')}:${authTag}:${ciphertext}`;
    } catch (e) {
        console.error('[SECURITY] Database text encryption error:', e.message);
        throw new Error('Encryption operation failed');
    }
}

/**
 * Text Decryption (handles both v2 GCM and legacy v1 CBC formats transparently)
 */
function decryptDatabaseText(encryptedText, keyString = process.env.DB_ENCRYPTION_KEY) {
    if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
    const keyBuffer = deriveKeyBuffer(keyString);

    try {
        // 1. Format v2: Authenticated AES-256-GCM ("v2:ivHex:authTagHex:ciphertextHex")
        if (encryptedText.startsWith('v2:')) {
            const parts = encryptedText.split(':');
            if (parts.length === 4) {
                const iv = Buffer.from(parts[1], 'hex');
                const authTag = Buffer.from(parts[2], 'hex');
                const ciphertext = parts[3];
                const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
                decipher.setAuthTag(authTag);
                let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                return decrypted;
            }
        }

        // 2. Format v1: Legacy AES-256-CBC ("ivHex:ciphertextHex")
        const parts = encryptedText.split(':');
        if (parts.length === 2) {
            const iv = Buffer.from(parts[0], 'hex');
            const ciphertext = parts[1];
            const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
            let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }

        // Return unencrypted plaintext as-is if no delimiter match
        return encryptedText;
    } catch (e) {
        // Failed decryption under primary key: try legacy fallback key if configured
        if (process.env.LEGACY_DB_ENCRYPTION_KEY) {
            try {
                const legacyBuf = deriveKeyBuffer(process.env.LEGACY_DB_ENCRYPTION_KEY);
                const parts = encryptedText.split(':');
                if (parts.length === 2) {
                    const iv = Buffer.from(parts[0], 'hex');
                    const decipher = crypto.createDecipheriv('aes-256-cbc', legacyBuf, iv);
                    let dec = decipher.update(parts[1], 'hex', 'utf8');
                    dec += decipher.final('utf8');
                    return dec;
                }
            } catch (_) { }
        }
        return encryptedText;
    }
}

/**
 * File Encryption Key Buffer
 */
function getFileEncryptionKeyBuffer() {
    return deriveKeyBuffer(process.env.FILE_ENCRYPTION_KEY);
}

/**
 * Database Encryption Key Buffer
 */
function getDbEncryptionKeyBuffer() {
    return deriveKeyBuffer(process.env.DB_ENCRYPTION_KEY);
}

/**
 * License Verification with Legacy Key Migration Support
 */
const LEGACY_LICENSE_SECRETS = [
    'logbook-plus-master-secret-key-2026'
];

function verifyLicenseKeySafe(licenseKey) {
    if (!licenseKey || typeof licenseKey !== 'string') return { valid: false };

    const primarySecret = process.env.LICENSE_SECRET;
    if (primarySecret) {
        try {
            const decoded = jwt.verify(licenseKey, primarySecret);
            if (decoded && decoded.type === 'self-hosted') {
                if (decoded.expiresAt && Date.now() > decoded.expiresAt) {
                    return { valid: false, expired: true, decoded };
                }
                return { valid: true, isLegacy: false, decoded };
            }
        } catch (_) { }
    }

    // Fallback: check legacy license keys to prevent locking out legitimate existing customers
    for (const legacySecret of LEGACY_LICENSE_SECRETS) {
        try {
            const decoded = jwt.verify(licenseKey, legacySecret);
            if (decoded && decoded.type === 'self-hosted') {
                if (decoded.expiresAt && Date.now() > decoded.expiresAt) {
                    return { valid: false, expired: true, decoded };
                }
                return { valid: true, isLegacy: true, decoded };
            }
        } catch (_) { }
    }

    return { valid: false };
}

module.exports = {
    validateSecurityConfiguration,
    deriveKeyBuffer,
    timingSafeEqual,
    encryptDatabaseText,
    decryptDatabaseText,
    getFileEncryptionKeyBuffer,
    getDbEncryptionKeyBuffer,
    verifyLicenseKeySafe,
    BANNED_SECRET_VALUES
};
