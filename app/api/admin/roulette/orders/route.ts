import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'
import {
  getRouletteSpinOrders,
  confirmRouletteSpinOrder,
  adminAddUserSpins,
} from '@/lib/roulette/service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const auth = await checkAdminAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    const orders = await getRouletteSpinOrders(status)
    return NextResponse.json({ success: true, orders })
  } catch (error: any) {
    console.error('[Admin Roulette Orders GET] Erro:', error)
    return NextResponse.json({ error: 'Erro ao carregar pedidos de giros' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await checkAdminAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action, orderId, email, spinsCount } = body

    if (action === 'confirm') {
      if (!orderId) {
        return NextResponse.json({ error: 'ID do pedido é obrigatório.' }, { status: 400 })
      }

      const adminName = auth.profile?.full_name || auth.user.email || 'Admin'
      const result = await confirmRouletteSpinOrder(orderId, adminName)

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 })
      }

      return NextResponse.json(result)
    }

    if (action === 'add_manual') {
      if (!email || !spinsCount || Number(spinsCount) <= 0) {
        return NextResponse.json({ error: 'Informe e-mail e quantidade válida de giros.' }, { status: 400 })
      }

      const result = await adminAddUserSpins({
        email,
        spinsCount: Number(spinsCount),
      })

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 })
      }

      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Ação não reconhecida.' }, { status: 400 })
  } catch (error: any) {
    console.error('[Admin Roulette Orders POST] Erro:', error)
    return NextResponse.json({ error: 'Erro ao processar ação de pedido' }, { status: 500 })
  }
}
