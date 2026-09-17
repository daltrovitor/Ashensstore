"use client"

import { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ProductCard } from "@/components/ecommerce/ProductCard"
import { CategoryDivider } from "@/components/home/category-divider"
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
    <section className="py-6 sm:py-10 bg-white relative overflow-hidden border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Divisor Quadrado no Estilo da Foto */}
        <CategoryDivider title={title} />

        {/* Container do Carrossel com Botões de Navegação */}
        <div className="relative group mt-4">
          {/* Botão Scroll Esquerda */}
          <button
            type="button"
            onClick={scrollLeft}
            aria-label="Rolar para a esquerda"
            className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-20 size-9 sm:size-10 rounded-md bg-white hover:bg-[#48B9FA] border border-neutral-200 hover:border-[#48B9FA] text-neutral-700 hover:text-white flex items-center justify-center transition-all duration-200 shadow-md opacity-0 group-hover:opacity-100 hover:scale-105 cursor-pointer"
          >
            <ChevronLeft className="size-5" />
          </button>

          {/* Trilho Horizontal Deslizável */}
          <div
            ref={scrollContainerRef}
            className="flex items-stretch gap-3 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1 cursor-grab active:cursor-grabbing select-none"
          >
            {loading
              ? [...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-[230px] sm:w-[260px] shrink-0 h-80 bg-neutral-100 border border-neutral-200 rounded-md animate-pulse p-3 space-y-3"
                  >
                    <div className="aspect-square bg-neutral-200 rounded-sm" />
                    <div className="h-4 bg-neutral-200 rounded w-3/4" />
                    <div className="h-4 bg-neutral-200 rounded w-1/2" />
                  </div>
                ))
              : products.map((product) => (
                  <div
                    key={product.id}
                    className="w-[230px] sm:w-[260px] shrink-0 flex"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
          </div>

          {/* Botão Scroll Direita */}
          <button
            type="button"
            onClick={scrollRight}
            aria-label="Rolar para a direita"
            className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-20 size-9 sm:size-10 rounded-md bg-white hover:bg-[#48B9FA] border border-neutral-200 hover:border-[#48B9FA] text-neutral-700 hover:text-white flex items-center justify-center transition-all duration-200 shadow-md opacity-0 group-hover:opacity-100 hover:scale-105 cursor-pointer"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
