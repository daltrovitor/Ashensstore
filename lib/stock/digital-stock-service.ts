import fs from 'fs'
import path from 'path'
import { getSupabaseService } from '@/lib/supabase/server'

export interface DigitalStockItem {
    id: string
    productId: string
    variantId?: string
    message: string
    status: 'available' | 'delivered'
    createdAt: string
    deliveredAt?: string
    deliveredToOrderId?: string
    deliveredToOrderExternalId?: string
}

const BUCKET_NAME = 'app_data'
const STOCK_FILE_NAME = 'digital-stock.json'
const DATA_DIR = path.join(process.cwd(), 'data')
const LOCAL_STOCK_FILE = path.join(DATA_DIR, 'digital-stock.json')

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
 * Lê todas as mensagens de estoque (Supabase Storage com fallback resiliente)
 */
export async function readAllStock(): Promise<DigitalStockItem[]> {
    const supabase = getSupabaseService()

    if (supabase) {
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .download(STOCK_FILE_NAME)

            if (!error && data) {
                const text = await data.text()
                if (text && text.trim()) {
                    return JSON.parse(text) as DigitalStockItem[]
                }
                return []
            }

            // Se o arquivo ainda não existir no bucket, cria com array vazio
            if (error) {
                await ensureBucket(supabase)
                await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(STOCK_FILE_NAME, '[]', { upsert: true, contentType: 'application/json' })
            }
        } catch (err) {
            console.warn('[DigitalStock] Aviso ao ler do Supabase Storage:', err)
        }
    }

    // Fallback local com try-catch (nunca dispara EROFS)
    try {
        if (fs.existsSync(LOCAL_STOCK_FILE)) {
            const raw = fs.readFileSync(LOCAL_STOCK_FILE, 'utf-8')
            return JSON.parse(raw) as DigitalStockItem[]
        }
    } catch (err) {
        console.warn('[DigitalStock] Fallback local ignorado:', err)
    }

    return []
}

/**
 * Salva todas as mensagens de estoque (Supabase Storage com salvamento local opcional)
 */
export async function saveAllStock(items: DigitalStockItem[]): Promise<void> {
    const jsonStr = JSON.stringify(items, null, 2)
    const supabase = getSupabaseService()

    if (supabase) {
        try {
            let { error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(STOCK_FILE_NAME, jsonStr, {
                    upsert: true,
                    contentType: 'application/json',
                })

            if (error) {
                await ensureBucket(supabase)
                const retry = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(STOCK_FILE_NAME, jsonStr, {
                        upsert: true,
                        contentType: 'application/json',
                    })
                if (retry.error) {
                    console.error('[DigitalStock] Erro ao gravar no Supabase Storage:', retry.error)
                }
            }
        } catch (err) {
            console.error('[DigitalStock] Exceção ao gravar no Supabase Storage:', err)
        }
    }

    // Tentativa não-bloqueante no disco local (ignora silenciosamente EROFS na Vercel/serverless)
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true })
        }
        fs.writeFileSync(LOCAL_STOCK_FILE, jsonStr, 'utf-8')
    } catch {
        // Silenciosamente ignorado em ambientes somente-leitura (Vercel Lambda)
    }
}

/**
 * Retorna itens disponíveis para um produto (e opcionalmente variante)
 */
export async function getAvailableStockItems(productId: string, variantId?: string): Promise<DigitalStockItem[]> {
    const all = await readAllStock()
    return all.filter(item => {
        if (item.status !== 'available') return false
        if (item.productId !== productId) return false
        if (variantId && item.variantId && item.variantId !== variantId) return false
        return true
    })
}

/**
 * Retorna todos os itens (disponíveis e entregues) de um produto
 */
export async function getAllStockItemsForProduct(productId: string): Promise<DigitalStockItem[]> {
    const all = await readAllStock()
    return all.filter(item => item.productId === productId)
}

/**
 * Sincroniza a quantidade de estoque com a tabela product_variants no Supabase
 */
