-- =============================================================================
-- Split & Settle Migration v3: Multi-Currency & Manual Expense Support
-- =============================================================================

-- 1. Add currency column to groups (defaults to USD)
ALTER TABLE groups ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

-- 2. Make image_path nullable in receipts to support manual/cash expenses
ALTER TABLE receipts ALTER COLUMN image_path DROP NOT NULL;
