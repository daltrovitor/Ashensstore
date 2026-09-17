"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { RedeemCodeCard } from "./redeem-code-card"
import { BuySpinsSection } from "./buy-spins-section"
import { PrizesGrid } from "./prizes-grid"
import type { RoulettePrize, RouletteSpinRecord } from "@/lib/roulette/types"
import { Button } from "@/components/ui/button"

export function HomeRouletteSection() {
  const router = useRouter()
  const { user } = useAuth()

  const [prizes, setPrizes] = useState<RoulettePrize[]>([])
  const [userSpins, setUserSpins] = useState(0)
  const [history, setHistory] = useState<RouletteSpinRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllPrizes, setShowAllPrizes] = useState(false)

  const fetchRouletteData = useCallback(async () => {
    try {
      const res = await fetch('/api/roulette/data', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.prizes) setPrizes(data.prizes)
        if (typeof data.balance === 'number') setUserSpins(data.balance)
        if (data.history) setHistory(data.history)
      }
    } catch (err) {
      console.warn('[HomeRouletteSection] Erro ao carregar dados da roleta:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRouletteData()
  }, [fetchRouletteData, user])

  const handleSpinSuccess = (newBalance: number) => {
    setUserSpins(newBalance)
    fetchRouletteData()
  }

  const handleRedeemSuccess = (_spinsAdded: number, newBalance: number) => {
    setUserSpins(newBalance)
    fetchRouletteData()
  }

  const handleOpenAuth = () => {
    router.push('/login?redirect=/')
  }

  const pendingClaims = history.filter(h => h.claim_status === 'pending')

  return (
    <section className="py-8 sm:py-12 bg-white border-b border-neutral-200 relative overflow-hidden">
      {/* Background Decorativo sutil */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-b from-[#48B9FA]/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-8 sm:space-y-10">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-neutral-200">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-neutral-900 tracking-tight">
              Roleta da Sorte Ashens
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl">
              Gire a esteira e concorra a <strong>Kitsune</strong>, <strong>Dragon Rework</strong>, <strong>Dark Blade</strong>, <strong>Contas Max Level 2550</strong> e Gamepasses com entrega segura!
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/roleta"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#48B9FA] hover:text-[#0284c7] transition-colors py-1.5 px-3 rounded-sm bg-white border border-neutral-200 hover:border-[#48B9FA] shadow-xs"
            >
              <span>Abrir página dedicada</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Alerta de Prêmios Pendentes de Resgate (se logado) */}
        {user && pendingClaims.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 font-bold">
                !
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                  Você tem {pendingClaims.length} prêmio(s) aguardando resgate!
                </h4>
                <p className="text-[11px] sm:text-xs text-amber-700">
                  Acesse seus giros para concluir a entrega automática ou via ticket no Discord.
                </p>
              </div>
            </div>
            <Link
              href="/roleta#meus-giros"
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-sm transition-colors shrink-0"
            >
              Resgatar Meus Prêmios
            </Link>
          </div>
        )}

        {/* 1. ROLETA HORIZONTAL INTERATIVA */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 sm:p-6 md:p-8">
          <RouletteWheel
            prizes={prizes}
            userSpins={userSpins}
            isLoggedIn={!!user}
            onSpinSuccess={handleSpinSuccess}
            onOpenAuth={handleOpenAuth}
          />
        </div>

        {/* 2. DUAS COLUNAS: RESGATE DE CÓDIGO + COMPRA DE GIROS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Resgatar Código */}
          <div className="lg:col-span-5 w-full">
            <RedeemCodeCard
              isLoggedIn={!!user}
              onRedeemSuccess={handleRedeemSuccess}
              onOpenAuth={handleOpenAuth}
            />
          </div>

          {/* Comprar Mais Giros (pacotes 1, 5, 10) */}
          <div className="lg:col-span-7 w-full bg-white rounded-xl border border-neutral-200 p-5 sm:p-6 shadow-xs">
            <BuySpinsSection />
          </div>
        </div>

        {/* 3. O QUE POSSO GANHAR? (Collapsible / Preview) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-neutral-900">
              Prêmios Disponíveis na Roleta
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllPrizes(!showAllPrizes)}
              className="text-xs font-bold text-neutral-700 hover:text-[#48B9FA] cursor-pointer"
            >
              {showAllPrizes ? "Ocultar tabela de prêmios" : "Ver todos os prêmios e probabilidades"}
            </Button>
          </div>

          {showAllPrizes && (
            <div className="bg-white rounded-xl border border-neutral-200 p-5 sm:p-6 shadow-xs transition-all">
              <PrizesGrid prizes={prizes} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
