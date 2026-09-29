// Hello World
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

export async function getSupabaseServer() {
  const cookieStore = await cookies()
  // Ensure environment variables are present before creating the client.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    // Return a minimal dummy client object so callers receive a non-null value
    // This avoids widespread `possibly null` TypeScript errors in route files.
    // At runtime any attempted operation will throw with a clear message.
    const thrower = () => {
      throw new Error('Supabase not configured')
    }
    const dummy = new Proxy(
      {},
      {
        get() {
          return thrower
        },
      }
    )
    return dummy as any
  }

  // NOTE: server uses the anon key for normal server-side requests that run
  // with the current request cookies (session-aware). Privileged operations
  // (bypassing Row Level Security) require the service role key and should
  // be done with `getSupabaseService()` below.
  // Provide the cookie helpers expected by the current Supabase types.
  // Cast to `any` where necessary to avoid mismatches across Next.js versions.
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Returns a supabase client authenticated with the service role key if present.
// This client bypasses RLS and should only be used in secure server environments.
export function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return null
  }

  return createClient(url, serviceKey)
}
