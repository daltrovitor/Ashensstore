
/**
 * GET /api/products/[slug]
 * Busca um produto específico pelo slug
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: product, error } = await supabase
            .from('products')
            .select(`
                *,
                category:categories(name, slug),
                variants:product_variants(*)
            `)
            .eq('slug', slug)
            .single()

        if (error || !product) {
            return NextResponse.json(
                { error: 'Produto não encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json(product)

    } catch (error) {
        console.error('[Product API] Erro ao buscar produto:', error)
        return NextResponse.json(
            { error: 'Falha ao buscar produto' },
            { status: 500 }
        )
    }
}
