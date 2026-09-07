"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-shopping-cart"
import { toast } from "sonner"
import type { Product } from "@/lib/store/types"

interface ProductCardProps {
    product: Product
    priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
    const { addItem } = useCart()
    const router = useRouter()

    // Determine price
    const prices = product.variants?.map(v => Number(v.retail_price || v.price || 0)) || []
    const basePrice = product.price ? Number(product.price) : (prices.length ? Math.min(...prices) : 0)
    const originalPrice = product.compare_at_price ? Number(product.compare_at_price) : 0

    const formatPrice = (p: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(p)
    }

    // Determine image
    const imageUrl =
        product.mockups?.find(m => m.is_main)?.image_url ||
        product.mockups?.[0]?.image_url ||
        product.thumbnail_url ||
        (product.images && product.images[0]) ||
        "/ashens-logo.jpg"

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const variant = product.variants && product.variants.length > 0 ? product.variants[0] : null

        addItem({
            id: variant?.id || product.id,
            product_id: product.id,
            variant_id: variant?.id,
            name: product.name,
            price: basePrice,
            image: imageUrl,
            quantity: 1,
        })

        toast.success(`"${product.name}" adicionado ao carrinho`)
    }

    const handleDirectBuy = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        handleAddToCart(e)
        router.push('/checkout')
    }

    return (
        <div className="group flex flex-col bg-white border border-neutral-200 rounded-sm overflow-hidden hover:border-neutral-400 transition-colors">
            {/* Imagem do Produto em Fundo Neutro Limpo */}
            <Link
                href={`/produto/${product.slug}`}
                className="block relative aspect-square bg-neutral-50 p-6 flex items-center justify-center overflow-hidden"
            >
                <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                    priority={priority}
                />
            </Link>

            {/* Informações do Produto */}
            <div className="p-4 flex flex-col flex-1 justify-between bg-white">
                <div>
                    {/* Categoria */}
                    {product.category && (
                        <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1">
                            {product.category.name}
                        </p>
                    )}

                    {/* Nome do Produto */}
                    <Link href={`/produto/${product.slug}`} className="block mb-2">
                        <h3 className="text-sm font-medium text-neutral-900 leading-snug line-clamp-2 group-hover:text-neutral-600 transition-colors">
                            {product.name}
                        </h3>
                    </Link>
                </div>

                {/* Preço e Botões */}
                <div className="pt-3 border-t border-neutral-100 mt-2 space-y-3">
                    <div className="flex items-baseline gap-2">
                        <span className="text-base font-semibold text-neutral-900">
                            {formatPrice(basePrice)}
                        </span>
                        {originalPrice > basePrice && (
                            <span className="text-xs text-neutral-400 line-through">
                                {formatPrice(originalPrice)}
                            </span>
                        )}
                        <span className="text-[11px] text-neutral-500 font-normal">
                            no PIX
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            className="w-full h-8 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-sm hover:border-[#48B9FA] hover:text-[#48B9FA] transition-colors cursor-pointer"
                        >
                            Carrinho
                        </button>

                        <button
                            type="button"
                            onClick={handleDirectBuy}
                            className="w-full h-8 text-xs font-medium text-white bg-[#48B9FA] hover:bg-[#20a6f5] rounded-sm transition-colors shadow-xs cursor-pointer"
                        >
                            Comprar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
