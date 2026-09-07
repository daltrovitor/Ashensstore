/**
 * POST /api/checkout/create
 * Criação de pedido exclusivo via PIX para entrega digital no Roblox / Blox Fruits
 */

import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/orders/service'
import { generatePixPayload, COMPANY_PIX_DATA } from '@/lib/pix/brcode'
import { validateCoupon } from '@/lib/affiliates/service'
import { z } from 'zod'

// Schema de validação adaptado para entrega digital
const CheckoutSchema = z.object({
    payment_method: z.literal('pix').default('pix'),
    coupon_code: z.string().optional(),
    items: z.array(z.object({
        variant_id: z.string().uuid().optional(),
        quantity: z.number().min(1),
        price: z.number().min(0),
        name: z.string(),
    })),
    customer: z.object({
        name: z.string().min(2, "Nome é obrigatório"),
        email: z.string().email("E-mail inválido"),
        phone: z.string().min(8, "Telefone/WhatsApp é obrigatório"),
        roblox_username: z.string().min(2, "Nick do Roblox é obrigatório para entrega"),
        delivery_notes: z.string().optional(),
    }),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Valida dados de entrada
        const validatedData = CheckoutSchema.parse(body)

        // Calcula subtotal para desconto de cupom
        const itemsSubtotal = validatedData.items.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0)
        let discountAmount = 0
        let appliedCoupon: string | undefined = undefined
        let affiliateId: string | undefined = undefined
        let affiliateCommission = 0

        if (validatedData.coupon_code) {
            const couponResult = validateCoupon(validatedData.coupon_code)
            if (couponResult.valid && couponResult.coupon_code) {
                appliedCoupon = couponResult.coupon_code
                const pct = (couponResult.discount_percent || 10) / 100
                discountAmount = Math.round((itemsSubtotal * pct) * 100) / 100
                affiliateId = couponResult.affiliate_id
                affiliateCommission = discountAmount
            }
        }

        // Verifica modo de teste
        const isTestMode = process.env.PAYMENT_MODE === 'test'

        // Cria pedido no sistema
        const orderResult = await createOrder({
            customerName: validatedData.customer.name,
            customerEmail: validatedData.customer.email,
            customerPhone: validatedData.customer.phone,
            shippingCost: 0,
            discountAmount: discountAmount,
            couponCode: appliedCoupon,
            paymentMethod: 'pix',
            orderType: 'digital_roblox',
            shippingAddress: {
                name: validatedData.customer.name,
                roblox_username: validatedData.customer.roblox_username,
                phone: validatedData.customer.phone,
                email: validatedData.customer.email,
                delivery_notes: validatedData.customer.delivery_notes || '',
                address1: 'Entrega Digital Roblox',
                city: 'Roblox Blox Fruits',
                state_code: 'DF',
                country_code: 'BR',
                zip: '00000-000',
                coupon_code: appliedCoupon,
                discount_amount: discountAmount > 0 ? discountAmount : undefined,
                affiliate_id: affiliateId,
                affiliate_commission: affiliateCommission > 0 ? affiliateCommission : undefined,
                chat_messages: [
                    {
                        id: 'msg-' + Date.now(),
                        sender: 'system',
                        sender_name: 'Ashens Store Suporte',
                        message: `Olá, ${validatedData.customer.name}! Seu pedido foi criado com sucesso. Assim que o pagamento via PIX for confirmado, nossa equipe entregará seus itens diretamente aqui no chat para seu Nick do Roblox (${validatedData.customer.roblox_username}).`,
                        timestamp: new Date().toISOString(),
                    }
                ]
            },
            items: validatedData.items,
            isTest: isTestMode,
        })

        // Gera o código QR PIX oficial padrão Banco Central (EMVCo)
        const cleanTxid = orderResult.orderId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25)
        const pixCode = generatePixPayload({
            key: COMPANY_PIX_DATA.key,
            name: COMPANY_PIX_DATA.name,
            city: COMPANY_PIX_DATA.city,
            amount: orderResult.total,
            txid: cleanTxid,
        })

        return NextResponse.json({
            success: true,
            order_id: orderResult.orderId,
            total: orderResult.total,
            discount: discountAmount,
            coupon_code: appliedCoupon,
            payment_method: 'pix',
            pix_code: pixCode,
            pix_key: COMPANY_PIX_DATA.keyFormatted,
            raw_pix_key: COMPANY_PIX_DATA.key,
            recipient_name: COMPANY_PIX_DATA.name,
            recipient_city: COMPANY_PIX_DATA.city,
        })

    } catch (error) {
        console.error('[Checkout] Erro ao criar checkout:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: 'Dados inválidos',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    }))
                },
                { status: 400 }
            )
        }

        return NextResponse.json(
            {
                error: 'Falha ao criar checkout',
                message: error instanceof Error ? error.message : 'Erro desconhecido'
            },
            { status: 500 }
        )
    }
}
