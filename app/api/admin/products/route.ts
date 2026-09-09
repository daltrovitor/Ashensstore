
import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'
import { getSupabaseService } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const VariantSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "Variant name is required"),
    size: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    price: z.number().min(0),
    stock: z.number().min(0).optional(),
    in_stock: z.boolean().default(true),
})

const ProductSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional().nullable(),
    price: z.number().min(0),
    thumbnail_url: z.string().optional().nullable(),
    images: z.array(z.string()).optional(),
    category_id: z.string().uuid().optional().nullable(),
    display_order: z.number().int().min(0).optional().default(0),
    is_active: z.boolean().default(true),
    is_featured: z.boolean().default(false),
    variants: z.array(VariantSchema).optional(),
})

export async function GET(request: Request) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getSupabaseService()
        if (!supabase) {
            throw new Error('Supabase Service Role Key is missing')
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '100')

        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data, count, error } = await supabase
            .from('products')
            .select('*, variants:product_variants(*)', { count: 'exact' })
            .range(from, to)

        if (error) throw error

        const formattedProducts = (data || []).map((prod: any) => {
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
                variants: (prod.variants || []).map((v: any) => ({
                    ...v,
                    stock: v.printful_catalog_variant_id ? parseInt(v.printful_catalog_variant_id, 10) : (v.in_stock ? 10 : 0)
                }))
            }
        })

        // Ordena por display_order ASC, desempate por created_at DESC
        formattedProducts.sort((a: any, b: any) => {
            const orderA = a.display_order !== undefined && a.display_order > 0 ? a.display_order : 9999
            const orderB = b.display_order !== undefined && b.display_order > 0 ? b.display_order : 9999
            if (orderA !== orderB) return orderA - orderB
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

        return NextResponse.json({
            products: formattedProducts,
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        })

    } catch (error) {
        console.error('[Admin Products] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getSupabaseService()
        if (!supabase) {
            return NextResponse.json({ error: 'Database service configuration error' }, { status: 500 })
        }

        const body = await request.json()
        console.log('[Admin Products] Received body:', JSON.stringify(body, null, 2))

        let validatedData: z.infer<typeof ProductSchema>;
        try {
            validatedData = ProductSchema.parse(body)
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error('[Admin Products] Validation Error details:', JSON.stringify(error.errors, null, 2))
                return NextResponse.json({
                    error: 'Validation Error',
                    details: error.errors,
                    message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
                }, { status: 400 })
            }
            throw error
        }

        // Resolução segura de categoria para evitar FK 23503 caso o ID venha de store_categories
        let targetCategoryId = validatedData.category_id
        if (targetCategoryId) {
            const { data: catExists } = await supabase.from('categories').select('id').eq('id', targetCategoryId).maybeSingle()
            if (!catExists) {
                const { data: storeCat } = await supabase.from('store_categories').select('name, slug').eq('id', targetCategoryId).maybeSingle()
                if (storeCat) {
                    const { data: matchedCat } = await supabase.from('categories').select('id').or(`slug.eq.${storeCat.slug},name.eq.${storeCat.name}`).maybeSingle()
                    if (matchedCat) {
                        targetCategoryId = matchedCat.id
                    }
                }
            }
        }

        const displayOrder = validatedData.display_order || 0
        const printfulId = `order:${displayOrder}:local-${Date.now()}`

        // 1. Create Product
        let product: any = null
        let productError: any = null

        // Tenta inserir com display_order nativo
        const insertPayload: any = {
            name: validatedData.name,
            slug: validatedData.slug,
            description: validatedData.description,
            thumbnail_url: validatedData.thumbnail_url,
            category_id: targetCategoryId,
            display_order: displayOrder,
            is_active: validatedData.is_active,
            is_featured: validatedData.is_featured,
            printful_id: printfulId,
        }

        const resFirst = await supabase
            .from('products')
            .insert(insertPayload)
            .select()
            .single()

        if (resFirst.error && resFirst.error.message.includes('display_order')) {
            // Fallback caso a coluna display_order ainda não tenha sido criada no banco
            delete insertPayload.display_order
            const resFallback = await supabase
                .from('products')
                .insert(insertPayload)
                .select()
                .single()
            product = resFallback.data
            productError = resFallback.error
        } else {
            product = resFirst.data
            productError = resFirst.error
        }

        if (productError) {
            if (productError.code === '23505') {
                return NextResponse.json({ error: 'Já existe um produto com este slug.' }, { status: 409 })
            }
            if (productError.code === '23503') {
                console.error('[Admin Products] Category ID violation:', targetCategoryId)
                return NextResponse.json({
                    error: 'Categoria inválida.',
                    message: `A categoria selecionada não é válida para esta tabela de produtos.`
                }, { status: 400 })
            }
            throw productError
        }

        // 2. Create Variants
        if (validatedData.variants && validatedData.variants.length > 0) {
            const variantsToInsert = validatedData.variants.map((v: any) => {
                const stockCount = v.stock !== undefined ? v.stock : (v.in_stock ? 10 : 0)
                const isAvailable = stockCount > 0 && v.in_stock !== false
                return {
                    product_id: product.id,
                    name: v.name,
                    size: v.size || null,
                    color: v.color || null,
                    price: v.price,
                    retail_price: v.price,
                    stock: stockCount,
                    in_stock: isAvailable,
                    printful_catalog_variant_id: stockCount.toString(),
                    printful_variant_id: 'local-' + Date.now() + '-' + Math.random().toString(36).substring(7),
                }
            })

            await supabase.from('product_variants').insert(variantsToInsert)
        } else {
            // Default Variant
            await supabase.from('product_variants').insert({
                product_id: product.id,
                name: 'Padrão',
                price: validatedData.price,
                retail_price: validatedData.price,
                stock: 10,
                in_stock: true,
                printful_catalog_variant_id: '10',
                printful_variant_id: 'local-' + Date.now(),
            })
        }

        // 3. Create Mockups
        if (validatedData.images && validatedData.images.length > 0) {
            const mockups = validatedData.images.map((url: string, index: number) => ({
                product_id: product.id,
                image_url: url,
                display_order: index,
                is_main: index === 0
            }))
            await supabase.from('product_mockups').insert(mockups)
        }

        return NextResponse.json({ success: true, product })

    } catch (error: any) {
        console.error('[Admin Products] Create Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 })
    }
}
