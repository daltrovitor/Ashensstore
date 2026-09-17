import { NextResponse } from 'next/server'
import { getRecentPublicWinners } from '@/lib/roulette/service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const wins = await getRecentPublicWinners(20)
    return NextResponse.json({
      success: true,
      winners: wins,
    })
  } catch (error: any) {
    console.error('[Recent Wins API] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Falha ao carregar ganhadores recentes' },
      { status: 500 }
    )
  }
}
