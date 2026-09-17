"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Gamepad2 } from "lucide-react"
import { getAllGames, type GameCategory } from "@/lib/store/games"

export function GameCategoriesSection() {
  const [searchTerm, setSearchTerm] = useState("")
  const allGames = useMemo(() => getAllGames(), [])

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
    <section className="py-8 sm:py-12 bg-[#0a0911] text-white relative overflow-hidden border-b border-purple-900/30">
      {/* Luzes decorativas de fundo inspiradas no ineight */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Ícone de Controle Neon */}
            <div className="size-11 sm:size-13 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 p-[1px] shadow-[0_0_25px_rgba(147,51,234,0.4)] shrink-0 flex items-center justify-center">
              <div className="size-full bg-[#120f1d] rounded-[15px] flex items-center justify-center">
                <Gamepad2 className="size-5 sm:size-6 text-purple-400" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-purple-200">
                Escolha um jogo!
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 font-medium">
                Navegue pelas categorias e encontre seu jogo favorito
              </p>
            </div>
          </div>

          {/* Campo de Pesquisa em Tempo Real */}
          <div className="relative w-full sm:w-72 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar categoria..."
              className="w-full bg-[#161322]/80 hover:bg-[#1c182c] focus:bg-[#1c182c] border border-purple-500/20 focus:border-purple-500/70 rounded-full h-10 pl-10 pr-4 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none transition-all shadow-inner focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        {/* Grid de Cards dos Jogos */}
        {filteredGames.length === 0 ? (
          <div className="text-center py-12 bg-[#141220]/60 border border-purple-500/20 rounded-2xl p-6 space-y-2">
            <p className="text-sm font-semibold text-neutral-300">
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
  return (
    <Link
      href={`/categoria/${game.slug}`}
      className="group relative block w-full rounded-xl sm:rounded-2xl overflow-hidden border border-purple-500/20 hover:border-purple-400 bg-[#141120] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(168,85,247,0.45)] cursor-pointer"
    >
      {/* Container com Aspect Ratio 16:9 */}
      <div className="relative w-full pt-[56.25%] bg-neutral-900 overflow-hidden">
        <Image
          src={game.bannerUrl}
          alt={game.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Gradiente sutil inferior com efeito violeta idêntico à imagem 1 */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-950/80 via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

        {/* Barra de destaque neon no rodapé do card */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity" />

        {/* Badge do Jogo (se houver) */}
        {game.tag && (
          <div className="absolute top-2 right-2 z-10">
            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-black/60 backdrop-blur-md text-purple-200 border border-purple-400/30 shadow-md">
              {game.tag}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
