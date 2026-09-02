-- =============================================================================
-- Split & Settle Migration v2: Security, Invite Codes, Analytics & Audit Logs
-- =============================================================================

-- 1. Add invite_code to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- 2. Add category, notes, tax, tip to receipts table
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Other';
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

-- 3. Create activity_logs table for group audit trail & feed
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_select_group_member" ON activity_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = activity_logs.group_id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "activity_insert_group_member" ON activity_logs FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = activity_logs.group_id AND gm.user_id = auth.uid()
  )
);
