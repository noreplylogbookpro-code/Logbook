const { logsDb } = require('../config/db');

function logServerEvent(level, message, metadata = {}) {
    const timestamp = Date.now();
    const formattedTime = new Date(timestamp).toISOString();
    console.log(`[${level.toUpperCase()}] [${formattedTime}] ${message}`);

    // Non-blocking database insertion
    logsDb.insert({
        type: 'server_log',
        level: level.toLowerCase(),
        message,
        metadata,
        timestamp
    }).then(async () => {
        try {
            // Keep sliding window of 500 logs
            const count = await logsDb.count({ type: 'server_log' });
            if (count > 500) {
                const logs = await logsDb.find({ type: 'server_log' });
                logs.sort((a, b) => a.timestamp - b.timestamp);
                const toRemove = logs.slice(0, logs.length - 500);
                for (const l of toRemove) {
                    await logsDb.remove({ _id: l._id }, {});
                }
                logsDb.compactDatafile();
            }
        } catch (err) {
            console.error("Error pruning server logs:", err);
        }
    }).catch(err => {
        console.error("Error inserting server log:", err);
    });
}

module.exports = {
    logServerEvent
};
