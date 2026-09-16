const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { validate } = require('../middleware/validate.middleware');
const { updateTicketSchema } = require('../utils/schemas');
const adminController = require('../controllers/admin.controller');

// All admin routes require valid authentication followed by admin role validation
router.use(requireAuth);
router.use(requireAdmin);

// System Monitoring & Stats
router.get('/stats', adminController.getStats);

// Ticket Triage Queue
router.get('/tickets', adminController.getTickets);
router.patch('/tickets/:id', validate(updateTicketSchema), adminController.updateTicket);

// Bills & Expense Monitor
router.get('/bills', adminController.getBills);

// User & Identity Directory
router.get('/users', adminController.getUsers);
router.post('/users/:id/archive', adminController.archiveUser);
router.post('/users/:id/unarchive', adminController.unarchiveUser);
router.post('/users/:id/revoke-sessions', adminController.revokeUserSessions);

// Security Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
