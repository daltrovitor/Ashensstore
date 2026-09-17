import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'
import { createRouletteSpinOrder, getRouletteSettings } from '@/lib/roulette/service'
import { COMPANY_PIX_DATA } from '@/lib/pix/brcode'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const BuySpinsSchema = z.object({
  customerName: z.string().min(2, 'Nome é obrigatório'),
  customerEmail: z.string().email('E-mail válido é obrigatório'),
  customerPhone: z.string().optional(),
  robloxUsername: z.string().min(2, 'Nick do Roblox é obrigatório'),
  spinsCount: z.number().int().min(1, 'Quantidade de giros inválida'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = BuySpinsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: parsed.error.issues.map(i => i.message)
      }, { status: 400 })
    }

    const settings = await getRouletteSettings()
    if (!settings.is_active) {
      return NextResponse.json({
        error: 'A compra de giros da roleta está temporariamente desativada.'
      }, { status: 400 })
    }

    let userId: string | null = null
    try {
      const supabase = await getSupabaseServer()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
      }
    } catch {}

    const order = await createRouletteSpinOrder({
      userId,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone,
      robloxUsername: parsed.data.robloxUsername,
      spinsCount: parsed.data.spinsCount,
    })

    return NextResponse.json({
      success: true,
      order,
      pix_code: order.pix_code,
      pix_key: COMPANY_PIX_DATA.keyFormatted,
      recipient_name: COMPANY_PIX_DATA.name,
      recipient_city: COMPANY_PIX_DATA.city,
      message: 'Pedido de giros gerado com sucesso! Efetue o pagamento PIX para liberação dos giros.'
    })
  } catch (error: any) {
    console.error('[Buy Spins POST] Erro:', error)
    return NextResponse.json({
      error: error.message || 'Erro ao gerar pedido de giros'
    }, { status: 500 })
  }
}
