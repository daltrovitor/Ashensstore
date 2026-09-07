/**
 * POST /api/checkout/create
 * Criação de pedido exclusivo via PIX para entrega digital no Roblox / Blox Fruits
 */

import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/orders/service'
import { generatePixPayload, COMPANY_PIX_DATA } from '@/lib/pix/brcode'
import { z } from 'zod'

// Schema de validação adaptado para entrega digital
const CheckoutSchema = z.object({
    payment_method: z.literal('pix').default('pix'),
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

        // Verifica modo de teste
        const isTestMode = process.env.PAYMENT_MODE === 'test'

        // Cria pedido no sistema
        const orderResult = await createOrder({
            customerName: validatedData.customer.name,
            customerEmail: validatedData.customer.email,
            customerPhone: validatedData.customer.phone,
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
                chat_messages: [
                    {
                        id: 'msg-' + Date.now(),
                        sender: 'system',
                        sender_name: 'Ashens Store Suporte',
                        message: `Olá, ${validatedData.customer.name}! Seu pedido foi criado com sucesso. Assim que o pagamento via PIX for confirmado, nossa equipe entrará em contato por aqui para entregar seus itens no Roblox (Nick informado: ${validatedData.customer.roblox_username}).`,
                        timestamp: new Date().toISOString(),
                    }
                ]
            },
            items: validatedData.items,
            isTest: isTestMode,
            shippingCost: 0,
            paymentMethod: 'pix',
            orderType: 'digital_roblox',
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
