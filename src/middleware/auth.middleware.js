const { supabaseForUser } = require('../lib/supabaseClient');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const supabase = supabaseForUser(token);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired authorization token' });
    }

    req.userId = data.user.id;
    req.user = data.user;
    req.supabase = supabase;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed: ' + err.message });
  }
}

module.exports = { requireAuth };
