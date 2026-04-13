// ============================================================
// Supabase client config (anon key only — safe to publish).
// All security relies on Row Level Security policies in the
// `profiles` table — see SUPABASE_SETUP.sql.
// ============================================================

const SUPABASE_URL = 'https://qrswutkoygynhtzpxqfi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyc3d1dGtveWd5bmh0enB4cWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjQ3MTcsImV4cCI6MjA5MDEwMDcxN30.ITBPc-Qm2LlSk4asrXUfor9JFSZ95iT3AYJ6Cm-vlPY';

// supabase global is provided by the CDN script in index.html
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: window.localStorage
    }
});
