"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/ecommerce/ProductCard"
import { HeroSliderSimple } from "@/components/hero-slider-simple"
import { ArrowRight, ShieldCheck, Zap, MessageSquare, Headphones, ShoppingBag, Layers } from "lucide-react"
import type { Product, Category } from "@/lib/store/types"
import { StoreLoader } from "@/components/store-loader"
import { DiscordCta } from "@/components/discord-cta"

function HomeContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
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

  const displayedProducts = selectedCategory === "all"
    ? products
    : products.filter((p) => p.category_id === selectedCategory)

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
      <StoreLoader isLoading={loading} minDurationMs={1200} />
      <Navbar />

      {/* 1. Banners Principais */}
      <HeroSliderSimple />

      {/* 2. PRODUTOS E CATEGORIAS LÁ EM CIMA (Logo após o banner) */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header da Seção de Produtos */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 pb-4 border-b border-neutral-200">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#48B9FA] uppercase tracking-wider">
                <ShoppingBag className="w-4 h-4 text-[#48B9FA]" />
                <span>Catálogo da Loja</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
                Produtos Disponíveis
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500">
                Frutas permanentes, físicas, gamepasses e contas com entrega rápida via Pix.
              </p>
            </div>

            <Link
              href="/loja"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#48B9FA] hover:text-[#20a6f5] transition-colors cursor-pointer group self-start sm:self-auto"
            >
              <span>Ver catálogo completo</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Abas Horizontais de Categorias lá em cima */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
              }`}
            >
              Todos os Produtos ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category_id === cat.id).length
              const isActive = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#48B9FA] text-white shadow-sm"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
                  }`}
                >
                  {cat.name} {count > 0 ? `(${count})` : ''}
                </button>
              )
            })}
          </div>

          {/* Grid de Produtos */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse bg-neutral-100 rounded-sm h-72 sm:h-80 border border-neutral-200 p-3 sm:p-4 space-y-3">
                  <div className="bg-neutral-200 rounded-sm h-40 sm:h-48 w-full"></div>
                  <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                  <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 border border-neutral-200 rounded-sm p-8 space-y-2">
              <p className="text-sm font-semibold text-neutral-700">Nenhum produto cadastrado nesta categoria.</p>
              <p className="text-xs text-neutral-500">Selecione outra categoria ou veja todos os itens acima.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Faixa de Vantagens e Segurança */}
      <section className="py-8 sm:py-10 bg-white border-t border-neutral-100">
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

      {/* 4. CATEGORIAS E LINKS DE CATEGORIAS LÁ EMBAIXO */}
      {categories.length > 0 && (
        <section className="py-8 sm:py-12 bg-neutral-50/70 border-t border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#48B9FA] uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-[#48B9FA]" />
                  <span>Navegue por Categoria</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
                  Categorias Principais
                </h3>
              </div>
              <Link
                href="/loja"
                className="text-xs font-semibold text-[#48B9FA] hover:text-[#20a6f5] flex items-center gap-1 cursor-pointer"
              >
                Ver todas no catálogo <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/loja?categoryId=${encodeURIComponent(cat.slug || cat.id)}`}
                  className="p-4 sm:p-5 rounded-sm bg-white border border-neutral-200 hover:border-[#48B9FA] transition-colors flex flex-col justify-between cursor-pointer group"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs sm:text-sm text-neutral-900 group-hover:text-[#48B9FA] transition-colors line-clamp-1">
                      {cat.name}
                    </h4>
                    <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                      {cat.description || "Ver itens desta categoria"}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center text-[11px] sm:text-xs font-bold text-[#48B9FA]">
                    <span>Explorar</span>
                    <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. CTA Servidor do Discord Oficial */}
      <DiscordCta />

      {/* 6. Rodapé */}
      <Footer />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<StoreLoader isLoading={true} minDurationMs={1200} />}>
      <HomeContent />
    </Suspense>
  )
}
