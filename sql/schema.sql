-- =============================================================================
-- SPLIT & SETTLE: COMPLETE MASTER DATABASE SCHEMA & ZERO-RECURSION RLS
-- =============================================================================

-- 1. GROUPS TABLE
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE groups ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

-- 2. GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- 3. RECEIPTS TABLE
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  paid_by UUID NOT NULL REFERENCES auth.users(id),
  image_path TEXT,
  merchant_name TEXT,
  total_amount NUMERIC(10,2),
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  tip_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Other',
  notes TEXT,
  receipt_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'parsed', 'confirmed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE receipts ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Other';
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE receipts ALTER COLUMN image_path DROP NOT NULL;

-- 4. RECEIPT ITEMS TABLE
CREATE TABLE IF NOT EXISTS receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);

-- 5. ITEM SHARES TABLE
CREATE TABLE IF NOT EXISTS item_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES receipt_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_amount NUMERIC(10,2) NOT NULL,
  UNIQUE (item_id, user_id)
);

-- 6. SETTLEMENTS TABLE
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  from_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'computed' CHECK (type IN ('computed', 'payment')),
  settled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- SECURITY DEFINER HELPER FUNCTIONS (Bypasses RLS to prevent recursion)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_group_member(lookup_group_id UUID, lookup_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = lookup_group_id AND user_id = lookup_user_id
  );
$$;

-- Alias for backwards compatibility
CREATE OR REPLACE FUNCTION public.is_member_of_group(lookup_group_id UUID, lookup_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = lookup_group_id AND user_id = lookup_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_creator(lookup_group_id UUID, lookup_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = lookup_group_id AND created_by = lookup_user_id
  );
$$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 1. DROP ALL OLD POLICIES ON ALL TABLES
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('groups', 'group_members', 'receipts', 'receipt_items', 'item_shares', 'settlements', 'activity_logs')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 2. GROUPS POLICIES
CREATE POLICY "groups_select_policy" ON groups FOR SELECT USING (
  created_by = auth.uid() OR public.is_group_member(id, auth.uid())
);

CREATE POLICY "groups_insert_policy" ON groups FOR INSERT WITH CHECK (
  created_by = auth.uid()
);

CREATE POLICY "groups_update_policy" ON groups FOR UPDATE USING (
  created_by = auth.uid()
);

CREATE POLICY "groups_delete_policy" ON groups FOR DELETE USING (
  created_by = auth.uid()
);

-- 3. GROUP MEMBERS POLICIES
CREATE POLICY "members_select_policy" ON group_members FOR SELECT USING (
  user_id = auth.uid() OR public.is_group_member(group_id, auth.uid())
);

CREATE POLICY "members_insert_policy" ON group_members FOR INSERT WITH CHECK (
  user_id = auth.uid() OR public.is_group_creator(group_id, auth.uid()) OR public.is_group_member(group_id, auth.uid())
);

CREATE POLICY "members_delete_policy" ON group_members FOR DELETE USING (
  user_id = auth.uid() OR public.is_group_creator(group_id, auth.uid())
);

-- 4. RECEIPTS POLICIES
CREATE POLICY "receipts_select_policy" ON receipts FOR SELECT USING (
  public.is_group_member(group_id, auth.uid())
);

CREATE POLICY "receipts_insert_policy" ON receipts FOR INSERT WITH CHECK (
  public.is_group_member(group_id, auth.uid())
);

CREATE POLICY "receipts_update_policy" ON receipts FOR UPDATE USING (
  public.is_group_member(group_id, auth.uid())
);

CREATE POLICY "receipts_delete_policy" ON receipts FOR DELETE USING (
  public.is_group_member(group_id, auth.uid())
);

-- 5. RECEIPT ITEMS POLICIES
CREATE POLICY "items_all_policy" ON receipt_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM receipts r
    WHERE r.id = receipt_items.receipt_id AND public.is_group_member(r.group_id, auth.uid())
  )
);

-- 6. ITEM SHARES POLICIES
CREATE POLICY "shares_all_policy" ON item_shares FOR ALL USING (
  EXISTS (
    SELECT 1 FROM receipt_items ri
    JOIN receipts r ON r.id = ri.receipt_id
    WHERE ri.id = item_shares.item_id AND public.is_group_member(r.group_id, auth.uid())
  )
);

-- 7. SETTLEMENTS POLICIES
CREATE POLICY "settlements_all_policy" ON settlements FOR ALL USING (
  public.is_group_member(group_id, auth.uid())
);

-- 8. ACTIVITY LOGS POLICIES
CREATE POLICY "activity_select_policy" ON activity_logs FOR SELECT USING (
  public.is_group_member(group_id, auth.uid())
);

CREATE POLICY "activity_insert_policy" ON activity_logs FOR INSERT WITH CHECK (
  public.is_group_member(group_id, auth.uid())
);

-- 9. STORAGE BUCKET POLICIES
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'receipts_bucket_upload') THEN
    CREATE POLICY "receipts_bucket_upload" ON storage.objects FOR INSERT WITH CHECK (
      bucket_id = 'receipts' AND auth.role() = 'authenticated'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'receipts_bucket_read') THEN
    CREATE POLICY "receipts_bucket_read" ON storage.objects FOR SELECT USING (
      bucket_id = 'receipts' AND auth.role() = 'authenticated'
    );
  END IF;
END $$;

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_group_members_group_user ON group_members(group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_group_id ON receipts(group_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_item_shares_item_id ON item_shares(item_id);
CREATE INDEX IF NOT EXISTS idx_settlements_group_id ON settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_group_id ON activity_logs(group_id);
