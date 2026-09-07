"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface StoreLoaderProps {
  isLoading: boolean
  minDurationMs?: number
  onFinish?: () => void
}

const LOADING_STEPS = [
  "Iniciando Ashens Store...",
  "Carregando catálogo de Blox Fruits...",
  "Sincronizando Frutas Míticas & Gamepasses...",
  "Preparando ambiente seguro...",
  "Tudo pronto!",
]

export function StoreLoader({
  isLoading,
  minDurationMs = 1800,
  onFinish,
}: StoreLoaderProps) {
  const [progress, setProgress] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  const [shouldRender, setShouldRender] = useState(true)

  // Controle do tempo mínimo
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true)
    }, minDurationMs)

    return () => clearTimeout(timer)
  }, [minDurationMs])

  // Animação contínua do progresso (0 a 100%)
  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const calculatedProgress = Math.min(
        100,
        Math.floor((elapsed / minDurationMs) * 100)
      )

      setProgress(calculatedProgress)

      // Atualiza o texto dos passos com base no progresso
      const step = Math.min(
        LOADING_STEPS.length - 1,
        Math.floor((calculatedProgress / 100) * LOADING_STEPS.length)
      )
      setStepIndex(step)

      if (calculatedProgress >= 100) {
        clearInterval(interval)
      }
    }, 25)

    return () => clearInterval(interval)
  }, [minDurationMs])

  // Desmonta quando ambos (tempo mínimo e carregamento de dados) terminarem
  useEffect(() => {
    if (minTimeElapsed && !isLoading && progress >= 100) {
      const finishTimer = setTimeout(() => {
        setShouldRender(false)
        if (onFinish) onFinish()
      }, 350)
      return () => clearTimeout(finishTimer)
    }
  }, [minTimeElapsed, isLoading, progress, onFinish])

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          key="store-loader-screen"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.02,
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white text-neutral-900 select-none overflow-hidden"
        >
          {/* Elementos geométricos sutis de fundo */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.08, 0.18, 0.08],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-[500px] h-[500px] rounded-full bg-[#48B9FA]/20 blur-3xl"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center px-6 max-w-sm w-full text-center">
            {/* Logo com anel animado */}
            <div className="relative mb-6">
              {/* Anel de Pulso */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.4, 0.9, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -inset-3 rounded-2xl border-2 border-[#48B9FA]/40 pointer-events-none"
              />

              {/* Anel giratório sutil */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute -inset-1.5 rounded-xl border border-dashed border-[#48B9FA]/30 pointer-events-none"
              />

              {/* Container da Imagem da Logo */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white border border-neutral-200 p-2 shadow-xs flex items-center justify-center overflow-hidden"
              >
                <Image
                  src="/ashens-logo.jpg"
                  alt="Ashens Store"
                  width={112}
                  height={112}
                  priority
                  className="object-contain w-full h-full"
                />
              </motion.div>
            </div>

            {/* Nome da Marca */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="mb-6 space-y-1"
            >
              <h2 className="text-xl font-bold tracking-[0.2em] uppercase text-neutral-900">
                Ashens Store
              </h2>
              <p className="text-xs font-semibold tracking-[0.18em] text-[#48B9FA] uppercase">
                Roblox Blox Fruits
              </p>
            </motion.div>

            {/* Barra de Progresso */}
            <div className="w-full space-y-2 mb-3">
              <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/80">
                <motion.div
                  className="h-full bg-[#48B9FA] rounded-full relative"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                >
                  {/* Ponto de luz no final da barra */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-xs" />
                </motion.div>
              </div>

              {/* Porcentagem */}
              <div className="flex justify-between items-center text-[11px] text-neutral-500 font-mono">
                <span>Carregando</span>
                <span className="font-semibold text-neutral-800">{progress}%</span>
              </div>
            </div>

            {/* Texto de Status Alternante */}
            <div className="h-5 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={stepIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-neutral-500 font-medium tracking-tight"
                >
                  {LOADING_STEPS[stepIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
