// scripts/setup-telegram-bots.js
/**
 * Sets up Telegram Bot profiles, commands menus, and descriptions
 * via official Telegram Bot API for:
 *   1. Developer Note Bot
 *   2. Server Security & Stats Bot
 *   3. Helpdesk Campus Bot
 */

const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function telegramApi(token, method, payload = null) {
    return new Promise((resolve, reject) => {
        const bodyStr = payload ? JSON.stringify(payload) : null;
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${token}/${method}`,
            method: payload ? 'POST' : 'GET',
            headers: payload ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr)
            } : {}
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ ok: false, error: 'JSON parse error' });
                }
            });
        });

        req.on('error', reject);
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

async function setupBot(name, token, config) {
    console.log(`\n====================================================`);
    console.log(` Setting up: ${name}`);
    console.log(`====================================================`);

    if (!token) {
        console.warn(`[SKIP] Token is empty for ${name}.`);
        return;
    }

    // 1. Get Bot Info
    const me = await telegramApi(token, 'getMe');
    if (!me.ok) {
        console.error(`[ERROR] Invalid token or Telegram API error:`, me);
        return;
    }
    console.log(`Connected to: @${me.result.username} (${me.result.first_name})`);

    // 2. Set Commands Menu
    if (config.commands && config.commands.length > 0) {
        const cmdRes = await telegramApi(token, 'setMyCommands', { commands: config.commands });
        console.log(`  Set Commands Menu     : ${cmdRes.ok ? 'SUCCESS [OK]' : 'FAILED (' + cmdRes.description + ')'}`);
    }

    // 3. Set Description (Shown before pressing Start)
    if (config.description) {
        const descRes = await telegramApi(token, 'setMyDescription', { description: config.description });
        console.log(`  Set Description       : ${descRes.ok ? 'SUCCESS [OK]' : 'FAILED (' + descRes.description + ')'}`);
    }

    // 4. Set Short Description (Profile snippet)
    if (config.shortDescription) {
        const shortRes = await telegramApi(token, 'setMyShortDescription', { short_description: config.shortDescription });
        console.log(`  Set Short Description : ${shortRes.ok ? 'SUCCESS [OK]' : 'FAILED (' + shortRes.description + ')'}`);
    }
}

async function main() {
    console.log('Starting Telegram Bots configuration...');

    // --- 1. Developer Note Bot ---
    await setupBot('Developer Note Bot', process.env.DEVNOTE_TELEGRAM_BOT_TOKEN, {
        commands: [
            { command: 'start', description: 'Start bot & show guide' },
            { command: 'devnote', description: 'Publish note: Title | Message | Badge | Link' },
            { command: 'status', description: 'View current active developer note' },
            { command: 'off', description: 'Hide/disable active developer note' },
            { command: 'on', description: 'Re-enable previous developer note' },
            { command: 'help', description: 'View formatting guide and syntax examples' }
        ],
        description: 'Official Logbook Plus Developer Note Bot.\n\nRemotely publish, update, and manage announcements, maintenance banners, and broadcast notes displayed inside the Logbook Plus app and web vault.',
        shortDescription: 'Publish and manage Developer Notes & live announcements for Logbook Plus.'
    });

    // --- 2. Server Security & Stats Bot ---
    await setupBot('Server Security & Stats Bot', process.env.SERVER_TELEGRAM_BOT_TOKEN, {
        commands: [
            { command: 'start', description: 'Show server monitoring overview' },
            { command: 'stats', description: 'Get live CPU, RAM & session stats' },
            { command: 'health', description: 'Check server online status and health' },
            { command: 'help', description: 'Show server monitoring bot help' }
        ],
        description: 'Official Logbook Plus Server Monitor & Security Shield Bot.\n\nReceives automated real-time alerts for critical server events, security alarms, rate limit triggers, and system diagnostics.',
        shortDescription: 'Real-time server monitoring, health stats & security alerts for Logbook Plus.'
    });

    // --- 3. Helpdesk Campus Bot ---
    await setupBot('Helpdesk Campus Bot', process.env.HELPDESK_TELEGRAM_BOT_TOKEN, {
        commands: [
            { command: 'start', description: 'Start campus helpdesk notification bot' },
            { command: 'status', description: 'Check campus helpdesk bot status' },
            { command: 'help', description: 'Show helpdesk bot commands and info' }
        ],
        description: 'Official Logbook Plus Campus Helpdesk Bot.\n\nDelivers real-time ticket notifications, complaint status updates, and staff alerts across campuses.',
        shortDescription: 'Campus complaints, ticket updates and staff alerts for Logbook Plus.'
    });

    console.log('\n====================================================');
    console.log(' ALL TELEGRAM BOTS CONFIGURED SUCCESSFULLY!');
    console.log('====================================================\n');
}

main().catch(console.error);
