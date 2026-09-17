import { NextResponse } from 'next/server'
import { getSupabaseServer, getSupabaseService } from '@/lib/supabase/server'

/**
 * Resposta padrão para rotas administrativas quando não autenticado.
 * Retorna 404 Not Found para mascarar completamente a existência da rota para invasores e scanners.
 */
export function adminNotFoundResponse() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function checkAdminAuth(request: Request) {
  try {
    const supabase = await getSupabaseServer()

    // 1. Get current authenticated user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('[AdminAuth] No valid session:', authError?.message)
      return null
    }

    // 2. Fetch profile to check role
    // Using SERVICE ROLE to bypass potentially recursive RLS policies on 'profiles' table
    try {
      const supabaseAdmin = getSupabaseService()
      if (!supabaseAdmin) {
        console.error('[AdminAuth] Service role client not available')
        return null
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        console.log('[AdminAuth] Profile fetch error or not found:', profileError?.message)
        return null
      }

      // 3. Verify admin/manager role
      if (!profile.role || !['admin', 'manager'].includes(profile.role)) {
        console.log('[AdminAuth] Access denied for role:', profile.role)
        return null
      }

      // Return the authorized details
      return { user, profile, supabase }
    } catch (err) {
      console.error('[AdminAuth] Crash during profile check:', err)
      return null
    }
  } catch (error) {
    console.error('[AdminAuth] Critical error:', error)
    return null
  }
}
