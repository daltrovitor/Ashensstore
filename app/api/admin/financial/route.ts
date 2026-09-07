import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'
import { getSupabaseService } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const supabase = getSupabaseService()
        if (!supabase) {
            return NextResponse.json({ error: 'Erro de conexão com o banco' }, { status: 500 })
        }

        const { searchParams } = new URL(request.url)
        const days = parseInt(searchParams.get('days') || '30')

        // Busca pedidos
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                id,
                external_id,
                status,
                payment_status,
                payment_method,
                total,
                subtotal,
                shipping_cost,
                customer_name,
                customer_email,
                shipping_address,
                created_at
            `)
            .order('created_at', { ascending: false })

        if (error) throw error

        const allOrders = orders || []

        // Datas de referência
        const now = new Date()
        const todayStr = now.toISOString().slice(0, 10)
        const currentMonthStr = now.toISOString().slice(0, 7) // YYYY-MM

        // Métricas Globais do E-commerce
        let totalRevenue = 0
        let todayRevenue = 0
        let monthRevenue = 0
        let pendingRevenue = 0
        let paidOrdersCount = 0
        let pendingOrdersCount = 0

        // Métodos de Pagamento do E-commerce
        const paymentMethodsMap: Record<string, { label: string; total: number; count: number; color: string }> = {
            pix: { label: 'PIX (Instantâneo)', total: 0, count: 0, color: '#48B9FA' },
            credit_card: { label: 'Cartão de Crédito', total: 0, count: 0, color: '#3B82F6' },
            card: { label: 'Cartão Online', total: 0, count: 0, color: '#2563EB' },
            other: { label: 'Outros Métodos', total: 0, count: 0, color: '#9CA3AF' },
        }

        // Histórico diário dos últimos 30 dias de vendas do E-commerce
        const dailyRevenueMap: Record<string, { date: string; revenue: number; orders: number }> = {}
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dStr = d.toISOString().slice(0, 10)
            dailyRevenueMap[dStr] = {
                date: new Date(dStr + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                revenue: 0,
                orders: 0,
            }
        }

        allOrders.forEach((order: any) => {
            const amount = parseFloat(order.total) || 0
            const orderDateStr = order.created_at ? order.created_at.slice(0, 10) : ''
            const orderMonthStr = order.created_at ? order.created_at.slice(0, 7) : ''

            // Considera pago se o status for PAID, CONFIRMED, DELIVERED, IN_PRODUCTION, SHIPPED ou payment_status = completed/paid
            const isPaid =
                ['PAID', 'CONFIRMED', 'DELIVERED', 'IN_PRODUCTION', 'SHIPPED'].includes(order.status) ||
                order.payment_status === 'completed' ||
                order.payment_status === 'paid'

            if (isPaid) {
                totalRevenue += amount
                paidOrdersCount++

                if (orderDateStr === todayStr) {
                    todayRevenue += amount
                }
                if (orderMonthStr === currentMonthStr) {
                    monthRevenue += amount
                }

                if (dailyRevenueMap[orderDateStr]) {
                    dailyRevenueMap[orderDateStr].revenue += amount
                    dailyRevenueMap[orderDateStr].orders += 1
                }

                // Agrega por método de pagamento
                const rawMethod = (order.payment_method || 'pix').toLowerCase()
                let targetKey = 'pix'
                if (rawMethod.includes('credit') || rawMethod.includes('credito')) targetKey = 'credit_card'
                else if (rawMethod.includes('card') || rawMethod.includes('cartao')) targetKey = 'card'
                else if (!rawMethod.includes('pix')) targetKey = 'other'

                if (!paymentMethodsMap[targetKey]) {
                    paymentMethodsMap[targetKey] = { label: 'Outros', total: 0, count: 0, color: '#9CA3AF' }
                }

                paymentMethodsMap[targetKey].total += amount
                paymentMethodsMap[targetKey].count++
            } else if (order.status === 'PENDING_PAYMENT' || order.payment_status === 'pending') {
                pendingRevenue += amount
                pendingOrdersCount++
            }
        })

        const averageTicket = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0
        const conversionRate = allOrders.length > 0 ? Math.round((paidOrdersCount / allOrders.length) * 100) : 0

        // Transforma mapa de métodos de pagamento em array com porcentagens
        const paymentMethodsList = Object.entries(paymentMethodsMap)
            .filter(([_, data]) => data.count > 0 || data.total > 0)
            .map(([key, data]) => ({
                id: key,
                label: data.label,
                total: data.total,
                count: data.count,
                percentage: totalRevenue > 0 ? Math.round((data.total / totalRevenue) * 100) : 0,
                color: data.color,
            }))

        // Se não houver métodos ainda, retorna lista padrão com PIX (oficial da loja)
        const safePaymentMethods = paymentMethodsList.length > 0 ? paymentMethodsList : [
            { id: 'pix', label: 'PIX (Instantâneo)', total: 0, count: 0, percentage: 100, color: '#48B9FA' },
        ]

        // Formata transações recentes do e-commerce
        const formattedTransactions = allOrders.slice(0, 30).map((tx: any) => {
            const shipping = (typeof tx.shipping_address === 'object' && tx.shipping_address) ? tx.shipping_address : {}
            return {
                id: tx.id,
                external_id: tx.external_id,
                customer_name: tx.customer_name || 'Comprador Online',
                customer_email: tx.customer_email || '',
                roblox_username: shipping.roblox_username || '',
                payment_method: tx.payment_method || 'pix',
                payment_status: tx.payment_status || 'pending',
                status: tx.status,
                total: parseFloat(tx.total) || 0,
                created_at: tx.created_at,
            }
        })

        return NextResponse.json({
            kpis: {
                total_revenue: totalRevenue,
                today_revenue: todayRevenue,
                month_revenue: monthRevenue,
                pending_revenue: pendingRevenue,
                average_ticket: averageTicket,
                paid_orders_count: paidOrdersCount,
                pending_orders_count: pendingOrdersCount,
                all_orders_count: allOrders.length,
                conversion_rate: conversionRate,
            },
            payment_methods: safePaymentMethods,
            daily_chart: Object.values(dailyRevenueMap),
            recent_transactions: formattedTransactions,
        })
    } catch (error: any) {
        console.error('[Admin Financial] Erro ao carregar dados:', error)
        return NextResponse.json(
            { error: 'Falha ao carregar dados financeiros' },
            { status: 500 }
        )
    }
}
