import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId') || searchParams.get('order_id')

    if (!orderId) {
        return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)

        let query = supabase
            .from('orders')
            .select('id, external_id, status, payment_status, total, customer_name, customer_email, created_at')

        if (isUuid) {
            query = query.or(`external_id.eq.${orderId},id.eq.${orderId}`)
        } else {
            query = query.eq('external_id', orderId)
        }

        const { data: order, error } = await query.single()

        if (error || !order) {
            return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
        }

        const isPaid = order.status === 'PAID' || order.status === 'CONFIRMED' || order.payment_status === 'completed'

        return NextResponse.json({
            success: true,
            orderId: order.external_id,
            status: order.status,
            payment_status: order.payment_status,
            isPaid,
            total: order.total,
        })

    } catch (error: any) {
        console.error('Verification error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
