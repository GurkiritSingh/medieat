const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Public client (respects RLS, used for frontend-facing routes)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Admin client (bypasses RLS, used for server-side operations)
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = { supabase, supabaseAdmin };
