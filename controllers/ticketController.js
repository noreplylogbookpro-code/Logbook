const { generateTicketToken } = require('../utils/tokenGenerator');
const { Parser } = require('json2csv');
const { readTickets, writeTickets, readSubscriptions, getSubscriptionForSchool, readTags, writeTags } = require('../utils/dbHelper');
const https = require('https');

// Helper to extract school key from headers or request parameters
const getSchool = (req) => {
    const school = req.headers['x-school-key'] || req.query.school || (req.body && req.body.school);
    if (!school) return 'NHSST';
    return school.toUpperCase().trim();
};

/**
 * @route   POST /api/v1/tickets
 * @desc    Create a new complaint ticket
 */
exports.createTicket = (req, res) => {
    const { userName, userPhone, userEmail, category, subject, description, floor, roomNumber, reportedBy, isPrefilled, adminTag } = req.body;
    const targetSchool = getSchool(req);

    if (!userName || !subject) {
        return res.status(400).json({ success: false, error: 'User name and subject brief are required.' });
    }

    const ticketsDB = readTickets(targetSchool);
    const maxId = ticketsDB.reduce((max, t) => t.id > max ? t.id : max, 0);

    const newTicket = {
        id: maxId + 1,
        token: generateTicketToken(),
        userName,
        userPhone: userPhone || '',
        userEmail: userEmail || '',
        category: category || 'PC Hardware',
        subject: subject || 'No Subject',
        description: description || subject || '',
        floor: floor || 'Ground Floor',
        roomNumber: roomNumber || 'General Area',
        reportedBy: reportedBy || 'anonymous',
        isPrefilled: Boolean(isPrefilled),
        adminTag: adminTag || 'IT Support',
        status: 'PENDING',
        adminRemark: null,
        createdAt: new Date().toISOString(),
        closedAt: null,
        resolutionTimeMinutes: null
    };

    ticketsDB.push(newTicket);
    writeTickets(ticketsDB, targetSchool);

    return res.status(201).json({
        success: true,
        message: `Complaint registered successfully in school ${targetSchool}.`,
        data: { token: newTicket.token, status: newTicket.status, createdAt: newTicket.createdAt }
    });
};

/**
 * @route   GET /api/v1/tickets/track/:token
 * @desc    Track ticket status by unique token
 */
exports.trackTicket = (req, res) => {
    const { token } = req.params;
    const targetSchool = getSchool(req);

    const ticketsDB = readTickets(targetSchool);
    const ticket = ticketsDB.find(t => t.token.toUpperCase() === token.toUpperCase());

    if (!ticket) {
        return res.status(404).json({ success: false, error: 'Ticket token not found.' });
    }

    return res.status(200).json({ success: true, data: ticket });
};

/**
 * @route   PATCH /api/v1/tickets/:id/status
 * @desc    Admin updates ticket status (e.g. mark IN_PROGRESS)
 */
exports.updateTicketStatus = (req, res) => {
    const ticketId = parseInt(req.params.id, 10);
    const { status, adminRemark } = req.body;
    const targetSchool = getSchool(req);

    const allowedStatuses = ['PENDING', 'IN_PROGRESS', 'CLOSED'];
    if (!status || !allowedStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({ success: false, error: 'Valid status (PENDING, IN_PROGRESS, CLOSED) is required.' });
    }

    const ticketsDB = readTickets(targetSchool);
    const ticketIndex = ticketsDB.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) {
        return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }

    const ticket = ticketsDB[ticketIndex];

    if (status.toUpperCase() === 'CLOSED' && ticket.status !== 'CLOSED') {
        ticket.closedAt = new Date().toISOString();
        ticket.resolutionTimeMinutes = Math.round((new Date(ticket.closedAt) - new Date(ticket.createdAt)) / (1000 * 60));
    }

    if (status.toUpperCase() === 'IN_PROGRESS') {
        if (!adminRemark || !adminRemark.trim()) {
            return res.status(400).json({ success: false, error: 'Technical remark is required to start this ticket.' });
        }
        ticket.adminRemark = adminRemark;
    }

    ticket.status = status.toUpperCase();
    ticketsDB[ticketIndex] = ticket;
    writeTickets(ticketsDB, targetSchool);

    return res.status(200).json({
        success: true,
        message: `Ticket status updated to ${status}.`,
        data: ticket
    });
};

