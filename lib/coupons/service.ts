import fs from 'fs'
import path from 'path'
import { getSupabaseService } from '@/lib/supabase/server'
import { getAffiliateByCoupon } from '@/lib/affiliates/service'

export type CouponDiscountType = 'percentage' | 'fixed'
export type CouponApplicability = 'all' | 'products' | 'categories'

export interface Coupon {
    id: string
    code: string
    description?: string
    discount_type: CouponDiscountType
    discount_value: number
    max_discount?: number | null
    min_order_value?: number | null
    max_uses?: number | null
    max_uses_per_customer?: number | null
    start_date?: string | null
    expiration_date?: string | null
    is_active: boolean
    applicability: CouponApplicability
    applicable_product_ids?: string[]
    applicable_category_ids?: string[]
    allow_stacking: boolean
    current_uses: number
    total_discount_granted: number
    created_at: string
    updated_at: string
}

export interface CouponUsage {
    id: string
    coupon_id: string
    coupon_code: string
    order_id: string
    customer_email?: string
    customer_name?: string
    customer_roblox?: string
    discount_amount: number
    order_total: number
    created_at: string
}

export interface CouponSummary {
    total_coupons: number
    active_coupons: number
    expired_coupons: number
    total_uses: number
    total_discount_granted: number
}

export interface ValidateCouponParams {
    code: string
    items?: Array<{
        product_id?: string
        variant_id?: string
        name: string
        price: number
        quantity: number
        category_id?: string
    }>
    subtotal?: number
    customer_email?: string
    customer_roblox?: string
}

export interface ValidateCouponResult {
    valid: boolean
    coupon_id?: string
    coupon_code?: string
    discount_type?: CouponDiscountType
    discount_value?: number
    discount_amount?: number
    max_discount?: number | null
    allow_stacking?: boolean
    is_affiliate?: boolean
    affiliate_id?: string
    message?: string
    error?: string
}

const BUCKET_NAME = 'app_data'
const COUPONS_FILE_NAME = 'coupons.json'
const COUPON_USAGES_FILE_NAME = 'coupon_usages.json'
const DATA_DIR = path.join(process.cwd(), 'data')
const LOCAL_COUPONS_FILE = path.join(DATA_DIR, 'coupons.json')
const LOCAL_COUPON_USAGES_FILE = path.join(DATA_DIR, 'coupon_usages.json')

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

/**
 * Lê todos os cupons com fallback resiliente
 */
export async function readCoupons(): Promise<Coupon[]> {
    const supabase = getSupabaseService()

    if (supabase) {
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .download(COUPONS_FILE_NAME)

            if (!error && data) {
                const text = await data.text()
                if (text && text.trim()) {
                    return JSON.parse(text) as Coupon[]
                }
                return []
            }

            if (error) {
                await ensureBucket(supabase)
                await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(COUPONS_FILE_NAME, '[]', { upsert: true, contentType: 'application/json' })
            }
        } catch (err) {
            console.warn('[Coupons] Aviso ao ler do Supabase Storage:', err)
        }
    }

    try {
        if (fs.existsSync(LOCAL_COUPONS_FILE)) {
            const raw = fs.readFileSync(LOCAL_COUPONS_FILE, 'utf-8')
            return JSON.parse(raw) as Coupon[]
        }
    } catch (err) {
        console.warn('[Coupons] Fallback local ignorado:', err)
    }

    return []
}

/**
 * Salva todos os cupons
 */
