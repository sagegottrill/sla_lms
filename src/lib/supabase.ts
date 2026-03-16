import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

// Check if credentials are placeholders via console warning for dev environment
if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') {
  console.warn('Supabase credentials are not set in .env! Using placeholder values.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
