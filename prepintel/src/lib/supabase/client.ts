import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Gracefully handle missing keys for local development UI testing
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createBrowserClient(url, key)
}