export async function saveCoupons(coupons: Coupon[]): Promise<void> {
    const jsonStr = JSON.stringify(coupons, null, 2)
    const supabase = getSupabaseService()

    if (supabase) {
        try {
            let { error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(COUPONS_FILE_NAME, jsonStr, {
                    upsert: true,
                    contentType: 'application/json',
                })

            if (error) {
                await ensureBucket(supabase)
                const retry = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(COUPONS_FILE_NAME, jsonStr, {
                        upsert: true,
                        contentType: 'application/json',
                    })
                if (retry.error) {
                    console.error('[Coupons] Erro ao salvar no Supabase Storage:', retry.error)
                }
            }
        } catch (err) {
            console.error('[Coupons] Exceção ao salvar no Supabase Storage:', err)
        }
    }

    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true })
        }
        fs.writeFileSync(LOCAL_COUPONS_FILE, jsonStr, 'utf-8')
    } catch {
        // Ignora EROFS na Vercel
    }
}

/**
 * Lê os registros de uso de cupons
 */
export async function readCouponUsages(): Promise<CouponUsage[]> {
    const supabase = getSupabaseService()

    if (supabase) {
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .download(COUPON_USAGES_FILE_NAME)

            if (!error && data) {
                const text = await data.text()
                if (text && text.trim()) {
                    return JSON.parse(text) as CouponUsage[]
                }
                return []
            }

            if (error) {
                await ensureBucket(supabase)
                await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(COUPON_USAGES_FILE_NAME, '[]', { upsert: true, contentType: 'application/json' })
            }
        } catch (err) {
            console.warn('[Coupons] Aviso ao ler usages do Supabase Storage:', err)
        }
    }

    try {
        if (fs.existsSync(LOCAL_COUPON_USAGES_FILE)) {
            const raw = fs.readFileSync(LOCAL_COUPON_USAGES_FILE, 'utf-8')
            return JSON.parse(raw) as CouponUsage[]
        }
    } catch (err) {
        console.warn('[Coupons] Fallback local de usages ignorado:', err)
    }

    return []
}

/**
 * Salva os registros de uso de cupons
 */
export async function saveCouponUsages(usages: CouponUsage[]): Promise<void> {
    const jsonStr = JSON.stringify(usages, null, 2)
    const supabase = getSupabaseService()

    if (supabase) {
        try {
            let { error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(COUPON_USAGES_FILE_NAME, jsonStr, {
                    upsert: true,
                    contentType: 'application/json',
                })

            if (error) {
                await ensureBucket(supabase)
                await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(COUPON_USAGES_FILE_NAME, jsonStr, {
                        upsert: true,
                        contentType: 'application/json',
                    })
            }
        } catch (err) {
            console.error('[Coupons] Exceção ao salvar usages:', err)
        }
    }

    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true })
        }
        fs.writeFileSync(LOCAL_COUPON_USAGES_FILE, jsonStr, 'utf-8')
    } catch {
        // Ignora EROFS na Vercel
    }
}

/**
 * Normaliza código de cupom
 */
export function normalizeCouponCode(code: string): string {
    return (code || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, '')
}

/**
 * Retorna todos os cupons com resumo de métricas
 */
export async function getCouponsWithSummary(): Promise<{
    coupons: Coupon[]
    summary: CouponSummary
}> {
    const coupons = await readCoupons()
    const now = new Date()

    let activeCount = 0
    let expiredCount = 0
    let totalUses = 0
    let totalDiscount = 0

    for (const c of coupons) {
        const isExpired = c.expiration_date ? new Date(c.expiration_date) < now : false
        if (c.is_active && !isExpired) {
            activeCount++
        }
        if (isExpired) {
            expiredCount++
        }
        totalUses += (c.current_uses || 0)
        totalDiscount += (Number(c.total_discount_granted) || 0)
    }

    return {
        coupons,
        summary: {
            total_coupons: coupons.length,
            active_coupons: activeCount,
            expired_coupons: expiredCount,
            total_uses: totalUses,
            total_discount_granted: Math.round(totalDiscount * 100) / 100,
        }
    }
}

/**
 * Busca cupom por ID
 */
export async function getCouponById(id: string): Promise<Coupon | null> {
    const coupons = await readCoupons()
    return coupons.find(c => c.id === id) || null
}

/**
 * Busca cupom por código
 */
