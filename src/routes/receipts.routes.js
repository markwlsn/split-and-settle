const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createItemSchema,
  updateItemSchema,
  updateReceiptSchema,
  manualExpenseSchema,
  sharesSchema,
  autoSplitSchema,
} = require('../utils/schemas');
const {
  uploadReceipt,
  createManualExpense,
  parseReceipt,
  getReceipt,
  getReceiptImageUrl,
  updateReceipt,
  deleteReceipt,
  addItem,
  deleteItem,
  autoSplitReceipt,
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

// Upload photo receipt for a group
router.post('/groups/:id/receipts', requireAuth, upload.single('image'), uploadReceipt);

// Create manual expense without a photo
router.post('/groups/:id/expenses', requireAuth, validate(manualExpenseSchema), createManualExpense);

// Parse receipt with Gemini Vision
router.post('/receipts/:id/parse', requireAuth, parseReceipt);

// Get receipt details with items & shares
router.get('/receipts/:id', requireAuth, getReceipt);

// Get short-lived signed image URL
router.get('/receipts/:id/image-url', requireAuth, getReceiptImageUrl);

// Update receipt metadata (payer, merchant, date, category, tax/tip, notes)
router.patch('/receipts/:id', requireAuth, validate(updateReceiptSchema), updateReceipt);

// Delete receipt and image
router.delete('/receipts/:id', requireAuth, deleteReceipt);

// Smart auto-split across members
router.post('/receipts/:id/auto-split', requireAuth, validate(autoSplitSchema), autoSplitReceipt);

// Add individual line item to receipt
router.post('/receipts/:receiptId/items', requireAuth, validate(createItemSchema), addItem);

// Delete individual line item from receipt
router.delete('/receipts/:receiptId/items/:itemId', requireAuth, deleteItem);

// Update individual receipt item
router.patch('/receipts/:receiptId/items/:itemId', requireAuth, validate(updateItemSchema), updateItem);

// Set custom item shares
router.post('/receipts/:receiptId/items/:itemId/shares', requireAuth, validate(sharesSchema), setItemShares);

// Confirm receipt and recompute settlements
router.post('/receipts/:id/confirm', requireAuth, confirmReceipt);

module.exports = router;
