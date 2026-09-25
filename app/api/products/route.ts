// Hello World
import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'
import { parseCategoryRecord } from '@/lib/categories/category-helper'
import {
    buildCategoryHierarchy,
    resolveProductAssignment,
    normalizeSlug,
    isBloxFruitsReference,
    filterProductsByTargetCategory,
} from '@/lib/categories/category-resolver'

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

        // 1. Carrega todas as categorias para construir a hierarquia canônica
        const [catsRes, storeCatsRes] = await Promise.all([
            supabase.from('categories').select('*'),
            supabase.from('store_categories').select('*'),
        ])

        const rawAllCats = [
            ...(catsRes.data || []),
            ...(storeCatsRes.data || []),
        ]
        const parsedCats = rawAllCats.map(parseCategoryRecord)
        const hierarchy = buildCategoryHierarchy(parsedCats)

        // 2. Constrói query básica de produtos ativos
        let query = supabase
            .from('products')
            .select(`
                *,
                variants:product_variants(*),
                mockups:product_mockups(*)
            `)
            .eq('is_active', true)

        // 3. Se houver filtro por categoria
        if (categoryId && categoryId !== 'all') {
            const cleanTarget = normalizeSlug(categoryId)

            // Verifica se é uma Categoria Principal
            const mainTarget = hierarchy.mainCategories.find(
                (m) => m.id === categoryId || normalizeSlug(m.slug || m.id || m.name) === cleanTarget
            )

            if (mainTarget) {
                // IDs válidos para a categoria principal e suas subcategorias
                const validIds = new Set<string>()
                if (mainTarget.id) validIds.add(mainTarget.id)
                if (mainTarget.slug) validIds.add(mainTarget.slug)

                const subs = hierarchy.mainToSubsMap.get(mainTarget.id) || []
                for (const s of subs) {
                    if (s.id) validIds.add(s.id)
                    if (s.slug) validIds.add(s.slug)
                }

                if (isBloxFruitsReference(mainTarget.slug || mainTarget.name)) {
                    validIds.add('frutas')
                    validIds.add('gamepasses')
                    validIds.add('contas')
                    validIds.add('racas')
                    validIds.add('c1000000-0000-0000-0000-000000000001')
                    validIds.add('c2000000-0000-0000-0000-000000000002')
                    validIds.add('c3000000-0000-0000-0000-000000000003')
                    validIds.add('c4000000-0000-0000-0000-000000000004')
                }

                const idArray = Array.from(validIds)
                if (idArray.length > 0) {
                    query = query.in('category_id', idArray)
                }
            } else {
                // É uma subcategoria específica
                const subTarget = hierarchy.subcategories.find(
                    (s) => s.id === categoryId || normalizeSlug(s.slug || s.id || s.name) === cleanTarget
                )
                if (subTarget) {
                    const subIds = [subTarget.id]
                    if (subTarget.slug) subIds.push(subTarget.slug)
                    query = query.in('category_id', subIds)
                } else {
                    query = query.eq('category_id', categoryId)
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

        let formatted = (data || []).map((prod: any) => {
            let order = 0
            if (typeof prod.display_order === 'number') {
                order = prod.display_order
            } else if (typeof prod.printful_id === 'string' && prod.printful_id.startsWith('order:')) {
                const parsed = parseInt(prod.printful_id.split(':')[1], 10)
                order = isNaN(parsed) ? 0 : parsed
            }

            // Enriquecimento com categoria resolvível
            const assignment = resolveProductAssignment(prod, hierarchy)
            const catObj = assignment.subcategory || assignment.mainCategory || null

            return {
                ...prod,
                display_order: order,
                category: catObj
                    ? {
                          id: catObj.id,
                          name: catObj.name,
                          slug: catObj.slug,
                          parent_id: catObj.parent_id,
                          is_main: catObj.is_main,
                      }
                    : null,
                main_category: assignment.mainCategory
                    ? {
                          id: assignment.mainCategory.id,
                          name: assignment.mainCategory.name,
                          slug: assignment.mainCategory.slug,
                      }
                    : null,
                variants: (prod.variants || []).map((v: any) => {
                    const stockNum =
                        typeof v.stock === 'number'
                            ? v.stock
                            : v.printful_catalog_variant_id && !isNaN(parseInt(v.printful_catalog_variant_id, 10))
                            ? parseInt(v.printful_catalog_variant_id, 10)
                            : v.in_stock
                            ? 10
                            : 0
                    const finalStock = isNaN(stockNum) ? 0 : stockNum
                    return {
                        ...v,
                        stock: finalStock,
                        in_stock: Boolean(v.in_stock !== false && finalStock > 0),
                    }
                }),
            }
        })

        // Se houver categoryId, passa também pelo filtro canônico da hierarquia para blindagem extra
        if (categoryId && categoryId !== 'all') {
            formatted = filterProductsByTargetCategory(formatted, categoryId, hierarchy)
        }

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