export async function getCouponByCode(code: string): Promise<Coupon | null> {
    if (!code) return null
    const clean = normalizeCouponCode(code)
    const coupons = await readCoupons()
    return coupons.find(c => normalizeCouponCode(c.code) === clean) || null
}

/**
 * Cria um novo cupom
 */
export async function createCoupon(data: {
    code: string
    description?: string
    discount_type: CouponDiscountType
    discount_value: number
    max_discount?: number | null
    min_order_value?: number | null
    max_uses?: number | null
    max_uses_per_customer?: number | null
    start_date?: string | null
    expiration_date?: string | null
    is_active?: boolean
    applicability?: CouponApplicability
    applicable_product_ids?: string[]
    applicable_category_ids?: string[]
    allow_stacking?: boolean
}): Promise<{ success: boolean; coupon?: Coupon; error?: string }> {
    const cleanCode = normalizeCouponCode(data.code)
    if (!cleanCode || cleanCode.length < 2) {
        return { success: false, error: 'O código do cupom deve ter no mínimo 2 caracteres alfanuméricos.' }
    }

    if (data.discount_value <= 0) {
        return { success: false, error: 'O valor do desconto deve ser maior que zero.' }
    }

    if (data.discount_type === 'percentage' && data.discount_value > 100) {
        return { success: false, error: 'O desconto em porcentagem não pode ultrapassar 100%.' }
    }

    const coupons = await readCoupons()

    // Verifica duplicidade no sistema de cupons
    if (coupons.some(c => normalizeCouponCode(c.code) === cleanCode)) {
        return { success: false, error: `O cupom "${cleanCode}" já existe.` }
    }

    // Verifica se conflita com cupom de afiliado
    const existingAffiliate = await getAffiliateByCoupon(cleanCode)
    if (existingAffiliate) {
        return { success: false, error: `O código "${cleanCode}" já está em uso por um afiliado.` }
    }

    const newCoupon: Coupon = {
        id: 'cup_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
        code: cleanCode,
        description: data.description?.trim() || '',
        discount_type: data.discount_type,
        discount_value: Number(data.discount_value),
        max_discount: data.max_discount !== undefined && data.max_discount !== null ? Number(data.max_discount) : null,
        min_order_value: data.min_order_value !== undefined && data.min_order_value !== null ? Number(data.min_order_value) : null,
        max_uses: data.max_uses !== undefined && data.max_uses !== null ? Math.floor(Number(data.max_uses)) : null,
        max_uses_per_customer: data.max_uses_per_customer !== undefined && data.max_uses_per_customer !== null ? Math.floor(Number(data.max_uses_per_customer)) : 1,
        start_date: data.start_date || null,
        expiration_date: data.expiration_date || null,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
        applicability: data.applicability || 'all',
        applicable_product_ids: data.applicable_product_ids || [],
        applicable_category_ids: data.applicable_category_ids || [],
        allow_stacking: Boolean(data.allow_stacking),
        current_uses: 0,
        total_discount_granted: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }

    coupons.unshift(newCoupon)
    await saveCoupons(coupons)

    return { success: true, coupon: newCoupon }
}

/**
 * Atualiza um cupom existente
 */
