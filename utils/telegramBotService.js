// utils/telegramBotService.js
/**
 * Telegram Bot Service for Logbook Plus
 * 
 * Allows administrators to publish, update, check, or disable Developer Notes
 * remotely by sending predefined text or commands directly to the Telegram Bot.
 * 
 * Supported commands:
 *   /devnote <Title> | <Message> [| <Badge>] [| <ActionUrl>]
 *   /devnote (or /devnote status) - View current active developer note
 *   /devnote off (or /devnote disable) - Turn off active note
 *   /devnote on (or /devnote enable) - Re-activate the latest note
 *   /devnote help - Show format guide and examples
 * 
 * Also supports multiline key: value syntax:
 *   /devnote
 *   Title: Scheduled Maintenance
 *   Message: Cloud backups will be paused for 30 minutes at midnight.
 *   Badge: Maintenance
 */

const https = require('https');
const { developerNotesDb } = require('../config/db');
const { logServerEvent } = require('./logger');

let isPollingActive = false;
let pollingAbortController = null;
let lastUpdateId = 0;

/**
 * Sends a message to a Telegram chat via Bot API
 */
function sendTelegramMessage({ botToken, chatId, text, parseMode = 'HTML' }) {
    return new Promise((resolve) => {
        const token = (botToken || "").trim();
        const targetChatId = (chatId || "").trim();

        if (!token || !targetChatId) {
            return resolve({ success: false, error: 'Telegram bot token or chat ID is missing.' });
        }

        try {
            const payload = JSON.stringify({
                chat_id: targetChatId,
                text,
                parse_mode: parseMode,
                disable_web_page_preview: true
            });

            const req = https.request({
                hostname: 'api.telegram.org',
                port: 443,
                path: `/bot${token}/sendMessage`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                },
                timeout: 10000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve({ success: parsed.ok === true, data: parsed });
                    } catch (e) {
                        resolve({ success: false, error: 'Invalid response from Telegram API' });
                    }
                });
            });

            req.on('error', (err) => {
                resolve({ success: false, error: err.message });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({ success: false, error: 'Telegram API request timed out' });
            });

            req.write(payload);
            req.end();
        } catch (err) {
            resolve({ success: false, error: err.message });
        }
    });
}

// In-memory anti-spam cooldown cache for Telegram alerts (key -> timestamp)
const securityAlertCooldowns = new Map();

// Cooldown intervals by severity level
const ALERT_COOLDOWNS_MS = {
    critical: 1 * 60 * 1000, // 1 minute cooldown for critical events
    error: 1.5 * 60 * 1000,  // 1.5 minutes cooldown for errors
    alarm: 2 * 60 * 1000,    // 2 minutes cooldown for security alarms
    warning: 3 * 60 * 1000   // 3 minutes cooldown for warnings
};

/**
 * Sends an automated Telegram alert notification for critical events, warnings, errors, and alarms
 */
async function sendEventAlertTelegram({ level = 'alarm', ip, endpoint, reason, details }) {
    const normLevel = (level || 'alarm').toLowerCase();
    const cooldownMs = ALERT_COOLDOWNS_MS[normLevel] || (2 * 60 * 1000);

    // Form unique deduplication key: severity:ip:endpoint:reasonPrefix
    const cleanReason = String(reason || '').trim();
    const reasonSnippet = cleanReason.replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    const key = `${normLevel}:${ip || 'server'}:${endpoint || 'general'}:${reasonSnippet}`;

    const now = Date.now();
    const lastAlert = securityAlertCooldowns.get(key) || 0;

    // Suppress notification if already alerted within cooldown window
    if (now - lastAlert < cooldownMs) {
        return { success: false, throttled: true, reason: 'Suppressed by alert cooldown' };
    }
    securityAlertCooldowns.set(key, now);

    // Evict expired entries to avoid memory leak
    if (securityAlertCooldowns.size > 500) {
        for (const [k, timestamp] of securityAlertCooldowns.entries()) {
            if (now - timestamp > 5 * 60 * 1000) securityAlertCooldowns.delete(k);
        }
    }

    let headerBadge = '<b>SECURITY ALARM TRIGGERED</b>';
    if (normLevel === 'critical') {
        headerBadge = '<b>CRITICAL SERVER EVENT</b>';
    } else if (normLevel === 'error') {
        headerBadge = '<b>SERVER ERROR DETECTED</b>';
    } else if (normLevel === 'warning') {
        headerBadge = '<b>SYSTEM WARNING DETECTED</b>';
    }

    const timeStr = new Date(now).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const formattedIp = ip ? `<code>${ip}</code>` : '<i>System / Internal</i>';
    const formattedEndpoint = endpoint ? `<code>${endpoint}</code>` : '<i>N/A</i>';

    const text = `${headerBadge}\n\n` +
        `<b>Severity:</b> <code>#${normLevel.toUpperCase()}</code>\n` +
        `<b>Event:</b> ${cleanReason || 'System event recorded'}\n` +
        `<b>Client IP:</b> ${formattedIp}\n` +
        `<b>Target Endpoint:</b> ${formattedEndpoint}\n` +
        `<b>Timestamp:</b> ${timeStr}\n` +
        (details ? `<b>Details:</b> ${details}\n` : '') +
        `\nLogbook Security & Server Monitor`;

    const token = (process.env.SERVER_TELEGRAM_BOT_TOKEN).trim();
    const chatId = (process.env.SERVER_TELEGRAM_BOT_CHAT_ID).trim();

    return sendTelegramMessage({
        botToken: token,
        chatId: chatId,
        text,
        parseMode: 'HTML'
    });
}

