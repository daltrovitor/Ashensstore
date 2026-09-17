"use client"

import type { RoulettePrize } from "@/lib/roulette/types"
import { Gift, ShieldCheck, Sparkles, HelpCircle } from "lucide-react"

interface PrizesGridProps {
  prizes: RoulettePrize[]
}

export function PrizesGrid({ prizes }: PrizesGridProps) {
  const activePrizes = (prizes || []).filter(p => p.is_active)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#48B9FA]/10 border border-[#48B9FA]/20 flex items-center justify-center text-[#48B9FA]">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              O que posso ganhar?
            </h2>
            <p className="text-xs text-neutral-500">
              Confira a lista completa de recompensas e suas probabilidades oficiais de sorteio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Mítico (≤3%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Lendário (3%-10%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#48B9FA]" />
            <span>Raro/Outros</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {activePrizes.map((prize) => {
          const prob = Number(prize.probability) || 1
          const rarity = prize.rarity || (
            prob <= 3 ? 'mythic' : prob <= 10 ? 'legendary' : prob <= 25 ? 'rare' : 'common'
          )
          const isMythic = rarity === 'mythic'
          const isLegendary = rarity === 'legendary'
          const isEpic = rarity === 'epic'
          const isRare = rarity === 'rare'

          const badgeColor = isMythic
            ? 'bg-amber-100 text-amber-800 border-amber-300'
            : isLegendary
            ? 'bg-purple-100 text-purple-800 border-purple-300'
            : isEpic
            ? 'bg-pink-100 text-pink-800 border-pink-300'
            : isRare
            ? 'bg-blue-100 text-blue-800 border-blue-200'
            : 'bg-neutral-100 text-neutral-700 border-neutral-200'

          const borderHover = isMythic
            ? 'hover:border-amber-400 hover:shadow-amber-100'
            : isLegendary
            ? 'hover:border-purple-400 hover:shadow-purple-100'
            : isEpic
            ? 'hover:border-pink-400 hover:shadow-pink-100'
            : 'hover:border-[#48B9FA] hover:shadow-blue-100'

          return (
            <div
              key={prize.id}
              className={`bg-white border border-neutral-200 rounded-xl p-3.5 flex flex-col justify-between transition-all hover:shadow-md ${borderHover} group relative`}
            >
              {/* Top: Tag de Probabilidade */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                  {prize.probability}%
                </span>
                <span className="text-[10px] text-neutral-400 font-medium capitalize">
                  {prize.redemption_type === 'automatic' ? 'Instantâneo' : 'Via Discord'}
                </span>
              </div>

              {/* Imagem do Item */}
              <div className="w-20 h-20 mx-auto my-2 relative flex items-center justify-center">
                <img
                  src={prize.image_url}
                  alt={prize.name}
                  className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              </div>

              {/* Nome & Informações */}
              <div className="text-center pt-2 border-t border-neutral-100 mt-1">
                <h4 className="text-xs font-bold text-neutral-900 line-clamp-1 leading-snug" title={prize.name}>
                  {prize.name}
                </h4>
                <p className="text-[10px] text-neutral-500 line-clamp-2 mt-1 leading-tight" title={prize.description}>
                  {prize.description || prize.delivery_info || 'Item resgatável da Roleta Ashens.'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
