import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'

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
                // Se foi passado slug, busca o ID da categoria correspondente
                const { data: cat } = await supabase
                    .from('categories')
                    .select('id')
                    .eq('slug', categoryId)
                    .maybeSingle()

                if (cat?.id) {
                    query = query.eq('category_id', cat.id)
                } else {
                    const { data: storeCat } = await supabase
                        .from('store_categories')
                        .select('id')
                        .eq('slug', categoryId)
                        .maybeSingle()

                    if (storeCat?.id) {
                        query = query.eq('category_id', storeCat.id)
                    } else {
                        // Categoria inexistente no banco
                        return NextResponse.json([])
                    }
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

