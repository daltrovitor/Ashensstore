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

const BUCKET_NAME = 'app_data'
const AFFILIATES_FILE_NAME = 'affiliates.json'
const DATA_DIR = path.join(process.cwd(), 'data')
const LOCAL_AFFILIATES_FILE = path.join(DATA_DIR, 'affiliates.json')

let bucketEnsured = false

async function ensureBucket(supabase: any) {
    if (bucketEnsured) return
    try {
        await supabase.storage.createBucket(BUCKET_NAME, { public: false })
        bucketEnsured = true
    } catch {
        bucketEnsured = true
    }
}

export async function readAffiliates(): Promise<Affiliate[]> {
    const supabase = getSupabaseService()

    if (supabase) {
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .download(AFFILIATES_FILE_NAME)

            if (!error && data) {
                const text = await data.text()
                if (text && text.trim()) {
                    return JSON.parse(text) as Affiliate[]
                }
                return []
            }

            if (error) {
                await ensureBucket(supabase)
                await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(AFFILIATES_FILE_NAME, '[]', { upsert: true, contentType: 'application/json' })
            }
        } catch (err) {
            console.warn('[Affiliates] Aviso ao ler do Supabase Storage:', err)
        }
    }

    // Fallback local com try-catch (nunca dispara EROFS)
    try {
        if (fs.existsSync(LOCAL_AFFILIATES_FILE)) {
            const raw = fs.readFileSync(LOCAL_AFFILIATES_FILE, 'utf-8')
            return JSON.parse(raw) as Affiliate[]
        }
    } catch (err) {
        console.warn('[Affiliates] Fallback local ignorado:', err)
    }

    return []
}

export async function saveAffiliates(affiliates: Affiliate[]): Promise<void> {
    const jsonStr = JSON.stringify(affiliates, null, 2)
    const supabase = getSupabaseService()

    if (supabase) {
        try {
            let { error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(AFFILIATES_FILE_NAME, jsonStr, {
                    upsert: true,
                    contentType: 'application/json',
                })

            if (error) {
                await ensureBucket(supabase)
                const retry = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(AFFILIATES_FILE_NAME, jsonStr, {
                        upsert: true,
                        contentType: 'application/json',
                    })
                if (retry.error) {
                    console.error('[Affiliates] Erro ao salvar no Supabase Storage:', retry.error)
                }
            }
        } catch (err) {
            console.error('[Affiliates] Exceção ao salvar no Supabase Storage:', err)
        }
    }

    // Tentativa não-bloqueante no disco local (ignora silenciosamente EROFS na Vercel)
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true })
        }
        fs.writeFileSync(LOCAL_AFFILIATES_FILE, jsonStr, 'utf-8')
    } catch {
        // Silenciosamente ignorado em ambientes somente-leitura
    }
}

export async function getAffiliateByUserId(userId: string): Promise<Affiliate | null> {
    const all = await readAffiliates()
    return all.find(a => a.user_id === userId) || null
}

export async function getAffiliateByCoupon(code: string): Promise<Affiliate | null> {
    if (!code) return null
    const clean = code.trim().toUpperCase()
    const all = await readAffiliates()
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

    const all = await readAffiliates()

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
    await saveAffiliates(all)

    return { success: true, affiliate: newAffiliate }
}

export async function validateCoupon(code: string): Promise<{
    valid: boolean
    coupon_code?: string
    discount_percent?: number
    affiliate_id?: string
    error?: string
}> {
    if (!code || typeof code !== 'string') {
        return { valid: false, error: 'Código de cupom inválido' }
    }

    const affiliate = await getAffiliateByCoupon(code)
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
    const affiliate = await getAffiliateByUserId(userId)
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
