const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { verifyHelpdeskToken, requireAdminRole } = require('./authRoutes');

// Public User Routes
router.post('/', ticketController.createTicket);
router.get('/track/:token', ticketController.trackTicket);
router.get('/tags', ticketController.getTags);

// Authenticated Dashboard Routes
router.get('/dashboard', verifyHelpdeskToken, ticketController.getDashboardStats);
router.patch('/:id/status', verifyHelpdeskToken, ticketController.updateTicketStatus);
router.patch('/:id/close', verifyHelpdeskToken, ticketController.closeTicket);
router.post('/send-notification', verifyHelpdeskToken, ticketController.sendNotification);
router.get('/settings/defaults', verifyHelpdeskToken, ticketController.getNotificationDefaults);

// Admin / Super Admin Only Routes
router.get('/reports/csv', requireAdminRole, ticketController.exportTicketsCSV);
router.post('/tags', requireAdminRole, ticketController.addTag);
router.delete('/tags/:tag', requireAdminRole, ticketController.deleteTag);

module.exports = router;