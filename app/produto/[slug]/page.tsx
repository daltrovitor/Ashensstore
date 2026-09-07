import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { getSupabaseService } from '@/lib/supabase/server'
import ProductDetailsClient from './ProductDetailsClient'
import type { Product } from '@/lib/store/types'

interface Props {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const supabase = getSupabaseService()
    if (supabase) {
      let { data, error } = await supabase
        .from('products')
        .select('*, variants:product_variants(*), mockups:product_mockups(*)')
        .eq('slug', slug)
        .maybeSingle()

      if (!data && !error) {
        // Tenta buscar por ID se slug não for encontrado
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
        if (isUUID) {
          const res = await supabase
            .from('products')
            .select('*, variants:product_variants(*), mockups:product_mockups(*)')
            .eq('id', slug)
            .maybeSingle()
          data = res.data
        }
      }

      if (data) {
        // Carrega categoria associada se houver category_id
        if (data.category_id) {
          const { data: cat } = await supabase
            .from('categories')
            .select('*')
            .eq('id', data.category_id)
            .maybeSingle()

          if (cat) {
            data.category = cat
          } else {
            const { data: storeCat } = await supabase
              .from('store_categories')
              .select('*')
              .eq('id', data.category_id)
              .maybeSingle()
            if (storeCat) data.category = storeCat
          }
        }

        return data as any
      }
    }
  } catch (err) {
    console.error('[Product Page] Erro ao buscar produto no banco:', err)
  }

  // Se não existir no banco de dados, retorna null (aciona notFound)
  return null
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return {
      title: 'Produto não encontrado | Ashens Store',
    }
  }

  const previousImages = (await parent).openGraph?.images || []
  const productImage = product.thumbnail_url || product.images?.[0] || '/ashens-logo.jpg'

  return {
    title: `${product.name} | Ashens Store`,
    description: product.description?.substring(0, 160) || `Compre ${product.name} no Blox Fruits com entrega garantida via PIX na Ashens Store.`,
    openGraph: {
      title: `${product.name} | Ashens Store`,
      description: product.description?.substring(0, 160),
      url: `https://ashenstore.com.br/produto/${slug}`,
      images: [productImage, ...previousImages],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Ashens Store`,
      description: product.description?.substring(0, 160),
      images: [productImage],
    },
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.thumbnail_url || product.images?.[0] || '/ashens-logo.jpg',
    "sku": product.variants?.[0]?.sku || product.id,
    "offers": {
      "@type": "Offer",
      "url": `https://ashenstore.com.br/produto/${slug}`,
      "priceCurrency": "BRL",
      "price": product.price || product.variants?.[0]?.retail_price || 0,
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Ashens Store"
      }
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailsClient initialProduct={product} />
    </>
  )
}
