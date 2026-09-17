import { NextResponse } from 'next/server'
import { checkAdminAuth, adminNotFoundResponse } from '@/lib/auth/admin-middleware'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const auth = await checkAdminAuth(request)
    if (!auth) {
      return adminNotFoundResponse()
    }

    const { user, profile } = auth

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: profile.full_name,
        role: profile.role,
        is_active: profile.is_active,
      },
    })
  } catch (error) {
    console.error('[api/admin/me] Error:', error)
    return adminNotFoundResponse()
  }
}