/**
 * @route   PATCH /api/v1/tickets/:id/close
 * @desc    Close a ticket, add remark, and calculate resolution time
 */
exports.closeTicket = (req, res) => {
    const ticketId = parseInt(req.params.id, 10);
    const { adminRemark, closedBy } = req.body;
    const targetSchool = getSchool(req);

    if (!adminRemark) {
        return res.status(400).json({ success: false, error: 'Admin remark/work done detail is required.' });
    }

    const ticketsDB = readTickets(targetSchool);
    const ticketIndex = ticketsDB.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) {
        return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }

    const ticket = ticketsDB[ticketIndex];
    if (ticket.status === 'CLOSED') {
        return res.status(400).json({ success: false, error: 'Ticket is already closed.' });
    }

    const closedAt = new Date().toISOString();
    const createdAt = new Date(ticket.createdAt);
    const resolutionTimeMinutes = Math.round((new Date(closedAt) - createdAt) / (1000 * 60));

    const updatedTicket = {
        ...ticket,
        status: 'CLOSED',
        adminRemark,
        closedBy: closedBy || 'IT Administrator',
        closedAt,
        resolutionTimeMinutes
    };

    ticketsDB[ticketIndex] = updatedTicket;
    writeTickets(ticketsDB, targetSchool);

    return res.status(200).json({
        success: true,
        message: 'Ticket closed successfully.',
        data: updatedTicket
    });
};

/**
 * @route   GET /api/v1/tickets/dashboard
 * @desc    Get dashboard metrics and ticket list (supports role & user filtering)
 */
exports.getDashboardStats = (req, res) => {
    const { username, role } = req.query;
    const targetSchool = getSchool(req);

    const ticketsDB = readTickets(targetSchool);
    let filteredTickets = [...ticketsDB];

    // If the requester is a standard staff user, they only see their own tickets
    if (role === 'USER' && username) {
        filteredTickets = ticketsDB.filter(t => t.reportedBy.toLowerCase() === username.toLowerCase());
    }

    const total = filteredTickets.length;
    const pending = filteredTickets.filter(t => t.status === 'PENDING').length;
    const inProgress = filteredTickets.filter(t => t.status === 'IN_PROGRESS').length;
    const closed = filteredTickets.filter(t => t.status === 'CLOSED').length;

    const closedTickets = filteredTickets.filter(t => t.resolutionTimeMinutes !== null);
    const avgResolutionMinutes = closedTickets.length > 0
        ? Math.round(closedTickets.reduce((acc, t) => acc + t.resolutionTimeMinutes, 0) / closedTickets.length)
        : 0;

    const schoolSub = getSubscriptionForSchool(targetSchool);

    return res.status(200).json({
        success: true,
        stats: { total, pending, inProgress, closed, avgResolutionMinutes },
        tickets: filteredTickets,
        subscription: schoolSub
    });
};

/**
 * @route   GET /api/v1/tickets/reports/csv
 * @desc    Export downloadable CSV report with query parameters
 * @access  Admin
 */
