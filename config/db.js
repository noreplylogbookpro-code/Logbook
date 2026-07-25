// config/db.js
const Datastore = require('nedb-promises');
const path = require('path');
require('dotenv').config();

// Primary users, configs, settings datastore
const db = Datastore.create({
    filename: process.env.DB || 'server_users.db',
    autoload: true
});

// Dedicated system event logger datastore
const logsDb = Datastore.create({
    filename: process.env.LOGS_DB || 'server_logs.db',
    autoload: true
});

// Set auto-compaction interval to 5 minutes (300,000 ms)
// NeDB will safely serialize and execute compaction in the background
db.setAutocompactionInterval(300000);
logsDb.setAutocompactionInterval(300000);

// Log compaction events and catch errors to prevent unhandled promise rejections
db.on('compaction.done', (err) => {
    if (err) {
        console.error('Compaction error on server_users.db:', err);
    } else {
        console.log('Compaction completed on server_users.db');
    }
});

logsDb.on('compaction.done', (err) => {
    if (err) {
        console.error('Compaction error on server_logs.db:', err);
    } else {
        console.log('Compaction completed on server_logs.db');
    }
});

// Override manual compactDatafile with a safe no-op callback caller.
// Since NeDB handles compaction automatically via the interval set above,
// manual compaction on every single write is unnecessary and causes I/O bottlenecks.
db.compactDatafile = (callback) => {
    if (typeof callback === 'function') process.nextTick(() => callback(null));
};
logsDb.compactDatafile = (callback) => {
    if (typeof callback === 'function') process.nextTick(() => callback(null));
};

module.exports = {
    db,
    logsDb
};