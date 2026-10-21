const os = require('os');
require('dotenv').config({ quiet: true });

function parseQuotaLimit(val) {
    if (!val) return 100 * 1024 * 1024; // 100 MB default
    const n = parseInt(val, 10);
    return isNaN(n) ? 100 * 1024 * 1024 : n;
}

let serverConfig = {
    quotaLimit: parseQuotaLimit(process.env.QUOTA_LIMIT),
    signupsEnabled: true,
    licenseKey: process.env.LICENSE_KEY || ""
};

const activeUserSessions = new Map();
const networkStats = {
    totalRequests: 0,
    bytesRx: 0,
    bytesTx: 0
};
const networkEndpointStats = new Map();
const networkClientIpStats = new Map();
const networkMethodStats = { GET: 0, POST: 0, PUT: 0, DELETE: 0, OTHER: 0 };

let prevCpuTime = null;
function getCpuUsagePercent() {
    try {
        const cpus = os.cpus();
        if (!cpus || cpus.length === 0) return 0;
        let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
        for (let cpu of cpus) {
            user += cpu.times.user;
            nice += cpu.times.nice;
            sys += cpu.times.sys;
            idle += cpu.times.idle;
            irq += cpu.times.irq;
        }
        const total = user + nice + sys + idle + irq;
        if (!prevCpuTime) {
            prevCpuTime = { idle, total };
            return Math.min(100, Math.max(5, Math.floor((1 - idle / total) * 100)));
        }
        const idleDiff = idle - prevCpuTime.idle;
        const totalDiff = total - prevCpuTime.total;
        prevCpuTime = { idle, total };
        if (totalDiff === 0) return 0;
        return Math.min(100, Math.max(0, Math.round((1 - idleDiff / totalDiff) * 100)));
    } catch (e) {
        return 0;
    }
}

function extractUserFromLog(log) {
    if (!log) return null;
    if (log.metadata?.username && typeof log.metadata.username === 'string') {
        return log.metadata.username.trim().toLowerCase();
    }
    const msg = log.message || '';
    const userMatch = msg.match(/\(User:\s*([^\s)]+)\)/i) ||
                      msg.match(/User logged in.*?['"]([^'"]+)['"]/i) ||
                      msg.match(/User logged out.*?['"]([^'"]+)['"]/i) ||
                      msg.match(/for user\s*['"]([^'"]+)['"]/i);
    if (userMatch && userMatch[1]) {
        return userMatch[1].trim().toLowerCase();
    }
    return null;
}

function isLogoutLog(log) {
    if (!log) return false;
    if (log.metadata?.isLogout === true) return true;
    const url = log.metadata?.url || '';
    if (url.includes('/logout')) return true;
    const msg = log.message || '';
    if (/user logged out/i.test(msg) || /logged out successfully/i.test(msg)) return true;
    return false;
}

const loggedOutUsers = new Map(); // normalizedUser -> timestamp of logout

function markUserOffline(username, timestamp = Date.now()) {
    if (!username || typeof username !== 'string') return;
    const normalizedUser = username.trim().toLowerCase();
    if (!normalizedUser) return;
    const existing = loggedOutUsers.get(normalizedUser) || 0;
    loggedOutUsers.set(normalizedUser, Math.max(timestamp || Date.now(), existing));

    // Remove all sessions matching this user across all schools
    for (const [key, session] of activeUserSessions.entries()) {
        if (session.username && session.username.toLowerCase() === normalizedUser) {
            activeUserSessions.delete(key);
        }
    }
}

function isUserExplicitlyOffline(username, lastActivityTime = 0) {
    if (!username || typeof username !== 'string') return false;
    const normalizedUser = username.trim().toLowerCase();
    const logoutTime = loggedOutUsers.get(normalizedUser);
    if (!logoutTime) return false;
    return logoutTime >= (lastActivityTime || 0);
}

function recordUserActivity(username, role = 'USER', school = 'LOGBOOK', ip = '', timestamp = Date.now()) {
    if (!username || typeof username !== 'string') return;
    const normalizedUser = username.trim().toLowerCase();
    if (!normalizedUser) return;

    const logoutTime = loggedOutUsers.get(normalizedUser);
    if (logoutTime && timestamp <= logoutTime) {
        // Activity is older than or equal to logout, do not mark online
        return;
    }
    if (logoutTime && timestamp > logoutTime) {
        loggedOutUsers.delete(normalizedUser);
    }

    const normalizedSchool = (school || 'LOGBOOK').trim().toUpperCase();
    const key = `${normalizedUser}@${normalizedSchool}`;
    const existing = activeUserSessions.get(key);
    const lastActiveAt = Math.max(timestamp || Date.now(), existing?.lastActiveAt || 0);

    activeUserSessions.set(key, {
        username: normalizedUser,
        lastActiveAt,
        ip: ip || existing?.ip || '',
        role: role || existing?.role || 'USER',
        school: normalizedSchool
    });
}

async function initSessionsFromLogs(logsDb, thresholdMs = 15 * 60 * 1000) {
    try {
        if (!logsDb) return 0;
        const allLogs = await logsDb.find({ type: 'server_log' });
        if (!Array.isArray(allLogs) || allLogs.length === 0) return 0;

        const now = Date.now();
        let restoredCount = 0;

        // Sort ascending so latest timestamp wins
        allLogs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        for (const log of allLogs) {
            const user = extractUserFromLog(log);
            if (!user) continue;
            const logTime = log.timestamp || 0;

            if (isLogoutLog(log)) {
                markUserOffline(user, logTime);
                continue;
            }

            // Only consider online if within threshold and not logged out
            if (logTime && (now - logTime) < thresholdMs) {
                if (!isUserExplicitlyOffline(user, logTime)) {
                    const ip = log.metadata?.ip || '';
                    const school = log.metadata?.school || 'LOGBOOK';
                    recordUserActivity(user, 'USER', school, ip, logTime);
                    restoredCount++;
                }
            }
        }
        return restoredCount;
    } catch (e) {
        console.error('Failed to init sessions from server logs:', e.message);
        return 0;
    }
}

module.exports = {
    serverConfig,
    activeUserSessions,
    networkStats,
    networkEndpointStats,
    networkClientIpStats,
    networkMethodStats,
    getCpuUsagePercent,
    recordUserActivity,
    extractUserFromLog,
    isLogoutLog,
    markUserOffline,
    isUserExplicitlyOffline,
    initSessionsFromLogs
};
