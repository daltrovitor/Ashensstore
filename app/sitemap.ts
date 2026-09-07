import { MetadataRoute } from 'next'
import { getSupabaseService } from '@/lib/supabase/server'
import { BLOX_PRODUCTS } from '@/data/blox-fruits'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ashenstore.com.br'

    // Rotas estáticas
    const routes = [
        '',
        '/loja',
        '/pedidos',
        '/checkout',
        '/login',
        '/signup',
    ].map((route) => ({
        url: `${SITE_URL}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    try {
        const supabase = getSupabaseService()
        let productSlugs: string[] = []

        if (supabase) {
            const { data: products } = await supabase
                .from('products')
                .select('slug')
                .eq('is_active', true)

            if (products && products.length > 0) {
                productSlugs = products.map(p => p.slug)
            }
        }

        if (productSlugs.length === 0) {
            productSlugs = BLOX_PRODUCTS.map(p => p.slug)
        }

        const productEntries = productSlugs.map((slug) => ({
            url: `${SITE_URL}/produto/${slug}`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }))

        return [...routes, ...productEntries]
    } catch (error) {
        console.error('Sitemap error:', error)
        return routes
    }
}
