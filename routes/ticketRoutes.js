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

module.exports = router;