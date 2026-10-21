// utils/emailService.js
/**
 * Zero-Dependency Native SMTP Client & Email Service for Logbook Plus
 * 
 * Supports:
 * - SMTP with direct TLS/SSL (Port 465)
 * - SMTP with STARTTLS (Port 587 or 25)
 * - AUTH LOGIN (Base64)
 * - Connection verification and diagnostics
 * - Branded HTML email templates for OTP verification
 */

const net = require('net');
const tls = require('tls');
const { logServerEvent } = require('./logger');

/**
 * Returns current SMTP configuration from environment variables
 */
function getSmtpConfig() {
    const host = (process.env.SMTP_HOST || '').trim();
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = (process.env.SMTP_USER || '').trim();
    const rawPass = (process.env.SMTP_PASS || '').trim();
    // For Gmail app passwords, auto-strip spaces (e.g. 'mftv dbul tmxx acpp' -> 'mftvdbultmxxacpp')
    const pass = host.toLowerCase().includes('gmail.com') ? rawPass.replace(/\s+/g, '') : rawPass;

    let from = (process.env.SMTP_FROM || '').trim();
    if (!from) {
        from = `"Logbook Plus Security" <${user}>`;
    } else if (host.toLowerCase().includes('gmail.com') && user) {
        // Gmail requires envelope and from header to match the authenticated account
        const displayName = from.includes('<') ? from.replace(/<[^>]+>/, '').replace(/"/g, '').trim() : 'Logbook Plus Security';
        from = `"${displayName || 'Logbook Plus Security'}" <${user}>`;
    }

    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const isConfigured = Boolean(host && user && pass);

    return {
        host,
        port,
        user,
        pass,
        from,
        secure,
        isConfigured
    };
}

function getSafeCommandLabel(cmd) {
    if (!cmd) return 'INITIAL_HANDSHAKE';
    const firstWord = cmd.trim().split(/[\s\r\n]/)[0].toUpperCase();
    if (['EHLO', 'HELO', 'STARTTLS', 'QUIT'].includes(firstWord)) return firstWord;
    if (firstWord === 'AUTH') return 'AUTH';
    if (firstWord.startsWith('MAIL')) return 'MAIL FROM';
    if (firstWord.startsWith('RCPT')) return 'RCPT TO';
    if (firstWord === 'DATA') return 'DATA';
    return '[EMAIL_CONTENT_PAYLOAD]';
}

/**
 * Sends a raw SMTP command and waits for the expected response code
 */
function sendSmtpCommand(socket, command, expectedCode, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        let timer = setTimeout(() => {
            reject(new Error(`SMTP command timed out after ${timeoutMs}ms (${getSafeCommandLabel(command)})`));
        }, timeoutMs);

        const onData = (data) => {
            const response = data.toString();
            // Multi-line SMTP responses have a dash after the 3-digit code (e.g. 250-...)
            // The final line has a space (e.g. 250 OK)
            const lines = response.split('\r\n').filter(Boolean);
            const lastLine = lines[lines.length - 1] || '';
            const codeMatch = lastLine.match(/^(\d{3})\s/);

            if (codeMatch) {
                const code = parseInt(codeMatch[1], 10);
                clearTimeout(timer);
                socket.removeListener('data', onData);
                socket.removeListener('error', onError);

                if (expectedCode === undefined || code === expectedCode || (Array.isArray(expectedCode) && expectedCode.includes(code))) {
                    resolve({ code, response: response.trim(), lastLine });
                } else {
                    reject(new Error(`SMTP error (${code}): ${lastLine}`));
                }
            }
        };

        const onError = (err) => {
            clearTimeout(timer);
            socket.removeListener('data', onData);
            socket.removeListener('error', onError);
            reject(err);
        };

        socket.on('data', onData);
        socket.on('error', onError);

        if (command) {
            socket.write(command + '\r\n');
        }
    });
}

/**
 * Verifies SMTP connection and authentication
 */
