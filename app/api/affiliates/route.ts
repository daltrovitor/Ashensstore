import { NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth/service'
import { registerAffiliate, getAffiliateStats, getAffiliateByUserId } from '@/lib/affiliates/service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/affiliates
 * Retorna dados e estatísticas de afiliados do usuário logado
 */
export async function GET(request: Request) {
    try {
        const profile = await getCurrentProfile()

        if (!profile) {
            return NextResponse.json({
                authenticated: false,
                is_affiliate: false,
            })
        }

        const stats = await getAffiliateStats(profile.user_id)

        return NextResponse.json({
            authenticated: true,
            is_affiliate: !!stats,
            stats: stats || null,
            profile: {
                id: profile.user_id,
                email: profile.email,
                name: profile.full_name || '',
            }
        })
    } catch (error: any) {
        console.error('[Affiliate API GET Error]:', error)
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
    }
}

/**
 * POST /api/affiliates
 * Cadastra o usuário atual como afiliado com cupom personalizado de 10%
 */
export async function POST(request: Request) {
    try {
        const profile = await getCurrentProfile()

        if (!profile) {
            return NextResponse.json({ error: 'Você precisa estar logado para se tornar um afiliado' }, { status: 401 })
        }

        const body = await request.json()
        const { coupon_code } = body

        if (!coupon_code || typeof coupon_code !== 'string') {
            return NextResponse.json({ error: 'Código do cupom é obrigatório' }, { status: 400 })
        }

        const result = await registerAffiliate({
            userId: profile.user_id,
            name: profile.full_name || profile.email.split('@')[0],
            email: profile.email,
            couponCode: coupon_code,
        })

        if (!result.success) {
            return NextResponse.json({ error: result.error || 'Erro ao registrar afiliado' }, { status: 400 })
        }

        const stats = await getAffiliateStats(profile.user_id)

        return NextResponse.json({
            success: true,
            message: 'Conta de afiliado criada com sucesso!',
            stats,
        })
    } catch (error: any) {
        console.error('[Affiliate API POST Error]:', error)
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
    }
}
