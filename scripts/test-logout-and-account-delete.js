// scripts/test-logout-and-account-delete.js
const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const apiRouter = require('../api');
const { db, twoFactorDb, logsDb } = require('../config/db');
const { recordUserActivity, activeUserSessions } = require('../utils/serverState');

async function runTests() {
    console.log('====================================================');
    console.log('   LOGOUT ONLINE STATUS & ACCOUNT DELETION TESTS    ');
    console.log('====================================================\n');

    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Request Logger & Network Diagnostics Middleware (matching server.js)
    const { markUserOffline } = require('../utils/serverState');
    app.use((req, res, next) => {
        const url = req.url;
        res.on('finish', () => {
            const isLogoutRequest = url.includes('/logout');
            const activeUser = req.tokenPayload?.username || req.headers['x-caller-username'] || req.body?.username || req.query?.username || req.body?.email;
            const callerRole = req.headers['x-caller-role'] || req.body?.role || 'USER';
            const targetSchool = req.headers['x-school-key'] || req.body?.school || 'LOGBOOK';

            if (isLogoutRequest && activeUser && typeof activeUser === 'string') {
                markUserOffline(activeUser);
            } else if (activeUser && typeof activeUser === 'string' && res.statusCode < 400 && !isLogoutRequest) {
                recordUserActivity(
                    activeUser,
                    callerRole,
                    targetSchool,
                    req.ip
                );
            }
        });
        next();
    });

    app.use('/api', apiRouter);

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}/api`;

    console.log(`[INFO] Test server running on ${baseUrl}\n`);

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
        const masterUser = process.env.MASTER_USER || 'admin';
        const masterPass = process.env.MASTER_PASS || '123456';

        // 1. Get Master Token
        let res = await fetch(`${baseUrl}/master/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: masterUser, password: masterPass })
        });
        let data = await res.json();
        const masterToken = data.token;
        const masterHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${masterToken}`
        };

        // ====================================================
        // TEST SECTION 1: LOGOUT MARKS USER OFFLINE IMMEDIATELY
        // ====================================================
        console.log('--- TEST 1: User Login & Online Status Tracking ---');
        const testUser1 = `logout_tester_${Date.now()}`;
        const testEmail1 = `${testUser1}@example.com`;
        const testPass1 = 'Password123!';

        // Create and login test user
        res = await fetch(`${baseUrl}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: testUser1,
                email: testEmail1,
                password: testPass1,
                securityQuestion: 'What was the name of your first pet?',
                securityAnswer: 'Buddy'
            })
        });
        data = await res.json();
        const user1Token = data.token;
        const user1Id = data.user?.id;
        assert(res.status === 201 && !!user1Token, 'Signup test user 1');

        // Check master users: user should be ONLINE
        res = await fetch(`${baseUrl}/master/users`, { headers: masterHeaders });
        let usersList = await res.json();
        let targetUserInList = usersList.find(u => u.username === testUser1);
        assert(targetUserInList && targetUserInList.isOnline === true, 'User is ONLINE after login / activity', `(isOnline: ${targetUserInList?.isOnline})`);

        // User performs logout
        console.log('\n--- TEST 2: User Logs Out ---');
        res = await fetch(`${baseUrl}/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user1Token}`
            },
            body: JSON.stringify({ username: testUser1 })
        });
        data = await res.json();
        assert(res.status === 200 && data.success === true, 'POST /api/logout', `(message: "${data.message}")`);

        // Check master users immediately after logout: user MUST be OFFLINE!
        res = await fetch(`${baseUrl}/master/users`, { headers: masterHeaders });
        usersList = await res.json();
        targetUserInList = usersList.find(u => u.username === testUser1);
        assert(targetUserInList && targetUserInList.isOnline === false, 'User is now OFFLINE immediately upon logout', `(isOnline: ${targetUserInList?.isOnline})`);

        // ====================================================
        // TEST SECTION 2: ACCOUNT DELETION WITH SECURITY QUESTION
        // ====================================================
        console.log('\n--- TEST 3: Account Deletion (Email OTP + Security Question) ---');

        // Request deletion OTP
        res = await fetch(`${baseUrl}/user/delete-account/request-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user1Token}`
            }
        });
        data = await res.json();
        assert(res.status === 200 && data.success === true && !!data.devOtp, 'Request Account Deletion OTP', `(requiresSecurityQ: ${data.requiresSecurityQuestion}, question: "${data.securityQuestion}")`);
        const deletionOtp1 = data.devOtp;

        // Try confirm with wrong security answer (should fail 400)
        res = await fetch(`${baseUrl}/user/delete-account/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user1Token}`
            },
            body: JSON.stringify({
                otp: deletionOtp1,
                securityAnswer: 'WrongAnswer'
            })
        });
        data = await res.json();
        assert(res.status === 400 && data.error.includes('Incorrect answer'), 'Fails deletion on incorrect security answer');

        // Confirm with CORRECT security answer ('Buddy')
        res = await fetch(`${baseUrl}/user/delete-account/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user1Token}`
            },
            body: JSON.stringify({
                otp: deletionOtp1,
                securityAnswer: 'Buddy'
            })
        });
        data = await res.json();
        assert(res.status === 200 && data.success === true, 'Confirm Account Deletion with OTP + Security Answer', `(message: "${data.message}")`);

        // Verify user no longer exists in database
        const deletedUserInDb = await db.findOne({ _id: user1Id });
        assert(!deletedUserInDb, 'User record completely removed from database');

        // Verify deleted user can no longer log in
        res = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: testUser1, password: testPass1 })
        });
        assert(res.status === 401, 'Deleted user cannot log in (HTTP 401)');

        // ====================================================
        // TEST SECTION 3: ACCOUNT DELETION WITH 2FA
        // ====================================================
        console.log('\n--- TEST 4: Account Deletion with 2FA Authenticator ---');
        const testUser2 = `totp_del_${Date.now()}`;
        const testEmail2 = `${testUser2}@example.com`;
        const testPass2 = 'Password123!';

        // Create user 2
        res = await fetch(`${baseUrl}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: testUser2,
                email: testEmail2,
                password: testPass2
            })
        });
        data = await res.json();
        const user2Token = data.token;
        const user2Id = data.user?.id;

        // Setup 2FA for User 2
        res = await fetch(`${baseUrl}/profile/2fa/setup`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${user2Token}` }
        });
        data = await res.json();
        const base32Secret = data.secret;

        // Generate TOTP code
        const crypto = require('crypto');
        function base32Decode(base32Str) {
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
            let cleanStr = String(base32Str).replace(/[\s\-\=]/g, '').toUpperCase();
            let length = cleanStr.length;
            let buffer = Buffer.alloc(Math.floor(length * 5 / 8));
            let bits = 0, value = 0, index = 0;
            for (let i = 0; i < length; i++) {
                const val = alphabet.indexOf(cleanStr[i]);
                value = (value << 5) | val;
                bits += 5;
                if (bits >= 8) {
                    buffer[index++] = (value >>> (bits - 8)) & 255;
                    bits -= 8;
                }
            }
            return buffer;
        }

        function generateCurrentTOTP(secret) {
            const secretBuffer = base32Decode(secret);
            const counter = Math.floor(Date.now() / 30000);
            const counterBuffer = Buffer.alloc(8);
            counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
            counterBuffer.writeUInt32BE(counter % 0x100000000, 4);
            const hmac = crypto.createHmac('sha1', secretBuffer);
            hmac.update(counterBuffer);
            const hmacResult = hmac.digest();
            const offset = hmacResult[hmacResult.length - 1] & 0xf;
            const code = ((hmacResult[offset] & 0x7f) << 24) |
                ((hmacResult[offset + 1] & 0xff) << 16) |
                ((hmacResult[offset + 2] & 0xff) << 8) |
                (hmacResult[offset + 3] & 0xff);
            return (code % 1000000).toString().padStart(6, '0');
        }

        const currentTotp = generateCurrentTOTP(base32Secret);

        // Verify and enable 2FA
        res = await fetch(`${baseUrl}/profile/2fa/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user2Token}`
            },
            body: JSON.stringify({ code: currentTotp })
        });
        data = await res.json();
        assert(res.status === 200 && data.success === true, 'Enable 2FA on User 2');

        // Request deletion OTP for User 2 (should demand 2FA)
        res = await fetch(`${baseUrl}/user/delete-account/request-otp`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${user2Token}` }
        });
        data = await res.json();
        assert(res.status === 200 && data.requires2FA === true, 'Request Deletion OTP reflects requires2FA = true');
        const deletionOtp2 = data.devOtp;

        // Confirm deletion with 2FA code
        res = await fetch(`${baseUrl}/user/delete-account/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user2Token}`
            },
            body: JSON.stringify({
                otp: deletionOtp2,
                twoFactorCode: currentTotp
            })
        });
        data = await res.json();
        assert(res.status === 200 && data.success === true, 'Confirm Account Deletion with OTP + 2FA Code', `(message: "${data.message}")`);

        // Verify 2FA record also purged
        const deleted2faInDb = await twoFactorDb.findOne({ _id: user2Id });
        assert(!deleted2faInDb, 'User 2FA credentials wiped from twoFactorDb');

    } catch (err) {
        console.error('\n[FATAL TEST ERROR]:', err);
        failed++;
    } finally {
        server.close();
        console.log('\n====================================================');
        console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
        console.log('====================================================\n');
        process.exit(failed > 0 ? 1 : 0);
    }
}

runTests();
