import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'
import {
    getAllStockItemsForProduct,
    getAvailableStockItems,
    addStockMessages,
    removeStockItem,
    syncProductVariantStock
} from '@/lib/stock/digital-stock-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/digital-stock?productId=...&variantId=...
 * Retorna as mensagens de estoque de um produto
 */
export async function GET(request: Request) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')
        const variantId = searchParams.get('variantId') || undefined

        if (!productId) {
            return NextResponse.json({ error: 'productId é obrigatório' }, { status: 400 })
        }

        const allItems = getAllStockItemsForProduct(productId)
        const availableItems = getAvailableStockItems(productId, variantId)
        const deliveredItems = allItems.filter(i => i.status === 'delivered')

        return NextResponse.json({
            success: true,
            productId,
            variantId,
            totalAvailable: availableItems.length,
            available: availableItems,
            delivered: deliveredItems,
        })
    } catch (error: any) {
        console.error('[DigitalStock GET Error]:', error)
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
    }
}

/**
 * POST /api/admin/digital-stock
 * Adiciona novas mensagens de estoque para o produto
 * Body: { productId: string, variantId?: string, messages?: string[], messagesText?: string }
 */
export async function POST(request: Request) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { productId, variantId, messages, messagesText } = body

        if (!productId) {
            return NextResponse.json({ error: 'productId é obrigatório' }, { status: 400 })
        }

        let messageList: string[] = []

        if (Array.isArray(messages)) {
            messageList = messages.map(String)
        } else if (typeof messagesText === 'string') {
            // Divide por linha
            messageList = messagesText
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
        }

        if (messageList.length === 0) {
            return NextResponse.json({ error: 'Nenhuma mensagem válida informada' }, { status: 400 })
        }

        const result = await addStockMessages(productId, messageList, variantId)

        return NextResponse.json({
            success: true,
            countAdded: result.countAdded,
            totalAvailable: result.totalAvailable,
            message: `${result.countAdded} mensagem(ns) adicionada(s) ao estoque com sucesso!`
        })
    } catch (error: any) {
        console.error('[DigitalStock POST Error]:', error)
        return NextResponse.json({ error: error.message || 'Erro ao adicionar mensagens' }, { status: 500 })
    }
}

/**
 * DELETE /api/admin/digital-stock?id=...
 * Remove uma mensagem de estoque
 */
export async function DELETE(request: Request) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID do item é obrigatório' }, { status: 400 })
        }

        const result = await removeStockItem(id)

        if (!result.success) {
            return NextResponse.json({ error: 'Item não encontrado no estoque' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            remainingAvailable: result.remainingAvailable,
            message: 'Mensagem removida do estoque'
        })
    } catch (error: any) {
        console.error('[DigitalStock DELETE Error]:', error)
        return NextResponse.json({ error: error.message || 'Erro ao remover mensagem' }, { status: 500 })
    }
}
