const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_DIR = path.join(__dirname, '../database');
const SCHOOLS = (process.env.VITE_SCHOOLS || 'NHSST,NHISR,NHSSR,NHITM,NHSSVL,NHSSA,NHPSASEC19,NHPSASEC3,DMCE,NHPSP').split(',').map(s => s.trim().toUpperCase());

function getSchoolKey(school) {
    if (!school) return 'NHSST';
    const upper = school.toUpperCase().trim();
    return SCHOOLS.includes(upper) ? upper : 'NHSST';
}

function getTicketsFile(school) {
    const key = getSchoolKey(school).toLowerCase();
    return path.join(DB_DIR, `tickets_${key}.json`);
}

function getUsersFile(school) {
    const key = getSchoolKey(school).toLowerCase();
    return path.join(DB_DIR, `users_${key}.json`);
}

/**
 * Initializes the database directory and default files for a given school if they do not exist.
 */
function initDB(school) {
    const key = getSchoolKey(school);
    const ticketsFile = getTicketsFile(key);
    const usersFile = getUsersFile(key);

    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (!fs.existsSync(ticketsFile)) {
        fs.writeFileSync(ticketsFile, JSON.stringify([
            {
                id: 1,
                token: 'HD-20260801-A9F2',
                reportedBy: 'staff',
                userName: 'Main Office Staff',
                userPhone: '9876543210',
                userEmail: `staff@${key.toLowerCase()}.edu`,
                category: 'PC Hardware',
                floor: '1st Floor',
                roomNumber: '102B',
                subject: 'Printer Jam',
                description: 'Paper is jammed in the office laserjet printer tray 2.',
                status: 'CLOSED',
                adminRemark: 'Cleared the jammed paper roller assembly and tested printing successfully.',
                closedBy: 'IT Administrator',
                resolutionTimeMinutes: 15,
                createdAt: new Date().toISOString()
            }
        ], null, 2));
    }

    if (!fs.existsSync(usersFile)) {
        const superUser = (process.env.SUPER_ADMIN_USER).trim().toLowerCase();
        const superPass = process.env.SUPER_ADMIN_PASS;
        const adminUser = (process.env.DEFAULT_ADMIN_USER).trim().toLowerCase();
        const adminPass = process.env.DEFAULT_ADMIN_PASS;
        const staffUser = (process.env.DEFAULT_STAFF_USER).trim().toLowerCase();
        const staffPass = process.env.DEFAULT_STAFF_PASS;

        fs.writeFileSync(usersFile, JSON.stringify([
            {
                id: 1,
                username: superUser,
                password: superPass,
                role: 'SUPER_ADMIN',
                fullName: 'Super Administrator'
            },
            {
                id: 2,
                username: adminUser,
                password: adminPass,
                role: 'ADMIN',
                fullName: 'IT Administrator'
            },
            {
                id: 3,
                username: staffUser,
                password: staffPass,
                role: 'USER',
                fullName: 'Main Office Staff'
            }
        ], null, 2));
    }
}

function readTickets(school) {
    const key = getSchoolKey(school);
    initDB(key);
    const data = fs.readFileSync(getTicketsFile(key), 'utf8');
    return JSON.parse(data);
}

function writeTickets(tickets, school) {
    const key = getSchoolKey(school);
    initDB(key);
    fs.writeFileSync(getTicketsFile(key), JSON.stringify(tickets, null, 2));
}

function readUsers(school) {
    const key = getSchoolKey(school);
    initDB(key);
    const data = fs.readFileSync(getUsersFile(key), 'utf8');
    return JSON.parse(data);
}

function writeUsers(users, school) {
    const key = getSchoolKey(school);
    initDB(key);
    fs.writeFileSync(getUsersFile(key), JSON.stringify(users, null, 2));
}

const SUB_FILE = path.join(DB_DIR, 'subscriptions.json');

function readSubscriptions() {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(SUB_FILE)) {
        fs.writeFileSync(SUB_FILE, JSON.stringify({}, null, 2));
    }
    try {
        return JSON.parse(fs.readFileSync(SUB_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
}

function writeSubscriptions(data) {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(SUB_FILE, JSON.stringify(data, null, 2));
}

function getSubscriptionForSchool(school) {
    const subscriptions = readSubscriptions();
    if (!school) return { status: 'ACTIVE', expiresAt: null };
    const key = school.toString().toUpperCase().trim();
    return subscriptions[key] || subscriptions[school] || { status: 'ACTIVE', expiresAt: null };
}

const LICENSES_FILE = path.join(DB_DIR, 'licenses.json');

function readLicenses() {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(LICENSES_FILE)) {
        fs.writeFileSync(LICENSES_FILE, JSON.stringify([], null, 2));
    }
    try {
        return JSON.parse(fs.readFileSync(LICENSES_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

function writeLicenses(data) {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(LICENSES_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
    SCHOOLS,
    getSchoolKey,
    readTickets,
    writeTickets,
    readUsers,
    writeUsers,
    readSubscriptions,
    writeSubscriptions,
    getSubscriptionForSchool,
    readLicenses,
    writeLicenses
};
