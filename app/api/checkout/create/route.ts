/**
 * POST /api/checkout/create
 * Criação de pedido exclusivo via PIX para entrega digital no Roblox / Blox Fruits
 */

import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/orders/service'
import { generatePixPayload, COMPANY_PIX_DATA } from '@/lib/pix/brcode'
import { validateCouponForCheckout, recordCouponUsage } from '@/lib/coupons/service'
import { z } from 'zod'

// Schema de validação adaptado para entrega digital
const CheckoutSchema = z.object({
    payment_method: z.literal('pix').default('pix'),
    coupon_code: z.string().optional(),
    items: z.array(z.object({
        product_id: z.string().optional(),
        variant_id: z.string().optional(),
        quantity: z.number().min(1),
        price: z.number().min(0),
        name: z.string(),
        category_id: z.string().optional(),
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

        // Calcula subtotal dos itens
        const itemsSubtotal = validatedData.items.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0)
        let discountAmount = 0
        let appliedCoupon: string | undefined = undefined
        let affiliateId: string | undefined = undefined
        let affiliateCommission = 0
        let couponValidationResult: any = null

        // Validação estrita do cupom no servidor
        if (validatedData.coupon_code && validatedData.coupon_code.trim()) {
            couponValidationResult = await validateCouponForCheckout({
                code: validatedData.coupon_code,
                items: validatedData.items,
                subtotal: itemsSubtotal,
                customer_email: validatedData.customer.email,
                customer_roblox: validatedData.customer.roblox_username,
            })

            if (!couponValidationResult.valid) {
                return NextResponse.json(
                    {
                        error: couponValidationResult.error || 'Cupom inválido ou não aplicável a este pedido.'
                    },
                    { status: 400 }
                )
            }

            appliedCoupon = couponValidationResult.coupon_code
            discountAmount = couponValidationResult.discount_amount || 0

            if (couponValidationResult.is_affiliate) {
                affiliateId = couponValidationResult.affiliate_id
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

        // Registra utilização do cupom após sucesso na criação do pedido
        if (appliedCoupon && couponValidationResult) {
            await recordCouponUsage({
                coupon_id: couponValidationResult.coupon_id,
                coupon_code: appliedCoupon,
                order_id: orderResult.orderId,
                customer_email: validatedData.customer.email,
                customer_name: validatedData.customer.name,
                customer_roblox: validatedData.customer.roblox_username,
                discount_amount: discountAmount,
                order_total: orderResult.total,
            })
        }

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
