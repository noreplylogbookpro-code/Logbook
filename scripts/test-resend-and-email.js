// scripts/test-resend-and-email.js
const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const apiRouter = require('../api');
const { db, usersDb } = require('../config/db');
const {
    getSmtpConfig,
    verifySmtpConnection,
    buildOtpEmailHtml
} = require('../utils/emailService');

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
        console.log('    EMAIL SERVICE & RESEND OTP DIAGNOSTICS TESTS    ');
        console.log('====================================================\n');

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

        try {
            // --- SUITE 1: HTML Email Generation & Formatting ---
            console.log('--- SUITE 1: OTP Email Template Generation ---');
            const sampleHtml = buildOtpEmailHtml({
                username: 'alice_vault',
                otp: '849201',
                maskedEmail: 'a****e@example.com',
                expiresInMinutes: 10
            });

            assert('Generates branded HTML body', typeof sampleHtml === 'string' && sampleHtml.includes('<!DOCTYPE html>'));
            assert('Includes 6-digit OTP in template', sampleHtml.includes('849201'));
            assert('Includes username and masked email', sampleHtml.includes('alice_vault') && sampleHtml.includes('a****e@example.com'));
            assert('Includes expiration notice', sampleHtml.includes('10 minutes'));

            // --- SUITE 2: Email Status & Diagnostics Endpoint ---
            console.log('\n--- SUITE 2: Email Configuration Diagnostics ---');
            const statusRes = await request('GET', '/system/email-status');
            assert('GET /api/system/email-status returns HTTP 200', statusRes.status === 200);
            assert('Returns configured boolean and diagnostic message',
                typeof statusRes.body.configured === 'boolean' && typeof statusRes.body.message === 'string',
                `configured: ${statusRes.body.configured}, message: "${statusRes.body.message}"`
            );

            // --- SUITE 3: Resend OTP Endpoint & Delivery Check ---
            console.log('\n--- SUITE 3: Resend OTP Endpoint & Delivery Check ---');
            const testUserId = `resend_tester_${Date.now()}`;
            const testEmail = `tester_${Date.now()}@example.com`;
            await db.insert({
                _id: testUserId,
                username: `user_${Date.now()}`,
                email: testEmail,
                passwordHash: 'dummy_hash',
                createdAt: Date.now()
            });

            const userToken = jwt.sign(
                { userId: testUserId, username: `user_${Date.now()}`, email: testEmail, role: 'USER' },
                process.env.JWT_SECRET || 'test_secret',
                { expiresIn: '1h' }
            );

            // First request: initial OTP
            const req1 = await request('POST', '/user/delete-account/request-otp', {}, {
                Authorization: `Bearer ${userToken}`
            });
            assert('Initial request OTP succeeds', req1.status === 200 && req1.body.success === true);
            assert('Returns mailStatus structure with delivery check details',
                req1.body.mailStatus && typeof req1.body.mailStatus.sent === 'boolean' && typeof req1.body.mailStatus.configured === 'boolean',
                `sent: ${req1.body.mailStatus?.sent}, configured: ${req1.body.mailStatus?.configured}`
            );

            // Resend request: calling /resend-otp
            const req2 = await request('POST', '/user/delete-account/resend-otp', {}, {
                Authorization: `Bearer ${userToken}`
            });
            assert('POST /api/user/delete-account/resend-otp succeeds', req2.status === 200 && req2.body.success === true);
            assert('Resend provides regenerated OTP and delivery status',
                req2.body.mailStatus !== undefined && typeof req2.body.email === 'string'
            );

            // Cleanup test user
            await db.remove({ _id: testUserId }, {});

        } finally {
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
