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

module.exports = {
    db,
    logsDb
};