"use client"

import { useState, useEffect, useRef, useMemo, use } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { StoreLoader } from "@/components/store-loader"
import { IneightProductCard } from "@/components/ecommerce/IneightProductCard"
import { PopularProductsCarousel } from "@/components/home/popular-products-carousel"
import { getGameBySlug } from "@/lib/store/games"
import type { Product, Category } from "@/lib/store/types"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowLeft,
  SlidersHorizontal,
  Layers,
  Sparkles,
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

  // Se for Blox Fruits, mostra todos os produtos da loja (já que são Blox Fruits)
  // Se for outro jogo que ainda não tem produtos, lista vazia
  const gameProducts = useMemo(() => {
    if (!game || game.slug === "blox-fruits") {
      return products
    }
    // Outros jogos no momento não possuem produtos cadastrados
    return []
  }, [game, products])

  // Filtra produtos pela subcategoria selecionada e pela busca
  const displayedProducts = useMemo(() => {
    let list = [...gameProducts]

    // Filtro por subcategoria
    if (selectedSubcat !== "all") {
      list = list.filter((p) => p.category_id === selectedSubcat)
    }

    // Filtro por busca
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      )
    }

    // Ordenação
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

  // Produtos populares do jogo para o carrossel
  const popularGameProducts = useMemo(() => {
    return gameProducts.filter((p) => p.is_featured || (p.display_order && p.display_order <= 5)).slice(0, 10)
  }, [gameProducts])

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
    <div className="min-h-screen bg-[#0a0911] text-white flex flex-col selection:bg-purple-600/30 selection:text-white">
      <StoreLoader isLoading={loading} minDurationMs={800} />
      <Navbar />

      {/* Top Breadcrumb & Retorno */}
      <div className="bg-[#0f0c1b] border-b border-purple-900/30 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>← Escolher outro jogo</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Link href="/" className="hover:text-white transition-colors">
              Início
            </Link>
            <span>/</span>
            <span className="text-purple-400 font-bold">{gameTitle}</span>
          </div>
        </div>
      </div>

      {/* Banner de Destaque do Jogo */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#130f24] to-[#0a0911] border-b border-purple-900/40 py-8 sm:py-12">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <Image
            src={gameBanner}
            alt={gameTitle}
            fill
            className="object-cover blur-md"
            priority
          />
        </div>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            {/* Imagem do Jogo */}
            <div className="relative w-full max-w-xs sm:max-w-sm aspect-video rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-[0_0_35px_rgba(168,85,247,0.35)] shrink-0">
              <Image
                src={gameBanner}
                alt={gameTitle}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>

            {/* Informações do Jogo */}
            <div className="flex-1 text-center md:text-left space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold shadow-sm">
                <ShieldCheck className="size-3.5 text-purple-400" />
                <span>Entrega Digital Garantida • Trade & Servidor VIP</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                {gameTitle}
              </h1>

              <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
                {gameDescription}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs font-bold text-neutral-400">
                <span className="flex items-center gap-1.5 text-purple-300">
                  <Sparkles className="size-3.5 text-yellow-400" />
                  <strong>{gameProducts.length}</strong> produtos disponíveis
                </span>
                <span>•</span>
                <span>Pagamento via Pix Automático</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUBCATEGORIAS POR ROLAGEM (Solicitação Principal do Usuário) */}
      {categories.length > 0 && (
        <section className="bg-[#0e0b19] border-b border-purple-900/30 sticky top-16 sm:top-20 z-40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                <Layers className="size-3.5 text-purple-400" />
                <span>Subcategorias de {gameTitle}</span>
              </div>

              {/* Setas de rolagem em desktop */}
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollTabs("left")}
                  aria-label="Rolar subcategorias para a esquerda"
                  className="size-7 rounded-full bg-white/5 hover:bg-purple-600/40 border border-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollTabs("right")}
                  aria-label="Rolar subcategorias para a direita"
                  className="size-7 rounded-full bg-white/5 hover:bg-purple-600/40 border border-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            {/* Trilho de Subcategorias com Rolagem Horizontal Suave */}
            <div
              ref={tabsContainerRef}
              className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1 select-none"
            >
              {/* Botão Todas */}
              <button
                type="button"
                onClick={() => setSelectedSubcat("all")}
                className={`snap-start shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 border whitespace-nowrap cursor-pointer ${
                  selectedSubcat === "all"
                    ? "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-purple-400/50 shadow-[0_0_20px_rgba(147,51,234,0.45)] scale-[1.02]"
                    : "bg-[#161224] text-neutral-400 hover:text-white border-white/10 hover:border-purple-500/30"
                }`}
              >
                Todas ({gameProducts.length})
              </button>

              {/* Subcategorias do Banco de Dados */}
              {categories.map((cat) => {
                const count = gameProducts.filter((p) => p.category_id === cat.id).length
                const isActive = selectedSubcat === cat.id

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedSubcat(cat.id)}
                    className={`snap-start shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 border whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-purple-400/50 shadow-[0_0_20px_rgba(147,51,234,0.45)] scale-[1.02]"
                        : "bg-[#161224] text-neutral-400 hover:text-white border-white/10 hover:border-purple-500/30"
                    }`}
                  >
                    {cat.name} {count > 0 ? `(${count})` : ""}
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* CARROSSEL DE PRODUTOS POPULARES DO JOGO (Seção da Imagem 2) */}
      {popularGameProducts.length > 0 && selectedSubcat === "all" && !searchQuery && (
        <PopularProductsCarousel
          products={popularGameProducts}
          title="PRODUTOS POPULARES"
        />
      )}

      {/* CATÁLOGO DE PRODUTOS FILTRADO DO JOGO */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full">
        {/* Barra de Busca e Ordenação interna do jogo */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6 sm:mb-8 pb-4 border-b border-purple-900/30">
          {/* Campo de Busca dentro do Jogo */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Buscar itens em ${gameTitle}...`}
              className="w-full bg-[#161224] border border-purple-500/20 focus:border-purple-500/60 rounded-xl h-10 pl-10 pr-4 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none transition-all focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Contador e Ordenação */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs text-neutral-400">
              <strong className="text-white font-bold">{displayedProducts.length}</strong> produtos
            </span>

            <div className="flex items-center gap-1.5 bg-[#161224] border border-purple-500/20 rounded-xl px-2.5 py-1.5">
              <SlidersHorizontal className="size-3.5 text-purple-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
              >
                <option value="popular" className="bg-[#161224]">Mais Populares</option>
                <option value="price_asc" className="bg-[#161224]">Menor Preço</option>
                <option value="price_desc" className="bg-[#161224]">Maior Preço</option>
                <option value="newest" className="bg-[#161224]">Mais Recentes</option>
                <option value="name" className="bg-[#161224]">Nome (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid de Produtos */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-96 bg-[#13111c] border border-purple-500/20 rounded-2xl animate-pulse p-3 space-y-3"
              >
                <div className="aspect-square bg-purple-950/30 rounded-xl" />
                <div className="h-4 bg-purple-950/40 rounded w-3/4" />
                <div className="h-4 bg-purple-950/30 rounded w-1/2" />
                <div className="h-8 bg-purple-950/50 rounded-xl mt-auto" />
              </div>
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="text-center py-16 sm:py-20 bg-[#131021]/80 border border-purple-500/30 rounded-2xl p-8 max-w-xl mx-auto space-y-4">
            <div className="size-16 rounded-full bg-purple-600/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
              <Layers className="size-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {game && !game.hasProducts
                  ? `Novidades de ${gameTitle} em breve!`
                  : "Nenhum produto encontrado nesta subcategoria"}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto">
                {game && !game.hasProducts
                  ? "Nossa equipe está cadastrando o estoque para este jogo. Visite o catálogo do Blox Fruits para ver as melhores ofertas ativas."
                  : "Tente selecionar outra subcategoria acima ou limpar os termos de busca."}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {game && !game.hasProducts ? (
                <button
                  type="button"
                  onClick={() => router.push("/categoria/blox-fruits")}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
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
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Ver Todas as Subcategorias
                </button>
              )}

              <Link
                href="/"
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2.5 text-xs font-bold rounded-xl transition-all"
              >
                Voltar ao Início
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {displayedProducts.map((product) => (
              <IneightProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
