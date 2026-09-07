
/**
 * Orders Service
 * Serviço para gerenciamento de pedidos
 */

import { createClient } from '@supabase/supabase-js'

export interface OrderRecipient {
    name: string
    address1?: string
    address2?: string
    city?: string
    state_code?: string
    country_code?: string
    zip?: string
    phone?: string
    email?: string
    roblox_username?: string
    delivery_notes?: string
    coupon_code?: string
    discount_amount?: number
    affiliate_id?: string
    affiliate_commission?: number
    delivered_items?: any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chat_messages?: any[]
}

/**
 * Cria um novo pedido no sistema
 */
export async function createOrder(params: {
    customerName: string
    customerEmail: string
    customerPhone?: string
    shippingAddress: OrderRecipient
    items: Array<{
        variant_id?: string
        quantity: number
        price: number
        name: string
    }>
    isTest?: boolean
    shippingCost?: number
    discountAmount?: number
    couponCode?: string
    paymentMethod?: string
    orderType?: string
}): Promise<{ orderId: string; total: number }> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Valida itens e calcula totais
    let subtotal = 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderItems: any[] = []

    for (const item of params.items) {
        let price = Number(item.price) || 0
        let variantId: string | null = null
        let itemName = item.name

        if (item.variant_id && item.variant_id.length > 10) {
            try {
                const { data: variant } = await supabase
                    .from('product_variants')
                    .select('id, name, price, retail_price, in_stock')
                    .eq('id', item.variant_id)
                    .maybeSingle()

                if (variant) {
                    variantId = variant.id
                    price = Number(variant.retail_price || variant.price || price)
                    if (variant.name && variant.name !== 'Padrão') {
                        itemName = `${item.name} (${variant.name})`
                    }
                }
            } catch (err) {
                console.warn('Erro ao buscar variante, usando dados do item:', err)
            }
        }

        const itemTotal = price * item.quantity
        subtotal += itemTotal

        orderItems.push({
            order_id: null, // Será preenchido após criar o pedido
            product_variant_id: variantId,
            name: itemName,
            quantity: item.quantity,
            unit_price: price,
            total_price: itemTotal,
        })
    }

    // Calcula frete (usa valor passado ou 0)
    const shippingCost = params.shippingCost !== undefined ? params.shippingCost : 0

    // Calcula desconto (ex: cupom de afiliado)
    const discountAmount = params.discountAmount !== undefined ? Math.max(0, Number(params.discountAmount)) : 0

    // Calcula taxas
    const tax = 0

    const total = Math.max(0, Math.round((subtotal - discountAmount + shippingCost + tax) * 100) / 100)

    // Gera ID externo único
    // Use Date.now() + distinct suffix
    const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const externalId = `ORD-${Date.now()}-${suffix}`

    // Cria pedido no banco
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            external_id: externalId,
            status: params.isTest ? 'TEST_ORDER' : 'PENDING_PAYMENT',
            payment_status: 'pending',
            payment_method: params.paymentMethod || 'pix',
            customer_name: params.customerName,
            customer_email: params.customerEmail,
            customer_phone: params.customerPhone,
            shipping_address: {
                ...params.shippingAddress,
                order_type: params.orderType || 'ecommerce',
                coupon_code: params.couponCode || undefined,
                discount_amount: discountAmount > 0 ? discountAmount : undefined,
            },
            subtotal,
            shipping_cost: shippingCost,
            tax,
            total,
            is_test: params.isTest || false,
        })
        .select('id')
        .single()

    if (orderError || !order) {
        console.error('Erro ao criar pedido:', orderError)
        throw new Error('Erro ao criar pedido no banco')
    }

    // Cria itens do pedido
    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
            orderItems.map(item => ({
                ...item,
                order_id: order.id
            }))
        )

    if (itemsError) {
        // Rollback pedido se falhar ao criar itens
        console.error('Erro ao criar itens:', itemsError)
        await supabase.from('orders').delete().eq('id', order.id)
        throw new Error('Erro ao criar itens do pedido')
    }

    return {
        orderId: externalId,
        total,
    }
}

/**
 * Busca pedidos de um cliente
 */
export async function getCustomerOrders(
    customerEmail: string,
    limit = 10,
    offset = 0
): Promise<any[]> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items(
                *,
                product_variant:product_variants(
                    *,
                    product:products(name, thumbnail_url)
                )
            )
        `)
        .eq('customer_email', customerEmail)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) {
        throw new Error('Erro ao buscar pedidos do cliente')
    }

    return data || []
}

/**
 * Busca pedido pelo ID externo
 */
export async function getOrderByExternalId(externalId: string): Promise<any> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items(
                *,
                product_variant:product_variants(
                    *,
                    product:products(name, thumbnail_url)
                )
            )
        `)
        .eq('external_id', externalId)
        .single()

    if (error) {
        throw new Error('Pedido não encontrado')
    }

    return data
}

export default {
    createOrder,
    getCustomerOrders,
    getOrderByExternalId,
}
