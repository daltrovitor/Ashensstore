import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'
import { adminDeliverSpinReward } from '@/lib/roulette/service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const auth = await checkAdminAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { spinId, notes } = body

    if (!spinId) {
      return NextResponse.json({ error: 'spinId é obrigatório' }, { status: 400 })
    }

    const ok = await adminDeliverSpinReward(spinId, notes)
    if (!ok) {
      return NextResponse.json({ error: 'Giro não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Prêmio marcado como entregue com sucesso!',
    })
  } catch (error: any) {
    console.error('[Admin Roulette Claims POST] Erro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar entrega' }, { status: 500 })
  }
}
