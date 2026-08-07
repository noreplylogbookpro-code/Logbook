const os = require('os');
require('dotenv').config();

function parseQuotaLimit(val) {
    if (!val) return 240 * 1024 * 1024; // 240 MB default
    const n = parseInt(val, 10);
    return isNaN(n) ? 240 * 1024 * 1024 : n;
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

function recordUserActivity(username, role = 'USER', school = 'LOGBOOK', ip = '') {
    if (!username || typeof username !== 'string') return;
    const key = username.trim().toLowerCase();
    if (!key) return;
    activeUserSessions.set(key, {
        username: key,
        lastActiveAt: Date.now(),
        ip: ip || '',
        role: role || 'USER',
        school: school || 'LOGBOOK'
    });
}

module.exports = {
    serverConfig,
    activeUserSessions,
    networkStats,
    networkEndpointStats,
    networkClientIpStats,
    networkMethodStats,
    getCpuUsagePercent,
    recordUserActivity
};
