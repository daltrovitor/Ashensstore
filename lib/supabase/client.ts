// Hello World
"use client"

import { createBrowserClient } from '@supabase/ssr'

// Small helper to create a browser supabase client using public keys.
// This client is intended for use in client components only.
// It uses createBrowserClient to ensure cookies are automatically handled.
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

    supabaseClient = createBrowserClient(url, anonKey)
  }

  return supabaseClient
}
