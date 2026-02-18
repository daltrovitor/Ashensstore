
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
        const limit = parseInt(searchParams.get('limit') || '50')

        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data, count, error } = await supabase
            .from('products')
            .select('*, variants:product_variants(*)', { count: 'exact' })
            .range(from, to)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({
            products: data || [],
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

        // 1. Create Product
        const { data: product, error: productError } = await supabase
            .from('products')
            .insert({
                name: validatedData.name,
                slug: validatedData.slug,
                description: validatedData.description,
                thumbnail_url: validatedData.thumbnail_url,
                category_id: validatedData.category_id,
                is_active: validatedData.is_active,
                is_featured: validatedData.is_featured,
                printful_id: 'local-' + Date.now(),
            })
            .select()
            .single()

        if (productError) {
            if (productError.code === '23505') {
                return NextResponse.json({ error: 'Já existe um produto com este slug.' }, { status: 409 })
            }
            if (productError.code === '23503') {
                console.error('[Admin Products] Category ID violation:', validatedData.category_id)
                return NextResponse.json({
                    error: 'Categoria inválida.',
                    message: `A categoria selecionada (ID: ${validatedData.category_id}) não é válida para esta tabela de produtos. Por favor, recrie a categoria e tente selecionar novamente.`
                }, { status: 400 })
            }
            throw productError
        }

        // 2. Create Variants
        if (validatedData.variants && validatedData.variants.length > 0) {
            const variantsToInsert = validatedData.variants.map((v: any) => ({
                product_id: product.id,
                name: v.name,
                size: v.size || null,
                color: v.color || null,
                price: v.price,
                retail_price: v.price,
                in_stock: v.in_stock,
                printful_variant_id: 'local-' + Date.now() + '-' + Math.random().toString(36).substring(7),
            }))

            await supabase.from('product_variants').insert(variantsToInsert)
        } else {
            // Default Variant
            await supabase.from('product_variants').insert({
                product_id: product.id,
                name: 'Padrão',
                price: validatedData.price,
                retail_price: validatedData.price,
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
