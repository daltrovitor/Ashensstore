"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-shopping-cart"
import { toast } from "sonner"
import { ShoppingCart, Zap } from "lucide-react"
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
    const discountPercent = originalPrice > basePrice ? Math.round(((originalPrice - basePrice) / originalPrice) * 100) : 0

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
        <div className="group flex flex-col bg-white border border-neutral-200/90 rounded-md overflow-hidden hover:border-[#48B9FA]/60 hover:shadow-md transition-all duration-200">
            {/* Imagem do Produto - Preenche a moldura inteira sem espaçamento */}
            <Link
                href={`/produto/${product.slug}`}
                className="block relative aspect-square w-full bg-neutral-100 overflow-hidden"
            >
                {/* Badges Flutuantes */}
                {discountPercent > 0 && (
                    <div className="absolute top-2 left-2 z-10">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white shadow-xs">
                            -{discountPercent}%
                        </span>
                    </div>
                )}

                <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                    priority={priority}
                />
            </Link>

            {/* Informações do Produto */}
            <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between bg-white">
                <div>
                    {/* Categoria */}
                    {product.category && (
                        <p className="text-[10px] sm:text-[11px] text-neutral-400 uppercase tracking-wider font-semibold mb-1 truncate">
                            {product.category.name}
                        </p>
                    )}

                    {/* Nome do Produto */}
                    <Link href={`/produto/${product.slug}`} className="block mb-2">
                        <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 leading-snug line-clamp-2 min-h-[32px] sm:min-h-[38px] group-hover:text-[#48B9FA] transition-colors">
                            {product.name}
                        </h3>
                    </Link>
                </div>

                {/* Preço e Ações */}
                <div className="pt-2.5 border-t border-neutral-100 mt-1 space-y-2.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-1">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-sm sm:text-base font-bold text-neutral-900">
                                {formatPrice(basePrice)}
                            </span>
                            {originalPrice > basePrice && (
                                <span className="text-[11px] text-neutral-400 line-through">
                                    {formatPrice(originalPrice)}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                            PIX
                        </span>
                    </div>

                    {/* Botões de Ação Ergonômicos para Celular e Desktop */}
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={handleDirectBuy}
                            className="flex-1 h-8 sm:h-9 text-[11px] sm:text-xs font-semibold text-white bg-[#48B9FA] hover:bg-[#20a6f5] active:scale-[0.98] rounded transition-all shadow-xs cursor-pointer flex items-center justify-center"
                        >
                            Comprar
                        </button>

                        <button
                            type="button"
                            onClick={handleAddToCart}
                            className="h-8 sm:h-9 w-8 sm:w-9 shrink-0 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.98] border border-neutral-200 rounded transition-all flex items-center justify-center cursor-pointer"
                            title="Adicionar ao carrinho"
                            aria-label="Adicionar ao carrinho"
                        >
                            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
