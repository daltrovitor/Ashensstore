import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/get-user'
import { redeemRouletteCode } from '@/lib/roulette/service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Você precisa estar logado na sua conta para resgatar códigos de giro.',
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Código de giro inválido ou não informado.' },
        { status: 400 }
      )
    }

    const result = await redeemRouletteCode({
      code,
      userId: user.id,
      userEmail: user.email || '',
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      spinsAdded: result.spinsAdded,
      newBalance: result.newBalance,
      message: result.message,
    })
  } catch (error: any) {
    console.error('[Roulette Redeem API] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao processar o resgate do código.' },
      { status: 500 }
    )
  }
}
