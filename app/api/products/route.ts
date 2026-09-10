import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'
import { findCategory } from '@/lib/utils/category-matcher'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const categoryId = searchParams.get('categoryId')
        const featured = searchParams.get('featured') === 'true'
        const search = searchParams.get('search')?.toLowerCase()

        const supabase = await getSupabaseServer()
        if (!supabase) {
            return NextResponse.json([])
        }

        let query = supabase
            .from('products')
            .select(`
                *,
                variants:product_variants(*),
                mockups:product_mockups(*)
            `)
            .eq('is_active', true)

        if (categoryId && categoryId !== 'all') {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId)
            if (isUUID) {
                query = query.eq('category_id', categoryId)
            } else {
                // Busca categorias de ambas as tabelas para correspondência inteligente
                const [catsRes, storeCatsRes] = await Promise.all([
                    supabase.from('categories').select('*'),
                    supabase.from('store_categories').select('*')
                ])

                const allCats = [
                    ...(catsRes.data || []),
                    ...(storeCatsRes.data || [])
                ]

                const matchedCat = findCategory(allCats, categoryId)

                if (matchedCat) {
                    // Se a categoria encontrada foi de store_categories, mapeia para o ID de categories
                    let targetId = matchedCat.id
                    const equivInCategories = (catsRes.data || []).find(
                        (c: any) => c.slug === matchedCat.slug || c.name === matchedCat.name
                    )
                    if (equivInCategories) {
                        targetId = equivInCategories.id
                    }

                    query = query.eq('category_id', targetId)
                } else {
                    // Categoria inexistente no banco
                    return NextResponse.json([])
                }
            }
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
        }

        if (featured) {
            query = query.eq('is_featured', true)
        }

        const { data, error } = await query
        if (error) {
            console.error('[Products API] Erro ao buscar produtos do banco:', error)
            return NextResponse.json([])
        }

        const formatted = (data || []).map((prod: any) => {
            let order = 0
            if (typeof prod.display_order === 'number') {
                order = prod.display_order
            } else if (typeof prod.printful_id === 'string' && prod.printful_id.startsWith('order:')) {
                const parsed = parseInt(prod.printful_id.split(':')[1], 10)
                order = isNaN(parsed) ? 0 : parsed
            }
            return {
                ...prod,
                display_order: order,
                variants: (prod.variants || []).map((v: any) => {
                    const stockNum = typeof v.stock === 'number'
                        ? v.stock
                        : (v.printful_catalog_variant_id && !isNaN(parseInt(v.printful_catalog_variant_id, 10))
                            ? parseInt(v.printful_catalog_variant_id, 10)
                            : (v.in_stock ? 10 : 0))
                    const finalStock = isNaN(stockNum) ? 0 : stockNum
                    return {
                        ...v,
                        stock: finalStock,
                        in_stock: Boolean(v.in_stock !== false && finalStock > 0)
                    }
                })
            }
        })

        // Ordena por display_order ASC (produtos com ordem explícita vêm na frente), desempate por data
        formatted.sort((a: any, b: any) => {
            const orderA = a.display_order !== undefined && a.display_order > 0 ? a.display_order : 9999
            const orderB = b.display_order !== undefined && b.display_order > 0 ? b.display_order : 9999
            if (orderA !== orderB) return orderA - orderB
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

        return NextResponse.json(formatted)

    } catch (error) {
        console.error('[Products API] Erro fatal ao buscar produtos:', error)
        return NextResponse.json([])
    }
}

