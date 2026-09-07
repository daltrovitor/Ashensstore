"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/ecommerce/ProductCard"
import { ProductGrid } from "@/components/ecommerce/ProductGrid"
import { HeroSliderSimple } from "@/components/hero-slider-simple"
import { ArrowRight } from "lucide-react"
import type { Product } from "@/lib/store/types"
import { StoreLoader } from "@/components/store-loader"

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
      title: "Entrega Digital no Roblox",
      desc: "Coordenação via servidor VIP ou trade com segurança",
    },
    {
      title: "Pagamento via QR Code Pix",
      desc: "Processamento automático e confirmação rápida",
    },
    {
      title: "Chat Integrado ao Pedido",
      desc: "Comunicação direta com o vendedor em tempo real",
    },
    {
      title: "Suporte Especializado",
      desc: "Atendimento dedicado para esclarecer suas dúvidas",
    },
  ]

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      <StoreLoader isLoading={loading} minDurationMs={1600} />
      <Navbar />

      {/* Banner Slider Limpo (Apenas Imagem) */}
      <HeroSliderSimple />

      {/* Faixa de Pilares / Vantagens Minimalista */}
      <section className="border-y border-neutral-200 bg-neutral-50/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustBadges.map((item, i) => (
              <div key={i} className="space-y-1">
                <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                  {item.title}
                </h4>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorias Principais (Apenas se existirem no banco de dados) */}
      {dbCategories.length > 0 && (
        <section className="py-10 border-b border-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {dbCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/loja?categoryId=${cat.slug || cat.id}`}
                  className="p-5 rounded-sm bg-white border border-neutral-200 hover:border-[#48B9FA] transition-colors flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <h3 className="font-semibold text-sm text-neutral-900 group-hover:text-[#48B9FA] transition-colors">{cat.name}</h3>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{cat.description || "Ver itens desta categoria"}</p>
                  </div>
                  <div className="mt-4 flex items-center text-xs font-medium text-[#48B9FA]">
                    <span>Ver itens</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Destaques da Semana */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-baseline justify-between mb-8 pb-4 border-b border-neutral-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight">
                Destaques da Semana
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Frutas, gamepasses e contas mais procuradas para Blox Fruits.
              </p>
            </div>

            <Link
              href="/loja"
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-900 hover:text-[#48B9FA] transition-colors cursor-pointer"
            >
              Ver catálogo completo
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-neutral-100 rounded-sm h-80 border border-neutral-200 p-4 space-y-3">
                  <div className="bg-neutral-200 rounded-sm h-48 w-full"></div>
                  <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                  <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 border border-neutral-200 rounded-sm p-8 space-y-2">
              <p className="text-sm font-medium text-neutral-700">Nenhum produto cadastrado no momento.</p>
              <p className="text-xs text-neutral-500">Cadastre produtos e itens no painel administrativo para exibi-los aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Frutas Míticas & Físicas */}
      {fruitProducts.length > 0 && (
        <section className="py-10 border-t border-neutral-100">
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

      {/* Gamepasses em Destaque */}
      {gamepassProducts.length > 0 && (
        <section className="py-10 pb-16 border-t border-neutral-100">
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

      {/* Rodapé Minimalista */}
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
