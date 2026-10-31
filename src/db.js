import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://btqulwxrgxrtywnhfjdy.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0cXVsd3hyZ3hydHl3bmhmamR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0MDQxODAsImV4cCI6MjEwODk4MDE4MH0.4XooPm9AZ-aGz2WNbvrDYWypSsQqArl08_Qri2qtmnE';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseKey = (rawAnonKey && rawAnonKey !== 'your-supabase-anon-key') ? rawAnonKey : defaultAnonKey;

// Configured strictly for PostgreSQL Database queries (Auth & Storage services disabled)
export const db = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
