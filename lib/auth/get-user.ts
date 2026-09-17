import { getSupabaseServer } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function getAuthUser(request?: Request) {
  // 1. Tenta pegar via cookies (sessão SSR)
  try {
    const supabase = await getSupabaseServer()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!error && user) return user
  } catch {}

  // 2. Tenta pegar via Bearer token
  if (request) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim()
      try {
        const client = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { user }, error } = await client.auth.getUser(token)
        if (!error && user) return user
      } catch {}
    }
  }

  return null
}
