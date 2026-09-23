// Hello World
"use client"

import { useState, useEffect, useRef, useMemo, use } from "react"
import Link from "next/link"
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
  const rawSlug = resolvedParams.slug
  const slug = decodeURIComponent(rawSlug || "").trim()

  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedSubcat, setSelectedSubcat] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<string>("popular")
  const [loading, setLoading] = useState(true)

  // Proporção dinâmica que se adapta à imagem real enviada na página principal
  const [bannerAspect, setBannerAspect] = useState<string>("16 / 9")

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

  // 1. Identificação precisa da Categoria Principal selecionada (Banco de Dados com fallback seguro)
  const currentCategory = useMemo(() => {
    if (!slug) return null
    const clean = slug.toLowerCase().trim()

    // Busca nas categorias cadastradas no banco
    const match = categories.find((c) => {
      if (c.slug && c.slug.toLowerCase().trim() === clean) return true
      if (c.id && c.id.toLowerCase().trim() === clean) return true
      if (c.name && c.name.toLowerCase().trim() === clean) return true
      return false
    })
    if (match) return match

    // Fallback para os jogos estáticos pré-configurados
    const staticGame = getGameBySlug(slug)
    if (staticGame) {
      return {
        id: staticGame.id,
        name: staticGame.name,
        slug: staticGame.slug,
        description: staticGame.description,
        image_url: staticGame.bannerUrl,
        is_main: true,
        is_active: true,
      } as Category
    }

    // Fallback genérico caso a rota seja acessada antes da sincronização
    return {
      id: slug,
      name: slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      slug: slug,
      description: "Confira todos os itens e ofertas disponíveis nesta categoria.",
      image_url: "/ashens-logo.jpg",
      is_main: true,
      is_active: true,
    } as Category
  }, [slug, categories])

  const categoryTitle = currentCategory ? currentCategory.name : "Categoria"
  const categoryDescription = currentCategory?.description || "Itens e ofertas disponíveis com entrega rápida via Pix."
  const categoryImage = currentCategory?.image_url || "/ashens-logo.jpg"

  // 2. Subcategorias vinculadas a esta Categoria Principal
  const subcategories = useMemo(() => {
    if (!currentCategory) return []
    return categories.filter((c) => {
      if (c.id === currentCategory.id) return false
      if (c.parent_id === currentCategory.id) return true
      if (currentCategory.slug && c.parent_id === currentCategory.slug) return true
      return false
    })
  }, [categories, currentCategory])

  // 3. Produtos desta Categoria Principal (apenas ativos)
  const mainCategoryProducts = useMemo(() => {
    if (!currentCategory) return []
    const subcatIds = new Set(subcategories.map((s) => s.id))
    const subcatSlugs = new Set(subcategories.map((s) => s.slug).filter(Boolean))

    return products.filter((p) => {
      if (p.is_active === false) return false

      // Atribuição direta à categoria principal
      if (p.category_id === currentCategory.id) return true
      if (currentCategory.slug && p.category_id === currentCategory.slug) return true
      if (p.category && (p.category.id === currentCategory.id || p.category.slug === currentCategory.slug)) return true

      // Atribuição a uma subcategoria desta categoria principal
      if (p.category_id && (subcatIds.has(p.category_id) || subcatSlugs.has(p.category_id))) return true
      if (p.category?.id && subcatIds.has(p.category.id)) return true
      if (p.category?.parent_id === currentCategory.id) return true

      // Fallback para Blox Fruits caso os produtos ainda não tenham sido remanejados
      if (currentCategory.slug === "blox-fruits") {
        const hasOtherMainCat = categories.some(
          (c) => c.is_main && c.id !== currentCategory.id && (p.category_id === c.id || p.category?.id === c.id)
        )
        if (!hasOtherMainCat) return true
      }

      return false
    })
  }, [products, currentCategory, subcategories, categories])

  // 4. Agrupamento de produtos por subcategoria para exibição ao rolar a página
  const categoryGroups = useMemo(() => {
    if (subcategories.length === 0) return []

    return subcategories
      .map((subcat) => {
        const catProducts = mainCategoryProducts.filter((p) => {
          if (p.category_id === subcat.id || p.category_id === subcat.slug) return true
          if (p.category && (p.category.id === subcat.id || p.category.slug === subcat.slug)) return true
          return false
        })
        return {
          category: subcat,
          products: catProducts,
        }
      })
      .filter((group) => group.products.length > 0)
  }, [subcategories, mainCategoryProducts])

  // Produtos que não pertencem a nenhuma subcategoria específica
  const directProducts = useMemo(() => {
    const inGroups = new Set(categoryGroups.flatMap((g) => g.products.map((p) => p.id)))
    return mainCategoryProducts.filter((p) => !inGroups.has(p.id))
  }, [categoryGroups, mainCategoryProducts])

  // 5. Lista filtrada para busca ou subcategoria específica
  const displayedProducts = useMemo(() => {
    let list = [...mainCategoryProducts]

    if (selectedSubcat !== "all") {
      list = list.filter((p) => p.category_id === selectedSubcat || p.category?.id === selectedSubcat)
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
      list.sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1
        if (!a.is_featured && b.is_featured) return 1
        return (a.display_order || 999) - (b.display_order || 999)
      })
    }

    return list
  }, [mainCategoryProducts, selectedSubcat, searchQuery, sortBy])

  // Rolagem suave da barra de subcategorias
  const scrollTabs = (direction: "left" | "right") => {
    if (tabsContainerRef.current) {
      const offset = direction === "left" ? -260 : 260
      tabsContainerRef.current.scrollBy({ left: offset, behavior: "smooth" })
    }
  }

  const handleBannerImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget
    if (naturalWidth && naturalHeight) {
      setBannerAspect(`${naturalWidth} / ${naturalHeight}`)
    }
  }

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
            <span className="text-[#0284c7] font-bold">{categoryTitle}</span>
          </div>
        </div>
      </div>

      {/* Banner de Destaque da Categoria Principal (Com molde adaptável à proporção real da imagem) */}
      <section className="bg-gradient-to-b from-blue-50/40 via-white to-white border-b border-neutral-200 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            {/* Molde da imagem que se adapta à proporção real da imagem enviada na home */}
            <div
              className="relative w-full max-w-xs sm:max-w-sm rounded-md sm:rounded-lg overflow-hidden border border-neutral-200 shadow-sm shrink-0 bg-neutral-100 transition-[aspect-ratio] duration-300"
              style={{ aspectRatio: bannerAspect }}
            >
              <img
                src={categoryImage}
                alt={categoryTitle}
                onLoad={handleBannerImageLoad}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Informações da Categoria Principal */}
            <div className="flex-1 text-center md:text-left space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-blue-50 border border-blue-200/60 text-[#0284c7] text-xs font-bold">
                <ShieldCheck className="size-3.5 text-[#48B9FA]" />
                <span>Entrega Digital Garantida • Envio Imediato</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-neutral-900 uppercase">
                {categoryTitle}
              </h1>

              <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl leading-relaxed">
                {categoryDescription}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-xs font-semibold text-neutral-500">
                <span className="text-[#0284c7]">
                  <strong>{mainCategoryProducts.length}</strong> produtos disponíveis
                </span>
                <span>•</span>
                <span>Pagamento via Pix Automático</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Barra de Subcategorias (Se existirem subcategorias cadastradas) */}
      {subcategories.length > 0 && (
        <section className="bg-white border-b border-neutral-200 sticky top-16 sm:top-20 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                <Layers className="size-3.5 text-[#48B9FA]" />
                <span>Categorias de {categoryTitle}</span>
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
                Todas ({mainCategoryProducts.length})
              </button>

              {/* Subcategorias */}
              {subcategories.map((cat) => {
                const count = mainCategoryProducts.filter(
                  (p) => p.category_id === cat.id || p.category?.id === cat.id
                ).length
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
              })}
            </div>
          </div>
        </section>
      )}

      {/* Catálogo de Produtos da Categoria Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full">
        {/* Barra de Busca e Ordenação */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6 sm:mb-8 pb-4 border-b border-neutral-200">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Buscar itens em ${categoryTitle}...`}
              className="w-full bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-[#48B9FA] rounded-md h-10 pl-10 pr-4 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all shadow-2xs focus:ring-2 focus:ring-[#48B9FA]/20"
            />
          </div>

          {/* Contador e Ordenação */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs text-neutral-500">
              <strong className="text-neutral-900 font-bold">
                {selectedSubcat === "all" && !searchQuery.trim()
                  ? mainCategoryProducts.length
                  : displayedProducts.length}
              </strong> produtos
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

        {/* Exibição dos Produtos */}
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
        ) : mainCategoryProducts.length === 0 ? (
          /* Estado Vazio Próprio da Categoria Principal (Sem desviar para outros jogos) */
          <div className="text-center py-16 bg-neutral-50 border border-neutral-200 rounded-md p-8 max-w-xl mx-auto space-y-4 mt-6">
            <div className="size-14 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-[#0284c7]">
              <Layers className="size-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                Nenhum produto em {categoryTitle} no momento
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
                O estoque desta categoria está sendo atualizado no painel de controle. Retorne em breve para conferir as novidades!
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/"
                className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white px-5 py-2 text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer"
              >
                Voltar para Todas as Categorias
              </Link>
            </div>
          </div>
        ) : selectedSubcat === "all" && !searchQuery.trim() && categoryGroups.length > 0 ? (
          /* As Categorias aparecem conforme é rolada a página para baixo */
          <div className="space-y-10">
            {categoryGroups.map(({ category: subcat, products: catProducts }) => (
              <section key={subcat.id} className="border-b border-neutral-100 pb-10 last:border-b-0 last:pb-0">
                <CategoryDivider
                  title={subcat.name}
                  subtitle={subcat.description || undefined}
                />
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-6">
                  {catProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ))}

            {/* Produtos diretos da categoria principal sem subcategoria */}
            {directProducts.length > 0 && (
              <section className="border-b border-neutral-100 pb-10 last:border-b-0 last:pb-0">
                <CategoryDivider
                  title="Mais Ofertas"
                  subtitle={`Outros produtos e ofertas de ${categoryTitle}`}
                />
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-6">
                  {directProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="text-center py-16 bg-neutral-50 border border-neutral-200 rounded-md p-8 max-w-xl mx-auto space-y-4 mt-6">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                Nenhum produto encontrado
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
                Tente selecionar outra categoria acima ou limpar o termo pesquisado.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSubcat("all")
                  setSearchQuery("")
                }}
                className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white px-5 py-2 text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer"
              >
                Ver Todas as Categorias
              </button>
            </div>
          </div>
        ) : (
          /* Grid quando uma subcategoria específica está selecionada ou há busca ativa */
          <div>
            <CategoryDivider
              title={
                selectedSubcat === "all"
                  ? searchQuery.trim()
                    ? `Resultados para "${searchQuery}"`
                    : categoryTitle
                  : categories.find((c) => c.id === selectedSubcat)?.name || "Produtos"
              }
            />
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-6">
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
