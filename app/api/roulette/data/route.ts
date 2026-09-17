import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/get-user'
import {
  getRoulettePrizes,
  getUserSpinsBalance,
  getUserSpinHistory,
  getRouletteSettings,
} from '@/lib/roulette/service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const prizes = await getRoulettePrizes(false)
    const settings = await getRouletteSettings()
    const user = await getAuthUser(request)

    let balance = null
    let history: any[] = []

    if (user && user.id) {
      balance = await getUserSpinsBalance(user.id, user.email || '')
      history = await getUserSpinHistory(user.id)
    }

    return NextResponse.json({
      success: true,
      prizes,
      settings,
      user: user ? { id: user.id, email: user.email } : null,
      balance: balance ? balance.spins_balance : 0,
      totalSpinsPerformed: balance ? balance.total_spins_performed : 0,
      history,
    })
  } catch (error: any) {
    console.error('[Roulette Data API] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Falha ao carregar dados da roleta' },
      { status: 500 }
    )
  }
}
