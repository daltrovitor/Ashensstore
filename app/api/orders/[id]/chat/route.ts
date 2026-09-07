import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface ChatMessage {
    id: string
    sender: 'buyer' | 'seller' | 'system'
    sender_name: string
    message: string
    timestamp: string
}

function getSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

/**
 * GET - Busca histórico de mensagens do chat associado ao pedido
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = getSupabaseClient()
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

        let query = supabase
            .from('orders')
            .select(`
                id,
                external_id,
                status,
                payment_status,
                total,
                customer_name,
                customer_email,
                customer_phone,
                shipping_address,
                created_at,
                items:order_items(id, name, quantity, unit_price)
            `)

        if (isUuid) {
            query = query.or(`external_id.eq.${id},id.eq.${id}`)
        } else {
            query = query.eq('external_id', id)
        }

        const { data: order, error } = await query.maybeSingle()

        if (error || !order) {
            return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
        }

        const shippingData = (typeof order.shipping_address === 'object' && order.shipping_address) ? order.shipping_address : {}
        let messages: ChatMessage[] = shippingData.chat_messages || []

        // Se não houver mensagens, inicializa com mensagem de boas-vindas do sistema
        if (!messages || messages.length === 0) {
            const robloxNick = shippingData.roblox_username || 'não informado'
            messages = [
                {
                    id: 'msg-init',
                    sender: 'system',
                    sender_name: 'Ashens Store Suporte',
                    message: `Olá! Seu pedido foi registrado. Nick do Roblox: "${robloxNick}". Assim que o pagamento for verificado, nosso vendedor enviará o link do servidor VIP ou organizará a entrega dos itens diretamente aqui no chat.`,
                    timestamp: order.created_at || new Date().toISOString(),
                }
            ]
        }

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                external_id: order.external_id,
                status: order.status,
                payment_status: order.payment_status,
                total: order.total,
                customer_name: order.customer_name,
                roblox_username: shippingData.roblox_username || '',
                phone: order.customer_phone || shippingData.phone || '',
                items: order.items || [],
                created_at: order.created_at,
            },
            messages,
        })

    } catch (error: any) {
        console.error('[Chat API GET Error]:', error)
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
    }
}

/**
 * POST - Envia uma nova mensagem no chat do pedido
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { message, sender, sender_name } = body

        if (!message || typeof message !== 'string' || !message.trim()) {
            return NextResponse.json({ error: 'Mensagem não pode ser vazia' }, { status: 400 })
        }

        const validSender = ['buyer', 'seller', 'system'].includes(sender) ? sender : 'buyer'
        const cleanName = sender_name ? String(sender_name).trim() : (validSender === 'seller' ? 'Vendedor Ashens' : 'Comprador')

        const supabase = getSupabaseClient()

        // 1. Busca pedido atual
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        let fetchQuery = supabase
            .from('orders')
            .select('id, external_id, shipping_address')

        if (isUuid) {
            fetchQuery = fetchQuery.or(`external_id.eq.${id},id.eq.${id}`)
        } else {
            fetchQuery = fetchQuery.eq('external_id', id)
        }

        const { data: order, error: fetchError } = await fetchQuery.maybeSingle()

        if (fetchError || !order) {
            return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
        }

        const shippingData = (typeof order.shipping_address === 'object' && order.shipping_address) ? { ...order.shipping_address } : {}
        const currentMessages: ChatMessage[] = shippingData.chat_messages || []

        const newMessage: ChatMessage = {
            id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            sender: validSender,
            sender_name: cleanName,
            message: message.trim(),
            timestamp: new Date().toISOString(),
        }

        const updatedMessages = [...currentMessages, newMessage]
        shippingData.chat_messages = updatedMessages
        shippingData.last_message_at = newMessage.timestamp

        // 2. Atualiza no Supabase
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                shipping_address: shippingData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', order.id)

        if (updateError) {
            console.error('[Chat API Update Error]:', updateError)
            return NextResponse.json({ error: 'Erro ao salvar mensagem' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: newMessage,
            messages: updatedMessages,
        })

    } catch (error: any) {
        console.error('[Chat API POST Error]:', error)
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
    }
}
