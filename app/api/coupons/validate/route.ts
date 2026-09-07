import { NextResponse } from 'next/server'
import { validateCoupon } from '@/lib/affiliates/service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/coupons/validate?code=...
 * Validação pública de cupom de desconto
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')

        if (!code) {
            return NextResponse.json({ valid: false, error: 'Código do cupom não informado' }, { status: 400 })
        }

        const result = validateCoupon(code)

        if (!result.valid) {
            return NextResponse.json({ valid: false, error: result.error || 'Cupom inválido ou não encontrado' }, { status: 400 })
        }

        return NextResponse.json({
            valid: true,
            coupon_code: result.coupon_code,
            discount_percent: result.discount_percent || 10,
            affiliate_id: result.affiliate_id,
            message: `Cupom ${result.coupon_code} aplicado! 10% de desconto.`
        })
    } catch (error: any) {
        console.error('[Coupon Validate Error]:', error)
        return NextResponse.json({ valid: false, error: error.message || 'Erro ao validar cupom' }, { status: 500 })
    }
}
