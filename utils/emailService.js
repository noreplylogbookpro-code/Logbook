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
const fs = require('fs');
const path = require('path');
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
function executeSmtpTransaction({ config, to, subject, html, text, attachments = [], testOnly = false }) {
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

                let payload = '';

                if (attachments && attachments.length > 0) {
                    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
                    const emailHeaders = [
                        `From: ${config.from}`,
                        `To: ${to}`,
                        `Subject: ${subject}`,
                        `Date: ${dateHeader}`,
                        `Message-ID: ${messageId}`,
                        `MIME-Version: 1.0`,
                        `Content-Type: multipart/related; boundary="${boundary}"`,
                        `X-Mailer: Logbook Plus Security Service`
                    ].join('\r\n');

                    let body = `--${boundary}\r\n`;
                    body += `Content-Type: text/html; charset=UTF-8\r\n`;
                    body += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
                    body += `${html}\r\n\r\n`;

                    for (const att of attachments) {
                        body += `--${boundary}\r\n`;
                        body += `Content-Type: ${att.contentType || 'image/png'}; name="${att.filename}"\r\n`;
                        body += `Content-Transfer-Encoding: base64\r\n`;
                        if (att.cid) {
                            body += `Content-ID: <${att.cid}>\r\n`;
                        }
                        body += `Content-Disposition: inline; filename="${att.filename}"\r\n\r\n`;
                        const b64 = (Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content)).toString('base64');
                        const chunked = b64.match(/.{1,76}/g) ? b64.match(/.{1,76}/g).join('\r\n') : b64;
                        body += `${chunked}\r\n\r\n`;
                    }

                    body += `--${boundary}--`;
                    payload = `${emailHeaders}\r\n\r\n${body}\r\n.`;
                } else {
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

                    payload = `${emailHeaders}\r\n\r\n${html}\r\n.`;
                }

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

function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function safeHttpUrl(value) {
    if (!value) return "";

    try {
        const url = new URL(value);
        return ["https:", "http:"].includes(url.protocol)
            ? url.href
            : "";
    } catch {
        return "";
    }
}

/**
 * Resolves and validates an email icon URL into a reliable absolute HTTP(S) URL,
 * CID reference (e.g. 'cid:app_logo'), or safe data URI.
 */
function resolveEmailIconUrl(customUrl = "") {
    if (customUrl && typeof customUrl === "string") {
        const trimmed = customUrl.trim();
        // Support CID attachments
        if (trimmed.startsWith("cid:")) {
            return trimmed.replace(/[^a-zA-Z0-9_\-:@.]/g, "");
        }
        // Support inline Data URIs
        if (trimmed.startsWith("data:image/")) {
            return trimmed;
        }
        // Support absolute HTTP / HTTPS URLs
        try {
            const parsed = new URL(trimmed);
            if (["https:", "http:"].includes(parsed.protocol)) {
                return parsed.href;
            }
        } catch {
            // Might be a relative path or local filename, handled below
        }
    }

    const baseDomain = (
        process.env.APP_URL ||
        process.env.BASE_URL ||
        process.env.PUBLIC_URL ||
        "https://logbookplus.co.in"
    ).trim().replace(/\/+$/, "");

    // If an explicit relative path or filename was provided (e.g. './assets/app-logo.webp' or '/assets/images/app_logo.png')
    if (customUrl && typeof customUrl === "string" && customUrl.trim()) {
        const cleanPath = customUrl.trim().replace(/^\.?\/+/, "");
        const normalizedPath = cleanPath.replace("app_logo", "app_logo");
        return `${baseDomain}/${normalizedPath}`;
    }

    // Optional environment variable override
    if (process.env.EMAIL_ICON_URL) {
        return process.env.EMAIL_ICON_URL.trim();
    }

    // Default to high-compatibility PNG logo (supported across Outlook, Gmail, Apple Mail, etc.)
    return `${baseDomain}/assets/images/app_logo.png`;
}

