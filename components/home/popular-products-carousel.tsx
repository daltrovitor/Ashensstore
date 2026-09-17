"use client"

import { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { IneightProductCard } from "@/components/ecommerce/IneightProductCard"
import type { Product } from "@/lib/store/types"

interface PopularProductsCarouselProps {
  products?: Product[]
  title?: string
  categoryId?: string
}

export function PopularProductsCarousel({
  products: initialProducts,
  title = "PRODUTOS POPULARES",
  categoryId,
}: PopularProductsCarouselProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts || [])
  const [loading, setLoading] = useState(!initialProducts || initialProducts.length === 0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts)
      setLoading(false)
      return
    }

    const fetchPopular = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (categoryId && categoryId !== "all") {
          params.append("categoryId", categoryId)
        }

        const res = await fetch(`/api/products?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            // Prioritiza produtos com destaque ou ordem de exibição
            const sorted = [...data].sort((a, b) => {
              if (a.is_featured && !b.is_featured) return -1
              if (!a.is_featured && b.is_featured) return 1
              return (a.display_order || 999) - (b.display_order || 999)
            })
            setProducts(sorted.slice(0, 12))
          }
        }
      } catch (err) {
        console.error("Erro ao buscar produtos populares:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPopular()
  }, [initialProducts, categoryId])

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" })
    }
  }

  if (!loading && products.length === 0) {
    return null
  }

  return (
    <section className="py-6 sm:py-10 bg-[#090810] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Divisor Estilizado com Badge Centralizado (Imagem 2) */}
        <div className="relative flex items-center justify-center mb-6 sm:mb-8">
          {/* Linha esquerda neon violeta */}
          <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-purple-600/70 to-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]" />

          {/* Badge Central */}
          <div className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-[#130f22] border-2 border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2 mx-3 sm:mx-4 shrink-0">
            <span className="text-sm sm:text-base font-black tracking-wider uppercase text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
              🔥 {title}
            </span>
          </div>

          {/* Linha direita neon violeta */}
          <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-purple-600/70 to-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]" />
        </div>

        {/* Container do Carrossel com Botões de Navegação */}
        <div className="relative group">
          {/* Botão Scroll Esquerda */}
          <button
            type="button"
            onClick={scrollLeft}
            aria-label="Rolar para a esquerda"
            className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-20 size-9 sm:size-10 rounded-full bg-[#161226]/90 hover:bg-purple-600 border border-purple-500/40 text-white flex items-center justify-center transition-all duration-200 shadow-xl opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer backdrop-blur-sm"
          >
            <ChevronLeft className="size-5" />
          </button>

          {/* Trilho Horizontal Deslizável */}
          <div
            ref={scrollContainerRef}
            className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1 cursor-grab active:cursor-grabbing select-none"
          >
            {loading
              ? [...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-[220px] sm:w-[240px] md:w-[250px] shrink-0 h-96 bg-[#13111c] border border-purple-500/20 rounded-2xl animate-pulse p-3 space-y-3"
                  >
                    <div className="aspect-square bg-purple-950/30 rounded-xl" />
                    <div className="h-4 bg-purple-950/40 rounded w-3/4" />
                    <div className="h-4 bg-purple-950/30 rounded w-1/2" />
                    <div className="h-8 bg-purple-950/50 rounded-xl mt-auto" />
                  </div>
                ))
              : products.map((product) => (
                  <div
                    key={product.id}
                    className="w-[220px] sm:w-[240px] md:w-[250px] shrink-0 flex"
                  >
                    <IneightProductCard product={product} />
                  </div>
                ))}
          </div>

          {/* Botão Scroll Direita */}
          <button
            type="button"
            onClick={scrollRight}
            aria-label="Rolar para a direita"
            className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-20 size-9 sm:size-10 rounded-full bg-[#161226]/90 hover:bg-purple-600 border border-purple-500/40 text-white flex items-center justify-center transition-all duration-200 shadow-xl opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer backdrop-blur-sm"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
