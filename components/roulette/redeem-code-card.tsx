"use client"

import { useState } from "react"
import { KeyRound, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface RedeemCodeCardProps {
  isLoggedIn: boolean
  onRedeemSuccess?: (spinsAdded: number, newBalance: number) => void
  onOpenAuth?: () => void
}

export function RedeemCodeCard({
  isLoggedIn,
  onRedeemSuccess,
  onOpenAuth,
}: RedeemCodeCardProps) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [lastRedeemed, setLastRedeemed] = useState<number | null>(null)

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoggedIn) {
      toast.error("Você precisa estar conectado à sua conta para resgatar giros.")
      if (onOpenAuth) onOpenAuth()
      return
    }

    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      toast.error("Por favor, digite o código de giro.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/roulette/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || "Código inválido ou já utilizado.")
        return
      }

      toast.success(data.message || `Parabéns! ${data.spinsAdded} giros adicionados!`)
      setLastRedeemed(data.spinsAdded)
      setCode("")

      if (onRedeemSuccess) {
        onRedeemSuccess(data.spinsAdded, data.newBalance)
      }
    } catch {
      toast.error("Erro de conexão ao tentar resgatar o código.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-7 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#48B9FA]/10 border border-[#48B9FA]/20 flex items-center justify-center text-[#48B9FA]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
              Resgatar Giro
            </h3>
            <p className="text-xs text-neutral-500">
              Digite o código que você recebeu na compra ou em eventos promocionais.
            </p>
          </div>
        </div>

        {lastRedeemed && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>+{lastRedeemed} giros resgatados recentemente!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleRedeem} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ex: ASHEN-XXXX-XXXX-XXXX"
            className="h-12 uppercase tracking-widest font-mono text-sm px-4 bg-neutral-50 border-neutral-300 focus:bg-white focus:border-[#48B9FA]"
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !code.trim()}
          className="h-12 px-8 bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-bold text-sm rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>RESGATAR</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
