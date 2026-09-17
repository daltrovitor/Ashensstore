import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'
import { getAdminRouletteStats } from '@/lib/roulette/service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const auth = await checkAdminAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const data = await getAdminRouletteStats()
    return NextResponse.json({ success: true, ...data })
  } catch (error: any) {
    console.error('[Admin Roulette Stats GET] Erro:', error)
    return NextResponse.json({ error: 'Erro ao obter estatísticas' }, { status: 500 })
  }
}
