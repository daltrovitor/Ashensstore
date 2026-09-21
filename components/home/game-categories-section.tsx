// Hello World
"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { GAMES_DATA } from "@/lib/store/games"
import type { Category } from "@/lib/store/types"

export function GameCategoriesSection() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCats = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/categories", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setCategories(data)
          }
        }
      } catch (e) {
        console.warn("Erro ao buscar categorias para a seção de jogos:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchCats()
  }, [])

  // Apenas as Categorias Principais ativas aparecem na seção
  const mainCategories = useMemo(() => {
    const explicitlyMain = categories.filter((c) => c.is_main === true && c.is_active !== false)
    if (explicitlyMain.length > 0) return explicitlyMain

    // Fallback para categorias raiz se nenhuma tiver marcado is_main explicitamente
    const rootCats = categories.filter((c) => !c.parent_id && c.is_active !== false)
    if (rootCats.length > 0) return rootCats

    // Fallback seguro caso o banco ainda não possua categorias cadastradas
    if (categories.length === 0) {
      return GAMES_DATA.map((g) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        description: g.description,
        display_order: 0,
        is_active: true,
        is_main: true,
        image_url: g.bannerUrl,
      }))
    }

    return []
  }, [categories])

  const filteredGames = useMemo(() => {
    if (!searchTerm.trim()) return mainCategories
    const q = searchTerm.toLowerCase().trim()
    return mainCategories.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q)) ||
        (g.slug && g.slug.toLowerCase().includes(q))
    )
  }, [mainCategories, searchTerm])

  return (
    <section className="py-8 sm:py-10 bg-white text-neutral-900 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-neutral-900">
              Escolha um jogo
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
              Escolha seu jogo para navegar pelas ofertas e categorias de produtos
            </p>
          </div>

          {/* Campo de Pesquisa Limpo com Foco Azul */}
          <div className="relative w-full sm:w-72 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar jogo..."
              className="w-full bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-[#48B9FA] rounded-md h-10 pl-10 pr-4 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all shadow-2xs focus:ring-2 focus:ring-[#48B9FA]/20"
            />
          </div>
        </div>

        {/* Grid de Cards dos Jogos / Categorias Principais */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="w-full aspect-[16/9] rounded-md bg-neutral-100 animate-pulse border border-neutral-200"
              />
            ))}
          </div>
        ) : mainCategories.length === 0 ? (
          <div className="text-center py-10 px-4 bg-neutral-50 border border-dashed border-neutral-200 rounded-lg space-y-2">
            <p className="text-sm font-bold text-neutral-800">
              Nenhuma Categoria Principal cadastrada ainda
            </p>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Acesse a aba <strong>Categorias</strong> no Painel Administrativo para cadastrar suas categorias principais com suas próprias imagens.
            </p>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 border border-neutral-200 rounded-md p-6 space-y-2">
            <p className="text-sm font-semibold text-neutral-700">
              Nenhum jogo encontrado para &ldquo;{searchTerm}&rdquo;
            </p>
            <p className="text-xs text-neutral-500">
              Limpe o campo de busca para ver todas as categorias principais.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
            {filteredGames.map((game) => (
              <MainCategoryCard key={game.id} category={game} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function MainCategoryCard({ category }: { category: Category }) {
  // Proporção dinâmica que se adapta à imagem real enviada pelo usuário
  const [aspect, setAspect] = useState<string>("16 / 9")

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget
    if (naturalWidth && naturalHeight) {
      setAspect(`${naturalWidth} / ${naturalHeight}`)
    }
  }

  const categorySlug = category.slug || category.id
  const targetHref = `/categoria/${encodeURIComponent(categorySlug)}`

  return (
    <Link
      href={targetHref}
      className="group relative block w-full rounded-md sm:rounded-lg overflow-hidden border border-neutral-200 hover:border-[#48B9FA] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
    >
      {/* Container com molde dinâmico adaptado à proporção real da imagem */}
      <div
        className="relative w-full bg-neutral-100 overflow-hidden transition-[aspect-ratio] duration-300"
        style={{ aspectRatio: aspect }}
      >
        {category.image_url ? (
          <img
            src={category.image_url}
            alt={category.name}
            onLoad={handleImageLoad}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full min-h-[140px] bg-gradient-to-br from-neutral-100 via-neutral-200 to-neutral-100 flex items-center justify-center p-4">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{category.name}</span>
          </div>
        )}

        {/* Gradiente inferior para legibilidade de alto contraste */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent opacity-85 group-hover:opacity-95 transition-opacity pointer-events-none" />

        {/* Nome do Jogo / Categoria Principal */}
        <div className="absolute bottom-2.5 left-3 right-3 z-10 pointer-events-none">
          <h3 className="text-white font-extrabold text-sm sm:text-base drop-shadow-md uppercase tracking-wide truncate">
            {category.name}
          </h3>
        </div>

        {/* Barra de destaque azul no rodapé do card ao passar o mouse */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-[#48B9FA] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
    </Link>
  )
}
