import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kxjyewhhdyeylfagwieb.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_qekJJhIYjEh52w5IfnGCqw_LRraeFBG';
  return createBrowserClient(url, key);
}