/**
 * Backwards-compatible security alert wrapper
 */
async function sendSecurityAlertTelegram(params) {
    return sendEventAlertTelegram({ level: 'alarm', ...params });
}

/**
 * Publishes or creates a new Developer Note from Telegram
 */
async function publishDeveloperNote({ title, message, badge, version, actionUrl, actionText, author = 'Telegram Admin' }) {
    const now = Date.now();
    const yyyymmdd = new Date(now).toISOString().slice(0, 10).replace(/-/g, '');
    const noteId = `note_${yyyymmdd}_tg_${Math.random().toString(36).substring(2, 6)}`;

    // Set all existing active notes to inactive so this new one becomes the single active note
    const existingNotes = await developerNotesDb.find({});
    for (const note of existingNotes) {
        if (note.isActive) {
            await developerNotesDb.update({ _id: note._id }, { $set: { isActive: false, updatedAt: now } });
        }
    }

    const noteDoc = {
        _id: noteId,
        id: noteId,
        title: String(title).trim(),
        message: String(message).trim(),
        date: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        version: version ? String(version).trim() : null,
        badge: badge ? String(badge).trim() : 'Announcement',
        actionUrl: actionUrl ? String(actionUrl).trim() : null,
        actionText: actionText ? String(actionText).trim() : (actionUrl ? 'Read More' : null),
        isActive: true,
        source: 'telegram_bot',
        author: author,
        createdAt: now,
        updatedAt: now
    };

    await developerNotesDb.insert(noteDoc);
    developerNotesDb.compactDatafile();

    logServerEvent('info', `[TELEGRAM BOT] New developer note published by ${author}: '${noteDoc.title}'`);
    return noteDoc;
}

/**
 * Toggles or sets active status of developer notes
 */
async function setDeveloperNoteStatus(active) {
    const now = Date.now();
    const existing = (await developerNotesDb.find({}))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (!existing || existing.length === 0) {
        return { success: false, message: 'No developer notes found in database.' };
    }

    if (!active) {
        // Disable all active notes
        let disabledCount = 0;
        for (const note of existing) {
            if (note.isActive) {
                await developerNotesDb.update({ _id: note._id }, { $set: { isActive: false, updatedAt: now } });
                disabledCount++;
            }
        }
        developerNotesDb.compactDatafile();
        logServerEvent('info', `[TELEGRAM BOT] All developer notes disabled via Telegram.`);
        return { success: true, count: disabledCount, status: 'disabled' };
    } else {
        // Activate the latest note
        const latest = existing[0];
        await developerNotesDb.update({ _id: latest._id }, { $set: { isActive: true, updatedAt: now } });
        developerNotesDb.compactDatafile();
        logServerEvent('info', `[TELEGRAM BOT] Developer note '${latest.title}' enabled via Telegram.`);
        return { success: true, note: latest, status: 'enabled' };
    }
}

/**
 * Retrieves the currently active developer note
 */
async function getActiveDeveloperNote() {
    const notes = await developerNotesDb.find({});
    const active = notes
        .filter(n => n.isActive === true || n.isActive === 'true' || n.isActive === undefined)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return active[0] || null;
}

/**
 * Parses user command / message text into note fields
 */
