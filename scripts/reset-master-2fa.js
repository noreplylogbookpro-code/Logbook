const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { twoFactorDb } = require('../config/db');

async function resetMaster2FA() {
    console.log('Resetting Master Admin 2FA credentials...');
    try {
        await twoFactorDb.update(
            { _id: 'master_profile' },
            {
                $set: {
                    twoFactorEnabled: false,
                    twoFactorSecret: null,
                    tempTwoFactorSecret: null,
                    lastUsedTOTPCounter: null
                }
            },
            { upsert: true }
        );
        console.log('SUCCESS: Master Admin 2FA has been reset and disabled successfully.');
        console.log('You can now log into the Master Admin Console using your master username and password.');
        process.exit(0);
    } catch (err) {
        console.error('ERROR: Failed to reset Master Admin 2FA:', err.message);
        process.exit(1);
    }
}

resetMaster2FA();
