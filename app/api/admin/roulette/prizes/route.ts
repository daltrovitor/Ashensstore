import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'
import {
  getRoulettePrizes,
  saveRoulettePrize,
  deleteRoulettePrize,
} from '@/lib/roulette/service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const auth = await checkAdminAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const prizes = await getRoulettePrizes(true)
    return NextResponse.json({ success: true, prizes })
  } catch (error: any) {
    console.error('[Admin Roulette Prizes GET] Erro:', error)
    return NextResponse.json({ error: 'Erro ao carregar prêmios' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await checkAdminAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    if (!body.name || !body.image_url) {
      return NextResponse.json(
        { error: 'Nome e URL da imagem são obrigatórios.' },
        { status: 400 }
      )
    }

    const saved = await saveRoulettePrize(body)
    return NextResponse.json({ success: true, prize: saved })
  } catch (error: any) {
    console.error('[Admin Roulette Prizes POST] Erro:', error)
    return NextResponse.json({ error: 'Erro ao salvar prêmio' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await checkAdminAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do prêmio é obrigatório' }, { status: 400 })
    }

    await deleteRoulettePrize(id)
    return NextResponse.json({ success: true, message: 'Prêmio excluído com sucesso.' })
  } catch (error: any) {
    console.error('[Admin Roulette Prizes DELETE] Erro:', error)
    return NextResponse.json({ error: 'Erro ao excluir prêmio' }, { status: 500 })
  }
}
