const { generateTicketToken } = require('../utils/tokenGenerator');
const { Parser } = require('json2csv');
const { readTickets, writeTickets, readSubscriptions, getSubscriptionForSchool } = require('../utils/dbHelper');

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
    const { userName, userPhone, userEmail, category, subject, description, floor, roomNumber, reportedBy, isPrefilled } = req.body;
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
    const { status } = req.body;
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