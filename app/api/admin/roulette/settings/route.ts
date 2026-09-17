import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'
import { getRouletteSettings, saveRouletteSettings } from '@/lib/roulette/service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const auth = await checkAdminAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const settings = await getRouletteSettings()
    return NextResponse.json({ success: true, settings })
  } catch (error: any) {
    console.error('[Admin Roulette Settings GET] Erro:', error)
    return NextResponse.json({ error: 'Erro ao carregar configurações da roleta' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await checkAdminAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const updated = await saveRouletteSettings({
      spin_price: body.spin_price !== undefined ? Number(body.spin_price) : undefined,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
      suspense_near_miss_enabled: body.suspense_near_miss_enabled !== undefined ? Boolean(body.suspense_near_miss_enabled) : undefined,
      banner_title: body.banner_title,
      banner_subtitle: body.banner_subtitle,
    })

    return NextResponse.json({ success: true, settings: updated, message: 'Configurações salvas com sucesso!' })
  } catch (error: any) {
    console.error('[Admin Roulette Settings POST] Erro:', error)
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