async function verifySmtpConnection() {
    const config = getSmtpConfig();
    if (!config.isConfigured) {
        return {
            configured: false,
            success: false,
            error: 'SMTP is not configured in .env (SMTP_HOST, SMTP_USER, or SMTP_PASS missing).'
        };
    }

    try {
        await executeSmtpTransaction({
            config,
            testOnly: true
        });
        return {
            configured: true,
            success: true,
            message: `SMTP connection and authentication verified successfully with ${config.host}:${config.port}`
        };
    } catch (err) {
        return {
            configured: true,
            success: false,
            error: err.message
        };
    }
}

/**
 * Executes a full SMTP transaction
 */
function executeSmtpTransaction({ config, to, subject, html, text, testOnly = false }) {
    return new Promise((resolve, reject) => {
        let socket = null;
        let isTlsUpgraded = false;

        const cleanup = () => {
            if (socket && !socket.destroyed) {
                try {
                    socket.write('QUIT\r\n');
                    socket.end();
                } catch (e) { }
            }
        };

        const connectSocket = () => {
            if (config.secure) {
                // Direct TLS connection (Port 465)
                return tls.connect({
                    host: config.host,
                    port: config.port,
                    rejectUnauthorized: false
                });
            } else {
                // Plain TCP connection (Port 587 or 25)
                return net.connect({
                    host: config.host,
                    port: config.port
                });
            }
        };

        try {
            socket = connectSocket();
        } catch (err) {
            return reject(new Error(`Failed to establish socket to ${config.host}:${config.port}: ${err.message}`));
        }

        socket.setTimeout(15000);
        socket.on('timeout', () => {
            cleanup();
            reject(new Error(`Connection to SMTP server ${config.host}:${config.port} timed out.`));
        });

        // Step 1: Wait for 220 Greeting
        sendSmtpCommand(socket, null, 220)
            .then(async () => {
                // Step 2: Send EHLO
                const ehloRes = await sendSmtpCommand(socket, `EHLO localhost`, 250);

                // Step 3: STARTTLS if available and not already TLS
                if (!config.secure && ehloRes.response.includes('STARTTLS')) {
                    await sendSmtpCommand(socket, 'STARTTLS', 220);

                    // Upgrade socket to TLS
                    await new Promise((resTls, rejTls) => {
                        const tlsSocket = tls.connect({
                            socket: socket,
                            host: config.host,
                            rejectUnauthorized: false
                        }, () => {
                            socket = tlsSocket;
                            isTlsUpgraded = true;
                            resTls();
                        });
                        tlsSocket.on('error', rejTls);
                    });

                    // Re-send EHLO over TLS
                    await sendSmtpCommand(socket, `EHLO localhost`, 250);
                }

                // Step 4: AUTH LOGIN
                await sendSmtpCommand(socket, 'AUTH LOGIN', 334);
                // Send Base64 Username
                await sendSmtpCommand(socket, Buffer.from(config.user).toString('base64'), 334);
                // Send Base64 Password
                await sendSmtpCommand(socket, Buffer.from(config.pass).toString('base64'), 235);

                if (testOnly) {
                    cleanup();
                    return resolve({ success: true, message: 'SMTP Auth Verified' });
                }

                // Step 5: MAIL FROM
                const cleanFrom = config.from.includes('<')
                    ? config.from.match(/<([^>]+)>/)[1]
                    : config.from;
                await sendSmtpCommand(socket, `MAIL FROM:<${cleanFrom}>`, 250);

                // Step 6: RCPT TO
                await sendSmtpCommand(socket, `RCPT TO:<${to}>`, [250, 251]);

                // Step 7: DATA
                await sendSmtpCommand(socket, 'DATA', 354);

                // Construct MIME email payload
                const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2, 10)}@${config.host}>`;
                const dateHeader = new Date().toUTCString();

                const emailHeaders = [
                    `From: ${config.from}`,
                    `To: ${to}`,
                    `Subject: ${subject}`,
                    `Date: ${dateHeader}`,
                    `Message-ID: ${messageId}`,
                    `MIME-Version: 1.0`,
                    `Content-Type: text/html; charset=UTF-8`,
                    `X-Mailer: Logbook Plus Security Service`
                ].join('\r\n');

                const payload = `${emailHeaders}\r\n\r\n${html}\r\n.`;
                await sendSmtpCommand(socket, payload, 250);

                cleanup();
                resolve({ success: true, messageId });
            })
            .catch((err) => {
                cleanup();
                reject(err);
            });
    });
}

/**
 * Builds HTML template for OTP verification
 */
function buildOtpEmailHtml({ username, otp, maskedEmail, expiresInMinutes = 10 }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #09090b; padding: 28px 32px; text-align: left; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .header span { color: #60a5fa; }
    .content { padding: 32px; }
    .badge { display: inline-block; background: #fee2e2; color: #dc2626; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px; }
    h2 { margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #09090b; }
    p { margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #52525b; }
    .otp-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #2563eb; user-select: all; }
    .expiry { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 500; }
    .warning { background: #fff7ed; border-left: 4px solid #f97316; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 20px 0; }
    .warning p { margin: 0; font-size: 13px; color: #9a3412; font-weight: 500; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Logbook <span>Plus</span></h1>
    </div>
    <div class="content">
      <span class="badge">Security Alert</span>
      <h2>Account Deletion Verification Code</h2>
      <p>Hello <strong>${username}</strong>,</p>
      <p>We received an authorization request to permanently delete your <strong>Logbook Plus</strong> account (${maskedEmail}) and erase all associated encrypted backups from our cloud storage.</p>
      
      <p>Please use the single-use verification code below to authorize this procedure:</p>
      
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="expiry">Expires in ${expiresInMinutes} minutes • Single-use code</div>
      </div>
      
      <div class="warning">
        <p><strong>Did not request this?</strong> If you did not request account deletion, do not share this code with anyone. Your credentials may be compromised—please log in and update your password immediately.</p>
      </div>
      
      <p style="font-size: 12px; color: #a1a1aa; margin-top: 24px;">This is an automated security transmission sent to ${maskedEmail}.</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Logbook Plus. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

function maskEmailRecipient(email) {
    if (!email || !email.includes('@')) return 'user@***';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name[0]}${'*'.repeat(Math.min(name.length - 2, 5))}${name[name.length - 1]}@${domain}`;
}

/**
 * High-level function to send an OTP Email
 */
async function sendOtpEmail({ to, username, otp, maskedEmail }) {
    const config = getSmtpConfig();
    const safeTarget = maskedEmail || maskEmailRecipient(to);

    if (!config.isConfigured) {
        logServerEvent('warning', `[EMAIL SERVICE] Cannot dispatch email: SMTP is not configured in .env (host='${config.host}', user='${config.user}')`);
        return {
            success: false,
            configured: false,
            error: 'SMTP credentials are not configured in .env. Please configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.'
        };
    }

    try {
        const subject = `Your Logbook Plus Verification Code: ${otp}`;
        const html = buildOtpEmailHtml({ username, otp, maskedEmail: safeTarget });

        const result = await executeSmtpTransaction({
            config,
            to,
            subject,
            html
        });

        logServerEvent('info', `[EMAIL SERVICE] Verification OTP email dispatched successfully to ${safeTarget} (Message-ID: ${result.messageId})`);
        return {
            success: true,
            configured: true,
            messageId: result.messageId
        };
    } catch (err) {
        const sanitizedError = (err.message || 'SMTP delivery failure').replace(/<[^>]+>/g, '').slice(0, 150);
        logServerEvent('error', `[EMAIL SERVICE] Failed to dispatch OTP email to ${safeTarget}: ${sanitizedError}`);
        return {
            success: false,
            configured: true,
            error: sanitizedError
        };
    }
}

module.exports = {
    getSmtpConfig,
    verifySmtpConnection,
    sendOtpEmail,
    buildOtpEmailHtml
};