export async function syncProductVariantStock(productId: string, variantId?: string): Promise<number> {
    const available = await getAvailableStockItems(productId, variantId)
    const newStockCount = available.length

    const supabase = getSupabaseService()
    if (!supabase) return newStockCount

    try {
        if (variantId && variantId.length > 10) {
            await supabase
                .from('product_variants')
                .update({
                    stock: newStockCount,
                    in_stock: newStockCount > 0,
                })
                .eq('id', variantId)
        } else {
            // Atualiza todas as variantes associadas ao produto
            await supabase
                .from('product_variants')
                .update({
                    stock: newStockCount,
                    in_stock: newStockCount > 0,
                })
                .eq('product_id', productId)
        }
    } catch (err) {
        console.error('[DigitalStock] Erro ao sincronizar estoque com Supabase:', err)
    }

    return newStockCount
}

/**
 * Adiciona mensagens ao estoque de um produto (em lote ou individual)
 */
export async function addStockMessages(
    productId: string,
    messages: string[],
    variantId?: string
): Promise<{ countAdded: number; totalAvailable: number }> {
    const cleanMessages = messages
        .map(m => m.trim())
        .filter(m => m.length > 0)

    if (cleanMessages.length === 0) {
        const available = await getAvailableStockItems(productId, variantId)
        return { countAdded: 0, totalAvailable: available.length }
    }

    const all = await readAllStock()
    const now = new Date().toISOString()

    const newItems: DigitalStockItem[] = cleanMessages.map(msg => ({
        id: 'stk_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36),
        productId,
        variantId: variantId || undefined,
        message: msg,
        status: 'available',
        createdAt: now,
    }))

    all.push(...newItems)
    await saveAllStock(all)

    const totalAvailable = await syncProductVariantStock(productId, variantId)

    return {
        countAdded: newItems.length,
        totalAvailable,
    }
}

/**
 * Remove um item específico do estoque
 */
export async function removeStockItem(itemId: string): Promise<{ success: boolean; productId?: string; remainingAvailable: number }> {
    const all = await readAllStock()
    const index = all.findIndex(item => item.id === itemId)

    if (index === -1) {
        return { success: false, remainingAvailable: 0 }
    }

    const target = all[index]
    all.splice(index, 1)
    await saveAllStock(all)

    const remainingAvailable = await syncProductVariantStock(target.productId, target.variantId)

    return {
        success: true,
        productId: target.productId,
        remainingAvailable,
    }
}

/**
 * Seleciona aleatoriamente e entrega N mensagens do estoque do produto,
 * marcando-as como entregues e reduzindo o estoque no Supabase.
 */
export async function deliverRandomStockItems(params: {
    productId?: string
    variantId?: string
    quantity: number
    orderId: string
    orderExternalId: string
}): Promise<{
    delivered: DigitalStockItem[]
    deliveredMessages: string[]
    remainingAvailable: number
}> {
    const { productId, variantId, quantity, orderId, orderExternalId } = params
    const all = await readAllStock()

    // Filtra itens disponíveis para este produto/variante
    const candidateIndices: number[] = []
    all.forEach((item, idx) => {
        if (item.status !== 'available') return
        if (productId && item.productId !== productId) return
        if (variantId && item.variantId && item.variantId !== variantId) return
        candidateIndices.push(idx)
    })

    const needed = Math.max(1, quantity)
    const delivered: DigitalStockItem[] = []
    const now = new Date().toISOString()

    // Sorteia aleatoriamente 'needed' itens disponíveis
    for (let i = 0; i < needed && candidateIndices.length > 0; i++) {
        const randomPos = Math.floor(Math.random() * candidateIndices.length)
        const targetIdx = candidateIndices[randomPos]

        // Remove do array de candidatos para não sortear o mesmo item
        candidateIndices.splice(randomPos, 1)

        const item = all[targetIdx]
        item.status = 'delivered'
        item.deliveredAt = now
        item.deliveredToOrderId = orderId
        item.deliveredToOrderExternalId = orderExternalId

        delivered.push(item)
    }

    if (delivered.length > 0) {
        await saveAllStock(all)
        // Sincroniza estoque no Supabase
        const targetProductId = productId || delivered[0].productId
        const targetVariantId = variantId || delivered[0].variantId
        const remainingAvailable = await syncProductVariantStock(targetProductId, targetVariantId)

        return {
            delivered,
            deliveredMessages: delivered.map(d => d.message),
            remainingAvailable,
        }
    }

    const availableCount = candidateIndices.length
    return {
        delivered: [],
        deliveredMessages: [],
        remainingAvailable: availableCount,
    }
}
