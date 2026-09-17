"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Copy, Sparkles, ExternalLink, ShieldCheck, HelpCircle } from "lucide-react"
import { FaDiscord } from "react-icons/fa"
import { toast } from "sonner"
import type { RoulettePrize, ClaimStatus } from "@/lib/roulette/types"

interface PrizeResultModalProps {
  isOpen: boolean
  onClose: () => void
  prize: RoulettePrize | null
  spinId: string | null
  onClaimSuccess?: () => void
}

export function PrizeResultModal({
  isOpen,
  onClose,
  prize,
  spinId,
  onClaimSuccess,
}: PrizeResultModalProps) {
  const [copied, setCopied] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimedStatus, setClaimedStatus] = useState<ClaimStatus | null>(null)

  if (!prize) return null

  const handleCopySpinId = () => {
    if (!spinId) return
    navigator.clipboard.writeText(spinId)
    setCopied(true)
    toast.success("ID do giro copiado com sucesso!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClaimAutomatic = async () => {
    if (!spinId) return
    setClaiming(true)
    try {
      const res = await fetch('/api/roulette/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spinId }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setClaimedStatus('claimed')
        toast.success(data.message || "Recompensa resgatada com sucesso!")
        if (onClaimSuccess) onClaimSuccess()
      } else {
        toast.error(data.error || "Erro ao resgatar recompensa.")
      }
    } catch {
      toast.error("Erro de conexão ao resgatar.")
    } finally {
      setClaiming(false)
    }
  }

  const handleOpenDiscord = () => {
    if (spinId) {
      navigator.clipboard.writeText(
        `Olá suporte Ashens! Ganhei o prêmio "${prize.name}" na Roleta Ashens. Meu ID do Giro é: ${spinId}`
      )
      toast.info("Mensagem e ID do giro copiados! Cole no ticket do Discord.")
    }
    window.open("https://discord.gg/gVVd46ZGKH", "_blank")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white border border-neutral-200 rounded-xl shadow-2xl">
        {/* Banner com gradiente elegante */}
        <div className="relative bg-gradient-to-b from-[#48B9FA]/20 via-[#48B9FA]/5 to-transparent pt-8 pb-4 px-6 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className="w-28 h-28 mx-auto relative mb-4 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-[#48B9FA]/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-full h-full bg-white rounded-2xl border-2 border-[#48B9FA]/40 shadow-lg p-3 flex items-center justify-center">
              <img
                src={prize.image_url}
                alt={prize.name}
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
          </motion.div>

          <span className="inline-flex items-center gap-1 bg-[#48B9FA] text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase shadow-xs mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Parabéns!
          </span>

          <DialogTitle className="text-2xl font-bold text-neutral-900 tracking-tight">
            Você ganhou:
          </DialogTitle>
          <p className="text-xl font-extrabold text-[#0284c7] mt-0.5">
            {prize.name}
          </p>
          {prize.description && (
            <p className="text-xs text-neutral-500 mt-2 max-w-sm mx-auto leading-relaxed">
              {prize.description}
            </p>
          )}
        </div>

        {/* Informações do Giro e Resgate */}
        <div className="p-6 pt-2 space-y-4">
          {/* Card com ID do Giro */}
          {spinId && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400 block">
                  Identificador do Giro
                </span>
                <span className="font-mono text-xs font-bold text-neutral-800">
                  {spinId}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium gap-1.5 border-neutral-300 hover:bg-neutral-100"
                onClick={handleCopySpinId}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            </div>
          )}

          {/* Opções de Resgate */}
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <p className="text-xs font-semibold text-neutral-700 text-center uppercase tracking-wider">
              Como deseja receber sua recompensa?
            </p>

            {prize.redemption_type === 'automatic' ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Entrega Instantânea Disponível</strong>
                    <span>{prize.delivery_info || "Seu prêmio é entregue de forma 100% automática."}</span>
                  </div>
                </div>

                {claimedStatus === 'claimed' ? (
                  <div className="p-3 bg-neutral-100 border border-neutral-200 rounded-lg text-center text-xs font-semibold text-neutral-700">
                    ✅ Recompensa Resgatada! Verifique seu histórico ou chat.
                  </div>
                ) : (
                  <Button
                    onClick={handleClaimAutomatic}
                    disabled={claiming}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                  >
                    {claiming ? "Processando entrega..." : "Resgatar Automaticamente"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-[#48B9FA] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Entrega com Suporte via Discord</strong>
                    <span>
                      {prize.delivery_info || "Sua recompensa precisa ser entregue manualmente pela equipe Ashens no servidor VIP."}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleOpenDiscord}
                  className="w-full h-11 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm shadow-md transition-all gap-2 cursor-pointer"
                >
                  <FaDiscord className="w-4 h-4" />
                  <span>Resgatar pelo Discord</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </Button>
              </div>
            )}
          </div>

          <div className="pt-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-neutral-500 hover:text-neutral-900"
            >
              Fechar e Continuar Girando
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
