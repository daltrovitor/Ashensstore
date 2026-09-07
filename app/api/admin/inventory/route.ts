import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'
import { getSupabaseService } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const UpdateStockSchema = z.object({
    variant_id: z.string().uuid(),
    in_stock: z.boolean().optional(),
    stock: z.number().min(0).optional(),
    retail_price: z.number().min(0).optional(),
    cost_price: z.number().min(0).optional(),
})

/**
 * GET - Carrega dados consolidados do estoque de produtos e variantes
 */
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

        const { data: products, error } = await supabase
            .from('products')
            .select(`
                id,
                name,
                slug,
                thumbnail_url,
                category_id,
                is_active,
                created_at,
                variants:product_variants(
                    id,
                    product_id,
                    name,
                    price,
                    retail_price,
                    stock,
                    in_stock,
                    size,
                    color,
                    sku
                )
            `)
            .order('name', { ascending: true })

        if (error) throw error

        // Busca categorias para mapear os nomes
        const { data: categories } = await supabase
            .from('categories')
            .select('id, name')

        const categoryMap = new Map((categories || []).map((c: any) => [c.id, c.name]))

        // Processa estatísticas
        let totalVariants = 0
        let inStockVariants = 0
        let outOfStockVariants = 0
        let estimatedRetailValue = 0
        let estimatedCostValue = 0

        const enrichedProducts = (products || []).map((p: any) => {
            const vars = (p.variants || []).map((v: any) => {
                const stockCount = typeof v.stock === 'number' ? v.stock : (v.in_stock ? 10 : 0)
                const inStock = Boolean(v.in_stock && stockCount > 0)

                totalVariants++
                if (inStock) {
                    inStockVariants++
                    const price = Number(v.retail_price || v.price || 0)
                    estimatedRetailValue += price * stockCount
                } else {
                    outOfStockVariants++
                }

                return {
                    ...v,
                    stock: stockCount,
                    in_stock: inStock,
                    cost_price: 0,
                }
            })

            return {
                ...p,
                variants: vars,
                category_name: categoryMap.get(p.category_id) || 'Sem Categoria',
            }
        })

        return NextResponse.json({
            products: enrichedProducts,
            summary: {
                total_products: products?.length || 0,
                total_variants: totalVariants,
                in_stock_variants: inStockVariants,
                out_of_stock_variants: outOfStockVariants,
                stock_health_percentage: totalVariants > 0 ? Math.round((inStockVariants / totalVariants) * 100) : 100,
                estimated_retail_value: estimatedRetailValue,
                estimated_cost_value: estimatedCostValue,
            },
        })
    } catch (error: any) {
        console.error('[Admin Inventory] Erro ao carregar estoque:', error)
        return NextResponse.json(
            { error: error.message || 'Falha ao carregar dados de estoque' },
            { status: 500 }
        )
    }
}

/**
 * PATCH - Atualiza status de estoque, quantidade ou preço de venda de uma variação
 */
export async function PATCH(request: Request) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const supabase = getSupabaseService()
        if (!supabase) {
            return NextResponse.json({ error: 'Erro de conexão com o banco' }, { status: 500 })
        }

        const body = await request.json()
        const validated = UpdateStockSchema.parse(body)

        const updates: Record<string, any> = {}

        if (validated.stock !== undefined) {
            updates.stock = validated.stock
            if (validated.stock === 0) {
                updates.in_stock = false
            } else if (validated.in_stock === undefined) {
                updates.in_stock = true
            }
        }

        if (validated.in_stock !== undefined) {
            updates.in_stock = validated.in_stock
            if (validated.in_stock && validated.stock === undefined) {
                // Se ativou o estoque mas não passou quantidade, garante pelo menos 1 se estivesse 0
                const { data: current } = await supabase
                    .from('product_variants')
                    .select('stock')
                    .eq('id', validated.variant_id)
                    .single()
                if (current && (current.stock === 0 || current.stock === null)) {
                    updates.stock = 5
                }
            }
        }

        if (validated.retail_price !== undefined) {
            updates.retail_price = validated.retail_price
            updates.price = validated.retail_price
        }

        const { data, error } = await supabase
            .from('product_variants')
            .update(updates)
            .eq('id', validated.variant_id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({
            success: true,
            variant: {
                ...data,
                cost_price: 0,
            },
        })
    } catch (error: any) {
        console.error('[Admin Inventory] Erro ao atualizar estoque:', error)
        return NextResponse.json(
            { error: error.message || 'Falha ao atualizar variação' },
            { status: 500 }
        )
    }
}