exports.exportTicketsCSV = (req, res) => {
    try {
        const { status, category, startDate, endDate, floor } = req.query;
        const targetSchool = getSchool(req);

        const ticketsDB = readTickets(targetSchool);
        let filteredTickets = [...ticketsDB];

        // Filter by Status
        if (status && status.toUpperCase() !== 'ALL') {
            filteredTickets = filteredTickets.filter(t => t.status === status.toUpperCase());
        }

        // Filter by Category
        if (category) {
            filteredTickets = filteredTickets.filter(
                t => t.category.toLowerCase() === category.toLowerCase()
            );
        }

        // Filter by Floor
        if (floor) {
            filteredTickets = filteredTickets.filter(
                t => t.floor.toLowerCase() === floor.toLowerCase()
            );
        }

        // Filter by Date Range (Created At)
        if (startDate) {
            const start = new Date(startDate + 'T00:00:00');
            filteredTickets = filteredTickets.filter(t => new Date(t.createdAt) >= start);
        }
        if (endDate) {
            const end = new Date(endDate + 'T23:59:59.999');
            filteredTickets = filteredTickets.filter(t => new Date(t.createdAt) <= end);
        }

        // Format fields for CSV output
        const reportData = filteredTickets.map(ticket => ({
            'Ticket Token': ticket.token,
            'Status': ticket.status,
            'Staff Name': ticket.userName,
            'Contact Phone': ticket.userPhone,
            'Contact Email': ticket.userEmail,
            'Category': ticket.category,
            'Floor Location': ticket.floor,
            'Room/Lab No': ticket.roomNumber,
            'Subject': ticket.subject,
            'Description': ticket.description,
            'Reported By (User)': ticket.reportedBy,
            'Created Date & Time': ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A',
            'Closed Date & Time': ticket.closedAt ? new Date(ticket.closedAt).toLocaleString() : 'N/A',
            'Closed By (Admin)': ticket.closedBy || 'N/A',
            'Resolution Time (Mins)': ticket.resolutionTimeMinutes !== null ? ticket.resolutionTimeMinutes : 'N/A',
            'Admin Remarks / Work Done': ticket.adminRemark || 'N/A'
        }));

        // CSV Header definitions
        const fields = [
            'Ticket Token',
            'Status',
            'Staff Name',
            'Contact Phone',
            'Contact Email',
            'Category',
            'Floor Location',
            'Room/Lab No',
            'Subject',
            'Description',
            'Reported By (User)',
            'Created Date & Time',
            'Closed Date & Time',
            'Closed By (Admin)',
            'Resolution Time (Mins)',
            'Admin Remarks / Work Done'
        ];

        const json2csvParser = new Parser({ fields });
        const csvData = json2csvParser.parse(reportData);

        // Dynamic filename based on export timestamp
        const dateStr = new Date().toISOString().slice(0, 10);
        const filename = `${targetSchool}_IT_Helpdesk_Report_${dateStr}.csv`;

        // Set Response Headers for Direct CSV File Download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        return res.status(200).send(csvData);

    } catch (error) {
        console.error('CSV Export Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate CSV report.',
            details: error.message
        });
    }
};

