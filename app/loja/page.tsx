"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/ecommerce/ProductCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import type { Product, Category } from "@/lib/store/types"
import { StoreLoader } from "@/components/store-loader"
import { findCategory } from "@/lib/utils/category-matcher"

function LojaContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const searchParams = useSearchParams()
  const router = useRouter()

  const categoryParam = searchParams.get('categoryId') || "all"
  const sortParam = searchParams.get('sort') || "popular"
  const searchParam = searchParams.get('search') || ""
  const featuredParam = searchParams.get('featured')

  const [selectedCategory, setSelectedCategory] = useState(categoryParam)
  const [sortBy, setSortBy] = useState(sortParam)
  const [localSearch, setLocalSearch] = useState(searchParam)

  useEffect(() => {
    setSelectedCategory(categoryParam)
    setSortBy(sortParam)
    setLocalSearch(searchParam)
  }, [categoryParam, sortParam, searchParam])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, sortBy, searchParam, featuredParam])

  const updateFilters = (newCategory: string, newSort: string, newSearch?: string) => {
    const params = new URLSearchParams()

    if (newCategory && newCategory !== 'all') params.set('categoryId', newCategory)
    if (newSort && newSort !== 'popular') params.set('sort', newSort)
    
    const s = newSearch !== undefined ? newSearch : searchParam
    if (s && s.trim()) params.set('search', s.trim())

    router.push(`/loja?${params.toString()}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters(selectedCategory, sortBy, localSearch)
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory && selectedCategory !== "all") params.append('categoryId', selectedCategory)
      if (searchParam) params.append('search', searchParam)
      if (featuredParam) params.append('featured', 'true')

      const res = await fetch(`/api/products?${params.toString()}`)
      if (res.ok) {
        let data = await res.json()
        if (Array.isArray(data)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const getPrice = (p: any) => Number(p.price || p.variants?.[0]?.retail_price || 0)

          if (sortBy === 'name') data.sort((a, b) => a.name.localeCompare(b.name))
          else if (sortBy === 'price_asc') data.sort((a, b) => getPrice(a) - getPrice(b))
          else if (sortBy === 'price_desc') data.sort((a, b) => getPrice(b) - getPrice(a))
          else if (sortBy === 'newest') data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          else {
            // Padrão / popular: respeita a ordem definida pelo admin
            data.sort((a, b) => {
              const ordA = a.display_order && a.display_order > 0 ? a.display_order : 9999
              const ordB = b.display_order && b.display_order > 0 ? b.display_order : 9999
              if (ordA !== ordB) return ordA - ordB
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            })
          }

          setProducts(data)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const displayCategories = [
    { id: "all", slug: "all", name: "Todos os Itens" },
    ...categories.map((c) => ({ id: c.id, slug: c.slug || c.id, name: c.name })),
  ]

  const activeCategory = findCategory(categories, selectedCategory)

  const isTabActive = (cat: { id: string; slug?: string; name: string }) => {
    if (cat.id === "all") {
      return !selectedCategory || selectedCategory === "all" || !activeCategory
    }
    return activeCategory?.id === cat.id
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      <StoreLoader isLoading={loading} minDurationMs={1200} />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Cabeçalho do Catálogo */}
        <div className="mb-8 pb-4 border-b border-neutral-200">
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
            {searchParam ? `Resultados para "${searchParam}"` : "Catálogo"}
          </h1>
          <p className="text-neutral-500 text-xs sm:text-sm mt-1">
            {searchParam
              ? "Itens encontrados para a sua pesquisa."
              : "Frutas Físicas, Gamepasses e Contas com entrega rápida via PIX."
            }
          </p>
        </div>

        {/* Abas Horizontais de Categorias Dinâmicas do Banco */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          {displayCategories.map((cat) => {
            const isSelected = isTabActive(cat)
            const targetFilterValue = cat.id === "all" ? "all" : (cat.slug || cat.id)

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(targetFilterValue)
                  updateFilters(targetFilterValue, sortBy)
                }}
                className={`px-3.5 py-1.5 rounded-sm text-xs font-medium whitespace-nowrap transition-colors border cursor-pointer ${
                  isSelected
                    ? "bg-[#48B9FA] text-white border-[#48B9FA]"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-[#48B9FA] hover:text-[#48B9FA]"
                }`}
              >
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-8 pb-4 border-b border-neutral-200">
          {/* Campo de Busca */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Buscar por nome (ex: Kitsune)..."
              className="pl-9 pr-8 bg-neutral-50 border-neutral-300 focus-visible:ring-[#48B9FA] text-neutral-900 text-xs h-9 rounded-sm"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch("")
                  updateFilters(selectedCategory, sortBy, "")
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Ordenação e Contagem */}
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
            <span className="text-xs text-neutral-500">
              <strong className="text-neutral-900 font-semibold">{products.length}</strong> itens
            </span>

            <Select
              value={sortBy}
              onValueChange={(val) => {
                setSortBy(val)
                updateFilters(selectedCategory, val)
              }}
            >
              <SelectTrigger className="w-40 bg-white border-neutral-300 text-xs text-neutral-900 h-9 rounded-sm">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                <SelectItem value="popular">Mais Populares</SelectItem>
                <SelectItem value="newest">Mais Recentes</SelectItem>
                <SelectItem value="price_asc">Menor Preço</SelectItem>
                <SelectItem value="price_desc">Maior Preço</SelectItem>
                <SelectItem value="name">Nome (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid de Produtos */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-neutral-100 rounded-sm h-80 border border-neutral-200 p-4 space-y-3">
                <div className="bg-neutral-200 rounded-sm h-48 w-full"></div>
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-neutral-50 border border-neutral-200 rounded-sm p-8 space-y-4">
            <p className="text-base font-medium text-neutral-900">Nenhum produto encontrado</p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Tente limpar os filtros ou buscar por outro termo.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("all")
                setLocalSearch("")
                router.push('/loja')
              }}
              className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white px-4 py-2 text-xs font-medium rounded-sm transition-colors cursor-pointer shadow-xs"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default function LojaPage() {
  return (
    <Suspense fallback={<StoreLoader isLoading={true} minDurationMs={1200} />}>
      <LojaContent />
    </Suspense>
  )
}
