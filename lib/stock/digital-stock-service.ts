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

const DATA_DIR = path.join(process.cwd(), 'data')
const STOCK_FILE = path.join(DATA_DIR, 'digital-stock.json')

function ensureFileExists() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(STOCK_FILE)) {
        fs.writeFileSync(STOCK_FILE, JSON.stringify([], null, 2), 'utf-8')
    }
}

export function readAllStock(): DigitalStockItem[] {
    ensureFileExists()
    try {
        const raw = fs.readFileSync(STOCK_FILE, 'utf-8')
        return JSON.parse(raw) as DigitalStockItem[]
    } catch (err) {
        console.error('[DigitalStock] Erro ao ler arquivo de estoque:', err)
        return []
    }
}

export function saveAllStock(items: DigitalStockItem[]) {
    ensureFileExists()
    fs.writeFileSync(STOCK_FILE, JSON.stringify(items, null, 2), 'utf-8')
}

/**
 * Retorna itens disponíveis para um produto (e opcionalmente variante)
 */
export function getAvailableStockItems(productId: string, variantId?: string): DigitalStockItem[] {
    const all = readAllStock()
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
export function getAllStockItemsForProduct(productId: string): DigitalStockItem[] {
    const all = readAllStock()
    return all.filter(item => item.productId === productId)
}

/**
 * Sincroniza a quantidade de estoque com a tabela product_variants no Supabase
 */
export async function syncProductVariantStock(productId: string, variantId?: string): Promise<number> {
    const available = getAvailableStockItems(productId, variantId)
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
        const available = getAvailableStockItems(productId, variantId)
        return { countAdded: 0, totalAvailable: available.length }
    }

    const all = readAllStock()
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
    saveAllStock(all)

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
    const all = readAllStock()
    const index = all.findIndex(item => item.id === itemId)

    if (index === -1) {
        return { success: false, remainingAvailable: 0 }
    }

    const target = all[index]
    all.splice(index, 1)
    saveAllStock(all)

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
    const all = readAllStock()

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
        saveAllStock(all)
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
