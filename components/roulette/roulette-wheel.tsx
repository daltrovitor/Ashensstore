"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Sparkles, Volume2, VolumeX, Play, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { RoulettePrize } from "@/lib/roulette/types"
import { PrizeResultModal } from "./prize-result-modal"

interface RouletteWheelProps {
  prizes: RoulettePrize[]
  userSpins: number
  isLoggedIn: boolean
  onSpinSuccess?: (newBalance: number) => void
  onOpenAuth?: () => void
}

// Configurações dimensionais dos cards na esteira
const CARD_WIDTH_DESKTOP = 150
const CARD_GAP_DESKTOP = 14
const CARD_TOTAL_DESKTOP = CARD_WIDTH_DESKTOP + CARD_GAP_DESKTOP // 164px

const CARD_WIDTH_MOBILE = 118
const CARD_GAP_MOBILE = 10
const CARD_TOTAL_MOBILE = CARD_WIDTH_MOBILE + CARD_GAP_MOBILE // 128px

const TOTAL_SLOTS = 65 // Total de cards na esteira
const WINNER_INDEX = 48 // Índice onde o item vencedor estará posicionado
const SPIN_DURATION_MS = 6500 // Duração da rotação

export function RouletteWheel({
  prizes,
  userSpins,
  isLoggedIn,
  onSpinSuccess,
  onOpenAuth,
}: RouletteWheelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const [isSpinning, setIsSpinning] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [winningPrize, setWinningPrize] = useState<RoulettePrize | null>(null)
  const [currentSpinId, setCurrentSpinId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [translateX, setTranslateX] = useState(0)
  const [transitionStyle, setTransitionStyle] = useState('none')
  const [slots, setSlots] = useState<RoulettePrize[]>([])

  // Inicializa esteira com prêmios aleatórios distribuídos
  const buildInitialSlots = useCallback((targetWinner?: RoulettePrize, nearMiss?: RoulettePrize) => {
    if (!prizes || prizes.length === 0) return []
    const newSlots: RoulettePrize[] = []

    // Procura por itens míticos ou lendários caso não tenha vindo nearMiss explícito
    const fallbackNearMiss = nearMiss || prizes.find(p => p.rarity === 'mythic') || prizes.find(p => p.rarity === 'legendary')

    for (let i = 0; i < TOTAL_SLOTS; i++) {
      if (i === WINNER_INDEX && targetWinner) {
        newSlots.push(targetWinner)
      } else if (i === WINNER_INDEX - 1 && fallbackNearMiss && targetWinner?.rarity !== 'mythic') {
        // Posiciona o item mítico/lendário exatamente antes do vencedor para o suspense "quase caiu nele!"
        newSlots.push(fallbackNearMiss)
      } else if (i === WINNER_INDEX + 1 && prizes.some(p => p.rarity === 'legendary') && targetWinner?.rarity !== 'mythic') {
        // Item lendário logo depois para cercar o vencedor
        const leg = prizes.find(p => p.rarity === 'legendary') || prizes[0]
        newSlots.push(leg)
      } else {
        // Seleciona um item aleatório para preencher a esteira
        const randomItem = prizes[Math.floor(Math.random() * prizes.length)]
        newSlots.push(randomItem)
      }
    }
    return newSlots
  }, [prizes])

  useEffect(() => {
    if (prizes.length > 0 && slots.length === 0) {
      setSlots(buildInitialSlots())
    }
  }, [prizes, slots.length, buildInitialSlots])

  // Síntese de áudio leve para os cliques da roleta (com pitch dinâmico)
  const playTickSound = useCallback((isHighPitch = false) => {
    if (!soundEnabled || typeof window === 'undefined') return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      const baseFreq = isHighPitch ? 440 : 320
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(baseFreq / 2, ctx.currentTime + 0.04)

      gain.gain.setValueAtTime(0.045, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.04)
    } catch {
      // Ignora erro de áudio
    }
  }, [soundEnabled])

  // Som de vitória no final
  const playWinSound = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const now = ctx.currentTime

      const freqs = [440, 554.37, 659.25, 880] // A4, C#5, E5, A5
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(f, now + idx * 0.1)

        gain.gain.setValueAtTime(0.06, now + idx * 0.1)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now + idx * 0.1)
        osc.stop(now + idx * 0.1 + 0.4)
      })
    } catch {
      // Ignora
    }
  }, [soundEnabled])

  // Função disparada ao clicar no botão "GIRAR AGORA"
  const handleStartSpin = async () => {
    if (isSpinning) return

    if (!isLoggedIn) {
      toast.error("Você precisa estar logado na sua conta para girar a roleta!")
      if (onOpenAuth) onOpenAuth()
      return
    }

    if (userSpins < 1) {
      toast.error("Você não possui giros disponíveis! Adquira mais giros abaixo.")
      const buySection = document.getElementById("comprar-giros")
      if (buySection) buySection.scrollIntoView({ behavior: "smooth" })
      return
    }

    setIsSpinning(true)

    try {
      // 1. Chama backend para sorteio seguro
      const res = await fetch('/api/roulette/spin', { method: 'POST' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setIsSpinning(false)
        toast.error(data.error || "Não foi possível realizar o giro.")
        return
      }

      const winner = data.prize as RoulettePrize
      const nearMiss = data.nearMissPrize as RoulettePrize | undefined
      setWinningPrize(winner)
      setCurrentSpinId(data.spinId)

      if (onSpinSuccess) {
        onSpinSuccess(data.spinsRemaining)
      }

      // 2. Prepara os slots com o vencedor na posição 48 e o nearMiss na 47 (suspense cinematográfico)
      const newSlots = buildInitialSlots(winner, nearMiss)
      setSlots(newSlots)

      // 3. Reset visual para o início antes de disparar animação
      setTransitionStyle('none')
      setTranslateX(0)

      // 4. Inicia animação após breve frame
      setTimeout(() => {
        const isMobile = window.innerWidth < 768
        const cardTotal = isMobile ? CARD_TOTAL_MOBILE : CARD_TOTAL_DESKTOP
        const cardWidth = isMobile ? CARD_WIDTH_MOBILE : CARD_WIDTH_DESKTOP
        const containerWidth = containerRef.current?.offsetWidth || 800

        // Posição centralizada perfeita com pequena variação orgânica (-8px a +8px)
        const centerOffset = containerWidth / 2 - cardWidth / 2
        const randomJitter = (Math.random() - 0.5) * 16
        const targetTranslate = -(WINNER_INDEX * cardTotal) + centerOffset + randomJitter

        // Desaceleração cinematográfica com cauda longa (passa devagar pelo item raro)
        setTransitionStyle(`transform ${SPIN_DURATION_MS}ms cubic-bezier(0.08, 0.82, 0.17, 1)`)
        setTranslateX(targetTranslate)

        // Ticks de áudio progressivos: acelerados no início e desacelerando até parar
        const tickDelays = [
          50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700,
          760, 820, 880, 950, 1020, 1100, 1180, 1270, 1370, 1470, 1580, 1700,
          1830, 1970, 2120, 2280, 2450, 2630, 2820, 3030, 3250, 3490, 3750,
          4030, 4330, 4650, 4990, 5350, 5700, 6050, 6300
        ]

        tickDelays.forEach((delay, idx) => {
          if (delay < SPIN_DURATION_MS) {
            setTimeout(() => {
              // Ticks finais mais agudos para suspense
              const isFinal = delay > 4500
              playTickSound(isFinal)
            }, delay)
          }
        })

        // 5. Finalização do giro e modal de premiação
        setTimeout(() => {
          setIsSpinning(false)
          playWinSound()
          setModalOpen(true)
        }, SPIN_DURATION_MS + 250)
      }, 60)
    } catch (err) {
      console.error('[Roulette] Falha ao girar:', err)
      setIsSpinning(false)
      toast.error("Erro de conexão ao processar o giro.")
    }
  }

  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <div className="w-full bg-white border border-neutral-200 rounded-2xl p-4 sm:p-8 shadow-sm relative overflow-hidden text-neutral-900">
      {/* Background Decorativo Gamer / Roblox em tons claros */}
      <div className="absolute inset-0 bg-[radial-gradient(#48B9FA_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#48B9FA]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar da Roleta: Saldo e Som */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#48B9FA]/10 border border-[#48B9FA]/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#0284c7]" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold block leading-tight">
              Roleta da Sorte
            </span>
            <span className="text-sm font-bold text-neutral-900">
              Ashens Store Blox Fruits
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Badge de Saldo de Giros */}
          <div className="bg-neutral-100 border border-neutral-200 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-2xs">
            <span className="text-xs text-neutral-500 font-medium">Seus giros:</span>
            <span className="text-base font-extrabold text-[#0284c7]">
              {isLoggedIn ? userSpins : 0}
            </span>
          </div>

          {/* Mudo / Som */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 transition-colors cursor-pointer"
            title={soundEnabled ? "Desativar sons" : "Ativar sons"}
            aria-label="Controle de Som"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#0284c7]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Container Principal da Roleta Horizontal */}
      <div className="relative my-6 select-none" ref={containerRef}>
        {/* Indicador Fixo Superior (Seta Dourada / Azul Apontando para Baixo) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-30 pointer-events-none flex flex-col items-center">
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-[#48B9FA] drop-shadow-[0_2px_8px_rgba(72,185,250,0.8)]" />
        </div>

        {/* Linha Guia Central Vertical */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-[#48B9FA] via-[#48B9FA]/60 to-[#48B9FA] z-20 pointer-events-none shadow-[0_0_10px_#48B9FA]" />

        {/* Indicador Fixo Inferior (Seta Dourada / Azul Apontando para Cima) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 z-30 pointer-events-none flex flex-col items-center">
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-[#48B9FA] drop-shadow-[0_-2px_8px_rgba(72,185,250,0.8)]" />
        </div>

        {/* Efeito de Gradiente de Sombra nas Laterais em Branco */}
        <div className="absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-neutral-50 via-neutral-50/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-neutral-50 via-neutral-50/80 to-transparent z-10 pointer-events-none" />

        {/* A Esteira de Cards */}
        <div className="overflow-hidden py-4 rounded-xl bg-neutral-50 border border-neutral-200">
          <div
            ref={trackRef}
            className="flex items-center"
            style={{
              transform: `translateX(${translateX}px)`,
              transition: transitionStyle,
              willChange: 'transform',
            }}
          >
            {slots.map((prize, index) => {
              // Estilo de raridade prioritariamente pelo campo rarity, com fallback na probabilidade
              const prob = Number(prize.probability) || 1
              const rarity = prize.rarity || (
                prob <= 3 ? 'mythic' : prob <= 10 ? 'legendary' : prob <= 25 ? 'rare' : 'common'
              )
              const isMythic = rarity === 'mythic'
              const isLegendary = rarity === 'legendary'
              const isEpic = rarity === 'epic'
              const isRare = rarity === 'rare'

              const borderColor = isMythic
                ? 'border-amber-400/90 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white shadow-[0_0_14px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/40'
                : isLegendary
                ? 'border-purple-400/80 bg-gradient-to-b from-purple-500/10 via-purple-500/5 to-white shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                : isEpic
                ? 'border-pink-400/70 bg-gradient-to-b from-pink-500/10 via-pink-500/5 to-white shadow-[0_0_10px_rgba(236,72,153,0.1)]'
                : isRare
                ? 'border-blue-400/80 bg-gradient-to-b from-blue-500/10 via-blue-500/5 to-white'
                : 'border-neutral-200 bg-white'

              const rarityLabel = isMythic
                ? 'MÍTICO'
                : isLegendary
                ? 'LENDÁRIO'
                : isEpic
                ? 'ÉPICO'
                : isRare
                ? 'RARO'
                : 'COMUM'

              const rarityTextColor = isMythic
                ? 'text-amber-600 font-black tracking-wide'
                : isLegendary
                ? 'text-purple-600 font-black tracking-wide'
                : isEpic
                ? 'text-pink-600 font-bold'
                : isRare
                ? 'text-[#0284c7] font-bold'
                : 'text-neutral-500 font-semibold'

              return (
                <div
                  key={`${prize.id}-${index}`}
                  className={`shrink-0 w-[118px] sm:w-[150px] h-[160px] sm:h-[190px] mx-[5px] sm:mx-[7px] rounded-xl border p-2.5 sm:p-3 flex flex-col items-center justify-between relative transition-transform shadow-2xs ${borderColor}`}
                >
                  {/* Topo do Card: Raridade e % */}
                  <div className="w-full flex items-center justify-between text-[10px] sm:text-[11px] font-semibold">
                    <span className={rarityTextColor}>
                      {rarityLabel}
                    </span>
                    <span className="text-neutral-500 font-mono text-[10px] sm:text-xs">
                      {prize.probability}%
                    </span>
                  </div>

                  {/* Imagem do Item em Container Fixo Rigoroso */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center my-auto overflow-hidden">
                    <img
                      src={prize.image_url}
                      alt={prize.name}
                      className="w-full h-full object-contain drop-shadow-sm transition-transform duration-200 hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Nome do Item */}
                  <p className="text-[11px] sm:text-xs font-semibold text-center text-neutral-900 line-clamp-1 w-full" title={prize.name}>
                    {prize.name}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Ação Principal: Botão GIRAR */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
        <Button
          onClick={handleStartSpin}
          disabled={isSpinning}
          className={`h-14 px-10 rounded-xl text-base sm:text-lg font-black tracking-wide uppercase transition-all transform shadow-xl cursor-pointer ${
            isSpinning
              ? 'bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#48B9FA] via-[#20a6f5] to-blue-600 hover:from-[#3caaf0] hover:to-blue-700 text-white hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(72,185,250,0.5)]'
          }`}
        >
          {isSpinning ? (
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sorteando Prêmio...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Play className="w-5 h-5 fill-current" />
              <span>Girar Roleta (1 Giro)</span>
            </div>
          )}
        </Button>
      </div>

      {/* Aviso quando sem giros */}
      {isLoggedIn && userSpins === 0 && !isSpinning && (
        <div className="mt-4 inline-flex items-center justify-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200/80 px-4 py-2 rounded-lg mx-auto shadow-2xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Você está sem giros. Resgate um código abaixo ou adquira novos giros!</span>
        </div>
      )}

      {/* Modal de Premiação */}
      <PrizeResultModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        prize={winningPrize}
        spinId={currentSpinId}
      />
    </div>
  )
}
