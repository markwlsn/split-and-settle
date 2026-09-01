const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { updateItemSchema, sharesSchema } = require('../utils/schemas');
const {
  uploadReceipt,
  parseReceipt,
  getReceipt,
  updateItem,
  setItemShares,
} = require('../controllers/receipt.controller');
const { confirmReceipt } = require('../controllers/settlement.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP, HEIC) are allowed'), false);
    }
  },
});

// Upload receipt for a group
router.post('/groups/:id/receipts', requireAuth, upload.single('image'), uploadReceipt);

// Parse receipt with Gemini Vision
router.post('/receipts/:id/parse', requireAuth, parseReceipt);

// Get receipt details
router.get('/receipts/:id', requireAuth, getReceipt);

// Update receipt item
router.patch('/receipts/:receiptId/items/:itemId', requireAuth, validate(updateItemSchema), updateItem);

// Set item shares
router.post('/receipts/:receiptId/items/:itemId/shares', requireAuth, validate(sharesSchema), setItemShares);

// Confirm receipt and recompute settlements
router.post('/receipts/:id/confirm', requireAuth, confirmReceipt);

module.exports = router;
