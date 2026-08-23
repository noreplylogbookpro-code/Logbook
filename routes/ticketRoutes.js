const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

// Public User Routes
router.post('/', ticketController.createTicket);
router.get('/track/:token', ticketController.trackTicket);

// Admin / Dashboard Routes
router.get('/dashboard', ticketController.getDashboardStats);
router.patch('/:id/status', ticketController.updateTicketStatus);
router.patch('/:id/close', ticketController.closeTicket);

// Report Generation Endpoint
router.get('/reports/csv', ticketController.exportTicketsCSV);

// Tags Routes
router.get('/tags', ticketController.getTags);
router.post('/tags', ticketController.addTag);
router.delete('/tags/:tag', ticketController.deleteTag);

// Notification Dispatcher
router.post('/send-notification', ticketController.sendNotification);
router.get('/settings/defaults', ticketController.getNotificationDefaults);

module.exports = router;