import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'
import {
  getAdminCodes,
  bulkGenerateSpinCodes,
  updateCodeStatus,
} from '@/lib/roulette/service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const auth = await checkAdminAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')

    const data = await getAdminCodes({ status, search, page, limit })
    return NextResponse.json({ success: true, ...data })
  } catch (error: any) {
    console.error('[Admin Roulette Codes GET] Erro:', error)
    return NextResponse.json({ error: 'Erro ao listar códigos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await checkAdminAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const quantity = Math.max(1, Math.min(500, parseInt(body.quantity) || 1))
    const spinsPerCode = Math.max(1, parseInt(body.spinsPerCode) || 1)
    const prefix = (body.prefix || 'ASHEN').toUpperCase().replace(/[^A-Z0-9]/g, '')

    const codes = await bulkGenerateSpinCodes({
      quantity,
      spinsPerCode,
      createdBy: auth.user.email || 'admin',
      prefix,
    })

    return NextResponse.json({
      success: true,
      count: codes.length,
      codes,
      message: `${codes.length} código(s) de ${spinsPerCode} giro(s) gerado(s) com sucesso!`,
    })
  } catch (error: any) {
    console.error('[Admin Roulette Codes POST] Erro:', error)
    return NextResponse.json({ error: 'Erro ao gerar códigos' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await checkAdminAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { codeId, status } = body

    if (!codeId || !['active', 'disabled'].includes(status)) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const ok = await updateCodeStatus(codeId, status)
    return NextResponse.json({ success: ok })
  } catch (error: any) {
    console.error('[Admin Roulette Codes PATCH] Erro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar código' }, { status: 500 })
  }
}
