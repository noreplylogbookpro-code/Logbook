// scripts/test-developer-notes.js
const express = require('express');
const http = require('http');
require('dotenv').config();

const apiRouter = require('../api');
const { developerNotesDb } = require('../config/db');

async function runTests() {
    console.log('=== STARTING DEVELOPER NOTE API TESTS ===\n');

    const app = express();
    app.use(express.json());
    app.use('/api', apiRouter);

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}/api`;

    console.log(`Test server running on ${baseUrl}\n`);

    let passed = 0;
    let failed = 0;

    const assert = (condition, msg) => {
        if (condition) {
            console.log(`[PASS] ${msg}`);
            passed++;
        } else {
            console.error(`[FAIL] ${msg}`);
            failed++;
        }
    };

    try {
        // Test 1: Public GET /api/developer-note
        console.log('--- Test 1: Public GET /api/developer-note ---');
        let res = await fetch(`${baseUrl}/developer-note`);
        assert(res.status === 200, `Status code is 200 (got ${res.status})`);
        assert(res.headers.get('cache-control')?.includes('max-age=300'), 'Cache-Control header is set to max-age=300');
        let note = await res.json();
        console.log('Received Note:', JSON.stringify(note, null, 2));
        assert(note.id === 'note_20261019_01', `Expected note ID 'note_20261019_01' (got '${note.id}')`);
        assert(note.title === 'Welcome to Logbook Plus v2.0!', 'Note title matches expected');
        assert(note.badge === 'Announcement', 'Note badge is Announcement');
        assert(note.actionUrl === 'https://logbookplus.co.in/whats-new', 'Note actionUrl matches');
        assert(note.actionText === 'Read More', 'Note actionText matches');

        // Test 2: Admin GET without auth should fail 401
        console.log('\n--- Test 2: Admin GET without authentication ---');
        res = await fetch(`${baseUrl}/admin/developer-note`);
        assert(res.status === 401, `Status code is 401 (got ${res.status})`);

        // Test 3: Admin GET with X-Admin-Key
        console.log('\n--- Test 3: Admin GET with X-Admin-Key ---');
        const adminKey = process.env.ADMIN_API_KEY || process.env.MASTER_PASS;
        res = await fetch(`${baseUrl}/admin/developer-note`, {
            headers: { 'x-admin-key': adminKey }
        });
        assert(res.status === 200, `Admin authenticated successfully (got ${res.status})`);
        let list = await res.json();
        assert(Array.isArray(list.notes) && list.notes.length >= 1, `Found ${list.notes?.length} notes in DB`);

        // Test 4: Create a new Developer Note via Admin POST
        console.log('\n--- Test 4: Admin POST new developer note ---');
        const newNotePayload = {
            id: 'note_test_feature_2026',
            title: 'Test New Feature Note',
            message: 'This is a test notification from the test suite.',
            date: 'Oct 19, 2026',
            version: '2.0.21',
            badge: 'Update',
            actionUrl: 'https://logbookplus.co.in',
            actionText: 'Explore',
            isActive: true,
            makeExclusive: false
        };
        res = await fetch(`${baseUrl}/admin/developer-note`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-key': adminKey
            },
            body: JSON.stringify(newNotePayload)
        });
        assert(res.status === 201, `Created new note status 201 (got ${res.status})`);
        let created = await res.json();
        assert(created.note?.id === 'note_test_feature_2026', `Created note ID verified: ${created.note?.id}`);

        // Test 5: Verify public GET now returns the newest active note
        console.log('\n--- Test 5: Verify public GET serves the latest active note ---');
        res = await fetch(`${baseUrl}/developer-note`);
        let latestPublic = await res.json();
        assert(latestPublic.id === 'note_test_feature_2026', `Public note now serves latest note ID: ${latestPublic.id}`);
        assert(latestPublic.title === 'Test New Feature Note', 'Latest note title matches');

        // Test 6: Toggle active state of note_test_feature_2026
        console.log('\n--- Test 6: Toggle note active state ---');
        res = await fetch(`${baseUrl}/admin/developer-note/note_test_feature_2026/toggle`, {
            method: 'PATCH',
            headers: { 'x-admin-key': adminKey }
        });
        assert(res.status === 200, `Toggle status 200 (got ${res.status})`);
        let toggleRes = await res.json();
        assert(toggleRes.isActive === false, 'Note is now deactivated');

        // Public GET should fall back to previous active note: note_20261019_01
        res = await fetch(`${baseUrl}/developer-note`);
        let fallbackPublic = await res.json();
        assert(fallbackPublic.id === 'note_20261019_01', `Fallback to older active note: ${fallbackPublic.id}`);

        // Test 7: Clean up test note
        console.log('\n--- Test 7: Admin DELETE test note ---');
        res = await fetch(`${baseUrl}/admin/developer-note/note_test_feature_2026`, {
            method: 'DELETE',
            headers: { 'x-admin-key': adminKey }
        });
        assert(res.status === 200, `Deleted test note (status ${res.status})`);

        // Test 8: Deactivate all notes and test 404 behavior
        console.log('\n--- Test 8: Verify 404 behavior when no notes are active ---');
        await developerNotesDb.update({ _id: 'note_20261019_01' }, { $set: { isActive: false } });
        res = await fetch(`${baseUrl}/developer-note`);
        assert(res.status === 404, `Status is 404 when no active note exists (got ${res.status})`);
        let emptyRes = await res.json();
        assert(emptyRes.error !== undefined, 'Returns error field on 404');
        assert(emptyRes.message === '', 'Returns empty message on 404');

        // Restore initial active note
        await developerNotesDb.update({ _id: 'note_20261019_01' }, { $set: { isActive: true } });
        res = await fetch(`${baseUrl}/developer-note`);
        assert(res.status === 200, 'Restored initial note to active state');

    } catch (err) {
        console.error('Test execution error:', err);
        failed++;
    } finally {
        server.close();
        console.log(`\n=== TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED ===`);
        process.exit(failed > 0 ? 1 : 0);
    }
}

runTests();
