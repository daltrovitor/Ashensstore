"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/ecommerce/ProductCard"
import { ProductGrid } from "@/components/ecommerce/ProductGrid"
import { HeroSliderSimple } from "@/components/hero-slider-simple"
import { ArrowRight, ShieldCheck, Zap, MessageSquare, Headphones, Flame, Layers } from "lucide-react"
import type { Product } from "@/lib/store/types"
import { StoreLoader } from "@/components/store-loader"
import { DiscordCta } from "@/components/discord-cta"

function HomeContent() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [fruitProducts, setFruitProducts] = useState<Product[]>([])
  const [gamepassProducts, setGamepassProducts] = useState<Product[]>([])
  const [dbCategories, setDbCategories] = useState<{ id: string; name: string; slug: string; description?: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resFeatured, resFruits, resPasses, resCategories] = await Promise.all([
        fetch('/api/products?featured=true'),
        fetch('/api/products?categoryId=frutas'),
        fetch('/api/products?categoryId=gamepasses'),
        fetch('/api/categories'),
      ])

      if (resFeatured.ok) {
        const data = await resFeatured.json()
        setFeaturedProducts(Array.isArray(data) ? data : [])
      }

      if (resFruits.ok) {
        const data = await resFruits.json()
        setFruitProducts(Array.isArray(data) ? data.slice(0, 4) : [])
      }

      if (resPasses.ok) {
        const data = await resPasses.json()
        setGamepassProducts(Array.isArray(data) ? data.slice(0, 4) : [])
      }

      if (resCategories.ok) {
        const catData = await resCategories.json()
        setDbCategories(Array.isArray(catData) ? catData : [])
      }
    } catch (error) {
      console.error('Erro ao buscar dados da home:', error)
    } finally {
      setLoading(false)
    }
  }

  const trustBadges = [
    {
      icon: ShieldCheck,
      color: "text-emerald-500 bg-emerald-50 border-emerald-100",
      title: "Entrega Digital no Roblox",
      desc: "Coordenação direta via Servidor VIP ou Trade seguro no Mar 2 e 3.",
    },
    {
      icon: Zap,
      color: "text-[#48B9FA] bg-blue-50 border-blue-100",
      title: "Pagamento Instantâneo Pix",
      desc: "QR Code automático com confirmação imediata e 10% OFF nos cupons.",
    },
    {
      icon: MessageSquare,
      color: "text-purple-500 bg-purple-50 border-purple-100",
      title: "Chat Integrado ao Pedido",
      desc: "Comunicação rápida e transparente diretamente com o vendedor.",
    },
    {
      icon: Headphones,
      color: "text-amber-500 bg-amber-50 border-amber-100",
      title: "Suporte Especializado",
      desc: "Equipe pronta para esclarecer dúvidas e acompanhar seu pedido no Discord.",
    },
  ]

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-[#48B9FA]/20 selection:text-neutral-900">
      <StoreLoader isLoading={loading} minDurationMs={1600} />
      <Navbar />

      {/* 1. Banners Principais (Otimizado para Mobile sem cortes e com touch swipe) */}
      <HeroSliderSimple />

      {/* 2. PRODUTOS LOGO APÓS O BANNER (Destaques da Semana) */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header da Seção com Design Moderno */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8 pb-4 border-b border-neutral-200">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-blue-50 text-[#48B9FA] border border-blue-100">
                <Flame className="w-3.5 h-3.5" />
                Catálogo em Alta
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
                Destaques da Semana
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500">
                Frutas Míticas, Físicas, Gamepasses e Contas com entrega rápida via Pix.
              </p>
            </div>

            <Link
              href="/loja"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#48B9FA] hover:text-[#20a6f5] transition-colors cursor-pointer group self-start sm:self-auto bg-neutral-50 sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-sm border sm:border-0 border-neutral-200"
            >
              <span>Ver catálogo completo</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Grid Responsivo de Produtos: 2 colunas no celular, 4 no desktop */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-neutral-100 rounded-md h-72 sm:h-80 border border-neutral-200 p-3 sm:p-4 space-y-3">
                  <div className="bg-neutral-200 rounded-md h-40 sm:h-48 w-full"></div>
                  <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                  <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 border border-neutral-200 rounded-md p-8 space-y-2">
              <p className="text-sm font-semibold text-neutral-700">Nenhum produto cadastrado no momento.</p>
              <p className="text-xs text-neutral-500">Cadastre produtos e itens no painel administrativo para exibi-los aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Categorias Principais (Redesenhadas em Cards Interativos) */}
      {dbCategories.length > 0 && (
        <section className="py-8 sm:py-10 bg-neutral-50/70 border-y border-neutral-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-[#48B9FA]" />
                  Navegue por Categoria
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
                  Categorias Principais
                </h3>
              </div>
              <Link
                href="/loja"
                className="text-xs font-semibold text-[#48B9FA] hover:text-[#20a6f5] flex items-center gap-1 cursor-pointer"
              >
                Todas <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {dbCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/loja?categoryId=${cat.slug || cat.id}`}
                  className="p-4 sm:p-5 rounded-md bg-white border border-neutral-200/90 hover:border-[#48B9FA] hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div className="space-y-1.5">
                    <div className="w-8 h-8 rounded-md bg-blue-50 text-[#48B9FA] flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform">
                      {cat.name.substring(0, 2).toUpperCase()}
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-neutral-900 group-hover:text-[#48B9FA] transition-colors line-clamp-1">
                      {cat.name}
                    </h4>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                      {cat.description || "Ver itens desta categoria"}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center text-[11px] sm:text-xs font-bold text-[#48B9FA]">
                    <span>Explorar</span>
                    <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Faixa de Vantagens e Segurança (Design Redesenhado com Cards Gamer Modernos) */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {trustBadges.map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={i}
                  className="p-4 sm:p-5 rounded-md bg-neutral-50/80 border border-neutral-200/80 flex items-start gap-3.5 hover:border-neutral-300 transition-colors"
                >
                  <div className={`p-2.5 rounded-md shrink-0 border ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-neutral-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 5. Frutas Míticas & Físicas */}
      {fruitProducts.length > 0 && (
        <section className="py-6 sm:py-10 border-t border-neutral-100 bg-neutral-50/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProductGrid
              products={fruitProducts}
              title="Frutas Míticas & Físicas"
              description="Kitsune, Dragon, Leopard e as principais frutas para trade no Segundo ou Terceiro Mar."
              showViewAll={true}
              viewAllLink="/loja?categoryId=frutas"
              columns={4}
            />
          </div>
        </section>
      )}

      {/* 6. Gamepasses em Destaque */}
      {gamepassProducts.length > 0 && (
        <section className="py-6 sm:py-10 pb-12 sm:pb-16 border-t border-neutral-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProductGrid
              products={gamepassProducts}
              title="Gamepasses"
              description="2x Maestria, 2x Beli, Dark Blade e Barcos Rápidos com entrega direta."
              showViewAll={true}
              viewAllLink="/loja?categoryId=gamepasses"
              columns={4}
            />
          </div>
        </section>
      )}

      {/* 7. CTA Servidor do Discord Oficial */}
      <DiscordCta />

      {/* 8. Rodapé */}
      <Footer />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<StoreLoader isLoading={true} minDurationMs={1600} />}>
      <HomeContent />
    </Suspense>
  )
}
