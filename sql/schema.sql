-- =============================================================================
-- Split & Settle Full Database Schema & Row Level Security (RLS)
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
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- GROUPS POLICIES
CREATE POLICY "groups_select_member" ON groups FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "groups_insert_own" ON groups FOR INSERT WITH CHECK (
  auth.uid() = created_by
);

CREATE POLICY "groups_update_creator" ON groups FOR UPDATE USING (
  auth.uid() = created_by
);

CREATE POLICY "groups_delete_creator" ON groups FOR DELETE USING (
  auth.uid() = created_by
);

-- GROUP MEMBERS POLICIES
CREATE POLICY "members_select_same_group" ON group_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "members_insert_if_group_member_or_creator" ON group_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_id AND g.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "members_delete_own_or_creator" ON group_members FOR DELETE USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_id AND g.created_by = auth.uid()
  )
);

-- RECEIPTS POLICIES
CREATE POLICY "receipts_select_group_member" ON receipts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = receipts.group_id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "receipts_insert_group_member" ON receipts FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = receipts.group_id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "receipts_update_group_member" ON receipts FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = receipts.group_id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "receipts_delete_group_member" ON receipts FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = receipts.group_id AND gm.user_id = auth.uid()
  )
);

-- RECEIPT ITEMS POLICIES
CREATE POLICY "items_all_group_member" ON receipt_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM receipts r
    JOIN group_members gm ON gm.group_id = r.group_id
    WHERE r.id = receipt_items.receipt_id AND gm.user_id = auth.uid()
  )
);

-- ITEM SHARES POLICIES
CREATE POLICY "shares_select_group_member" ON item_shares FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM receipt_items ri
    JOIN receipts r ON r.id = ri.receipt_id
    JOIN group_members gm ON gm.group_id = r.group_id
    WHERE ri.id = item_shares.item_id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "shares_insert_group_member" ON item_shares FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM receipt_items ri
    JOIN receipts r ON r.id = ri.receipt_id
    JOIN group_members gm ON gm.group_id = r.group_id
    WHERE ri.id = item_shares.item_id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "shares_delete_group_member" ON item_shares FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM receipt_items ri
    JOIN receipts r ON r.id = ri.receipt_id
    JOIN group_members gm ON gm.group_id = r.group_id
    WHERE ri.id = item_shares.item_id AND gm.user_id = auth.uid()
  )
);

-- SETTLEMENTS POLICIES
CREATE POLICY "settlements_all_group_member" ON settlements FOR ALL USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = settlements.group_id AND gm.user_id = auth.uid()
  )
);

-- ACTIVITY LOGS POLICIES
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
