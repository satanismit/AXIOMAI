import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured =
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('YOUR_SUPABASE');

if (!isConfigured) {
    console.warn(
        '[AXIOMAI] Supabase env vars are missing or still placeholders.\n' +
        'Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in axiomai-ui/.env'
    );
}

// Only create client when real credentials are present to avoid URL validation crash
export const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://placeholder.supabase.co', 'placeholder-key-replace-me');