function parseDevNoteCommand(rawText, isPrivateChat = false) {
    if (!rawText || typeof rawText !== 'string') return null;

    let text = rawText.trim();
    if (!text) return null;

    const lowerText = text.toLowerCase();

    // Check for /start or help commands
    if (lowerText === '/start' || lowerText === '/help' || lowerText === 'help' || lowerText === '?') {
        return { type: 'HELP' };
    }

    // Check for explicit commands with triggers: /devnote, #devnote, devnote:, /note
    const triggerRegex = /^(\/devnote|#devnote|devnote:|\/note)\s*/i;
    let payload = '';

    if (triggerRegex.test(text)) {
        payload = text.replace(triggerRegex, '').trim();
    } else if (isPrivateChat || text.includes('|') || lowerText.startsWith('title:') || lowerText.startsWith('/status') || lowerText.startsWith('/off') || lowerText.startsWith('/on')) {
        payload = text;
    } else {
        return null;
    }

    // Check for sub-commands
    const lowerPayload = payload.toLowerCase();
    if (!payload || lowerPayload === 'status' || lowerPayload === '/status' || lowerPayload === 'info' || lowerPayload === 'show') {
        return { type: 'STATUS' };
    }
    if (lowerPayload === 'off' || lowerPayload === '/off' || lowerPayload === 'disable' || lowerPayload === 'hide' || lowerPayload === 'stop') {
        return { type: 'DISABLE' };
    }
    if (lowerPayload === 'on' || lowerPayload === '/on' || lowerPayload === 'enable' || lowerPayload === 'start') {
        return { type: 'ENABLE' };
    }
    if (lowerPayload === 'help' || lowerPayload === '/help' || lowerPayload === '?') {
        return { type: 'HELP' };
    }

    // Format A: Multiline Key: Value format
    if (payload.includes('\n') && (payload.toLowerCase().includes('title:') || payload.toLowerCase().includes('message:'))) {
        const lines = payload.split('\n');
        const data = {};
        for (const line of lines) {
            const colonIdx = line.indexOf(':');
            if (colonIdx > 0) {
                const key = line.slice(0, colonIdx).trim().toLowerCase();
                const val = line.slice(colonIdx + 1).trim();
                if (key === 'title') data.title = val;
                else if (key === 'message' || key === 'msg' || key === 'desc') data.message = val;
                else if (key === 'badge' || key === 'tag') data.badge = val;
                else if (key === 'version' || key === 'ver') data.version = val;
                else if (key === 'url' || key === 'actionurl' || key === 'link') data.actionUrl = val;
                else if (key === 'actiontext' || key === 'action') data.actionText = val;
            }
        }
        if (data.title && data.message) {
            return { type: 'CREATE', ...data };
        }
    }

    // Format B: Pipe-delimited: Title | Message | Badge | ActionUrl
    if (payload.includes('|')) {
        const parts = payload.split('|').map(p => p.trim());
        const title = parts[0];
        const message = parts[1];
        const badge = parts[2] || 'Announcement';
        const actionUrl = parts[3] || null;

        if (title && message) {
            return {
                type: 'CREATE',
                title,
                message,
                badge,
                actionUrl
            };
        }
    }

    // Format C: Single line with dash: Title - Message
    if (payload.includes(' - ')) {
        const [title, ...rest] = payload.split(' - ');
        return {
            type: 'CREATE',
            title: title.trim(),
            message: rest.join(' - ').trim(),
            badge: 'Announcement'
        };
    }

    // Format D: Plain sentence or announcement
    return {
        type: 'CREATE',
        title: payload.length > 50 ? payload.substring(0, 47) + '...' : payload,
        message: payload,
        badge: 'Announcement'
    };
}

/**
 * Handles an incoming Telegram update (from Webhook or Long-Polling)
 */
async function handleTelegramUpdate(update) {
    if (!update || typeof update !== 'object') {
        return { handled: false, reason: 'Empty update' };
    }

    const message = update.message || update.edited_message || update.channel_post;
    if (!message || !message.text) {
        return { handled: false, reason: 'No text message' };
    }

    const chatId = String(message.chat?.id || '');
    const sender = message.from?.username || message.from?.first_name || 'Admin';
    const text = message.text.trim();
    const isPrivateChat = message.chat?.type === 'private';

    const devnoteBotToken = (process.env.DEVNOTE_TELEGRAM_BOT_TOKEN || '').trim();
    const authorizedChatId = String(process.env.DEVNOTE_TELEGRAM_BOT_CHAT_ID || '').trim();
    const adminChatIds = (process.env.TELEGRAM_ADMIN_CHAT_IDS || '')
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);

    const isAuthorized = !authorizedChatId ||
        chatId === authorizedChatId ||
        isPrivateChat ||
        adminChatIds.includes(chatId) ||
        (message.from && adminChatIds.includes(String(message.from.id)));

    // Parse command with private chat awareness
    const parsed = parseDevNoteCommand(text, isPrivateChat);
    if (!parsed) {
        return { handled: false, reason: 'Not a recognized devnote command' };
    }

    // If unauthorized, send refusal via Developer Note Bot
    if (!isAuthorized) {
        await sendTelegramMessage({
            botToken: devnoteBotToken,
            chatId,
            text: `⛔ <b>Access Denied</b>\n\nYour Telegram Chat ID <code>${chatId}</code> is not authorized to publish Developer Notes on this server.`
        });
        return { handled: true, success: false, reason: 'Unauthorized chat' };
    }

    // Execute requested command
    if (parsed.type === 'HELP') {
        const helpText =
            `📢 <b>Logbook Developer Note Bot</b>\n\n` +
            `Send me announcements and updates to publish them directly into <code>server_developer_notes.json</code> for all app & web users!\n\n` +
            `<b>Supported Formats:</b>\n` +
            `1️⃣ <b>Pipe Format:</b>\n` +
            `<code>Title | Message | Badge (optional) | Link (optional)</code>\n` +
            `<i>Example:</i> <code>Scheduled Maintenance | Server restart at 11 PM UTC | Maintenance</code>\n\n` +
            `2️⃣ <b>Multiline Format:</b>\n` +
            `<code>Title: System Upgrade\nMessage: Performance optimizations deployed.\nBadge: Update</code>\n\n` +
            `3️⃣ <b>Commands:</b>\n` +
            `• <code>/status</code> - View current live note\n` +
            `• <code>/off</code> - Turn off active note\n` +
            `• <code>/on</code> - Re-enable previous note\n` +
            `• <code>/help</code> - Show this guide\n\n` +
            `<i>All published notes are immediately saved to <code>server_developer_notes.json</code> and live on <code>/api/developer-note</code>.</i>`;

        await sendTelegramMessage({ botToken: devnoteBotToken, chatId, text: helpText });
        return { handled: true, success: true, command: 'HELP' };
    }

    if (parsed.type === 'STATUS') {
        const active = await getActiveDeveloperNote();
        if (!active) {
            await sendTelegramMessage({
                botToken: devnoteBotToken,
                chatId,
                text: `<b>Developer Note Status:</b> <b>No Active Note</b>\n\n` +
                    `There is currently no active announcement displayed to app users.\n\n` +
                    `To publish one, send:\n<code>/devnote Your Title | Your Message</code>`
            });
        } else {
            const statusText =
                `📢 <b>Active Developer Note</b>\n\n` +
                `<b>Title:</b> ${active.title}\n` +
                `<b>Message:</b> ${active.message}\n` +
                `<b>Badge:</b> ${active.badge || 'Announcement'}\n` +
                `<b>Date:</b> ${active.date}\n` +
                (active.actionUrl ? `<b>Action:</b> <a href="${active.actionUrl}">${active.actionText || 'Read More'}</a>\n` : '') +
                `<b>Status:</b> 🟢 Active & Visible in App\n\n` +
                `<i>To turn it off, send <code>/devnote off</code></i>`;
            await sendTelegramMessage({ botToken: devnoteBotToken, chatId, text: statusText });
        }
        return { handled: true, success: true, command: 'STATUS' };
    }

    if (parsed.type === 'DISABLE') {
        const res = await setDeveloperNoteStatus(false);
        await sendTelegramMessage({
            botToken: devnoteBotToken,
            chatId,
            text: `⏸️ <b>Developer Note Disabled</b>\n\n` +
                `The active developer note has been hidden. Clients requesting <code>/api/developer-note</code> will receive no active banner.\n\n` +
                `<i>Send <code>/devnote on</code> to restore or <code>/devnote Title | Message</code> to set a new one.</i>`
        });
        return { handled: true, success: true, command: 'DISABLE', count: res.count };
    }

    if (parsed.type === 'ENABLE') {
        const res = await setDeveloperNoteStatus(true);
        if (res.success && res.note) {
            await sendTelegramMessage({
                botToken: devnoteBotToken,
                chatId,
                text: `▶️ <b>Developer Note Re-enabled</b>\n\n` +
                    `<b>Title:</b> ${res.note.title}\n` +
                    `<b>Status:</b> 🟢 Live on /api/developer-note`
            });
        } else {
            await sendTelegramMessage({
                botToken: devnoteBotToken,
                chatId,
                text: `⚠️ <b>Unable to enable note:</b> ${res.message || 'No prior notes found in database.'}`
            });
        }
        return { handled: true, success: res.success, command: 'ENABLE' };
    }

    if (parsed.type === 'CREATE') {
        try {
            const note = await publishDeveloperNote({
                title: parsed.title,
                message: parsed.message,
                badge: parsed.badge || 'Announcement',
                version: parsed.version || null,
                actionUrl: parsed.actionUrl || null,
                actionText: parsed.actionText || (parsed.actionUrl ? 'Read More' : null),
                author: `@${sender}`
            });

            const confirmation =
                `✅ <b>Developer Note Published Successfully!</b>\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `📌 <b>Title:</b> ${note.title}\n` +
                `💬 <b>Message:</b> ${note.message}\n` +
                `🏷️ <b>Badge:</b> ${note.badge}\n` +
                `📅 <b>Date:</b> ${note.date}\n` +
                (note.actionUrl ? `🔗 <b>Link:</b> <a href="${note.actionUrl}">${note.actionText || 'Read More'}</a>\n` : '') +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `🟢 <b>Live Status:</b> Broadcasted to Android App & Web Vault via <code>/api/developer-note</code>.\n\n` +
                `<i>Send <code>/devnote off</code> anytime to turn it off.</i>`;

            await sendTelegramMessage({ botToken: devnoteBotToken, chatId, text: confirmation });
            return { handled: true, success: true, command: 'CREATE', note };
        } catch (err) {
            await sendTelegramMessage({
                botToken: devnoteBotToken,
                chatId,
                text: `❌ <b>Error Publishing Note:</b> ${err.message}`
            });
            return { handled: true, success: false, error: err.message };
        }
    }

    return { handled: false, reason: 'Unknown command' };
}

/**
 * Long-polling worker for local testing / servers without public webhooks
 */
async function startTelegramPolling({ botToken, pollIntervalMs = 3000 } = {}) {
    const token = (botToken || process.env.DEVNOTE_TELEGRAM_BOT_TOKEN || '').trim();
    if (!token) {
        logServerEvent('warning', '[TELEGRAM BOT] Polling not started: DEVNOTE_TELEGRAM_BOT_TOKEN is not configured.');
        return;
    }

    if (isPollingActive) {
        logServerEvent('info', '[TELEGRAM BOT] Polling is already running.');
        return;
    }

    isPollingActive = true;
    logServerEvent('info', '[TELEGRAM BOT] Telegram bot background polling listener started.');

    const poll = async () => {
        if (!isPollingActive) return;

        try {
            const url = `/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=15`;
            const req = https.request({
                hostname: 'api.telegram.org',
                port: 443,
                path: url,
                method: 'GET',
                timeout: 25000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', async () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.ok && Array.isArray(parsed.result)) {
                            for (const update of parsed.result) {
                                if (update.update_id >= lastUpdateId) {
                                    lastUpdateId = update.update_id;
                                }
                                await handleTelegramUpdate(update);
                            }
                        }
                    } catch (e) { }

                    if (isPollingActive) {
                        setTimeout(poll, pollIntervalMs);
                    }
                });
            });

            req.on('error', () => {
                if (isPollingActive) setTimeout(poll, pollIntervalMs * 2);
            });

            req.on('timeout', () => {
                req.destroy();
                if (isPollingActive) setTimeout(poll, pollIntervalMs);
            });

            req.end();
        } catch (err) {
            if (isPollingActive) setTimeout(poll, pollIntervalMs * 2);
        }
    };

    poll();
}

/**
 * Stops background polling
 */
function stopTelegramPolling() {
    isPollingActive = false;
    logServerEvent('info', '[TELEGRAM BOT] Polling listener stopped.');
}

module.exports = {
    sendTelegramMessage,
    sendEventAlertTelegram,
    sendSecurityAlertTelegram,
    publishDeveloperNote,
    setDeveloperNoteStatus,
    getActiveDeveloperNote,
    parseDevNoteCommand,
    handleTelegramUpdate,
    startTelegramPolling,
    stopTelegramPolling
};
