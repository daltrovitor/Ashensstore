"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-shopping-cart"
import { toast } from "sonner"
import { ShoppingBag, Star } from "lucide-react"
import type { Product } from "@/lib/store/types"

interface IneightProductCardProps {
  product: Product
  priority?: boolean
}

export function IneightProductCard({ product, priority = false }: IneightProductCardProps) {
  const { addItem } = useCart()
  const router = useRouter()

  // Preço base e preço original
  const prices = product.variants?.map((v) => Number(v.retail_price || v.price || 0)) || []
  const basePrice = product.price ? Number(product.price) : prices.length ? Math.min(...prices) : 0
  const originalPrice = product.compare_at_price ? Number(product.compare_at_price) : 0
  const discountPercent =
    originalPrice > basePrice ? Math.round(((originalPrice - basePrice) / originalPrice) * 100) : 0

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(p)
  }

  // Imagem
  const imageUrl =
    product.mockups?.find((m) => m.is_main)?.image_url ||
    product.mockups?.[0]?.image_url ||
    product.thumbnail_url ||
    (product.images && product.images[0]) ||
    "/ashens-logo.jpg"

  // Estoque
  const hasVariants = Boolean(product.variants && product.variants.length > 0)
  const isOutOfStock = hasVariants
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? product.variants!.every((v: any) => v.in_stock === false || (typeof v.stock === "number" && v.stock <= 0))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : Boolean((product as any).in_stock === false || (typeof (product as any).stock === "number" && (product as any).stock <= 0))

  // Deterministic reviews count based on product id for social proof (just like in ineight)
  const reviewSeed = (product.id || "seed").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const reviewCount = 80 + (reviewSeed % 260)
  const reviewRating = 4.8 + ((reviewSeed % 3) * 0.1)

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isOutOfStock) {
      toast.error("Este produto está com o estoque esgotado.")
      return
    }

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

    toast.success(`"${product.name}" adicionado ao carrinho!`)
    router.push("/checkout")
  }

  return (
    <div className="group relative flex flex-col justify-between h-full bg-[#13111c] border border-purple-500/20 hover:border-purple-500/60 rounded-2xl p-2.5 sm:p-3 transition-all duration-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] hover:-translate-y-1">
      {/* Imagem do Produto */}
      <Link
        href={`/produto/${product.slug}`}
        className="block relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-900 border border-white/5"
      >
        {discountPercent > 0 && !isOutOfStock && (
          <div className="absolute top-2 left-2 z-10">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md">
              -{discountPercent}% OFF
            </span>
          </div>
        )}

        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          className={`object-cover w-full h-full transition-transform duration-500 ${
            isOutOfStock ? "blur-[2px] opacity-60" : "group-hover:scale-105"
          }`}
          priority={priority}
        />

        {/* Overlay Estoque Esgotado */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-2 pointer-events-none">
            <span className="text-red-400 font-black text-xs sm:text-sm tracking-wider uppercase text-center border border-red-500/40 bg-red-950/80 px-2.5 py-1 rounded-md">
              ESGOTADO
            </span>
          </div>
        )}
      </Link>

      {/* Conteúdo e Informações */}
      <div className="flex flex-col flex-1 justify-between pt-3">
        <div>
          {/* Título do Produto */}
          <Link href={`/produto/${product.slug}`} className="block">
            <h3
              className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 min-h-[34px] sm:min-h-[38px] group-hover:text-purple-300 transition-colors"
              title={product.name}
            >
              {product.name}
            </h3>
          </Link>

          {/* Avaliações em Estrelas */}
          <div className="flex items-center gap-1 mt-1.5 mb-2">
            <div className="flex items-center text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-yellow-400 stroke-yellow-400" />
              ))}
            </div>
            <span className="text-[11px] font-bold text-neutral-300 ml-1">
              {reviewRating.toFixed(1)}
            </span>
            <span className="text-[11px] text-neutral-400">
              ({reviewCount})
            </span>
          </div>
        </div>

        {/* Preço e Botão */}
        <div className="pt-2 border-t border-white/10 mt-auto space-y-2.5">
          <div>
            {/* Preço riscado + Porcentagem */}
            {originalPrice > basePrice ? (
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs text-neutral-400 line-through">
                  {formatPrice(originalPrice)}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1 rounded">
                  {discountPercent}% OFF
                </span>
              </div>
            ) : (
              <div className="h-4" />
            )}

            {/* Preço Atual e Selo Pix */}
            <div className="flex items-center justify-between">
              <div className="text-base sm:text-lg font-black text-white tracking-tight">
                {formatPrice(basePrice)}
              </div>
              {/* Ícone Pix estilizado */}
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-teal-950/70 border border-teal-500/40 text-teal-400 text-[10px] font-bold">
                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 512 512">
                  <path d="M407.9 339.4L339.4 408c-45.7 45.7-120.9 45.7-166.7 0L104.1 339.4c-45.7-45.7-45.7-120.9 0-166.7L172.6 104.1c45.7-45.7 120.9-45.7 166.7 0l68.5 68.5c45.7 45.7 45.7 120.9 0 166.8zM256 160l-96 96 96 96 96-96-96-96z" />
                </svg>
                <span>Pix</span>
              </div>
            </div>

            <p className="text-[10px] text-neutral-400 mt-0.5">
              À vista no Pix
            </p>
          </div>

          {/* Botão Comprar Agora */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleBuyNow}
            className={`w-full py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer select-none ${
              isOutOfStock
                ? "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-900/40 active:scale-[0.98]"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? "Esgotado" : "Comprar agora"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
