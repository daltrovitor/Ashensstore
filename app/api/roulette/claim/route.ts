import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/get-user'
import { claimSpinReward } from '@/lib/roulette/service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Apenas usuários autenticados podem resgatar recompensas.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { spinId, deliveryNotes } = body

    if (!spinId) {
      return NextResponse.json(
        { success: false, error: 'ID do giro não informado.' },
        { status: 400 }
      )
    }

    const result = await claimSpinReward({
      spinId,
      userId: user.id,
      deliveryNotes,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      claimStatus: result.claimStatus,
    })
  } catch (error: any) {
    console.error('[Roulette Claim API] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao processar resgate do prêmio.' },
      { status: 500 }
    )
  }
}
