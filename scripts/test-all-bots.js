// scripts/test-all-bots.js
require('dotenv').config();
const { sendTelegramMessage } = require('../utils/telegramBotService');
const https = require('https');

async function testBot(name, token, chatId) {
    console.log(`\n--- Testing ${name} Bot ---`);
    console.log(`Token: ${token ? token.substring(0, 10) + '...' : 'MISSING'}`);
    console.log(`Chat ID: ${chatId || 'MISSING'}`);

    if (!token) {
        console.log(`[SKIP] ${name} token is missing.`);
        return;
    }

    // 1. Test getMe
    await new Promise((resolve) => {
        https.get(`https://api.telegram.org/bot${token}/getMe`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`getMe response (${res.statusCode}):`, data);
                resolve();
            });
        }).on('error', (e) => {
            console.error(`getMe network error:`, e.message);
            resolve();
        });
    });

    if (!chatId) {
        console.log(`[SKIP] ${name} chatId is missing.`);
        return;
    }

    // 2. Test sending a message
    const res = await sendTelegramMessage({
        botToken: token,
        chatId: chatId,
        text: `🤖 <b>[Test Alert]</b> ${name} Bot is online and functional! Time: ${new Date().toLocaleTimeString()}`,
        parseMode: 'HTML'
    });
    console.log(`sendMessage result:`, res);
}

(async () => {
    await testBot('HELPDESK', process.env.HELPDESK_TELEGRAM_BOT_TOKEN, process.env.HELPDESK_TELEGRAM_BOT_CHAT_ID);
    await testBot('DEVNOTE', process.env.DEVNOTE_TELEGRAM_BOT_TOKEN, process.env.DEVNOTE_TELEGRAM_BOT_CHAT_ID);
    await testBot('SERVER', process.env.SERVER_TELEGRAM_BOT_TOKEN, process.env.SERVER_TELEGRAM_BOT_CHAT_ID);
})();
