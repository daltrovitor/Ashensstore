/**
 * GET /api/admin/orders
 * APIs administrativas para gerenciamento de pedidos
 */

import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'
import { getSupabaseService } from '@/lib/supabase/server'
import { deliverRandomStockItems } from '@/lib/stock/digital-stock-service'
import { z } from 'zod'

// Schema para filtros
const OrdersFilterSchema = z.object({
    status: z.string().optional(),
    customer_email: z.string().optional(),
    is_test: z.boolean().optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
})

// Middleware de autenticação - substituído por checkAdminAuth

/**
 * GET - Lista pedidos com filtros
 */
export async function GET(request: Request) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const supabase = getSupabaseService()
        if (!supabase) {
            return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
        }
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        // Valida filtros
        const filters = OrdersFilterSchema.parse({
            status: searchParams.get('status') || undefined,
            customer_email: searchParams.get('customer_email') || undefined,
            is_test: searchParams.get('is_test') === 'true' ? true :
                searchParams.get('is_test') === 'false' ? false : undefined,
            date_from: searchParams.get('date_from') || undefined,
            date_to: searchParams.get('date_to') || undefined,
        })

        let query = supabase
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
            `, { count: 'exact' })
            .order('created_at', { ascending: false })

        // Aplica filtros
        if (filters.status) {
            query = query.eq('status', filters.status)
        }

        if (filters.customer_email) {
            query = query.ilike('customer_email', `%${filters.customer_email}%`)
        }

        if (filters.is_test !== undefined) {
            query = query.eq('is_test', filters.is_test)
        }

        if (filters.date_from) {
            query = query.gte('created_at', filters.date_from)
        }

        if (filters.date_to) {
            query = query.lte('created_at', filters.date_to)
        }

        // Paginação
        const from = (page - 1) * limit
        const to = from + limit - 1
        query = query.range(from, to)

        const { data, error, count } = await query

        if (error) throw error

        // Calcula estatísticas
        const { data: stats } = await supabase
            .from('orders')
            .select('status, total, is_test')
            .gte('created_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())

        const statsSummary = {
            total_orders: count || 0,
            total_revenue: stats?.reduce((sum, order) =>
                !order.is_test ? sum + parseFloat(order.total) : sum, 0) || 0,
            status_counts: stats?.reduce((acc, order) => {
                acc[order.status] = (acc[order.status] || 0) + 1
                return acc
            }, {} as Record<string, number>) || {},
        }

        return NextResponse.json({
            orders: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
            stats: statsSummary,
        })

    } catch (error) {
        console.error('[Admin Orders] Erro ao listar pedidos:', error)
        return NextResponse.json(
            { error: 'Falha ao listar pedidos' },
            { status: 500 }
        )
    }
}

async function processOrderDigitalDelivery(supabase: any, orderId: string) {
    try {
        const { data: order, error } = await supabase
            .from('orders')
            .select(`
                id, external_id, customer_name, shipping_address,
                items:order_items(id, name, quantity, product_variant_id)
            `)
            .eq('id', orderId)
            .maybeSingle()

        if (error || !order) return { deliveredCount: 0, deliveredItems: [] }

        const shippingAddress = (typeof order.shipping_address === 'object' && order.shipping_address) ? { ...order.shipping_address } : {}
        const alreadyDelivered = shippingAddress.delivered_items && Array.isArray(shippingAddress.delivered_items) && shippingAddress.delivered_items.length > 0

        if (alreadyDelivered) {
            return { deliveredCount: shippingAddress.delivered_items.length, deliveredItems: shippingAddress.delivered_items, alreadyDelivered: true }
        }

        const deliveredSummary: Array<{ itemName: string; message: string }> = []

        for (const item of (order.items || [])) {
            let productId: string | undefined
            const variantId: string | undefined = item.product_variant_id

            if (variantId) {
                const { data: variant } = await supabase
                    .from('product_variants')
                    .select('product_id')
                    .eq('id', variantId)
                    .maybeSingle()
                if (variant?.product_id) {
                    productId = variant.product_id
                }
            }

            const deliveryResult = await deliverRandomStockItems({
                productId,
                variantId,
                quantity: item.quantity || 1,
                orderId: order.id,
                orderExternalId: order.external_id,
            })

            if (deliveryResult.deliveredMessages && deliveryResult.deliveredMessages.length > 0) {
                deliveryResult.deliveredMessages.forEach((msg: string) => {
                    deliveredSummary.push({ itemName: item.name, message: msg })
                })
            }
        }

        const currentChat = shippingAddress.chat_messages || []
        const nowIso = new Date().toISOString()

        if (deliveredSummary.length > 0) {
            const lines = deliveredSummary.map((d, i) => `🔹 Item ${i + 1} (${d.itemName}):\n${d.message}`).join('\n\n')
            const systemMessage = {
                id: 'msg-deliv-' + Date.now(),
                sender: 'system',
                sender_name: 'Ashens Store Suporte',
                message: `🎉 PAGAMENTO CONFIRMADO! SEU PRODUTO FOI ENTREGUE AUTOMATICAMENTE:\n\n${lines}\n\nObrigado pela compra na Ashens Store! Qualquer dúvida, nossa equipe está à disposição aqui no chat.`,
                timestamp: nowIso,
            }

            shippingAddress.chat_messages = [...currentChat, systemMessage]
            shippingAddress.delivered_items = deliveredSummary
            shippingAddress.payment_confirmed_at = nowIso
        } else {
            const systemMessage = {
                id: 'msg-deliv-' + Date.now(),
                sender: 'system',
                sender_name: 'Ashens Store Suporte',
                message: `🎉 Pagamento Confirmado! Seu pedido foi aprovado com sucesso. Nossa equipe já foi notificada e fará a entrega dos seus itens aqui no chat em instantes.`,
                timestamp: nowIso,
            }
            shippingAddress.chat_messages = [...currentChat, systemMessage]
            shippingAddress.payment_confirmed_at = nowIso
        }

        await supabase
            .from('orders')
            .update({
                shipping_address: shippingAddress,
                status: 'PAID',
                payment_status: 'completed',
                updated_at: nowIso,
            })
            .eq('id', order.id)

        return { deliveredCount: deliveredSummary.length, deliveredItems: deliveredSummary }
    } catch (err) {
        console.error('[Admin Orders] Erro ao processar entrega digital:', err)
        return { deliveredCount: 0, deliveredItems: [] }
    }
}

/**
 * POST - Atualiza status de pedidos ou outras ações
 */
export async function POST(request: Request) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const supabase = getSupabaseService()
        if (!supabase) {
            return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
        }
        const body = await request.json()
        const { action, data } = body

        switch (action) {
            case 'confirm_payment_and_deliver': {
                const { orderId } = data
                if (!orderId) {
                    return NextResponse.json({ error: 'orderId é obrigatório' }, { status: 400 })
                }

                const result = await processOrderDigitalDelivery(supabase, orderId)

                return NextResponse.json({
                    success: true,
                    message: result.deliveredCount > 0
                        ? `Pagamento confirmado! ${result.deliveredCount} item(ns) sorteado(s) e entregue(s) automaticamente no chat do cliente.`
                        : `Pagamento confirmado com sucesso!`,
                    deliveredCount: result.deliveredCount,
                    deliveredItems: result.deliveredItems,
                })
            }

            case 'update_status': {
                const { orderIds, status } = data
                if (!Array.isArray(orderIds) || !status) {
                    return NextResponse.json(
                        { error: 'orderIds e status são obrigatórios' },
                        { status: 400 }
                    )
                }

                // Se o status for PAID ou CONFIRMED, realiza a entrega automática do estoque digital
                if (status === 'PAID' || status === 'CONFIRMED') {
                    for (const id of orderIds) {
                        await processOrderDigitalDelivery(supabase, id)
                    }
                } else {
                    const updateData: Record<string, any> = {
                        status,
                        updated_at: new Date().toISOString(),
                    }

                    const { error } = await supabase
                        .from('orders')
                        .update(updateData)
                        .in('id', orderIds)

                    if (error) throw error
                }

                return NextResponse.json({
                    success: true,
                    message: `Status atualizado para ${orderIds.length} pedido(s)`,
                })
            }

            case 'get_details': {
                const { orderId } = data
                if (!orderId) {
                    return NextResponse.json(
                        { error: 'ID do pedido não informado' },
                        { status: 400 }
                    )
                }

                const { data: order, error } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        items:order_items(
                            *,
                            product_variant:product_variants(
                                *,
                                product:products(name, thumbnail_url, printful_id)
                            )
                        )
                    `)
                    .eq('id', orderId)
                    .single()

                if (error) throw error

                return NextResponse.json({
                    success: true,
                    order,
                })
            }

            case 'create_local_order': {
                const {
                    receipt_number,
                    customer_name,
                    customer_phone,
                    customer_document,
                    state_registration,
                    machine_number,
                    address,
                    neighborhood,
                    city,
                    state_code,
                    zip,
                    payment_method,
                    payment_status,
                    status,
                    total,
                    items,
                } = data

                if (!customer_name) {
                    return NextResponse.json({ error: 'Nome do cliente é obrigatório' }, { status: 400 })
                }

                const receiptNum = receipt_number || Math.floor(1000 + Math.random() * 9000).toString()
                const externalId = `LOC-${receiptNum}-${Date.now().toString().slice(-4)}`

                // Cria o pedido no Supabase
                const { data: order, error: orderErr } = await supabase
                    .from('orders')
                    .insert({
                        external_id: externalId,
                        status: status || 'CONFIRMED',
                        payment_status: payment_status || 'completed',
                        payment_method: payment_method || 'pix',
                        customer_name,
                        customer_phone: customer_phone || null,
                        customer_email: 'vendas@ashensstore.com.br',
                        subtotal: total || 0,
                        shipping_cost: 0,
                        total: total || 0,
                        tax: 0,
                        is_test: false,
                        shipping_address: {
                            order_type: 'local',
                            receipt_number: receiptNum,
                            customer_document: customer_document || null,
                            state_registration: state_registration || null,
                            machine_number: machine_number || null,
                            address1: address || 'Retirada no Balcão',
                            neighborhood: neighborhood || null,
                            city: city || 'Goiânia',
                            state_code: state_code || 'GO',
                            zip: zip || null,
                            phone: customer_phone || null,
                        },
                    })
                    .select()
                    .single()

                if (orderErr) throw orderErr

                // Cria os itens do pedido
                if (Array.isArray(items) && items.length > 0) {
                    const orderItemsToInsert = items.map((item: any) => ({
                        order_id: order.id,
                        product_variant_id: null,
                        name: item.unit ? `[${item.unit.toUpperCase()}] ${item.name}` : item.name,
                        quantity: item.quantity || 1,
                        unit_price: item.unit_price || 0,
                        total_price: item.total_price || ((item.quantity || 1) * (item.unit_price || 0)) || 0,
                    }))

                    const { error: itemsErr } = await supabase
                        .from('order_items')
                        .insert(orderItemsToInsert)

                    if (itemsErr) {
                        console.error('Erro ao inserir itens locais:', itemsErr)
                    }
                }

                return NextResponse.json({
                    success: true,
                    external_id: externalId,
                    order: {
                        ...order,
                        receipt_number: receiptNum,
                        customer_document,
                        state_registration,
                        machine_number,
                        address,
                        neighborhood,
                        city: city || 'Goiânia',
                        state: state_code || 'GO',
                        zip,
                        items: items || [],
                    },
                })
            }

            default:
                return NextResponse.json(
                    { error: 'Ação não reconhecida' },
                    { status: 400 }
                )
        }

    } catch (error) {
        console.error('[Admin Orders] Erro na operação:', error)
        return NextResponse.json(
            { error: 'Falha na operação' },
            { status: 500 }
        )
    }
}
