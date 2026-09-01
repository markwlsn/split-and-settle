const { getSupabaseAnon } = require('../lib/supabaseClient');

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    const supabaseAnon = getSupabaseAnon();
    const { data, error } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(201).json({
      accessToken: data.session?.access_token || null,
      user: data.user,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const supabaseAnon = getSupabaseAnon();
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return res.status(401).json({ error: error.message });
    }
    return res.json({
      accessToken: data.session?.access_token || null,
      user: data.user,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
