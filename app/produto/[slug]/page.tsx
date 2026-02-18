
import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { getSupabaseService } from '@/lib/supabase/server'
import ProductDetailsClient from './ProductDetailsClient'
import type { Product } from '@/lib/store/types'

interface Props {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = getSupabaseService()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('products')
    .select('*, category:store_categories(*), variants:product_variants(*)')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    console.error('Error fetching product:', error)
    return null
  }

  return data as any
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return {
      title: 'Produto não encontrado',
    }
  }

  const previousImages = (await parent).openGraph?.images || []
  const productImage = product.thumbnail_url || product.images?.[0] || '/logo2.png'

  return {
    title: product.name,
    description: product.description?.substring(0, 160) || `Compre ${product.name} na Librás. Soluções abrasivas de alta qualidade.`,
    openGraph: {
      title: `${product.name} | Librás`,
      description: product.description?.substring(0, 160),
      url: `https://loja.libraslixas.com.br/produto/${slug}`,
      images: [productImage, ...previousImages],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
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

  // Schema.org Product markup
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.thumbnail_url || product.images?.[0],
    "sku": product.variants?.[0]?.sku || product.id,
    "offers": {
      "@type": "Offer",
      "url": `https://loja.libraslixas.com.br/produto/${slug}`,
      "priceCurrency": "BRL",
      "price": product.variants?.[0]?.retail_price || product.variants?.[0]?.price || 0,
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Librás"
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
