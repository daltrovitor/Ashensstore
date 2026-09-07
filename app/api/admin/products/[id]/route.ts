
import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'
import { getSupabaseService } from '@/lib/supabase/server'
import { z } from 'zod'

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
    is_active: z.boolean().default(true),
    is_featured: z.boolean().default(false),
    variants: z.array(VariantSchema).optional(),
})

export async function DELETE(
    request: Request,
    { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await paramsPromise

        if (!id) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }

        const supabase = getSupabaseService()
        if (!supabase) {
            return NextResponse.json({ error: 'Database service configuration error' }, { status: 500 })
        }

        // 1. Obter todas as variantes deste produto
        const { data: variants } = await supabase
            .from('product_variants')
            .select('id')
            .eq('product_id', id)

        const variantIds = (variants || []).map((v: any) => v.id)

        // 2. Desvincular com segurança os itens de pedidos anteriores para preservar o histórico contábil sem violar a FK
        if (variantIds.length > 0) {
            const { error: unlinkError } = await supabase
                .from('order_items')
                .update({ product_variant_id: null })
                .in('product_variant_id', variantIds)

            if (unlinkError) {
                console.error('[Admin Products] Unlink order_items Error:', unlinkError)
            }

            // Excluir as variantes
            const { error: varDelError } = await supabase
                .from('product_variants')
                .delete()
                .in('id', variantIds)

            if (varDelError) {
                console.error('[Admin Products] Delete variants Error:', varDelError)
            }
        }

        // 3. Excluir mockups / fotos do produto
        await supabase
            .from('product_mockups')
            .delete()
            .eq('product_id', id)

        // 4. Excluir o produto da tabela principal
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('[Admin Products] Delete Error:', error)
            throw error
        }

        return NextResponse.json({ success: true, message: 'Produto excluído com sucesso' })

    } catch (error: any) {
        console.error('[Admin Products] Delete Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 })
    }
}

export async function PUT(
    request: Request,
    { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await paramsPromise
        if (!id) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }

        const body = await request.json()
        console.log('[Admin Products PUT] Received body:', JSON.stringify(body, null, 2))

        let validatedData: z.infer<typeof ProductSchema>;
        try {
            validatedData = ProductSchema.parse(body)
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error('[Admin Products PUT] Validation Error details:', JSON.stringify(error.errors, null, 2))
                return NextResponse.json({
                    error: 'Validation Error',
                    details: error.errors,
                    message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
                }, { status: 400 })
            }
            throw error
        }

        const supabase = getSupabaseService()
        if (!supabase) {
            return NextResponse.json({ error: 'Database service configuration error' }, { status: 500 })
        }

        // 1. Update Product
        const { error: productError } = await supabase
            .from('products')
            .update({
                name: validatedData.name,
                slug: validatedData.slug,
                description: validatedData.description,
                price: validatedData.price,
                thumbnail_url: validatedData.thumbnail_url,
                images: validatedData.images || [],
                category_id: validatedData.category_id,
                is_active: validatedData.is_active,
                is_featured: validatedData.is_featured,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        if (productError) {
            if (productError.code === '23505') {
                return NextResponse.json({ error: 'Já existe um produto com este slug.' }, { status: 409 })
            }
            if (productError.code === '23503') {
                console.error('[Admin Products PUT] Category ID violation:', validatedData.category_id)
                return NextResponse.json({
                    error: 'Categoria inválida.',
                    message: `A categoria selecionada (ID: ${validatedData.category_id}) não é válida para esta tabela de produtos. Por favor, recrie a categoria e tente selecionar novamente.`
                }, { status: 400 })
            }
            throw productError
        }

        // 2. Update Variants
        if (validatedData.variants && Array.isArray(validatedData.variants)) {
            const { data: existingVariantsShort } = await supabase
                .from('product_variants')
                .select('id')
                .eq('product_id', id)

            const existingIds = new Set((existingVariantsShort || []).map(v => v.id))
            const incomingIds = new Set(validatedData.variants.filter(v => v.id).map(v => v.id))

            const toDelete = [...existingIds].filter(eid => !incomingIds.has(eid))
            if (toDelete.length > 0) {
                // Desvincular com segurança itens de pedidos antes de excluir variantes removidas
                await supabase.from('order_items').update({ product_variant_id: null }).in('product_variant_id', toDelete)
                await supabase.from('product_variants').delete().in('id', toDelete)
            }

            for (const variant of validatedData.variants) {
                const stockCount = variant.stock !== undefined ? variant.stock : (variant.in_stock ? 10 : 0)
                const isAvailable = stockCount > 0 && variant.in_stock !== false

                if (variant.id && existingIds.has(variant.id)) {
                    await supabase
                        .from('product_variants')
                        .update({
                            name: variant.name,
                            size: variant.size || null,
                            color: variant.color || null,
                            price: variant.price,
                            retail_price: variant.price,
                            stock: stockCount,
                            in_stock: isAvailable,
                            printful_catalog_variant_id: stockCount.toString(),
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', variant.id)
                } else {
                    await supabase
                        .from('product_variants')
                        .insert({
                            product_id: id,
                            name: variant.name,
                            size: variant.size || null,
                            color: variant.color || null,
                            price: variant.price,
                            retail_price: variant.price,
                            stock: stockCount,
                            in_stock: isAvailable,
                            printful_catalog_variant_id: stockCount.toString(),
                            printful_variant_id: 'local-' + Date.now() + '-' + Math.random().toString(36).substring(7),
                        })
                }
            }
        }

        // 3. Update Mockups (images)
        if (validatedData.images && Array.isArray(validatedData.images)) {
            await supabase.from('product_mockups').delete().eq('product_id', id)
            const mockups = validatedData.images.map((url: string, index: number) => ({
                product_id: id,
                image_url: url,
                display_order: index,
                is_main: index === 0
            }))
            await supabase.from('product_mockups').insert(mockups)
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('[Admin Products PUT] Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 })
    }
}
