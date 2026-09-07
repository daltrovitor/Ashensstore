import { getSupabaseServer, getSupabaseService } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Simple admin validation - accepts any authenticated Supabase user.
 * Returns user data if token is valid, or null otherwise.
 */
export async function validateAdminRequest(request?: Request) {
  try {
    if (!request) return null

    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    if (!authHeader) return null

    // Dev shortcuts: accept a known DEV_ADMIN_TOKEN or Basic auth with dev credentials when not in production
    const DEV_ADMIN_TOKEN = process.env.DEV_ADMIN_TOKEN || 'DEV_ADMIN_TOKEN'
    const DEV_ADMIN_EMAIL = 'admin@ashensstore.com.br'
    const DEV_ADMIN_PASSWORD = 'Ashens@2024!'

    // Bearer token path
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length).trim()
      if (token === DEV_ADMIN_TOKEN && process.env.NODE_ENV !== 'production') {
        return { id: 'dev-admin', username: 'admin', email: DEV_ADMIN_EMAIL }
      }

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !anonKey || !token) {
        return null
      }

      const supabase = createClient(url, anonKey)
      const { data: userData, error: userError } = await supabase.auth.getUser(token)

      if (userError || !userData?.user) {
        return null
      }

      const userId = userData.user.id
      const userEmail = userData.user.email

      // Return user data - any authenticated Supabase user is admin
      return {
        id: userId,
        username: userEmail?.split('@')[0] || 'admin',
        email: userEmail,
      }
    }

    // Basic auth fallback for dev: Basic base64(email:password)
    if (authHeader?.startsWith('Basic ') && process.env.NODE_ENV !== 'production') {
      try {
        const b = authHeader.slice('Basic '.length)
        const decoded = Buffer.from(b, 'base64').toString('utf-8')
        const [email, password] = decoded.split(':')
        if (email === DEV_ADMIN_EMAIL && password === DEV_ADMIN_PASSWORD) {
          return { id: 'dev-admin', username: 'admin', email: DEV_ADMIN_EMAIL }
        }
      } catch (e) {
        return null
      }
    }

    return null
  } catch (err) {
    console.warn('[validateAdminRequest] Error:', err)
    return null
  }
}
