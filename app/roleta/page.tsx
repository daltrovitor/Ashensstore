"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useAuth } from "@/hooks/use-auth"
import { RecentWinsTicker } from "@/components/roulette/recent-wins-ticker"
import { RouletteWheel } from "@/components/roulette/roulette-wheel"
import { RedeemCodeCard } from "@/components/roulette/redeem-code-card"
import { PrizesGrid } from "@/components/roulette/prizes-grid"
import { UserSpinsHistory } from "@/components/roulette/user-spins-history"
import { BuySpinsSection } from "@/components/roulette/buy-spins-section"
import type { RoulettePrize, RouletteSpinRecord, RouletteSettings } from "@/lib/roulette/types"

export default function RoulettePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [prizes, setPrizes] = useState<RoulettePrize[]>([])
  const [settings, setSettings] = useState<RouletteSettings | null>(null)
  const [userSpins, setUserSpins] = useState(0)
  const [history, setHistory] = useState<RouletteSpinRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRouletteData = useCallback(async () => {
    try {
      const res = await fetch('/api/roulette/data', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.prizes) setPrizes(data.prizes)
        if (data.settings) setSettings(data.settings)
        if (typeof data.balance === 'number') setUserSpins(data.balance)
        if (data.history) setHistory(data.history)
      }
    } catch (err) {
      console.warn('[RoulettePage] Erro ao carregar dados:', err)
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
    router.push('/login?redirect=/roleta')
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-[#48B9FA]/20">
      <Navbar />

      {/* Ticker de Ganhadores Recentes */}
      <RecentWinsTicker />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full space-y-12">
        {/* Cabeçalho da Página */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 tracking-tight">
            Roleta da Sorte Ashens
          </h1>

          <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
            Gire e concorra a Frutas Míticas (Kitsune, Dragon), Contas Level 2550 e Gamepasses com entrega rápida e segura.
          </p>
        </div>

        {/* 1. ROLETA HORIZONTAL */}
        <section className="w-full">
          <RouletteWheel
            prizes={prizes}
            userSpins={userSpins}
            isLoggedIn={!!user}
            onSpinSuccess={handleSpinSuccess}
            onOpenAuth={handleOpenAuth}
          />
        </section>

        {/* 2. RESGATAR CÓDIGO */}
        <section>
          <RedeemCodeCard
            isLoggedIn={!!user}
            onRedeemSuccess={handleRedeemSuccess}
            onOpenAuth={handleOpenAuth}
          />
        </section>

        {/* 3. O QUE POSSO GANHAR? */}
        <section>
          <PrizesGrid prizes={prizes} />
        </section>

        {/* 4. MEUS ÚLTIMOS GIROS */}
        <section>
          <UserSpinsHistory
            history={history}
            isLoggedIn={!!user}
            userSpins={userSpins}
            onOpenAuth={handleOpenAuth}
            onClaimSuccess={fetchRouletteData}
          />
        </section>

        {/* 5. COMPRAR MAIS GIROS */}
        <section>
          <BuySpinsSection
            spinPrice={settings?.spin_price}
            userEmail={user?.email}
            userName={(user as any)?.user_metadata?.full_name || user?.name}
          />
        </section>
      </main>

      <Footer />
    </div>
  )
}