export async function updateCoupon(id: string, data: Partial<Coupon>): Promise<{ success: boolean; coupon?: Coupon; error?: string }> {
    const coupons = await readCoupons()
    const index = coupons.findIndex(c => c.id === id)

    if (index === -1) {
        return { success: false, error: 'Cupom não encontrado.' }
    }

    const current = coupons[index]

    if (data.code) {
        const cleanCode = normalizeCouponCode(data.code)
        if (cleanCode.length < 2) {
            return { success: false, error: 'O código do cupom deve ter no mínimo 2 caracteres.' }
        }
        const duplicate = coupons.find(c => c.id !== id && normalizeCouponCode(c.code) === cleanCode)
        if (duplicate) {
            return { success: false, error: `O cupom "${cleanCode}" já está em uso.` }
        }
        current.code = cleanCode
    }

    if (data.discount_value !== undefined) {
        if (data.discount_value <= 0) {
            return { success: false, error: 'O valor do desconto deve ser maior que zero.' }
        }
        if ((data.discount_type || current.discount_type) === 'percentage' && data.discount_value > 100) {
            return { success: false, error: 'O desconto em porcentagem não pode ultrapassar 100%.' }
        }
        current.discount_value = Number(data.discount_value)
    }

    if (data.discount_type !== undefined) current.discount_type = data.discount_type
    if (data.description !== undefined) current.description = data.description.trim()
    if (data.max_discount !== undefined) current.max_discount = data.max_discount !== null ? Number(data.max_discount) : null
    if (data.min_order_value !== undefined) current.min_order_value = data.min_order_value !== null ? Number(data.min_order_value) : null
    if (data.max_uses !== undefined) current.max_uses = data.max_uses !== null ? Math.floor(Number(data.max_uses)) : null
    if (data.max_uses_per_customer !== undefined) current.max_uses_per_customer = data.max_uses_per_customer !== null ? Math.floor(Number(data.max_uses_per_customer)) : null
    if (data.start_date !== undefined) current.start_date = data.start_date || null
    if (data.expiration_date !== undefined) current.expiration_date = data.expiration_date || null
    if (data.is_active !== undefined) current.is_active = Boolean(data.is_active)
    if (data.applicability !== undefined) current.applicability = data.applicability
    if (data.applicable_product_ids !== undefined) current.applicable_product_ids = data.applicable_product_ids
    if (data.applicable_category_ids !== undefined) current.applicable_category_ids = data.applicable_category_ids
    if (data.allow_stacking !== undefined) current.allow_stacking = Boolean(data.allow_stacking)

    current.updated_at = new Date().toISOString()
    coupons[index] = current
    await saveCoupons(coupons)

    return { success: true, coupon: current }
}

/**
 * Alterna status ativo/inativo
 */
export async function toggleCouponStatus(id: string): Promise<{ success: boolean; is_active?: boolean; error?: string }> {
    const coupons = await readCoupons()
    const target = coupons.find(c => c.id === id)
    if (!target) return { success: false, error: 'Cupom não encontrado.' }

    target.is_active = !target.is_active
    target.updated_at = new Date().toISOString()
    await saveCoupons(coupons)

    return { success: true, is_active: target.is_active }
}

/**
 * Exclui um cupom
 */
export async function deleteCoupon(id: string): Promise<{ success: boolean; error?: string }> {
    const coupons = await readCoupons()
    const filtered = coupons.filter(c => c.id !== id)
    if (filtered.length === coupons.length) {
        return { success: false, error: 'Cupom não encontrado.' }
    }
    await saveCoupons(filtered)
    return { success: true }
}

/**
 * Validação profunda do cupom para aplicação no carrinho ou checkout
 */
