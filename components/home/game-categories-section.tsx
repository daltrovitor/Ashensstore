"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search } from "lucide-react"
import { getAllGames, type GameCategory } from "@/lib/store/games"

interface DbCategory {
  id: string
  name: string
  slug: string
  description?: string
  display_order?: number
}

const GAME_BANNERS_MAP: Record<string, { bannerUrl: string; tag?: string }> = {
  "blox-fruits": { bannerUrl: "/games/blox-fruits.png", tag: "MAIS POPULAR" },
  "adopt-me": { bannerUrl: "/games/adopt-me.png", tag: "DESTAQUE" },
  "grow-a-garden-2": { bannerUrl: "/games/grow-a-garden.png", tag: "NOVO" },
  "murder-mystery-2": { bannerUrl: "/games/murder-mystery-2.png", tag: "POPULAR" },
  "rivals": { bannerUrl: "/games/rivals.png", tag: "DESTAQUE" },
}

export function GameCategoriesSection() {
  const [searchTerm, setSearchTerm] = useState("")
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([])
  const fallbackGames = useMemo(() => getAllGames(), [])

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setDbCategories(data)
          }
        }
      } catch (e) {
        console.warn("Erro ao buscar categorias para a seção de jogos:", e)
      }
    }
    fetchCats()
  }, [])

  // Constrói a lista final priorizando as categorias criadas no painel
  const allGames: GameCategory[] = useMemo(() => {
    if (dbCategories.length === 0) return fallbackGames

    // Filtra as categorias principais de jogos ou as criadas no banco
    const mapped = dbCategories.map((cat) => {
      const slugNormalized = (cat.slug || "").toLowerCase().trim()
      const nameLower = cat.name.toLowerCase()

      // Identifica banner de jogo se corresponder
      let banner = "/games/blox-fruits.png"
      let tag = "CATEGORIA"

      if (slugNormalized.includes("blox") || nameLower.includes("blox")) {
        banner = "/games/blox-fruits.png"
        tag = "MAIS POPULAR"
      } else if (slugNormalized.includes("adopt") || nameLower.includes("adopt")) {
        banner = "/games/adopt-me.png"
        tag = "DESTAQUE"
      } else if (slugNormalized.includes("garden") || nameLower.includes("garden")) {
        banner = "/games/grow-a-garden.png"
        tag = "NOVO"
      } else if (slugNormalized.includes("murder") || slugNormalized.includes("mm2") || nameLower.includes("murder")) {
        banner = "/games/murder-mystery-2.png"
        tag = "POPULAR"
      } else if (slugNormalized.includes("rival") || nameLower.includes("rival")) {
        banner = "/games/rivals.png"
        tag = "DESTAQUE"
      } else if (GAME_BANNERS_MAP[slugNormalized]) {
        banner = GAME_BANNERS_MAP[slugNormalized].bannerUrl
        tag = GAME_BANNERS_MAP[slugNormalized].tag || "CATEGORIA"
      } else {
        banner = "/banners/banner-1.jpg"
        tag = "DESTAQUE"
      }

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug || cat.id,
        aliases: [cat.name.toLowerCase(), (cat.slug || "").toLowerCase()],
        bannerUrl: banner,
        description: cat.description || "Confira os itens disponíveis nesta categoria.",
        tag,
        hasProducts: true,
      }
    })

    return mapped
  }, [dbCategories, fallbackGames])

  const filteredGames = useMemo(() => {
    if (!searchTerm.trim()) return allGames
    const q = searchTerm.toLowerCase().trim()
    return allGames.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.aliases.some((a) => a.toLowerCase().includes(q))
    )
  }, [allGames, searchTerm])

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

        {/* Grid de Cards dos Jogos - Design Mais Quadrado */}
        {filteredGames.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 border border-neutral-200 rounded-md p-6 space-y-2">
            <p className="text-sm font-semibold text-neutral-700">
              Nenhuma categoria encontrada para &ldquo;{searchTerm}&rdquo;
            </p>
            <p className="text-xs text-neutral-500">
              Tente buscar por &ldquo;Blox Fruits&rdquo;, &ldquo;Adopt Me&rdquo; ou limpe o campo de busca.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function GameCard({ game }: { game: GameCategory }) {
  // Remove emojis para um visual mais limpo e profissional
  const cleanTag = game.tag ? game.tag.replace(/[^a-zA-Z0-9À-ÿ\s]/g, "").trim() : null

  return (
    <Link
      href={`/categoria/${game.slug}`}
      className="group relative block w-full rounded-md sm:rounded-lg overflow-hidden border border-neutral-200 hover:border-[#48B9FA] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
    >
      {/* Container de Imagem com Aspect Ratio 16:9 */}
      <div className="relative w-full pt-[56.25%] bg-neutral-100 overflow-hidden">
        <Image
          src={game.bannerUrl}
          alt={game.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradiente sutil inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Tag do Jogo Limpa e Quadrada */}
        {cleanTag && (
          <div className="absolute top-2 right-2 z-10">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#48B9FA] text-white shadow-xs uppercase tracking-wider">
              {cleanTag}
            </span>
          </div>
        )}

        {/* Nome do Jogo sobreposto na imagem para visual forte */}
        <div className="absolute bottom-2 left-3 right-3 z-10">
          <h3 className="text-white font-extrabold text-sm sm:text-base drop-shadow-sm uppercase tracking-wide truncate">
            {game.name}
          </h3>
        </div>

        {/* Barra de destaque azul no rodapé do card ao passar o mouse */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-[#48B9FA] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
    </Link>
  )
}
