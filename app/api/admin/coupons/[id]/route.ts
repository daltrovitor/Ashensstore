import { NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth/service'
import { getCouponById, updateCoupon, deleteCoupon, toggleCouponStatus } from '@/lib/coupons/service'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const profile = await getCurrentProfile()
        if (!profile || !['admin', 'manager'].includes(profile.role)) {
            return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 })
        }

        const { id } = await params
        const coupon = await getCouponById(id)

        if (!coupon) {
            return NextResponse.json({ error: 'Cupom não encontrado.' }, { status: 404 })
        }

        return NextResponse.json(coupon)
    } catch (error: any) {
        console.error('[Admin Coupon [id] - GET]:', error)
        return NextResponse.json({ error: error.message || 'Erro ao carregar cupom' }, { status: 500 })
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const profile = await getCurrentProfile()
        if (!profile || !['admin', 'manager'].includes(profile.role)) {
            return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 })
        }

        const { id } = await params
        const body = await request.json()

        const result = await updateCoupon(id, body)

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        return NextResponse.json(result.coupon)
    } catch (error: any) {
        console.error('[Admin Coupon [id] - PUT]:', error)
        return NextResponse.json({ error: error.message || 'Erro ao atualizar cupom' }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const profile = await getCurrentProfile()
        if (!profile || !['admin', 'manager'].includes(profile.role)) {
            return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 })
        }

        const { id } = await params
        const body = await request.json()

        if (body.toggleStatus) {
            const result = await toggleCouponStatus(id)
            if (!result.success) {
                return NextResponse.json({ error: result.error }, { status: 400 })
            }
            return NextResponse.json({ is_active: result.is_active })
        }

        const result = await updateCoupon(id, body)
        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        return NextResponse.json(result.coupon)
    } catch (error: any) {
        console.error('[Admin Coupon [id] - PATCH]:', error)
        return NextResponse.json({ error: error.message || 'Erro ao atualizar cupom' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const profile = await getCurrentProfile()
        if (!profile || !['admin', 'manager'].includes(profile.role)) {
            return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 })
        }

        const { id } = await params
        const result = await deleteCoupon(id)

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[Admin Coupon [id] - DELETE]:', error)
        return NextResponse.json({ error: error.message || 'Erro ao excluir cupom' }, { status: 500 })
    }
}