export async function validateCouponForCheckout(params: ValidateCouponParams): Promise<ValidateCouponResult> {
    const rawCode = params.code
    if (!rawCode || typeof rawCode !== 'string') {
        return { valid: false, error: 'Informe um código de cupom válido.' }
    }

    const cleanCode = normalizeCouponCode(rawCode)
    const coupon = await getCouponByCode(cleanCode)

    // Se não for cupom do sistema de cupons, verifica se é afiliado (retrocompatibilidade)
    if (!coupon) {
        const affiliate = await getAffiliateByCoupon(cleanCode)
        if (affiliate) {
            const items = params.items || []
            const subtotal = params.subtotal !== undefined
                ? params.subtotal
                : items.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0)

            const discountPct = affiliate.discount_percent || 10
            const discountAmount = Math.round((subtotal * (discountPct / 100)) * 100) / 100

            return {
                valid: true,
                coupon_code: affiliate.coupon_code,
                discount_type: 'percentage',
                discount_value: discountPct,
                discount_amount: discountAmount,
                is_affiliate: true,
                affiliate_id: affiliate.user_id,
                message: `Cupom de afiliado "${affiliate.coupon_code}" aplicado (${discountPct}% de desconto)!`,
            }
        }

        return { valid: false, error: 'Cupom não encontrado ou inválido.' }
    }

    // 1. Status ativo
    if (!coupon.is_active) {
        return { valid: false, error: 'Este cupom está desativado no momento.' }
    }

    // 2. Validade: data de início
    const now = new Date()
    if (coupon.start_date) {
        const startDate = new Date(coupon.start_date)
        if (now < startDate) {
            return { valid: false, error: 'Este cupom ainda não começou a valer.' }
        }
    }

    // 3. Validade: data de expiração
    if (coupon.expiration_date) {
        const expDate = new Date(coupon.expiration_date)
        // Se a data for apenas YYYY-MM-DD, estende até o final do dia
        if (coupon.expiration_date.length === 10) {
            expDate.setHours(23, 59, 59, 999)
        }
        if (now > expDate) {
            return { valid: false, error: 'Este cupom já expirou.' }
        }
    }

    // 4. Limite de utilizações global
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        return { valid: false, error: 'O limite total de utilizações deste cupom foi atingido.' }
    }

    // 5. Limite de utilizações por cliente
    if (coupon.max_uses_per_customer && (params.customer_email || params.customer_roblox)) {
        const usages = await readCouponUsages()
        const cleanEmail = (params.customer_email || '').trim().toLowerCase()
        const cleanRoblox = (params.customer_roblox || '').trim().toLowerCase()

        const customerUsages = usages.filter(u => {
            if (u.coupon_id !== coupon.id && normalizeCouponCode(u.coupon_code) !== cleanCode) return false
            const matchEmail = cleanEmail && u.customer_email && u.customer_email.trim().toLowerCase() === cleanEmail
            const matchRoblox = cleanRoblox && u.customer_roblox && u.customer_roblox.trim().toLowerCase() === cleanRoblox
            return matchEmail || matchRoblox
        })

        if (customerUsages.length >= coupon.max_uses_per_customer) {
            return {
                valid: false,
                error: `Você já atingiu o limite de uso deste cupom (${coupon.max_uses_per_customer} vez${coupon.max_uses_per_customer > 1 ? 'es' : ''}).`
            }
        }
    }

    // 6. Verificar elegibilidade dos itens do carrinho
    const items = params.items || []
    let eligibleItems = items

    if (items.length > 0) {
        if (coupon.applicability === 'products') {
            const allowedProductIds = coupon.applicable_product_ids || []
            eligibleItems = items.filter(item => item.product_id && allowedProductIds.includes(item.product_id))

            if (eligibleItems.length === 0) {
                return { valid: false, error: 'Nenhum dos produtos em seu carrinho é elegível para este cupom.' }
            }
        } else if (coupon.applicability === 'categories') {
            const allowedCategoryIds = coupon.applicable_category_ids || []
            eligibleItems = items.filter(item => item.category_id && allowedCategoryIds.includes(item.category_id))

            if (eligibleItems.length === 0) {
                return { valid: false, error: 'Nenhum produto da categoria elegível foi encontrado em seu carrinho.' }
            }
        }
    }

    // Calcula subtotal dos itens elegíveis (ou subtotal geral se items não foram detalhados)
    const eligibleSubtotal = items.length > 0
        ? eligibleItems.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0)
        : (params.subtotal || 0)

    // 7. Valor mínimo de compra
    if (coupon.min_order_value && eligibleSubtotal < coupon.min_order_value) {
        const formattedMin = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(coupon.min_order_value)
        return {
            valid: false,
            error: `O valor mínimo para aplicar este cupom é de ${formattedMin}.`
        }
    }

    // 8. Cálculo do desconto
    let calculatedDiscount = 0

    if (coupon.discount_type === 'percentage') {
        let pctDiscount = eligibleSubtotal * (coupon.discount_value / 100)
        if (coupon.max_discount && coupon.max_discount > 0) {
            pctDiscount = Math.min(pctDiscount, coupon.max_discount)
        }
        calculatedDiscount = pctDiscount
    } else {
        // Valor fixo em R$
        calculatedDiscount = Math.min(coupon.discount_value, eligibleSubtotal)
    }

    calculatedDiscount = Math.round(calculatedDiscount * 100) / 100

    const formattedDiscount = coupon.discount_type === 'percentage'
        ? `${coupon.discount_value}%`
        : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(coupon.discount_value)

    return {
        valid: true,
        coupon_id: coupon.id,
        coupon_code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: calculatedDiscount,
        max_discount: coupon.max_discount,
        allow_stacking: coupon.allow_stacking,
        message: `Cupom "${coupon.code}" aplicado com sucesso (-${formattedDiscount})!`,
    }
}

