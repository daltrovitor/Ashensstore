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

        return NextResponse.json(data || [])

    } catch (error) {
        console.error('[Products API] Erro fatal ao buscar produtos:', error)
        return NextResponse.json([])
    }
}