exports.sendNotification = async (req, res) => {
    let {
        telegramEnabled,
        telegramBotToken,
        telegramChatId,
        whatsappEnabled,
        whatsappPhone,
        whatsappApiKey,
        title,
        message,
        alertType,
        school,
        ticket
    } = req.body;

    let telegramSent = false;
    let whatsappSent = false;
    let telegramError = null;
    let whatsappError = null;

    const activeTelegramToken = (telegramBotToken && telegramBotToken.trim()) || (process.env.DEFAULT_TELEGRAM_BOT_TOKEN && process.env.DEFAULT_TELEGRAM_BOT_TOKEN.trim());
    const activeTelegramChatId = (telegramChatId && telegramChatId.trim()) || (process.env.DEFAULT_TELEGRAM_BOT_CHAT_ID && process.env.DEFAULT_TELEGRAM_BOT_CHAT_ID.trim());

    const activeWhatsappPhone = (whatsappPhone && whatsappPhone.trim()) || (process.env.DEFAULT_WHATSAPP_PHONE && process.env.DEFAULT_WHATSAPP_PHONE.trim());
    const activeWhatsappApiKey = (whatsappApiKey && whatsappApiKey.trim()) || (process.env.DEFAULT_WHATSAPP_API_KEY && process.env.DEFAULT_WHATSAPP_API_KEY.trim());

    // Build rich Telegram message based on alert type
    const buildTelegramMessage = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        const schoolTag = school ? `🏫 ${school}` : '';

        if (alertType === 'NEW_TICKET' && ticket) {
            const lines = [
                `🚨 <b>New Complaint Registered</b>`,
                ``,
                `━━━━━━━━━━━━━━━━━━━━━`,
                `🏫 <b>Campus:</b> ${school || 'N/A'}`,
                `🎫 <b>Ticket:</b> <code>${ticket.token || 'N/A'}</code>`,
                `📅 <b>Date:</b> ${dateStr}`,
                `🕐 <b>Time:</b> ${timeStr}`,
                `━━━━━━━━━━━━━━━━━━━━━`,
                ``,
                `📋 <b>Category:</b> ${ticket.category || 'General'}`,
                `📝 <b>Subject:</b> ${ticket.subject || 'No Subject'}`,
                `👤 <b>Reported By:</b> ${ticket.userName || ticket.reportedBy || 'Unknown'}`,
                `📍 <b>Floor:</b> ${ticket.floor || 'N/A'}`,
                `🚪 <b>Room/Lab:</b> ${ticket.roomNumber || 'N/A'}`,
            ];
            if (ticket.description && ticket.description !== ticket.subject) {
                lines.push(`💬 <b>Description:</b> ${ticket.description}`);
            }
            if (ticket.userPhone) {
                lines.push(`📞 <b>Contact:</b> ${ticket.userPhone}`);
            }
            lines.push(``);
            lines.push(`⚡ <b>Status:</b> 🟡 PENDING`);
            lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
            lines.push(`<i>LogBook+ IT Helpdesk</i>`);
            return lines.join('\n');
        }

        if (alertType === 'STATUS_CHANGE' && ticket) {
            const statusEmoji = ticket.status === 'IN_PROGRESS' ? '🔵' : ticket.status === 'CLOSED' ? '🟢' : '🟡';
            const statusLabel = ticket.status === 'IN_PROGRESS' ? 'In Progress' : ticket.status === 'CLOSED' ? 'Closed' : 'Pending';
            const lines = [
                `🔄 <b>Ticket Status Updated</b>`,
                ``,
                `━━━━━━━━━━━━━━━━━━━━━`,
                `🏫 <b>Campus:</b> ${school || 'N/A'}`,
                `🎫 <b>Ticket:</b> <code>${ticket.token || 'N/A'}</code>`,
                `📅 <b>Date:</b> ${dateStr}`,
                `🕐 <b>Time:</b> ${timeStr}`,
                `━━━━━━━━━━━━━━━━━━━━━`,
                ``,
                `📋 <b>Category:</b> ${ticket.category || 'General'}`,
                `📝 <b>Subject:</b> ${ticket.subject || 'No Subject'}`,
                `⚡ <b>Status:</b> ${statusEmoji} ${statusLabel}`,
            ];
            if (ticket.adminRemark) {
                lines.push(`🛠️ <b>Action:</b> ${ticket.adminRemark}`);
            }
            if (ticket.status === 'CLOSED' && ticket.closedBy) {
                lines.push(`👨‍💻 <b>Closed By:</b> ${ticket.closedBy}`);
            }
            if (ticket.resolutionTimeMinutes) {
                const hrs = Math.floor(ticket.resolutionTimeMinutes / 60);
                const mins = ticket.resolutionTimeMinutes % 60;
                const resTime = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                lines.push(`⏱️ <b>Resolution Time:</b> ${resTime}`);
            }
            lines.push(``);
            lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
            lines.push(`<i>LogBook+ IT Helpdesk</i>`);
            return lines.join('\n');
        }

        if (alertType === 'CLOSED' && ticket) {
            const lines = [
                `✅ <b>Ticket Resolved</b>`,
                ``,
                `━━━━━━━━━━━━━━━━━━━━━`,
                `🏫 <b>Campus:</b> ${school || 'N/A'}`,
                `🎫 <b>Ticket:</b> <code>${ticket.token || 'N/A'}</code>`,
                `📅 <b>Date:</b> ${dateStr}`,
                `🕐 <b>Time:</b> ${timeStr}`,
                `━━━━━━━━━━━━━━━━━━━━━`,
                ``,
                `📋 <b>Category:</b> ${ticket.category || 'General'}`,
                `📝 <b>Subject:</b> ${ticket.subject || 'No Subject'}`,
                `👨‍💻 <b>Closed By:</b> ${ticket.closedBy || 'IT Admin'}`,
                `🛠️ <b>Work Done:</b> ${ticket.adminRemark || 'No remarks'}`,
            ];
            if (ticket.resolutionTimeMinutes) {
                const hrs = Math.floor(ticket.resolutionTimeMinutes / 60);
                const mins = ticket.resolutionTimeMinutes % 60;
                const resTime = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                lines.push(`⏱️ <b>Resolution Time:</b> ${resTime}`);
            }
            lines.push(``);
            lines.push(`⚡ <b>Status:</b> 🟢 CLOSED`);
            lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
            lines.push(`<i>LogBook+ IT Helpdesk</i>`);
            return lines.join('\n');
        }

        // Fallback: General / Test message
        const lines = [
            `🔔 <b>${title}</b>`,
            ``,
            `━━━━━━━━━━━━━━━━━━━━━`,
        ];
        if (school) lines.push(`🏫 <b>Campus:</b> ${school}`);
        lines.push(`📅 <b>Date:</b> ${dateStr}`);
        lines.push(`🕐 <b>Time:</b> ${timeStr}`);
        lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
        lines.push(``);
        lines.push(message);
        lines.push(``);
        lines.push(`<i>LogBook+ IT Helpdesk</i>`);
        return lines.join('\n');
    };

    if (telegramEnabled) {
        if (activeTelegramToken && activeTelegramChatId) {
            await new Promise((resolve) => {
                const postData = JSON.stringify({
                    chat_id: activeTelegramChatId,
                    text: buildTelegramMessage(),
                    parse_mode: 'HTML'
                });

                const options = {
                    hostname: 'api.telegram.org',
                    port: 443,
                    path: `/bot${activeTelegramToken}/sendMessage`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData)
                    }
                };

                const request = https.request(options, (response) => {
                    let data = '';
                    response.on('data', (chunk) => { data += chunk; });
                    response.on('end', () => {
                        if (response.statusCode >= 200 && response.statusCode < 300) {
                            telegramSent = true;
                        } else {
                            telegramError = `Telegram API Error (${response.statusCode}): ${data}`;
                            console.error(telegramError);
                        }
                        resolve();
                    });
                });

                request.on('error', (err) => {
                    telegramError = `Telegram connection error: ${err.message}`;
                    console.error(telegramError);
                    resolve();
                });

                request.write(postData);
                request.end();
            });
        } else {
            telegramError = 'Telegram bot token or chat ID is missing.';
            console.warn(telegramError);
        }
    }

    if (whatsappEnabled) {
        if (activeWhatsappPhone && activeWhatsappApiKey) {
            await new Promise((resolve) => {
                const cleanMessage = `[IT Helpdesk] ${title}: ${message}`.replace(/<[^>]*>/g, '');
                const encodedMsg = encodeURIComponent(cleanMessage);
                const path = `/whatsapp.php?phone=${activeWhatsappPhone.trim()}&apikey=${activeWhatsappApiKey.trim()}&text=${encodedMsg}`;

                const options = {
                    hostname: 'api.callmebot.com',
                    port: 443,
                    path: path,
                    method: 'GET'
                };

                const request = https.request(options, (response) => {
                    let data = '';
                    response.on('data', (chunk) => { data += chunk; });
                    response.on('end', () => {
                        if (response.statusCode >= 200 && response.statusCode < 300) {
                            whatsappSent = true;
                        } else {
                            whatsappError = `WhatsApp API Error (${response.statusCode}): ${data}`;
                            console.error(whatsappError);
                        }
                        resolve();
                    });
                });

                request.on('error', (err) => {
                    whatsappError = `WhatsApp connection error: ${err.message}`;
                    console.error(whatsappError);
                    resolve();
                });

                request.end();
            });
        } else {
            whatsappError = 'WhatsApp phone number or API key is missing.';
            console.warn(whatsappError);
        }
    }

    return res.status(200).json({
        success: true,
        telegramSent,
        whatsappSent,
        telegramError,
        whatsappError
    });
};

