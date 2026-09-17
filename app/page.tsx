"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/ecommerce/ProductCard"
import { HeroSliderSimple } from "@/components/hero-slider-simple"
import { GameCategoriesSection } from "@/components/home/game-categories-section"
import { CategoryDivider } from "@/components/home/category-divider"
import { ArrowRight, ShieldCheck, Zap, MessageSquare, Headphones } from "lucide-react"
import type { Product, Category } from "@/lib/store/types"
import { StoreLoader } from "@/components/store-loader"
import { DiscordCta } from "@/components/discord-cta"
import { BLOX_CATEGORIES, BLOX_PRODUCTS } from "@/data/blox-fruits"

function HomeContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resProducts, resCategories] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ])

      if (resProducts.ok) {
        const prodData = await resProducts.json()
        setProducts(Array.isArray(prodData) ? prodData : [])
      }

      if (resCategories.ok) {
        const catData = await resCategories.json()
        setCategories(Array.isArray(catData) ? catData : [])
      }
    } catch (error) {
      console.error('Erro ao buscar dados da home:', error)
    } finally {
      setLoading(false)
    }
  }

  // Lista de categorias com fallback seguro
  const activeCategories = useMemo(() => {
    if (categories.length > 0) return categories
    return BLOX_CATEGORIES
  }, [categories])

  // Lista de produtos com fallback seguro
  const allProducts = useMemo(() => {
    if (products.length > 0) return products
    return BLOX_PRODUCTS
  }, [products])

  // Agrupamento de produtos por categoria para exibição contínua para baixo
  const categoryGroups = useMemo(() => {
    const groups = activeCategories.map((cat) => {
      const catProducts = allProducts.filter((p) => {
        if (p.category_id === cat.id) return true
        if (cat.slug && p.category_id === cat.slug) return true
        if (p.category && (p.category.id === cat.id || p.category.slug === cat.slug)) return true
        return false
      })
      return {
        category: cat,
        products: catProducts,
      }
    }).filter((group) => group.products.length > 0)

    // Se as categorias do banco baterem, retorna os grupos
    if (groups.length > 0) {
      return groups
    }

    // Fallback dinâmico: agrupa os produtos pelas categorias disponíveis nos próprios produtos
    const map = new Map<string, { category: Category; products: Product[] }>()
    for (const p of allProducts) {
      const catName = p.category?.name || "Ofertas em Destaque"
      const catId = p.category_id || p.category?.id || "destaques"
      const catSlug = p.category?.slug || catId

      if (!map.has(catName)) {
        map.set(catName, {
          category: {
            id: catId,
            name: catName,
            slug: catSlug,
            description: "Confira todos os itens disponíveis nesta categoria",
          },
          products: [],
        })
      }
      map.get(catName)!.products.push(p)
    }

    return Array.from(map.values())
  }, [activeCategories, allProducts])

  // Produtos que não entraram em nenhum grupo (se houver)
  const uncategorizedProducts = useMemo(() => {
    const includedIds = new Set(
      categoryGroups.flatMap((g) => g.products.map((p) => p.id))
    )
    return allProducts.filter((p) => !includedIds.has(p.id))
  }, [categoryGroups, allProducts])

  const trustBadges = [
    {
      icon: ShieldCheck,
      title: "Entrega Digital no Roblox",
      desc: "Coordenação direta via Servidor VIP ou Trade seguro no Mar 2 e 3.",
    },
    {
      icon: Zap,
      title: "Pagamento Instantâneo Pix",
      desc: "QR Code automático com confirmação imediata e 10% OFF nos cupons.",
    },
    {
      icon: MessageSquare,
      title: "Chat Integrado ao Pedido",
      desc: "Comunicação rápida e transparente diretamente com o vendedor.",
    },
    {
      icon: Headphones,
      title: "Suporte Especializado",
      desc: "Equipe pronta para esclarecer dúvidas e acompanhar seu pedido no Discord.",
    },
  ]

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-[#48B9FA]/20 selection:text-neutral-900">
      <StoreLoader isLoading={loading} minDurationMs={1000} />
      <Navbar />

      {/* 1. Banners Principais no Topo (Garantidos com Fallback) */}
      <HeroSliderSimple />

      {/* 2. Escolha o Jogo / Categorias Principais (Logo abaixo dos banners) */}
      <GameCategoriesSection />

      {/* 3. Cada Categoria Listada para Baixo com o Divisor Redesenhado Quadrado */}
      <div className="bg-white">
        {categoryGroups.map(({ category, products: catProducts }) => (
          <section key={category.id} className="py-6 sm:py-8 bg-white border-b border-neutral-100 last:border-b-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Divisor no Estilo da Foto (Mais Quadrado, Branco e Azul) */}
              <CategoryDivider
                title={category.name}
                subtitle={category.description || undefined}
              />

              {/* Grade de Produtos com o Nosso ProductCard Oficial */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-6">
                {catProducts.slice(0, 8).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Link Limpo para ver mais itens da categoria se houver mais de 8 */}
              {catProducts.length > 8 && (
                <div className="text-center mt-6">
                  <Link
                    href={`/loja?categoryId=${encodeURIComponent(category.slug || category.id)}`}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md bg-white border border-[#48B9FA] text-[#0284c7] hover:bg-[#48B9FA] hover:text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <span>Ver todos os {catProducts.length} itens de {category.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        ))}

        {/* Seção adicional para produtos sem categoria definida (se houver) */}
        {uncategorizedProducts.length > 0 && (
          <section className="py-6 sm:py-8 bg-white border-b border-neutral-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <CategoryDivider title="Mais Produtos" subtitle="Outros itens disponíveis no catálogo" />
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-6">
                {uncategorizedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* 4. Faixa de Vantagens e Segurança */}
      <section className="py-8 sm:py-10 bg-white border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {trustBadges.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-[#48B9FA] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 5. CTA Servidor do Discord Oficial */}
      <DiscordCta />

      {/* 6. Rodapé */}
      <Footer />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<StoreLoader isLoading={true} minDurationMs={1000} />}>
      <HomeContent />
    </Suspense>
  )
}
