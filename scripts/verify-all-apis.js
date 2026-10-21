// scripts/verify-all-apis.js
const express = require('express');
const http = require('http');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const apiRouter = require('../api');
const { db, logsDb, developerNotesDb } = require('../config/db');
const { getSubscriptionForSchool } = require('../utils/dbHelper');
const { recordUserActivity, activeUserSessions, logServerEvent } = require('../utils/serverState');

async function runApiVerification() {
    console.log('====================================================');
    console.log('   LOGBOOK PLUS - COMPREHENSIVE API TEST SUITE      ');
    console.log('====================================================\n');

    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Helpdesk Subscription Suspension Guard Middleware (from server.js)
    app.use((req, res, next) => {
        const url = req.url;
        if (
            !url.startsWith('/api/v1/tickets') &&
            !url.startsWith('/api/v1/auth')
        ) {
            return next();
        }

        if (
            url.startsWith('/api/master') ||
            url.startsWith('/api/v1/master') ||
            url.startsWith('/api/v1/auth/login') ||
            url.startsWith('/api/v1/auth/config') ||
            url === '/health'
        ) {
            return next();
        }

        const targetSchool = req.headers['x-school-key'] || req.query.school || (req.body && req.body.school) || 'NHSST';
        const callerRole = req.headers['x-caller-role'] || req.query.role || (req.body && req.body.role) || '';
        if (callerRole === 'SUPER_ADMIN') {
            return next();
        }

        const schoolSub = getSubscriptionForSchool(targetSchool);
        const isExpired = schoolSub.expiresAt && new Date(schoolSub.expiresAt) < new Date();

        if (schoolSub.status === 'SUSPENDED' || isExpired) {
            const errorMsg = isExpired
                ? 'This campus database subscription license has expired. Please contact master@localhost for renewal support.'
                : 'This campus database subscription is suspended. Please contact master@localhost for support.';
            return res.status(403).json({
                success: false,
                error: errorMsg,
                isSuspended: true,
                isExpired: isExpired
            });
        }
        next();
    });

    app.use('/api', apiRouter);

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}/api`;

    console.log(`[INFO] Test server listening on ${baseUrl}\n`);

    let passed = 0;
    let failed = 0;

    const assert = (condition, testName, extraInfo = '') => {
        if (condition) {
            console.log(`  [PASS] ${testName} ${extraInfo}`);
            passed++;
        } else {
            console.error(`  [FAIL] ${testName} ${extraInfo}`);
            failed++;
        }
    };

    try {
        // ====================================================
        // SUITE 1: PUBLIC GENERAL ENDPOINTS
        // ====================================================
        console.log('--- SUITE 1: Public Endpoints ---');

        // 1. Health check
        let res = await fetch(`${baseUrl}/health`);
        let data = await res.json();
        assert(res.status === 200 && data.status === 'ok', 'GET /api/health', `(status: ${res.status}, db: ${data.db})`);

        // 2. Developer Note
        res = await fetch(`${baseUrl}/developer-note`);
        data = await res.json();
        assert(res.status === 200 && data.id, 'GET /api/developer-note', `(note id: ${data.id}, title: "${data.title}")`);

        // 3. Blogs
        res = await fetch(`${baseUrl}/blogs`);
        data = await res.json();
        assert(res.status === 200 && Array.isArray(data), 'GET /api/blogs', `(count: ${data.length})`);

        // 4. Changelogs
        res = await fetch(`${baseUrl}/changelogs`);
        data = await res.json();
        assert(res.status === 200 && Array.isArray(data), 'GET /api/changelogs', `(count: ${data.length})`);

        // 5. Store package availability
        res = await fetch(`${baseUrl}/check-store`);
        data = await res.json();
        assert(res.status === 200 && data.available === true, 'GET /api/check-store', `(playStore: ${!!data.playStoreUrl})`);

        // 6. Check Email availability
        res = await fetch(`${baseUrl}/check-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: `random_non_existent_${Date.now()}@example.com` })
        });
        data = await res.json();
        assert(res.status === 200 && data.available === true, 'POST /api/check-email', `(available: ${data.available})`);

        // 7. Check Username availability
        res = await fetch(`${baseUrl}/check-username`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: `random_user_${Date.now()}` })
        });
        data = await res.json();
        assert(res.status === 200 && data.available === true, 'POST /api/check-username', `(available: ${data.available})`);

        // ====================================================
        // SUITE 2: MASTER ADMIN ENDPOINTS
        // ====================================================
        console.log('\n--- SUITE 2: Master Admin Endpoints ---');

        const masterUser = process.env.MASTER_USER || 'admin';
        const masterPass = process.env.MASTER_PASS || '123456';

        // 8. Master Login
        res = await fetch(`${baseUrl}/master/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: masterUser, password: masterPass })
        });
        data = await res.json();
        const masterToken = data.token;
        assert(res.status === 200 && !!masterToken, 'POST /api/master/login', `(token received: ${!!masterToken})`);

        const masterHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${masterToken}`
        };

        // 9. Master Stats
        res = await fetch(`${baseUrl}/master/stats`, { headers: masterHeaders });
        data = await res.json();
        assert(res.status === 200 && data.totalUsers !== undefined, 'GET /api/master/stats', `(totalUsers: ${data.totalUsers}, ramUsed: ${data.ramUsedPercent}%)`);

        // 10. Master Users (Online status tracking test)
        res = await fetch(`${baseUrl}/master/users`, { headers: masterHeaders });
        data = await res.json();
        assert(res.status === 200 && Array.isArray(data), 'GET /api/master/users', `(loaded ${data.length} users with isOnline flags)`);

        // Verify users have isOnline boolean
        const hasOnlineTracking = data.some(u => typeof u.isOnline === 'boolean');
        assert(hasOnlineTracking, 'Online user tracking verification', `(user online status evaluated properly)`);

        // 11. Master Logs
        res = await fetch(`${baseUrl}/master/logs`, { headers: masterHeaders });
        data = await res.json();
        assert(res.status === 200 && (Array.isArray(data) || Array.isArray(data.logs)), 'GET /api/master/logs');

        // 12. Master Developer Notes list
        res = await fetch(`${baseUrl}/master/developer-notes`, { headers: masterHeaders });
        data = await res.json();
        assert(res.status === 200 && data.success === true, 'GET /api/master/developer-notes', `(notes count: ${data.count})`);

        // 13. Master Subscriptions
        res = await fetch(`${baseUrl}/master/subscriptions`, { headers: masterHeaders });
        data = await res.json();
        assert(res.status === 200 && data.subscriptions !== undefined, 'GET /api/master/subscriptions', `(schools: ${Object.keys(data.subscriptions || {}).length})`);

        // 14. Master Backup Files
        res = await fetch(`${baseUrl}/master/backup/files`, { headers: masterHeaders });
        data = await res.json();
        assert(res.status === 200 && Array.isArray(data.categories), 'GET /api/master/backup/files', `(total files: ${data.totalFiles})`);

        // ====================================================
        // SUITE 3: HELPDESK & CAMPUS SYSTEM
        // ====================================================
        console.log('\n--- SUITE 3: Helpdesk Campus System ---');

        // 15. Helpdesk Config
        res = await fetch(`${baseUrl}/v1/auth/config`);
        data = await res.json();
        assert(res.status === 200 && data.superAdminUser === 'master', 'GET /api/v1/auth/config', `(superAdmin: ${data.superAdminUser})`);

        // 16. Helpdesk Login as Super Admin (Master) in NHSST - verifying fix for expired license error
        res = await fetch(`${baseUrl}/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'master',
                password: '123456',
                school: 'NHSST'
            })
        });
        data = await res.json();
        assert(res.status === 200 && data.success === true && data.data?.role === 'SUPER_ADMIN', 'POST /api/v1/auth/login (Master Super Admin)', `(role: ${data.data?.role}, school: ${data.data?.school})`);

        const helpdeskHeaders = {
            'Content-Type': 'application/json',
            'x-caller-role': 'SUPER_ADMIN',
            'x-school-key': 'NHSST'
        };

        // 17. Helpdesk Tickets Dashboard Stats
        res = await fetch(`${baseUrl}/v1/tickets/dashboard?school=NHSST`, { headers: helpdeskHeaders });
        data = await res.json();
        assert(res.status === 200 && data.success === true && data.stats !== undefined, 'GET /api/v1/tickets/dashboard', `(total: ${data.stats?.total}, pending: ${data.stats?.pending}, closed: ${data.stats?.closed})`);

        // 18. Helpdesk Settings Defaults
        res = await fetch(`${baseUrl}/v1/tickets/settings/defaults?school=NHSST`, { headers: helpdeskHeaders });
        data = await res.json();
        assert(res.status === 200 && data.success === true, 'GET /api/v1/tickets/settings/defaults');

        // 19. Helpdesk Tags
        res = await fetch(`${baseUrl}/v1/tickets/tags?school=NHSST`, { headers: helpdeskHeaders });
        data = await res.json();
        assert(res.status === 200 && Array.isArray(data.tags || data), 'GET /api/v1/tickets/tags');

        // ====================================================
        // SUITE 4: VAULT USER AUTH & PROFILE
        // ====================================================
        console.log('\n--- SUITE 4: Vault User Auth & Profile ---');

        const testUsername = `testapi_${Date.now()}`;
        const testEmail = `${testUsername}@testlogbook.com`;
        const testPassword = 'Password123!';

        // 20. Signup check availability
        res = await fetch(`${baseUrl}/signup/check-availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, username: testUsername })
        });
        data = await res.json();
        assert(res.status === 200 && data.emailAvailable && data.usernameAvailable, 'POST /api/signup/check-availability');

        // 21. User Signup
        res = await fetch(`${baseUrl}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: testUsername,
                email: testEmail,
                password: testPassword,
                securityQuestion: 'What was the name of your first pet?',
                securityAnswer: 'Fluffy'
            })
        });
        data = await res.json();
        const userToken = data.token;
        const createdUserId = data.user?.id;
        assert(res.status === 201 && !!userToken, 'POST /api/signup (User registration)', `(userId: ${createdUserId})`);

        // 22. User Login
        res = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: testUsername, password: testPassword })
        });
        data = await res.json();
        assert(res.status === 200 && data.success === true, 'POST /api/login (Vault authentication)', `(username: ${data.user?.username})`);

        const userHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
        };

        // 23. User Profile
        res = await fetch(`${baseUrl}/profile`, { headers: userHeaders });
        data = await res.json();
        assert(res.status === 200 && data.username === testUsername, 'GET /api/profile', `(email: ${data.email}, plan: ${data.plan})`);

        // 24. License Status Check
        res = await fetch(`${baseUrl}/licenses/check`, { headers: userHeaders });
        data = await res.json();
        assert(res.status === 200 && data.plan !== undefined, 'GET /api/licenses/check', `(plan: ${data.plan}, licensed: ${data.licensed})`);

        // Clean up test user
        if (createdUserId) {
            await db.remove({ _id: createdUserId }, {});
            db.compactDatafile();
        }

        // ====================================================
        // SUITE 5: SYSTEMS STATUS REMOVAL VERIFICATION
        // ====================================================
        console.log('\n--- SUITE 5: Systems Status Clean Removal ---');

        // 25. Check /api/status does not expose old status endpoint
        res = await fetch(`${baseUrl}/status`);
        assert(res.status === 404, 'GET /api/status is cleanly removed (HTTP 404 expected)', `(got ${res.status})`);

    } catch (err) {
        console.error('\n[FATAL ERROR IN SUITE]:', err);
        failed++;
    } finally {
        server.close();
        console.log('\n====================================================');
        console.log(` API VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
        console.log('====================================================\n');
        process.exit(failed > 0 ? 1 : 0);
    }
}

runApiVerification();
