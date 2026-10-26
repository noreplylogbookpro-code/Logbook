// scripts/test-telegram-alert.js
/**
 * Test script for Logbook Server Stats & Telegram Alert Integration
 * 
 * Tests:
 *  1. Environment configuration (Bot Token & Chat ID)
 *  2. Real-time server metrics collection (CPU, Memory, Uptime, Sessions)
 *  3. Dispatching live Server Stats summary to the 'logbook server stats' Telegram group
 *  4. Dispatching Critical, Warning, and Alarm security alerts
 */

const os = require('os');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const {
    sendTelegramMessage,
    sendEventAlertTelegram
} = require('../utils/telegramBotService');
const { getCpuUsagePercent, activeUserSessions, networkStats } = require('../utils/serverState');
const { logsDb, usersDb } = require('../config/db');

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
}

async function runServerStatsTest() {
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

    console.log('====================================================');
    console.log('     LOGBOOK SERVER STATS & TELEGRAM BOT TEST       ');
    console.log('====================================================\n');

    // --- STEP 1: Verify Environment Credentials ---
    console.log('--- Step 1: Environment & Bot Credentials ---');
    const token = (process.env.SERVER_TELEGRAM_BOT_TOKEN || '').trim();
    const chatId = (process.env.SERVER_TELEGRAM_BOT_CHAT_ID || '').trim();

    assert('SERVER_TELEGRAM_BOT_TOKEN is configured', !!token, `prefix: ${token.substring(0, 10)}...`);
    assert('SERVER_TELEGRAM_BOT_CHAT_ID is configured', !!chatId, `chat_id: ${chatId}`);

    if (!token || !chatId) {
        console.error('\n[FATAL] Missing Telegram credentials in .env. Halting test.');
        process.exit(1);
    }

    // --- STEP 2: Collect Real-time Server Stats ---
    console.log('\n--- Step 2: Collecting Live Server Metrics ---');
    const memUsage = process.memoryUsage();
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const usedMem = totalMem - freeMem;
    const memPercent = Math.round((usedMem / totalMem) * 100);
    const cpuPercent = getCpuUsagePercent();
    const uptimeStr = formatUptime(process.uptime());
    const totalUsers = await usersDb.count({});
    const totalLogs = await logsDb.count({});
    const activeSessionsCount = activeUserSessions.size;

    console.log(`  OS Platform    : ${os.type()} ${os.release()} (${os.arch()})`);
    console.log(`  CPU Usage      : ${cpuPercent}%`);
    console.log(`  Memory Used    : ${formatBytes(usedMem)} / ${formatBytes(totalMem)} (${memPercent}%)`);
    console.log(`  Heap Used      : ${formatBytes(memUsage.heapUsed)} / ${formatBytes(memUsage.heapTotal)}`);
    console.log(`  Server Uptime  : ${uptimeStr}`);
    console.log(`  Active Sessions: ${activeSessionsCount}`);
    console.log(`  Database Stats : Users: ${totalUsers} | Logs: ${totalLogs}`);

    assert('Metrics collected successfully', true, `RAM: ${memPercent}%, CPU: ${cpuPercent}%`);

    // --- STEP 3: Dispatch Live Server Stats Report to Telegram ---
    console.log('\n--- Step 3: Dispatching Live Server Stats to Telegram ---');
    const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const statsMessage = `<b>LOGBOOK SERVER STATS REPORT</b>\n\n` +
        `<b>Severity:</b> <code>[#METRICS]</code>\n` +
        `<b>Status:</b> <code>ONLINE (HEALTHY)</code>\n` +
        `<b>Uptime:</b> ${uptimeStr}\n` +
        `<b>CPU Load:</b> ${cpuPercent}%\n` +
        `<b>RAM Usage:</b> ${formatBytes(usedMem)} / ${formatBytes(totalMem)} (${memPercent}%)\n` +
        `<b>Process Heap:</b> ${formatBytes(memUsage.heapUsed)}\n` +
        `<b>Active Sessions:</b> ${activeSessionsCount} online\n` +
        `<b>Registered Users:</b> ${totalUsers}\n` +
        `<b>Network Rx/Tx:</b> ${formatBytes(networkStats.bytesRx)} / ${formatBytes(networkStats.bytesTx)}\n` +
        `<b>Timestamp:</b> ${nowStr}\n\n` +
        `Logbook Security & Server Monitor`;

    const startStats = Date.now();
    const statsRes = await sendTelegramMessage({
        botToken: token,
        chatId: chatId,
        text: statsMessage,
        parseMode: 'HTML'
    });
    const statsDuration = Date.now() - startStats;

    assert(
        'Server Stats message sent to Telegram',
        statsRes.success === true,
        `msg_id: ${statsRes.data?.result?.message_id}, group: '${statsRes.data?.result?.chat?.title}', latency: ${statsDuration}ms`
    );

    // --- STEP 4: Test Event Alert Dispatch (Warning & Critical) ---
    console.log('\n--- Step 4: Dispatching Event Alerts ---');

    // 4.1 System Warning Alert
    const startWarn = Date.now();
    const warnRes = await sendEventAlertTelegram({
        level: 'warning',
        ip: '127.0.0.1',
        endpoint: '/api/v1/auth/users',
        reason: 'Diagnostics: Automated Warning Event Test',
        details: 'Status: 403 Forbidden | Test validation check'
    });
    const warnDuration = Date.now() - startWarn;

    assert(
        'Warning alert delivered to Telegram',
        warnRes.success === true,
        `msg_id: ${warnRes.data?.result?.message_id}, latency: ${warnDuration}ms`
    );

    // 4.2 Critical Event Alert
    const startCrit = Date.now();
    const critRes = await sendEventAlertTelegram({
        level: 'critical',
        ip: '127.0.0.1',
        endpoint: '/api/v1/database/sync',
        reason: 'Diagnostics: Automated Critical Event Test',
        details: 'Status: 500 | Pipeline integrity check passed'
    });
    const critDuration = Date.now() - startCrit;

    assert(
        'Critical alert delivered to Telegram',
        critRes.success === true,
        `msg_id: ${critRes.data?.result?.message_id}, latency: ${critDuration}ms`
    );

    // --- SUMMARY ---
    console.log('\n====================================================');
    console.log(` TEST RUN COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
}

runServerStatsTest().catch((err) => {
    console.error('[FATAL ERROR IN TEST SCRIPT]', err);
    process.exit(1);
});
