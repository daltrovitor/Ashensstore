"use client"

import { useState } from "react"
import { History, Sparkles, Check, Copy, ExternalLink, ShieldCheck, Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { RouletteSpinRecord } from "@/lib/roulette/types"
import { FaDiscord } from "react-icons/fa"

interface UserSpinsHistoryProps {
  history: RouletteSpinRecord[]
  isLoggedIn: boolean
  userSpins: number
  onOpenAuth?: () => void
  onClaimSuccess?: () => void
}

export function UserSpinsHistory({
  history,
  isLoggedIn,
  userSpins,
  onOpenAuth,
  onClaimSuccess,
}: UserSpinsHistoryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const handleCopy = (spinId: string) => {
    navigator.clipboard.writeText(spinId)
    setCopiedId(spinId)
    toast.success("ID do giro copiado!")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleClaim = async (spinId: string) => {
    setClaimingId(spinId)
    try {
      const res = await fetch('/api/roulette/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spinId }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || "Recompensa resgatada com sucesso!")
        if (onClaimSuccess) onClaimSuccess()
      } else {
        toast.error(data.error || "Erro ao resgatar recompensa.")
      }
    } catch {
      toast.error("Erro de conexão.")
    } finally {
      setClaimingId(null)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-neutral-50 border border-dashed border-neutral-300 rounded-2xl p-8 text-center space-y-3">
        <History className="w-8 h-8 text-neutral-400 mx-auto" />
        <h3 className="text-base font-bold text-neutral-900">
          Acesse sua conta para ver seus giros
        </h3>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
          Faça login para acompanhar suas vitórias anteriores, resgatar prêmios pendentes e ver seus giros disponíveis.
        </p>
        <Button
          onClick={onOpenAuth}
          className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-medium text-xs px-5 h-9 rounded-md shadow-xs cursor-pointer"
        >
          Entrar ou Criar Conta
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#48B9FA]/10 border border-[#48B9FA]/20 flex items-center justify-center text-[#48B9FA]">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Meus Últimos Giros
            </h2>
            <p className="text-xs text-neutral-500">
              Histórico pessoal de prêmios conquistados na roleta.
            </p>
          </div>
        </div>

        <div className="bg-[#48B9FA]/10 border border-[#48B9FA]/30 text-[#0284c7] font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-2 self-start sm:self-auto">
          <span>Giros Disponíveis:</span>
          <span className="text-sm font-black text-[#0284c7]">{userSpins}</span>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-8 text-center text-neutral-500 text-xs">
          Você ainda não realizou nenhum giro na roleta. Use um código ou adquira giros para começar!
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Prêmio Ganho</th>
                  <th className="py-3 px-4">ID do Giro</th>
                  <th className="py-3 px-4">Forma de Resgate</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-800">
                {history.map((spin) => {
                  const isDelivered = spin.claim_status === 'delivered'
                  const isClaimed = spin.claim_status === 'claimed'
                  const isPending = spin.claim_status === 'pending'

                  const formattedDate = new Date(spin.created_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  return (
                    <tr key={spin.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-neutral-500 font-mono text-[11px]">
                        {formattedDate}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-md bg-neutral-100 border border-neutral-200 p-1 flex items-center justify-center shrink-0">
                            <img
                              src={spin.prize_image}
                              alt={spin.prize_name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="font-bold text-neutral-900 line-clamp-1">{spin.prize_name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleCopy(spin.spin_id)}
                          className="font-mono text-xs font-semibold text-neutral-600 hover:text-black flex items-center gap-1.5 cursor-pointer"
                          title="Clique para copiar"
                        >
                          <span>{spin.spin_id}</span>
                          {copiedId === spin.spin_id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-neutral-400" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {spin.redemption_type === 'automatic' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" /> Automático
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5865F2] bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                            <FaDiscord className="w-3 h-3" /> Ticket Discord
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {isDelivered ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Entregue
                          </span>
                        ) : isClaimed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Resgatado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                            Pendente
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        {isPending ? (
                          spin.redemption_type === 'automatic' ? (
                            <Button
                              size="sm"
                              disabled={claimingId === spin.spin_id}
                              onClick={() => handleClaim(spin.spin_id)}
                              className="h-7 px-2.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                            >
                              {claimingId === spin.spin_id ? "Resgatando..." : "Resgatar"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `Olá suporte! Ganhei o prêmio "${spin.prize_name}" na Roleta. ID do Giro: ${spin.spin_id}`
                                )
                                toast.info("ID e texto copiados! Abrindo Discord...")
                                window.open("https://discord.gg/gVVd46ZGKH", "_blank")
                              }}
                              className="h-7 px-2.5 text-[11px] font-semibold bg-[#5865F2] hover:bg-[#4752C4] text-white rounded gap-1 cursor-pointer"
                            >
                              <FaDiscord className="w-3 h-3" />
                              <span>Abrir Ticket</span>
                            </Button>
                          )
                        ) : (
                          <span className="text-[11px] text-neutral-400 font-medium">Finalizado</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
