// Hello World
"use client"

import { useState, useEffect, useMemo, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { StoreLoader } from "@/components/store-loader"
import { ProductCard } from "@/components/ecommerce/ProductCard"
import { CategoryDivider } from "@/components/home/category-divider"
import { BLOX_CATEGORIES, BLOX_PRODUCTS } from "@/data/blox-fruits"
import {
  buildCategoryHierarchy,
  resolveProductAssignment,
  filterProductsByTargetCategory,
  normalizeSlug,
  isBloxFruitsReference,
} from "@/lib/categories/category-resolver"
import type { Product, Category } from "@/lib/store/types"
import {
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
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<string>("popular")
  const [loading, setLoading] = useState(true)

  // Proporção dinâmica que se adapta à imagem real enviada na página principal
  const [bannerAspect, setBannerAspect] = useState<string>("16 / 9")

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

  // 1. Constrói a hierarquia canônica de categorias (Principais e Subcategorias)
  const hierarchy = useMemo(() => {
    return buildCategoryHierarchy(categories)
  }, [categories])

  // 2. Identificação precisa da Categoria Principal selecionada
  const currentCategory = useMemo(() => {
    if (!slug) return null
    const clean = normalizeSlug(slug)

    // Busca nas categorias principais da hierarquia
    const match = hierarchy.mainCategories.find((c) => {
      if (c.slug && normalizeSlug(c.slug) === clean) return true
      if (c.id && normalizeSlug(c.id) === clean) return true
      if (c.name && normalizeSlug(c.name) === clean) return true
      return false
    })
    if (match) return match

    // Busca nas subcategorias da hierarquia
    const matchSub = hierarchy.subcategories.find((c) => {
      if (c.slug && normalizeSlug(c.slug) === clean) return true
      if (c.id && normalizeSlug(c.id) === clean) return true
      if (c.name && normalizeSlug(c.name) === clean) return true
      return false
    })
    if (matchSub) return matchSub

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
  }, [slug, hierarchy])

  const isBloxFruits = useMemo(() => isBloxFruitsReference(currentCategory?.slug || currentCategory?.name), [currentCategory])

  const categoryTitle = currentCategory ? currentCategory.name : "Categoria"
  const categoryDescription = currentCategory?.description || "Itens e ofertas disponíveis com entrega rápida via Pix."
  const categoryImage = currentCategory?.image_url || "/ashens-logo.jpg"

  // 3. Subcategorias vinculadas a esta Categoria Principal
  const subcategories = useMemo(() => {
    if (!currentCategory) return []
    const mapped =
      hierarchy.mainToSubsMap.get(currentCategory.id) ||
      (currentCategory.slug ? hierarchy.mainToSubsMap.get(currentCategory.slug) : []) ||
      []

    if (mapped.length > 0) return mapped

    // Fallback caso não mapeado
    return categories.filter((c) => {
      if (c.id === currentCategory.id || c.is_main) return false
      if (c.parent_id === currentCategory.id || (currentCategory.slug && c.parent_id === currentCategory.slug)) return true
      return false
    })
  }, [currentCategory, hierarchy, categories])

  // 4. Produtos desta Categoria Principal (apenas itens ativos pertencentes a este jogo)
  const mainCategoryProducts = useMemo(() => {
    if (!currentCategory) return []

    let sourceProducts = products
    if (isBloxFruits) {
      const hasAnyBloxInDb = products.some((p) => {
        if (p.is_active === false) return false
        const { mainCategory } = resolveProductAssignment(p, hierarchy)
        return mainCategory ? isBloxFruitsReference(mainCategory.slug || mainCategory.name) : false
      })

      if (!hasAnyBloxInDb) {
        sourceProducts = [...products, ...BLOX_PRODUCTS]
      }
    }

    return filterProductsByTargetCategory(sourceProducts, currentCategory.id, hierarchy)
  }, [products, currentCategory, hierarchy, isBloxFruits])

  // Helper de ordenação que respeita o seletor sortBy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortProducts = (list: Product[]) => {
    const copy = [...list]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getPrice = (p: any) => Number(p.price || p.variants?.[0]?.retail_price || 0)

    if (sortBy === "name") {
      copy.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === "price_asc") {
      copy.sort((a, b) => getPrice(a) - getPrice(b))
    } else if (sortBy === "price_desc") {
      copy.sort((a, b) => getPrice(b) - getPrice(a))
    } else if (sortBy === "newest") {
      copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else {
      copy.sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1
        if (!a.is_featured && b.is_featured) return 1
        return (a.display_order || 999) - (b.display_order || 999)
      })
    }
    return copy
  }

  // 5. Agrupamento de produtos por subcategoria para exibição ao rolar a página para baixo
  const categoryGroups = useMemo(() => {
    if (subcategories.length === 0) return []

    return subcategories
      .map((subcat) => {
        const catProducts = mainCategoryProducts.filter((p) => {
          const assignment = resolveProductAssignment(p, hierarchy)
          if (assignment.subcategory) {
            return assignment.subcategory.id === subcat.id || assignment.subcategory.slug === subcat.slug
          }
          return p.category_id === subcat.id || p.category_id === subcat.slug
        })
        return {
          category: subcat,
          products: sortProducts(catProducts),
        }
      })
      .filter((group) => group.products.length > 0)
  }, [subcategories, mainCategoryProducts, hierarchy, sortBy])

  // Produtos que não pertencem a nenhuma subcategoria específica
  const directProducts = useMemo(() => {
    const inGroups = new Set(categoryGroups.flatMap((g) => g.products.map((p) => p.id)))
    const remaining = mainCategoryProducts.filter((p) => !inGroups.has(p.id))
    return sortProducts(remaining)
  }, [categoryGroups, mainCategoryProducts, sortBy])

  // 6. Lista filtrada exclusivamente para quando há termo de busca ativo
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase().trim()
    const filtered = mainCategoryProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    )
    return sortProducts(filtered)
  }, [mainCategoryProducts, searchQuery, sortBy])

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
                {searchQuery.trim() ? searchResults.length : mainCategoryProducts.length}
              </strong> produtos disponíveis
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
        ) : searchQuery.trim() ? (
          /* Busca ativa */
          searchResults.length === 0 ? (
            <div className="text-center py-16 bg-neutral-50 border border-neutral-200 rounded-md p-8 max-w-xl mx-auto space-y-4 mt-6">
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                  Nenhum produto encontrado
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
                  Nenhum produto em {categoryTitle} corresponde a &ldquo;{searchQuery}&rdquo;.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white px-5 py-2 text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  Limpar Busca
                </button>
              </div>
            </div>
          ) : (
            <div>
              <CategoryDivider
                title={`Resultados para "${searchQuery}"`}
                subtitle={`${searchResults.length} produtos encontrados em ${categoryTitle}`}
              />
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-6">
                {searchResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )
        ) : (
          /* Padrão: Categoria por rolagem (cada subcategoria com seu divisor e todos os produtos carregados) */
          <div className="space-y-12">
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
                  title={`Mais Ofertas de ${categoryTitle}`}
                  subtitle={`Outros produtos e ofertas disponíveis`}
                />
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-6">
                  {directProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* Fallback caso não haja subcategorias cadastradas mas existam produtos diretos da categoria principal */}
            {categoryGroups.length === 0 && directProducts.length === 0 && mainCategoryProducts.length > 0 && (
              <section>
                <CategoryDivider
                  title={categoryTitle}
                  subtitle={categoryDescription}
                />
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-6">
                  {sortProducts(mainCategoryProducts).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
