require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const DEFAULT_URL = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const DEFAULT_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';
const DEFAULT_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || DEFAULT_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_KEY;
  return createClient(url, serviceKey);
}

const supabaseAdmin = getSupabaseAdmin();

function supabaseForUser(accessToken) {
  const url = process.env.SUPABASE_URL || DEFAULT_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

function getSupabaseAnon() {
  const url = process.env.SUPABASE_URL || DEFAULT_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
  return createClient(url, anonKey);
}

module.exports = {
  supabaseAdmin,
  supabaseForUser,
  getSupabaseAnon,
  getSupabaseAdmin,
};
