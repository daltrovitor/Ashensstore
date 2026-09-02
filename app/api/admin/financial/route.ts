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

        // Métricas Globais
        let totalRevenue = 0
        let todayRevenue = 0
        let monthRevenue = 0
        let paidOrdersCount = 0

        // Canais
        let ecommerceRevenue = 0
        let ecommerceCount = 0
        let localRevenue = 0
        let localCount = 0

        // Métodos de Pagamento
        const paymentMethodsMap: Record<string, { label: string; total: number; count: number; color: string }> = {
            pix: { label: 'PIX (Direto CNPJ)', total: 0, count: 0, color: '#10B981' },
            credit_card: { label: 'Cartão de Crédito', total: 0, count: 0, color: '#3B82F6' },
            debit_card: { label: 'Cartão de Débito', total: 0, count: 0, color: '#8B5CF6' },
            card: { label: 'Cartão (Stripe)', total: 0, count: 0, color: '#2563EB' },
            cash: { label: 'Dinheiro', total: 0, count: 0, color: '#F59E0B' },
            boleto: { label: 'Boleto / A Prazo', total: 0, count: 0, color: '#6B7280' },
            other: { label: 'Outros', total: 0, count: 0, color: '#9CA3AF' },
        }

        // Histórico diário dos últimos 30 dias para gráfico
        const dailyRevenueMap: Record<string, { date: string; ecommerce: number; local: number; total: number }> = {}
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dStr = d.toISOString().slice(0, 10)
            dailyRevenueMap[dStr] = {
                date: new Date(dStr + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                ecommerce: 0,
                local: 0,
                total: 0,
            }
        }

        allOrders.forEach((order: any) => {
            const amount = parseFloat(order.total) || 0
            const orderDateStr = order.created_at ? order.created_at.slice(0, 10) : ''
            const orderMonthStr = order.created_at ? order.created_at.slice(0, 7) : ''

            // Considera pago se o status for PAID, CONFIRMED, DELIVERED, IN_PRODUCTION, SHIPPED ou payment_status = completed
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

                // Identifica se é local ou e-commerce
                const orderType = order.shipping_address?.order_type || 'ecommerce'
                if (orderType === 'local' || orderType === 'loja' || orderType === 'balcao') {
                    localRevenue += amount
                    localCount++
                    if (dailyRevenueMap[orderDateStr]) {
                        dailyRevenueMap[orderDateStr].local += amount
                        dailyRevenueMap[orderDateStr].total += amount
                    }
                } else {
                    ecommerceRevenue += amount
                    ecommerceCount++
                    if (dailyRevenueMap[orderDateStr]) {
                        dailyRevenueMap[orderDateStr].ecommerce += amount
                        dailyRevenueMap[orderDateStr].total += amount
                    }
                }

                // Agrega por método de pagamento
                const rawMethod = (order.payment_method || 'other').toLowerCase()
                let targetKey = 'other'
                if (rawMethod.includes('pix')) targetKey = 'pix'
                else if (rawMethod.includes('credit') || rawMethod.includes('credito')) targetKey = 'credit_card'
                else if (rawMethod.includes('debit') || rawMethod.includes('debito')) targetKey = 'debit_card'
                else if (rawMethod.includes('card') || rawMethod.includes('cartao')) targetKey = 'card'
                else if (rawMethod.includes('cash') || rawMethod.includes('dinheiro')) targetKey = 'cash'
                else if (rawMethod.includes('boleto') || rawMethod.includes('prazo')) targetKey = 'boleto'

                paymentMethodsMap[targetKey].total += amount
                paymentMethodsMap[targetKey].count++
            }
        })

        const averageTicket = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0

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

        // Se não houver métodos ainda, retorna lista padrão com valores zerados
        const safePaymentMethods = paymentMethodsList.length > 0 ? paymentMethodsList : [
            { id: 'pix', label: 'PIX (Direto CNPJ)', total: 0, count: 0, percentage: 0, color: '#10B981' },
            { id: 'credit_card', label: 'Cartão de Crédito', total: 0, count: 0, percentage: 0, color: '#3B82F6' },
            { id: 'debit_card', label: 'Cartão de Débito', total: 0, count: 0, percentage: 0, color: '#8B5CF6' },
            { id: 'cash', label: 'Dinheiro', total: 0, count: 0, percentage: 0, color: '#F59E0B' },
        ]

        return NextResponse.json({
            kpis: {
                total_revenue: totalRevenue,
                today_revenue: todayRevenue,
                month_revenue: monthRevenue,
                average_ticket: averageTicket,
                paid_orders_count: paidOrdersCount,
                all_orders_count: allOrders.length,
            },
            channels: {
                ecommerce: {
                    total: ecommerceRevenue,
                    count: ecommerceCount,
                    percentage: totalRevenue > 0 ? Math.round((ecommerceRevenue / totalRevenue) * 100) : 0,
                },
                local: {
                    total: localRevenue,
                    count: localCount,
                    percentage: totalRevenue > 0 ? Math.round((localRevenue / totalRevenue) * 100) : 0,
                },
            },
            payment_methods: safePaymentMethods,
            daily_chart: Object.values(dailyRevenueMap),
            recent_transactions: allOrders.slice(0, 20),
        })
    } catch (error: any) {
        console.error('[Admin Financial] Erro ao carregar dados:', error)
        return NextResponse.json(
            { error: 'Falha ao carregar dados financeiros' },
            { status: 500 }
        )
    }
}