exports.getNotificationDefaults = (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            defaults: {
                telegramBotToken: (process.env.DEFAULT_TELEGRAM_BOT_TOKEN || '').trim(),
                telegramChatId: (process.env.DEFAULT_TELEGRAM_BOT_CHAT_ID || '').trim(),
                whatsappPhone: (process.env.DEFAULT_WHATSAPP_PHONE || '').trim(),
                whatsappApiKey: (process.env.DEFAULT_WHATSAPP_API_KEY || '').trim()
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

exports.getTags = (req, res) => {
    try {
        const tags = readTags();
        return res.status(200).json({ success: true, tags });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

exports.addTag = (req, res) => {
    try {
        const { tag } = req.body;
        if (!tag || !tag.trim()) {
            return res.status(400).json({ success: false, error: 'Tag name is required.' });
        }
        const tags = readTags();
        const newTag = tag.trim();
        if (tags.some(t => t.toLowerCase() === newTag.toLowerCase())) {
            return res.status(400).json({ success: false, error: 'Tag already exists.' });
        }
        tags.push(newTag);
        writeTags(tags);
        return res.status(201).json({ success: true, tags });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteTag = (req, res) => {
    try {
        const { tag } = req.params;
        if (!tag) {
            return res.status(400).json({ success: false, error: 'Tag name is required.' });
        }
        const tags = readTags();
        const filteredTags = tags.filter(t => t.toLowerCase() !== tag.toLowerCase());
        writeTags(filteredTags);
        return res.status(200).json({ success: true, tags: filteredTags });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};