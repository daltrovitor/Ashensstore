import { NextResponse } from 'next/server'
import { validateCouponForCheckout } from '@/lib/coupons/service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/coupons/validate?code=...&subtotal=...&email=...&roblox=...
 * Validação pública simples de cupom
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        const subtotalStr = searchParams.get('subtotal')
        const email = searchParams.get('email') || undefined
        const roblox = searchParams.get('roblox') || undefined

        if (!code) {
            return NextResponse.json({ valid: false, error: 'Código do cupom não informado.' }, { status: 400 })
        }

        const subtotal = subtotalStr ? Number(subtotalStr) : undefined

        const result = await validateCouponForCheckout({
            code,
            subtotal,
            customer_email: email,
            customer_roblox: roblox,
        })

        if (!result.valid) {
            return NextResponse.json({
                valid: false,
                error: result.error || 'Cupom inválido ou expirado.'
            }, { status: 400 })
        }

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('[Coupon Validate GET Error]:', error)
        return NextResponse.json({ valid: false, error: error.message || 'Erro ao validar cupom' }, { status: 500 })
    }
}

/**
 * POST /api/coupons/validate
 * Validação pública profunda com itens do carrinho e regras de elegibilidade
 */
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { code, items, subtotal, customer_email, customer_roblox } = body

        if (!code) {
            return NextResponse.json({ valid: false, error: 'Código do cupom não informado.' }, { status: 400 })
        }

        const result = await validateCouponForCheckout({
            code,
            items,
            subtotal: typeof subtotal === 'number' ? subtotal : undefined,
            customer_email,
            customer_roblox,
        })

        if (!result.valid) {
            return NextResponse.json({
                valid: false,
                error: result.error || 'Cupom inválido ou expirado.'
            }, { status: 400 })
        }

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('[Coupon Validate POST Error]:', error)
        return NextResponse.json({ valid: false, error: error.message || 'Erro ao validar cupom' }, { status: 500 })
    }
}
