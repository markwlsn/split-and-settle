const { supabaseAdmin } = require('../lib/supabaseClient');

/**
 * Middleware to enforce administrator privileges.
 * Verifies admin role against user metadata, environment admin email list,
 * or the user_roles PostgreSQL table.
 */
async function requireAdmin(req, res, next) {
  try {
    if (!req.userId || !req.user) {
      return res.status(401).json({ error: 'Authentication required before admin verification' });
    }

    const userEmail = (req.user.email || '').toLowerCase().trim();
    const userRole = req.user.user_metadata?.role || req.user.app_metadata?.role;

    // Check 1: User metadata explicitly indicates admin role
    if (userRole === 'admin') {
      req.isAdmin = true;
      return next();
    }

    // Check 2: Admin emails whitelist (from environment or default owner)
    const adminEmailsEnv = process.env.ADMIN_EMAILS || 'markwilsongeronilla01@gmail.com';
    const adminEmails = adminEmailsEnv
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (userEmail && adminEmails.includes(userEmail)) {
      req.isAdmin = true;
      return next();
    }

    // Check 3: Check database user_roles table
    try {
      const { data, error } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', req.userId)
        .single();

      if (!error && data && data.role === 'admin') {
        req.isAdmin = true;
        return next();
      }
    } catch (dbErr) {
      // Table may not exist yet in fresh migration; fallback to previous checks
      console.warn('user_roles query skipped or unavailable:', dbErr.message);
    }

    return res.status(403).json({
      error: 'Access denied: Administrator privileges required to access this resource.',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify admin privileges: ' + err.message });
  }
}

module.exports = { requireAdmin };
