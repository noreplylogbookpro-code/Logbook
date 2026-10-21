// scripts/test-telegram-devnote.js
const http = require('http');
const express = require('express');
const { developerNotesDb } = require('../config/db');
const {
    parseDevNoteCommand,
    handleTelegramUpdate,
    getActiveDeveloperNote
} = require('../utils/telegramBotService');

const apiRouter = require('../api');

function runTest() {
    let passed = 0;
    let failed = 0;

    function assert(desc, condition, details = '') {
        if (condition) {
            console.log(`  \x1b[32m[PASS]\x1b[0m ${desc} ${details ? '(' + details + ')' : ''}`);
            passed++;
        } else {
            console.error(`  \x1b[31m[FAIL]\x1b[0m ${desc} ${details ? '- ' + details : ''}`);
            failed++;
        }
    }

    return new Promise(async (resolve) => {
        console.log('====================================================');
        console.log('    TELEGRAM BOT DEVELOPER NOTE INTEGRATION TESTS   ');
        console.log('====================================================\n');

        // Setup test Express server
        const app = express();
        app.use(express.json());
        app.use('/api', apiRouter);

        const server = http.createServer(app);
        await new Promise(r => server.listen(0, '127.0.0.1', r));
        const port = server.address().port;
        const baseUrl = `http://127.0.0.1:${port}/api`;

        function request(method, path, body = null, headers = {}) {
            return new Promise((res, rej) => {
                const url = new URL(`${baseUrl}${path}`);
                const req = http.request({
                    hostname: url.hostname,
                    port: url.port,
                    path: url.pathname + url.search,
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers
                    }
                }, (resp) => {
                    let data = '';
                    resp.on('data', chunk => data += chunk);
                    resp.on('end', () => {
                        try {
                            res({ status: resp.statusCode, body: JSON.parse(data), headers: resp.headers });
                        } catch (e) {
                            res({ status: resp.statusCode, body: data, headers: resp.headers });
                        }
                    });
                });
                req.on('error', rej);
                if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
                req.end();
            });
        }

        // Save original note for cleanup
        const originalNotes = await developerNotesDb.find({});

        try {
            // --- SUITE 1: Command Parser Tests ---
            console.log('--- SUITE 1: Predefined Command Parsing ---');

            const p1 = parseDevNoteCommand('/devnote Security Patch v2.18 | All users must re-sync their vaults | Urgent | https://logbookplus.co.in');
            assert('Parses pipe syntax with title, message, badge & URL',
                p1 && p1.type === 'CREATE' && p1.title === 'Security Patch v2.18' && p1.badge === 'Urgent' && p1.actionUrl === 'https://logbookplus.co.in'
            );

            const p2 = parseDevNoteCommand('/devnote\nTitle: Scheduled Backup\nMessage: System upgrade tonight\nBadge: Maintenance');
            assert('Parses multiline Key: Value syntax',
                p2 && p2.type === 'CREATE' && p2.title === 'Scheduled Backup' && p2.message === 'System upgrade tonight' && p2.badge === 'Maintenance'
            );

            const p3 = parseDevNoteCommand('/devnote status');
            assert('Parses /devnote status command', p3 && p3.type === 'STATUS');

            const p4 = parseDevNoteCommand('/devnote off');
            assert('Parses /devnote off (disable) command', p4 && p4.type === 'DISABLE');

            const p5 = parseDevNoteCommand('/devnote on');
            assert('Parses /devnote on (enable) command', p5 && p5.type === 'ENABLE');

            const p6 = parseDevNoteCommand('/devnote help');
            assert('Parses /devnote help command', p6 && p6.type === 'HELP');

            const p7 = parseDevNoteCommand('#devnote Simple Title | Simple Message');
            assert('Parses hashtag trigger (#devnote)', p7 && p7.type === 'CREATE' && p7.title === 'Simple Title');

            const p8 = parseDevNoteCommand('random unrelated text');
            assert('Ignores non-devnote messages', p8 === null);

            // --- SUITE 2: Developer Note Creation via Telegram Update ---
            console.log('\n--- SUITE 2: Publish Developer Note via Telegram ---');

            const testChatId = String(process.env.DEVNOTE_TELEGRAM_BOT_CHAT_ID || process.env.DEFAULT_TELEGRAM_BOT_CHAT_ID || '-5159643473');
            const telegramUpdate = {
                update_id: 999901,
                message: {
                    message_id: 101,
                    from: { id: 1234567, username: 'testadmin', first_name: 'TestAdmin' },
                    chat: { id: testChatId, type: 'group', title: 'Test Admin Group' },
                    text: '/devnote Live Telegram Announcement | Broadcasted directly from bot to all app clients | Broadcast'
                }
            };

            const handleResult = await handleTelegramUpdate(telegramUpdate);
            assert('Telegram update handled successfully', handleResult && handleResult.handled && handleResult.success, `command: ${handleResult?.command}`);

            // Verify live client endpoint GET /api/developer-note
            const getRes = await request('GET', '/developer-note');
            assert('GET /api/developer-note reflects newly published note',
                getRes.status === 200 &&
                getRes.body.title === 'Live Telegram Announcement' &&
                getRes.body.badge === 'Broadcast',
                `title: "${getRes.body.title}"`
            );

            // --- SUITE 3: Disabling Note via Telegram (/devnote off) ---
            console.log('\n--- SUITE 3: Disable & Re-Enable Note via Telegram ---');

            const disableUpdate = {
                update_id: 999902,
                message: {
                    message_id: 102,
                    from: { id: 1234567, username: 'testadmin' },
                    chat: { id: testChatId, type: 'group' },
                    text: '/devnote off'
                }
            };

            const disableResult = await handleTelegramUpdate(disableUpdate);
            assert('Handled /devnote off', disableResult.handled && disableResult.command === 'DISABLE');

            const getAfterOff = await request('GET', '/developer-note');
            assert('GET /api/developer-note returns 404 when note is disabled', getAfterOff.status === 404);

            // Re-enable note
            const enableUpdate = {
                update_id: 999903,
                message: {
                    message_id: 103,
                    from: { id: 1234567, username: 'testadmin' },
                    chat: { id: testChatId, type: 'group' },
                    text: '/devnote on'
                }
            };

            const enableResult = await handleTelegramUpdate(enableUpdate);
            assert('Handled /devnote on', enableResult.handled && enableResult.command === 'ENABLE');

            const getAfterOn = await request('GET', '/developer-note');
            assert('GET /api/developer-note is restored to 200 OK', getAfterOn.status === 200 && getAfterOn.body.title === 'Live Telegram Announcement');

            // --- SUITE 4: Webhook HTTP Endpoint ---
            console.log('\n--- SUITE 4: Telegram Webhook HTTP Endpoint ---');

            const webhookRes = await request('POST', '/telegram/webhook', {
                update_id: 999904,
                message: {
                    message_id: 104,
                    from: { id: 1234567, username: 'webhookadmin' },
                    chat: { id: testChatId, type: 'group' },
                    text: '/devnote Webhook Announcement | Updated via HTTP POST webhook | Webhook'
                }
            });

            assert('POST /api/telegram/webhook returns { ok: true }', webhookRes.status === 200 && webhookRes.body.ok === true);

            const getWebhookNote = await request('GET', '/developer-note');
            assert('GET /api/developer-note shows note published through Webhook endpoint',
                getWebhookNote.status === 200 && getWebhookNote.body.title === 'Webhook Announcement'
            );

            // --- SUITE 5: Unauthorized Chat Protection ---
            console.log('\n--- SUITE 5: Security / Unauthorized Chat Protection ---');

            const unauthorizedUpdate = {
                update_id: 999905,
                message: {
                    message_id: 105,
                    from: { id: 987654321, username: 'hacker' },
                    chat: { id: '9999999999', type: 'private' },
                    text: '/devnote Hacked Note | Should not be accepted'
                }
            };

            const unauthResult = await handleTelegramUpdate(unauthorizedUpdate);
            assert('Rejects message from unauthorized Telegram chat ID',
                unauthResult.handled === true && unauthResult.success === false && unauthResult.reason === 'Unauthorized chat'
            );

            const checkUntouched = await request('GET', '/developer-note');
            assert('Developer note was NOT overwritten by unauthorized update',
                checkUntouched.body.title === 'Webhook Announcement'
            );

        } finally {
            // Restore original developer notes in database
            await developerNotesDb.remove({}, { multi: true });
            for (const n of originalNotes) {
                await developerNotesDb.insert(n);
            }
            developerNotesDb.compactDatafile();
            server.close();
        }

        console.log('\n====================================================');
        console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
        console.log('====================================================\n');
        resolve({ passed, failed });
    });
}

if (require.main === module) {
    runTest().then(r => process.exit(r.failed > 0 ? 1 : 0));
}

module.exports = runTest;
