"use client"

import { useState, useEffect, useRef, useMemo, use } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { StoreLoader } from "@/components/store-loader"
import { ProductCard } from "@/components/ecommerce/ProductCard"
import { CategoryDivider } from "@/components/home/category-divider"
import { getGameBySlug } from "@/lib/store/games"
import type { Product, Category } from "@/lib/store/types"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowLeft,
  SlidersHorizontal,
  Layers,
  ShieldCheck,
} from "lucide-react"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function GameCategoryPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const slug = resolvedParams.slug

  const game = useMemo(() => getGameBySlug(slug), [slug])
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedSubcat, setSelectedSubcat] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<string>("popular")
  const [loading, setLoading] = useState(true)

  const tabsContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchGameData()
  }, [slug])

  const fetchGameData = async () => {
    try {
      setLoading(true)
      const [resProd, resCat] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ])

      if (resCat.ok) {
        const catData = await resCat.json()
        setCategories(Array.isArray(catData) ? catData : [])
      }

      if (resProd.ok) {
        const prodData = await resProd.json()
        setProducts(Array.isArray(prodData) ? prodData : [])
      }
    } catch (err) {
      console.error("Erro ao carregar dados do jogo:", err)
    } finally {
      setLoading(false)
    }
  }

  // Se for Blox Fruits, mostra todos os produtos da loja
  // Se for outro jogo que ainda não tem produtos, lista vazia
  const gameProducts = useMemo(() => {
    if (!game || game.slug === "blox-fruits") {
      return products
    }
    return []
  }, [game, products])

  // Filtra produtos pela subcategoria selecionada e pela busca
  const displayedProducts = useMemo(() => {
    let list = [...gameProducts]

    if (selectedSubcat !== "all") {
      list = list.filter((p) => p.category_id === selectedSubcat)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getPrice = (p: any) => Number(p.price || p.variants?.[0]?.retail_price || 0)

    if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === "price_asc") {
      list.sort((a, b) => getPrice(a) - getPrice(b))
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => getPrice(b) - getPrice(a))
    } else if (sortBy === "newest") {
      list.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    } else {
      // Padrão / Mais populares
      list.sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1
        if (!a.is_featured && b.is_featured) return 1
        return (a.display_order || 999) - (b.display_order || 999)
      })
    }

    return list
  }, [gameProducts, selectedSubcat, searchQuery, sortBy])

  // Rolagem suave da barra de subcategorias
  const scrollTabs = (direction: "left" | "right") => {
    if (tabsContainerRef.current) {
      const offset = direction === "left" ? -260 : 260
      tabsContainerRef.current.scrollBy({ left: offset, behavior: "smooth" })
    }
  }

  const gameTitle = game ? game.name : "Blox Fruits"
  const gameDescription = game
    ? game.description
    : "Frutas permanentes, físicas, gamepasses, raças V4 e contas PVP com entrega rápida via Pix."
  const gameBanner = game ? game.bannerUrl : "/games/blox-fruits.png"

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-[#48B9FA]/20 selection:text-neutral-900">
      <StoreLoader isLoading={loading} minDurationMs={800} />
      <Navbar />

      {/* Top Breadcrumb & Retorno */}
      <div className="bg-neutral-50 border-b border-neutral-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-[#48B9FA] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Voltar para todas as categorias</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Link href="/" className="hover:text-neutral-900 transition-colors">
              Início
            </Link>
            <span>/</span>
            <span className="text-[#0284c7] font-bold">{gameTitle}</span>
          </div>
        </div>
      </div>

      {/* Banner de Destaque do Jogo (Clean White & Blue) */}
      <section className="bg-gradient-to-b from-blue-50/40 via-white to-white border-b border-neutral-200 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            {/* Imagem do Jogo com bordas quadradas */}
            <div className="relative w-full max-w-xs sm:max-w-sm aspect-video rounded-md sm:rounded-lg overflow-hidden border border-neutral-200 shadow-sm shrink-0 bg-neutral-100">
              <Image
                src={gameBanner}
                alt={gameTitle}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Informações do Jogo */}
            <div className="flex-1 text-center md:text-left space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-blue-50 border border-blue-200/60 text-[#0284c7] text-xs font-bold">
                <ShieldCheck className="size-3.5 text-[#48B9FA]" />
                <span>Entrega Digital Garantida • Trade & Servidor VIP</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-neutral-900 uppercase">
                {gameTitle}
              </h1>

              <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl leading-relaxed">
                {gameDescription}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-xs font-semibold text-neutral-500">
                <span className="text-[#0284c7]">
                  <strong>{gameProducts.length}</strong> produtos disponíveis
                </span>
                <span>•</span>
                <span>Pagamento via Pix Automático</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subcategorias por Rolagem (Design Mais Quadrado) */}
      <section className="bg-white border-b border-neutral-200 sticky top-16 sm:top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
              <Layers className="size-3.5 text-[#48B9FA]" />
              <span>Subcategorias de {gameTitle}</span>
            </div>

            {/* Setas de rolagem em desktop */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollTabs("left")}
                aria-label="Rolar subcategorias para a esquerda"
                className="size-7 rounded-md bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollTabs("right")}
                aria-label="Rolar subcategorias para a direita"
                className="size-7 rounded-md bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {/* Trilho de Subcategorias com Rolagem Horizontal */}
          <div
            ref={tabsContainerRef}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 select-none"
          >
            {/* Botão Todas */}
            <button
              type="button"
              onClick={() => setSelectedSubcat("all")}
              className={`shrink-0 px-4 py-1.5 rounded-md text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
                selectedSubcat === "all"
                  ? "bg-[#48B9FA] text-white border-[#48B9FA] shadow-xs"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-200"
              }`}
            >
              Todas ({gameProducts.length})
            </button>

            {/* Subcategorias */}
            {categories.length > 0
              ? categories.map((cat) => {
                  const count = gameProducts.filter((p) => p.category_id === cat.id).length
                  const isActive = selectedSubcat === cat.id

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedSubcat(cat.id)}
                      className={`shrink-0 px-4 py-1.5 rounded-md text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "bg-[#48B9FA] text-white border-[#48B9FA] shadow-xs"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-200"
                      }`}
                    >
                      {cat.name} {count > 0 ? `(${count})` : ""}
                    </button>
                  )
                })
              : null}
          </div>
        </div>
      </section>

      {/* Catálogo de Produtos do Jogo com ProductCard Oficial */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full">
        {/* Barra de Busca e Ordenação */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6 sm:mb-8 pb-4 border-b border-neutral-200">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Buscar itens em ${gameTitle}...`}
              className="w-full bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-[#48B9FA] rounded-md h-10 pl-10 pr-4 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all shadow-2xs focus:ring-2 focus:ring-[#48B9FA]/20"
            />
          </div>

          {/* Contador e Ordenação */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs text-neutral-500">
              <strong className="text-neutral-900 font-bold">{displayedProducts.length}</strong> produtos
            </span>

            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-md px-2.5 py-1.5">
              <SlidersHorizontal className="size-3.5 text-neutral-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-semibold text-neutral-800 outline-none cursor-pointer"
              >
                <option value="popular">Mais Populares</option>
                <option value="price_asc">Menor Preço</option>
                <option value="price_desc">Maior Preço</option>
                <option value="newest">Mais Recentes</option>
                <option value="name">Nome (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Divisor no estilo quadrado da foto */}
        <CategoryDivider
          title={selectedSubcat === "all" ? "Catálogo Completo" : categories.find(c => c.id === selectedSubcat)?.name || "Produtos"}
        />

        {/* Grid de Produtos Oficiais */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-80 bg-neutral-100 border border-neutral-200 rounded-md animate-pulse p-3 space-y-3"
              >
                <div className="aspect-square bg-neutral-200 rounded-sm" />
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                <div className="h-4 bg-neutral-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="text-center py-16 bg-neutral-50 border border-neutral-200 rounded-md p-8 max-w-xl mx-auto space-y-4 mt-6">
            <div className="size-14 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-[#0284c7]">
              <Layers className="size-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                {game && !game.hasProducts
                  ? `Novidades de ${gameTitle} em breve!`
                  : "Nenhum produto encontrado nesta subcategoria"}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
                {game && !game.hasProducts
                  ? "Nossa equipe está cadastrando o estoque para este jogo. Visite a categoria de Blox Fruits para ver todas as ofertas disponíveis."
                  : "Tente selecionar outra subcategoria acima ou limpar os termos de busca."}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {game && !game.hasProducts ? (
                <button
                  type="button"
                  onClick={() => router.push("/categoria/blox-fruits")}
                  className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white px-5 py-2 text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  Ver produtos de Blox Fruits
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubcat("all")
                    setSearchQuery("")
                  }}
                  className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white px-5 py-2 text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  Ver Todas as Subcategorias
                </button>
              )}

              <Link
                href="/"
                className="bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 px-4 py-2 text-xs font-bold rounded-md transition-colors"
              >
                Voltar ao Início
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-6">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
