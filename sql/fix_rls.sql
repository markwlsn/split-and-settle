-- =============================================================================
-- Split & Settle: Complete Non-Recursive RLS Fix & Full Setup
-- =============================================================================

-- 1. Helper function to check group membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_member_of_group(lookup_group_id UUID, lookup_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = lookup_group_id AND user_id = lookup_user_id
  );
$$;

-- 2. Clean up old policies on all tables
DROP POLICY IF EXISTS "groups_select_member" ON groups;
DROP POLICY IF EXISTS "groups_insert_own" ON groups;
DROP POLICY IF EXISTS "groups_update_creator" ON groups;
DROP POLICY IF EXISTS "groups_delete_creator" ON groups;
DROP POLICY IF EXISTS "groups_select_policy" ON groups;
DROP POLICY IF EXISTS "groups_insert_policy" ON groups;
DROP POLICY IF EXISTS "groups_update_policy" ON groups;
DROP POLICY IF EXISTS "groups_delete_policy" ON groups;

DROP POLICY IF EXISTS "members_select_same_group" ON group_members;
DROP POLICY IF EXISTS "members_insert_if_group_member_or_creator" ON group_members;
DROP POLICY IF EXISTS "members_delete_own_or_creator" ON group_members;
DROP POLICY IF EXISTS "members_select_policy" ON group_members;
DROP POLICY IF EXISTS "members_insert_policy" ON group_members;
DROP POLICY IF EXISTS "members_delete_policy" ON group_members;

DROP POLICY IF EXISTS "receipts_select_group_member" ON receipts;
DROP POLICY IF EXISTS "receipts_insert_group_member" ON receipts;
DROP POLICY IF EXISTS "receipts_update_group_member" ON receipts;
DROP POLICY IF EXISTS "receipts_delete_group_member" ON receipts;
DROP POLICY IF EXISTS "receipts_select_policy" ON receipts;
DROP POLICY IF EXISTS "receipts_insert_policy" ON receipts;
DROP POLICY IF EXISTS "receipts_update_policy" ON receipts;
DROP POLICY IF EXISTS "receipts_delete_policy" ON receipts;

DROP POLICY IF EXISTS "items_all_group_member" ON receipt_items;
DROP POLICY IF EXISTS "items_all_policy" ON receipt_items;

DROP POLICY IF EXISTS "shares_select_group_member" ON item_shares;
DROP POLICY IF EXISTS "shares_insert_group_member" ON item_shares;
DROP POLICY IF EXISTS "shares_delete_group_member" ON item_shares;
DROP POLICY IF EXISTS "shares_all_policy" ON item_shares;

DROP POLICY IF EXISTS "settlements_all_group_member" ON settlements;
DROP POLICY IF EXISTS "settlements_all_policy" ON settlements;

DROP POLICY IF EXISTS "activity_select_group_member" ON activity_logs;
DROP POLICY IF EXISTS "activity_insert_group_member" ON activity_logs;
DROP POLICY IF EXISTS "activity_select_policy" ON activity_logs;
DROP POLICY IF EXISTS "activity_insert_policy" ON activity_logs;

-- =============================================================================
-- 3. Apply Clean Non-Recursive Policies
-- =============================================================================

-- GROUPS
CREATE POLICY "groups_select_policy" ON groups FOR SELECT USING (
  created_by = auth.uid()
  OR public.is_member_of_group(id, auth.uid())
);

CREATE POLICY "groups_insert_policy" ON groups FOR INSERT WITH CHECK (
  auth.uid() = created_by
);

CREATE POLICY "groups_update_policy" ON groups FOR UPDATE USING (
  auth.uid() = created_by
);

CREATE POLICY "groups_delete_policy" ON groups FOR DELETE USING (
  auth.uid() = created_by
);

-- GROUP MEMBERS
CREATE POLICY "members_select_policy" ON group_members FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM groups g WHERE g.id = group_members.group_id AND g.created_by = auth.uid())
  OR public.is_member_of_group(group_id, auth.uid())
);

CREATE POLICY "members_insert_policy" ON group_members FOR INSERT WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM groups g WHERE g.id = group_members.group_id AND g.created_by = auth.uid())
  OR public.is_member_of_group(group_id, auth.uid())
);

CREATE POLICY "members_delete_policy" ON group_members FOR DELETE USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM groups g WHERE g.id = group_members.group_id AND g.created_by = auth.uid())
);

-- RECEIPTS
CREATE POLICY "receipts_select_policy" ON receipts FOR SELECT USING (
  public.is_member_of_group(group_id, auth.uid())
);

CREATE POLICY "receipts_insert_policy" ON receipts FOR INSERT WITH CHECK (
  public.is_member_of_group(group_id, auth.uid())
);

CREATE POLICY "receipts_update_policy" ON receipts FOR UPDATE USING (
  public.is_member_of_group(group_id, auth.uid())
);

CREATE POLICY "receipts_delete_policy" ON receipts FOR DELETE USING (
  public.is_member_of_group(group_id, auth.uid())
);

-- RECEIPT ITEMS
CREATE POLICY "items_all_policy" ON receipt_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM receipts r
    WHERE r.id = receipt_items.receipt_id AND public.is_member_of_group(r.group_id, auth.uid())
  )
);

-- ITEM SHARES
CREATE POLICY "shares_all_policy" ON item_shares FOR ALL USING (
  EXISTS (
    SELECT 1 FROM receipt_items ri
    JOIN receipts r ON r.id = ri.receipt_id
    WHERE ri.id = item_shares.item_id AND public.is_member_of_group(r.group_id, auth.uid())
  )
);

-- SETTLEMENTS
CREATE POLICY "settlements_all_policy" ON settlements FOR ALL USING (
  public.is_member_of_group(group_id, auth.uid())
);

-- ACTIVITY LOGS
CREATE POLICY "activity_select_policy" ON activity_logs FOR SELECT USING (
  public.is_member_of_group(group_id, auth.uid())
);

CREATE POLICY "activity_insert_policy" ON activity_logs FOR INSERT WITH CHECK (
  public.is_member_of_group(group_id, auth.uid())
);

-- 4. Fast Performance Indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group_user ON group_members(group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_group_id ON receipts(group_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_item_shares_item_id ON item_shares(item_id);
CREATE INDEX IF NOT EXISTS idx_settlements_group_id ON settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_group_id ON activity_logs(group_id);
