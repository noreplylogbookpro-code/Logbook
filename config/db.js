// config/db.js
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
require('dotenv').config({ quiet: true });

class JsonStore extends EventEmitter {
    constructor(filename) {
        super();
        this.filename = path.resolve(process.cwd(), filename);
        this.data = [];
        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(this.filename)) {
                const raw = fs.readFileSync(this.filename, 'utf8').trim();
                if (raw) {
                    this.data = JSON.parse(raw);
                    if (!Array.isArray(this.data)) this.data = [];
                } else {
                    this.data = [];
                }
            } else {
                this.data = [];
                this._saveSync();
            }
        } catch (e) {
            console.error(`Error loading database file ${this.filename}:`, e.message);
            this.data = [];
        }
    }

    _saveSync() {
        try {
            const dir = path.dirname(this.filename);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.filename, JSON.stringify(this.data, null, 2), 'utf8');
        } catch (e) {
            console.error(`Error writing database file ${this.filename}:`, e.message);
        }
    }

    _matches(doc, query) {
        if (!query || Object.keys(query).length === 0) return true;
        for (const key of Object.keys(query)) {
            if (key === '$or') {
                const conditions = query['$or'];
                if (!Array.isArray(conditions)) continue;
                const anyMatch = conditions.some(cond => this._matches(doc, cond));
                if (!anyMatch) return false;
                continue;
            }

            const val = doc[key];
            const cond = query[key];

            if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
                if ('$exists' in cond) {
                    const exists = val !== undefined && val !== null;
                    if (exists !== Boolean(cond.$exists)) return false;
                }
                if ('$lt' in cond && !(val < cond.$lt)) return false;
                if ('$lte' in cond && !(val <= cond.$lte)) return false;
                if ('$gt' in cond && !(val > cond.$gt)) return false;
                if ('$gte' in cond && !(val >= cond.$gte)) return false;
                if ('$ne' in cond && val === cond.$ne) return false;
                if ('$in' in cond && (!Array.isArray(cond.$in) || !cond.$in.includes(val))) return false;
            } else {
                if (val !== cond) return false;
            }
        }
        return true;
    }

    _applyProjection(doc, projection) {
        if (!doc || !projection || Object.keys(projection).length === 0) {
            return doc ? JSON.parse(JSON.stringify(doc)) : doc;
        }
        const cloned = JSON.parse(JSON.stringify(doc));
        const keys = Object.keys(projection);
        const isExclusion = keys.some(k => projection[k] === 0 || projection[k] === false);

        if (isExclusion) {
            keys.forEach(k => {
                if (projection[k] === 0 || projection[k] === false) delete cloned[k];
            });
            return cloned;
        } else {
            const projected = { _id: cloned._id };
            keys.forEach(k => {
                if (projection[k] === 1 || projection[k] === true) projected[k] = cloned[k];
            });
            return projected;
        }
    }

    _generateId() {
        return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    }

    find(query = {}, projection = {}) {
        const self = this;
        let sortObj = null;
        let limitVal = null;
        let skipVal = 0;

        const chain = {
            sort(s) { sortObj = s; return chain; },
            limit(l) { limitVal = l; return chain; },
            skip(sk) { skipVal = sk; return chain; },
            async exec() {
                let matches = self.data.filter(doc => self._matches(doc, query));
                if (sortObj) {
                    const keys = Object.keys(sortObj);
                    matches.sort((a, b) => {
                        for (const k of keys) {
                            const dir = sortObj[k];
                            if (a[k] < b[k]) return dir === 1 ? -1 : 1;
                            if (a[k] > b[k]) return dir === 1 ? 1 : -1;
                        }
                        return 0;
                    });
                }
                if (skipVal > 0) matches = matches.slice(skipVal);
                if (limitVal !== null && limitVal !== undefined && limitVal >= 0) matches = matches.slice(0, limitVal);

                return matches.map(doc => self._applyProjection(doc, projection));
            },
            then(onFulfilled, onRejected) { return chain.exec().then(onFulfilled, onRejected); },
            catch(onRejected) { return chain.exec().catch(onRejected); },
            finally(onFinally) { return chain.exec().finally(onFinally); }
        };

        return chain;
    }

    async findOne(query = {}, projection = {}) {
        const doc = this.data.find(d => this._matches(d, query));
        if (!doc) return null;
        return this._applyProjection(doc, projection);
    }

    async insert(doc) {
        const newDoc = JSON.parse(JSON.stringify(doc));
        if (!newDoc._id) newDoc._id = this._generateId();
        this.data.push(newDoc);
        this._saveSync();
        return JSON.parse(JSON.stringify(newDoc));
    }

    async update(query, updateObj, options = {}) {
        let updatedCount = 0;
        let matched = false;

        for (let i = 0; i < this.data.length; i++) {
            if (this._matches(this.data[i], query)) {
                matched = true;
                updatedCount++;
                const doc = this.data[i];
                if (updateObj.$set) {
                    Object.assign(doc, updateObj.$set);
                }
                if (updateObj.$unset) {
                    Object.keys(updateObj.$unset).forEach(k => delete doc[k]);
                }
                if (!updateObj.$set && !updateObj.$unset) {
                    const _id = doc._id;
                    this.data[i] = { ...updateObj, _id };
                }
                if (!options.multi) break;
            }
        }

        if (!matched && options.upsert) {
            const newDoc = query._id ? { _id: query._id } : { _id: this._generateId() };
            if (updateObj.$set) Object.assign(newDoc, updateObj.$set);
            if (!updateObj.$set) Object.assign(newDoc, updateObj);
            this.data.push(newDoc);
            updatedCount = 1;
        }

        if (updatedCount > 0) this._saveSync();
        return updatedCount;
    }

    async remove(query, options = {}) {
        let removedCount = 0;

        if (options.multi) {
            this.data = this.data.filter(doc => {
                const match = this._matches(doc, query);
                if (match) removedCount++;
                return !match;
            });
        } else {
            const idx = this.data.findIndex(doc => this._matches(doc, query));
            if (idx !== -1) {
                this.data.splice(idx, 1);
                removedCount = 1;
            }
        }

        if (removedCount > 0) this._saveSync();
        return removedCount;
    }

    async count(query = {}) {
        return this.data.filter(doc => this._matches(doc, query)).length;
    }

    setAutocompactionInterval(interval) {
        // Safe no-op for JSON store
    }

    compactDatafile(callback) {
        this._saveSync();
        this.emit('compaction.done', null);
        if (typeof callback === 'function') process.nextTick(() => callback(null));
        return Promise.resolve();
    }
}

// Create stores
const usersDb = new JsonStore(process.env.DB || process.env.DB_JSON || 'database/server_users.json');
const logsDb = new JsonStore(process.env.LOGS_DB || process.env.LOGS_DB_JSON || 'database/server_logs.json');
const changelogDb = new JsonStore(process.env.CHANGELOG_DB || 'database/server_changelog.json');
const licensesDb = new JsonStore(process.env.LICENSES_DB || 'database/server_licenses.json');
const twoFactorDb = new JsonStore(process.env.TWOFACTOR_DB || 'database/server_2fa.json');

// Export primary stores
module.exports = {
    db: usersDb,
    usersDb,
    logsDb,
    changelogDb,
    licensesDb,
    twoFactorDb
};