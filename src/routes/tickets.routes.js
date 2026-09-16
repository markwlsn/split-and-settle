const express = require('express');
const router = express.Router();
const { createTicket, getMyTickets } = require('../controllers/tickets.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createTicketSchema } = require('../utils/schemas');

router.post('/', requireAuth, validate(createTicketSchema), createTicket);
router.get('/my-tickets', requireAuth, getMyTickets);

module.exports = router;
