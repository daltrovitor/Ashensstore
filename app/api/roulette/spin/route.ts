import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/get-user'
import { performRouletteSpin } from '@/lib/roulette/service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Você precisa estar conectado à sua conta para girar a roleta.' },
        { status: 401 }
      )
    }

    const result = await performRouletteSpin({
      userId: user.id,
      userEmail: user.email || '',
      userName: user.user_metadata?.full_name || user.email?.split('@')[0],
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Não foi possível girar a roleta.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      prize: result.prize,
      nearMissPrize: result.nearMissPrize,
      spinsRemaining: result.spinsRemaining,
      spinId: result.spinId,
    })
  } catch (error: any) {
    console.error('[Roulette Spin API] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar o giro.' },
      { status: 500 }
    )
  }
}
