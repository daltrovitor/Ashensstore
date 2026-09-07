import fs from 'fs'
import path from 'path'
import { getSupabaseService } from '@/lib/supabase/server'

export interface Affiliate {
    id: string
    user_id: string
    name: string
    email: string
    coupon_code: string
    discount_percent: number
    commission_percent: number
    created_at: string
}

const DATA_DIR = path.join(process.cwd(), 'data')
const AFFILIATES_FILE = path.join(DATA_DIR, 'affiliates.json')

function ensureFileExists() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(AFFILIATES_FILE)) {
        fs.writeFileSync(AFFILIATES_FILE, JSON.stringify([], null, 2), 'utf-8')
    }
}

export function readAffiliates(): Affiliate[] {
    ensureFileExists()
    try {
        const raw = fs.readFileSync(AFFILIATES_FILE, 'utf-8')
        return JSON.parse(raw) as Affiliate[]
    } catch (err) {
        console.error('[Affiliates] Erro ao ler afiliados:', err)
        return []
    }
}

export function saveAffiliates(affiliates: Affiliate[]) {
    ensureFileExists()
    fs.writeFileSync(AFFILIATES_FILE, JSON.stringify(affiliates, null, 2), 'utf-8')
}

export function getAffiliateByUserId(userId: string): Affiliate | null {
    const all = readAffiliates()
    return all.find(a => a.user_id === userId) || null
}

export function getAffiliateByCoupon(code: string): Affiliate | null {
    if (!code) return null
    const clean = code.trim().toUpperCase()
    const all = readAffiliates()
    return all.find(a => a.coupon_code.toUpperCase() === clean) || null
}

export async function registerAffiliate(params: {
    userId: string
    name: string
    email: string
    couponCode: string
}): Promise<{ success: boolean; affiliate?: Affiliate; error?: string }> {
    const { userId, name, email, couponCode } = params

    const cleanCode = couponCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
    if (cleanCode.length < 3) {
        return { success: false, error: 'O código do cupom deve ter no mínimo 3 caracteres alfanuméricos.' }
    }

    const all = readAffiliates()

    // Verifica se usuário já é afiliado
    const existingUser = all.find(a => a.user_id === userId)
    if (existingUser) {
        return { success: true, affiliate: existingUser }
    }

    // Verifica se cupom já está em uso por outro
    const existingCoupon = all.find(a => a.coupon_code.toUpperCase() === cleanCode)
    if (existingCoupon) {
        return { success: false, error: 'Este cupom já está em uso. Por favor, escolha outro código.' }
    }

    const newAffiliate: Affiliate = {
        id: 'aff_' + Math.random().toString(36).substring(2, 10),
        user_id: userId,
        name: name || 'Afiliado',
        email: email,
        coupon_code: cleanCode,
        discount_percent: 10,
        commission_percent: 10,
        created_at: new Date().toISOString(),
    }

    all.push(newAffiliate)
    saveAffiliates(all)

    return { success: true, affiliate: newAffiliate }
}

export function validateCoupon(code: string): {
    valid: boolean
    coupon_code?: string
    discount_percent?: number
    affiliate_id?: string
    error?: string
} {
    if (!code || typeof code !== 'string') {
        return { valid: false, error: 'Código de cupom inválido' }
    }

    const affiliate = getAffiliateByCoupon(code)
    if (!affiliate) {
        return { valid: false, error: 'Cupom de desconto não encontrado ou inválido' }
    }

    return {
        valid: true,
        coupon_code: affiliate.coupon_code,
        discount_percent: affiliate.discount_percent || 10,
        affiliate_id: affiliate.user_id,
    }
}

export interface AffiliateStats {
    affiliate: Affiliate
    total_sales_count: number
    total_revenue: number
    total_commission: number
    paid_orders_count: number
    orders: Array<{
        id: string
        external_id: string
        created_at: string
        total: number
        status: string
        commission: number
    }>
}

export async function getAffiliateStats(userId: string): Promise<AffiliateStats | null> {
    const affiliate = getAffiliateByUserId(userId)
    if (!affiliate) return null

    const supabase = getSupabaseService()
    let totalSalesCount = 0
    let totalRevenue = 0
    let totalCommission = 0
    let paidOrdersCount = 0
    const ordersList: AffiliateStats['orders'] = []

    if (supabase) {
        try {
            const { data: orders, error } = await supabase
                .from('orders')
                .select('id, external_id, total, status, payment_status, created_at, shipping_address')
                .order('created_at', { ascending: false })

            if (!error && orders) {
                for (const order of orders) {
                    const shipping = (typeof order.shipping_address === 'object' && order.shipping_address) ? order.shipping_address : {}
                    const orderCoupon = (shipping.coupon_code || '').trim().toUpperCase()
                    const orderAffiliateId = shipping.affiliate_id

                    if (orderCoupon === affiliate.coupon_code.toUpperCase() || orderAffiliateId === affiliate.user_id) {
                        const isPaid = order.status === 'PAID' || order.status === 'CONFIRMED' || order.payment_status === 'completed'
                        const orderTotal = Number(order.total) || 0
                        const commission = Number(shipping.affiliate_commission) || (orderTotal * 0.10)

                        totalSalesCount++
                        if (isPaid) {
                            paidOrdersCount++
                            totalRevenue += orderTotal
                            totalCommission += commission
                        }

                        ordersList.push({
                            id: order.id,
                            external_id: order.external_id,
                            created_at: order.created_at,
                            total: orderTotal,
                            status: order.status,
                            commission,
                        })
                    }
                }
            }
        } catch (err) {
            console.error('[Affiliates] Erro ao buscar pedidos no Supabase:', err)
        }
    }

    return {
        affiliate,
        total_sales_count: totalSalesCount,
        paid_orders_count: paidOrdersCount,
        total_revenue: totalRevenue,
        total_commission: totalCommission,
        orders: ordersList,
    }
}
