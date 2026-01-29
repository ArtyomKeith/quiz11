import { createClient } from '@supabase/supabase-js';

// Helper to safely access env vars whether in Vite or other environments
// This prevents crashes if import.meta.env is undefined
const getEnv = (key: string, defaultValue: string) => {
  const meta = import.meta as any;
  // Check if meta.env exists before accessing properties
  if (meta && meta.env && meta.env[key]) {
    return meta.env[key];
  }
  return defaultValue;
};

// Vite uses VITE_ prefix for env vars
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL', 'https://bajvcygbaqwwatkzcfwr.supabase.co');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhanZjeWdiYXF3d2F0a3pjZndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjExOTQsImV4cCI6MjA4NTIzNzE5NH0.Pjybf2HB2XBgedtMzm4IvydbTQVC2R4YTq1LpbN2URg');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);