const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { paymentSchema } = require('../utils/schemas');
const {
  listSettlements,
  recordPayment,
} = require('../controllers/settlement.controller');

router.get('/groups/:id/settlements', requireAuth, listSettlements);
router.post('/groups/:id/settlements/payments', requireAuth, validate(paymentSchema), recordPayment);

module.exports = router;
