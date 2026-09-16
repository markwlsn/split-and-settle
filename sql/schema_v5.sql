-- =============================================================================
-- Split & Settle Migration v5: Role-Based Access Control (RBAC),
-- Security Audit Logs & Admin Space Infrastructure
-- =============================================================================

-- 1. USER ROLES TABLE
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 2. SECURITY DEFINER HELPER TO CHECK ADMIN STATUS
-- This function runs with elevated privileges to safely verify admin membership without recursion
CREATE OR REPLACE FUNCTION public.is_admin(lookup_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = lookup_user_id AND role = 'admin'
  );
$$;

-- 3. USER ROLES POLICIES
-- Users can view their own role
CREATE POLICY "Users can view their own role"
ON user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Only admins can insert or update roles
CREATE POLICY "Admins can manage user roles"
ON user_roles FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 4. SECURITY AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'ticket', 'user', 'session', 'group', 'system'
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on security_audit_logs
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read security audit logs
CREATE POLICY "Admins can view security audit logs"
ON security_audit_logs FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Authenticated backend services can insert audit logs
CREATE POLICY "Services and admins can insert audit logs"
ON security_audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. EXTEND TICKETS TABLE POLICIES FOR ADMIN ACCESS
-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
ON tickets FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can update tickets (e.g., mark resolved, add admin notes)
CREATE POLICY "Admins can update tickets"
ON tickets FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 6. INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON security_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_type ON tickets(type);
