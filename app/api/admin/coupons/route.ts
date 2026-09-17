import { NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth/service'
import { getCouponsWithSummary, createCoupon } from '@/lib/coupons/service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const couponSchema = z.object({
    code: z.string().min(2, 'O código do cupom deve ter pelo menos 2 caracteres'),
    description: z.string().optional(),
    discount_type: z.enum(['percentage', 'fixed']),
    discount_value: z.number().positive('O valor do desconto deve ser maior que zero'),
    max_discount: z.number().positive().nullable().optional(),
    min_order_value: z.number().nonnegative().nullable().optional(),
    max_uses: z.number().int().positive().nullable().optional(),
    max_uses_per_customer: z.number().int().positive().nullable().optional(),
    start_date: z.string().nullable().optional(),
    expiration_date: z.string().nullable().optional(),
    is_active: z.boolean().default(true),
    applicability: z.enum(['all', 'products', 'categories']).default('all'),
    applicable_product_ids: z.array(z.string()).default([]),
    applicable_category_ids: z.array(z.string()).default([]),
    allow_stacking: z.boolean().default(false),
})

export async function GET() {
    try {
        const profile = await getCurrentProfile()
        if (!profile || !['admin', 'manager'].includes(profile.role)) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        const data = await getCouponsWithSummary()
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('[Admin Coupons API - GET]:', error)
        return NextResponse.json({ error: error.message || 'Erro ao carregar cupons' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const profile = await getCurrentProfile()
        if (!profile || !['admin', 'manager'].includes(profile.role)) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        const body = await request.json()
        const parsed = couponSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({
                error: 'Dados inválidos',
                details: parsed.error.issues.map(i => i.message)
            }, { status: 400 })
        }

        const result = await createCoupon(parsed.data)

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        return NextResponse.json(result.coupon, { status: 201 })
    } catch (error: any) {
        console.error('[Admin Coupons API - POST]:', error)
        return NextResponse.json({ error: error.message || 'Erro ao criar cupom' }, { status: 500 })
    }
}
