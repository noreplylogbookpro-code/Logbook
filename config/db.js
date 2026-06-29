// config/db.js
const Datastore = require('nedb-promises');
const path = require('path');
require('dotenv').config();

const db = Datastore.create({
    filename: process.env.DB || 'users.db',
    autoload: true
});

module.exports = db;