function buildOtpEmailHtml({
    name,
    username,
    otp,
    maskedEmail,
    expiresInMinutes = 10,
    viewInBrowserUrl = "",
    securityHelpUrl = "",
    iconUrl = ""
}) {
    const currentYear = new Date().getFullYear();

    const recipientName = (name || username || "there").trim();
    const safeName = escapeHtml(recipientName || "there");
    const safeEmail = escapeHtml(maskedEmail || "");
    const safeOtp = escapeHtml(otp || "");
    const expiry = Number.isFinite(Number(expiresInMinutes))
        ? Math.max(1, Math.min(60, Math.floor(Number(expiresInMinutes))))
        : 10;

    const browserUrl = safeHttpUrl(viewInBrowserUrl);
    const helpUrl = safeHttpUrl(securityHelpUrl);
    const resolvedIcon = resolveEmailIconUrl(iconUrl);
    const safeIcon = escapeHtml(resolvedIcon);

    const browserLink = browserUrl
        ? `
      <tr>
        <td align="center" style="padding: 16px 24px 0;">
          <a href="${escapeHtml(browserUrl)}"
             style="font-family:Arial,Helvetica,sans-serif;
                    font-size:12px;color:#475569;
                    text-decoration:underline;">
            View this email in your browser
          </a>
        </td>
      </tr>`
        : "";

    const helpLink = helpUrl
        ? `<a href="${escapeHtml(helpUrl)}"
          style="color:#1d4ed8;text-decoration:underline;">
         visit our official security help page
       </a>`
        : "open Logbook Plus directly and contact support through the app";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Account Deletion Verification | Logbook Plus</title>
</head>

<body style="margin:0;padding:0;background-color:#f1f5f9;
             font-family:Arial,Helvetica,sans-serif;color:#1e293b;">

  <div style="display:none;font-size:1px;color:#f1f5f9;
              line-height:1px;max-height:0;max-width:0;
              opacity:0;overflow:hidden;">
    Your Logbook Plus account deletion verification code.
    If you did not request this, you do not need to use the code.
  </div>

  <table role="presentation" width="100%" cellspacing="0"
         cellpadding="0" border="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:24px 12px;">

        <table role="presentation" width="100%" cellspacing="0"
               cellpadding="0" border="0"
               style="max-width:540px;background-color:#ffffff;
                      border:1px solid #e2e8f0;border-radius:12px;
                      overflow:hidden;">

          <!-- Brand header -->
          <tr>
            <td style="padding:24px 28px;background-color:#ffffff;
                       border-bottom:1px solid #e2e8f0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td valign="middle" style="vertical-align:middle;padding-right:14px;width:38px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;border-spacing:0;">
                      <tr>
                        <td align="center" valign="middle" width="38" height="38"
                            style="width:38px;height:38px;background-color:#2563eb;border-radius:9px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#ffffff;text-align:center;line-height:38px;">
                          <img src="${safeIcon}"
                               alt="Logbook Plus"
                               width="38"
                               height="38"
                               style="display:block;width:38px;height:38px;border-radius:9px;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" style="vertical-align:middle;">
                    <p style="margin:0;font-size:21px;font-weight:bold;
                              letter-spacing:-0.4px;color:#1e293b;line-height:1.2;">
                      Logbook <span style="color:#2467b9;">Plus</span>
                    </p>
                    <p style="margin:4px 0 0;font-size:12px;color:#64748b;line-height:1.4;">
                      Official account security notification
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:28px;">

              <p style="margin:0 0 12px;font-size:12px;
                        font-weight:bold;letter-spacing:0.8px;
                        color:#475569;text-transform:uppercase;">
                Account security
              </p>

              <h1 style="margin:0 0 18px;font-size:23px;
                         line-height:1.35;font-weight:bold;color:#0f172a;">
                Verify your account deletion request
              </h1>

              <p style="margin:0 0 16px;font-size:15px;
                        line-height:1.7;color:#334155;">
                Hello ${safeName},
              </p>

              <p style="margin:0 0 16px;font-size:14px;
                        line-height:1.8;color:#475569;">
                We received a request to permanently delete your
                Logbook Plus account associated with
                <strong style="color:#334155;">${safeEmail}</strong>.
                This email contains a verification code required
                to confirm that request.
              </p>

              <p style="margin:0 0 20px;font-size:14px;
                        line-height:1.8;color:#475569;">
                Account deletion may permanently remove your account
                data and associated cloud backups, where applicable.
                Please review any available backup or recovery options
                before confirming deletion.
              </p>

              <!-- OTP panel -->
              <table role="presentation" width="100%" cellspacing="0"
                     cellpadding="0" border="0"
                     style="background-color:#f8fafc;
                            border:1px solid #dbe3ed;border-radius:10px;">
                <tr>
                  <td align="center" style="padding:24px 16px;">

                    <p style="margin:0 0 12px;font-size:13px;
                              color:#475569;">
                      Your one-time verification code
                    </p>

                    <p style="margin:0;font-family:Consolas,
                              'Courier New',monospace;font-size:32px;
                              line-height:1.5;font-weight:bold;
                              letter-spacing:6px;color:#1d4ed8;
                              overflow-wrap:anywhere;">
                      ${safeOtp}
                    </p>

                    <p style="margin:12px 0 0;font-size:12px;
                              line-height:1.6;color:#64748b;">
                      Expires in ${expiry} minutes · Single use only
                    </p>

                  </td>
                </tr>
              </table>

              <p style="margin:18px 0 0;font-size:13px;
                        line-height:1.8;color:#475569;">
                Enter this code only in the official Logbook Plus
                account-deletion flow. Our support team will never
                ask you to disclose this code.
              </p>

              <!-- Fraud warning -->
              <table role="presentation" width="100%" cellspacing="0"
                     cellpadding="0" border="0"
                     style="margin-top:24px;background-color:#fff7ed;
                            border:1px solid #fed7aa;border-radius:8px;">
                <tr>
                  <td style="padding:18px;">

                    <p style="margin:0 0 10px;font-size:15px;
                              line-height:1.5;font-weight:bold;
                              color:#9a3412;">
                      Did you not request account deletion?
                    </p>

                    <p style="margin:0 0 12px;font-size:13px;
                              line-height:1.8;color:#7c2d12;">
                      Do not enter, forward, or share this code.
                      You can simply ignore this email; do not use
                      the code to authorize the deletion.
                    </p>

                    <p style="margin:0 0 8px;font-size:13px;
                              line-height:1.7;font-weight:bold;
                              color:#7c2d12;">
                      If you suspect someone accessed your account:
                    </p>

                    <table role="presentation" width="100%"
                           cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="20" valign="top"
                            style="padding:3px 0;font-size:13px;
                                   color:#9a3412;">1.</td>
                        <td style="padding:3px 0;font-size:13px;
                                   line-height:1.7;color:#7c2d12;">
                          Open Logbook Plus directly, not through
                          links in an unexpected email.
                        </td>
                      </tr>
                      <tr>
                        <td width="20" valign="top"
                            style="padding:3px 0;font-size:13px;
                                   color:#9a3412;">2.</td>
                        <td style="padding:3px 0;font-size:13px;
                                   line-height:1.7;color:#7c2d12;">
                          Review your account security and change
                          your password if you suspect unauthorized
                          access.
                        </td>
                      </tr>
                      <tr>
                        <td width="20" valign="top"
                            style="padding:3px 0;font-size:13px;
                                   color:#9a3412;">3.</td>
                        <td style="padding:3px 0;font-size:13px;
                                   line-height:1.7;color:#7c2d12;">
                          If anything looks suspicious, ${helpLink}.
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:13px;
                        line-height:1.8;color:#64748b;">
                <strong style="color:#334155;">You are in control.</strong>
                This code is for verification only. Receiving this
                email does not mean your account has been deleted.
              </p>

            </td>
          </tr>

          <!-- Identifiable footer -->
          <tr>
            <td style="padding:22px 28px;background-color:#f8fafc;
                       border-top:1px solid #e2e8f0;">

              <p style="margin:0 0 8px;font-size:13px;
                        font-weight:bold;color:#334155;">
                Logbook Plus Account Security
              </p>

              <p style="margin:0 0 12px;font-size:12px;
                        line-height:1.8;color:#64748b;">
                This automated security notification was sent to
                ${safeEmail} in response to an account-deletion
                verification request.
              </p>

              <p style="margin:0;font-size:12px;line-height:1.8;
                        color:#64748b;">
                Logbook Plus will never ask you to send your
                verification code by email.
              </p>

              <p style="margin:16px 0 0;font-size:11px;
                        line-height:1.7;color:#94a3b8;">
                &copy; ${currentYear} Logbook Plus. All rights reserved.
              </p>

            </td>
          </tr>

          ${browserLink}

        </table>
      </td>
    </tr>
  </table>
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
async function sendOtpEmail({ to, name, username, otp, maskedEmail, iconUrl }) {
    const config = getSmtpConfig();
    const safeTarget = maskedEmail || maskEmailRecipient(to);
    const recipientName = name || username || "";

    if (!config.isConfigured) {
        logServerEvent('warning', `[EMAIL SERVICE] Cannot dispatch email: SMTP is not configured in .env (host='${config.host}', user='${config.user}')`);
        return {
            success: false,
            configured: false,
            error: 'SMTP credentials are not configured in .env. Please configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.'
        };
    }

    try {
        const localLogoPng = path.join(__dirname, '..', 'assets', 'images', 'app_logo.png');
        const localLogoWebp = path.join(__dirname, '..', 'assets', 'images', 'app_logo.webp');
        const localLogoFile = fs.existsSync(localLogoPng) ? localLogoPng : (fs.existsSync(localLogoWebp) ? localLogoWebp : null);

        let attachments = [];
        let effectiveIconUrl = iconUrl;

        // If no explicit remote URL is specified, embed the actual local asset image as inline CID attachment
        if ((!iconUrl || iconUrl.startsWith('cid:') || iconUrl.includes('assets/')) && localLogoFile) {
            const ext = path.extname(localLogoFile).toLowerCase();
            const contentType = ext === '.png' ? 'image/png' : 'image/webp';
            attachments.push({
                filename: path.basename(localLogoFile),
                contentType,
                cid: 'app_logo',
                content: fs.readFileSync(localLogoFile)
            });
            effectiveIconUrl = 'cid:app_logo';
        }

        const subject = `Your Logbook Plus Verification Code: ${otp}`;
        const html = buildOtpEmailHtml({ name: recipientName, username: recipientName, otp, maskedEmail: safeTarget, iconUrl: effectiveIconUrl });

        const result = await executeSmtpTransaction({
            config,
            to,
            subject,
            html,
            attachments
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
    buildOtpEmailHtml,
    resolveEmailIconUrl
};
