"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Sparkles, Trophy } from "lucide-react"
import type { PublicWinnerFeedItem } from "@/lib/roulette/types"

export function RecentWinsTicker() {
  const [winners, setWinners] = useState<PublicWinnerFeedItem[]>([])

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const res = await fetch('/api/roulette/recent-wins', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data.winners && data.winners.length > 0) {
            setWinners(data.winners)
          }
        }
      } catch (err) {
        console.warn('[RecentWinsTicker] Erro ao carregar ganhadores:', err)
      }
    }

    fetchWinners()
    const interval = setInterval(fetchWinners, 30000)
    return () => clearInterval(interval)
  }, [])

  if (winners.length === 0) {
    return null
  }

  return (
    <div className="w-full bg-blue-50/70 text-neutral-800 py-2.5 px-4 overflow-hidden border-y border-blue-100 select-none">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0 bg-white text-[#0284c7] px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border border-blue-200 shadow-2xs">
          <Trophy className="w-3.5 h-3.5 text-[#48B9FA]" />
          <span>Ganhadores Recentes</span>
        </div>

        {/* Marquee horizontal suave */}
        <div className="relative flex-1 overflow-hidden">
          <div className="flex items-center gap-6 animate-[marquee_35s_linear_infinite] whitespace-nowrap text-xs text-neutral-700">
            {winners.concat(winners).map((win, idx) => (
              <div key={`${win.id}-${idx}`} className="flex items-center gap-2 shrink-0 bg-white px-3 py-1 rounded-md border border-blue-100 shadow-2xs">
                <span className="font-semibold text-[#0284c7]">{win.masked_name}</span>
                <span className="text-neutral-400 text-[11px]">ganhou</span>
                <div className="relative w-4 h-4 rounded-sm overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src={win.prize_image}
                    alt={win.prize_name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <strong className="text-neutral-900 font-bold">{win.prize_name}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