/**
 * Registra a utilização de um cupom após confirmação do pedido
 */
export async function recordCouponUsage(params: {
    coupon_id?: string
    coupon_code: string
    order_id: string
    customer_email?: string
    customer_name?: string
    customer_roblox?: string
    discount_amount: number
    order_total: number
}): Promise<boolean> {
    try {
        const cleanCode = normalizeCouponCode(params.coupon_code)
        const coupons = await readCoupons()
        const targetCoupon = coupons.find(c => c.id === params.coupon_id || normalizeCouponCode(c.code) === cleanCode)

        // Se for cupom do sistema, atualiza métricas
        if (targetCoupon) {
            targetCoupon.current_uses = (targetCoupon.current_uses || 0) + 1
            targetCoupon.total_discount_granted = Math.round(((targetCoupon.total_discount_granted || 0) + params.discount_amount) * 100) / 100
            targetCoupon.updated_at = new Date().toISOString()
            await saveCoupons(coupons)
        }

        // Registra histórico de uso
        const usages = await readCouponUsages()
        const newUsage: CouponUsage = {
            id: 'usg_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
            coupon_id: targetCoupon?.id || 'affiliate',
            coupon_code: cleanCode,
            order_id: params.order_id,
            customer_email: params.customer_email || '',
            customer_name: params.customer_name || '',
            customer_roblox: params.customer_roblox || '',
            discount_amount: Number(params.discount_amount) || 0,
            order_total: Number(params.order_total) || 0,
            created_at: new Date().toISOString(),
        }

        usages.push(newUsage)
        await saveCouponUsages(usages)

        return true
    } catch (err) {
        console.error('[Coupons] Falha ao registrar utilização do cupom:', err)
        return false
    }
}

/**
 * Restaura o uso de um cupom se o pedido for cancelado
 */
export async function restoreCouponUsage(orderId: string): Promise<boolean> {
    try {
        const usages = await readCouponUsages()
        const usageIndex = usages.findIndex(u => u.order_id === orderId)

        if (usageIndex === -1) return false

        const usage = usages[usageIndex]
        usages.splice(usageIndex, 1)
        await saveCouponUsages(usages)

        if (usage.coupon_id && usage.coupon_id !== 'affiliate') {
            const coupons = await readCoupons()
            const coupon = coupons.find(c => c.id === usage.coupon_id)
            if (coupon) {
                coupon.current_uses = Math.max(0, (coupon.current_uses || 1) - 1)
                coupon.total_discount_granted = Math.max(0, Math.round(((coupon.total_discount_granted || usage.discount_amount) - usage.discount_amount) * 100) / 100)
                coupon.updated_at = new Date().toISOString()
                await saveCoupons(coupons)
            }
        }

        return true
    } catch (err) {
        console.error('[Coupons] Erro ao restaurar uso do cupom:', err)
        return false
    }
}
