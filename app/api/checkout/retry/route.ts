import { NextResponse } from 'next/server'
import { getOrderByExternalId } from '@/lib/orders/service'
import { generatePixPayload, COMPANY_PIX_DATA } from '@/lib/pix/brcode'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { orderId } = body

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
        }

        const order = await getOrderByExternalId(orderId)

        if (!order) {
            return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
        }

        const cleanTxid = order.external_id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25)
        const pixCode = generatePixPayload({
            key: COMPANY_PIX_DATA.key,
            name: COMPANY_PIX_DATA.name,
            city: COMPANY_PIX_DATA.city,
            amount: Number(order.total),
            txid: cleanTxid,
        })

        return NextResponse.json({
            success: true,
            orderId: order.external_id,
            total: order.total,
            pix_code: pixCode,
            pix_key: COMPANY_PIX_DATA.keyFormatted,
            recipient_name: COMPANY_PIX_DATA.name,
        })

    } catch (error: any) {
        console.error('Retry Checkout Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to get PIX payload' }, { status: 500 })
    }
}
