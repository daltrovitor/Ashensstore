import { FaDiscord } from "react-icons/fa"
import { ArrowUpRight, Gift, ShieldCheck, Users } from "lucide-react"

export function DiscordCta() {
  return (
    <section className="py-10 sm:py-12 border-t border-neutral-200 bg-neutral-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-white border border-neutral-200 rounded-sm p-6 sm:p-10 shadow-xs">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#5865F2]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            {/* Left Info Column */}
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#5865F2] uppercase tracking-wider">
                <FaDiscord className="w-4 h-4 text-[#5865F2]" />
                <span>Comunidade Oficial no Discord</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                  Faça Parte do Nosso Servidor no Discord
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Conecte-se com nossa comunidade de Blox Fruits, tire dúvidas sobre entregas, participe de sorteios de frutas míticas e receba suporte prioritário em tempo real.
                </p>
              </div>

              {/* Benefícios / Perks: Apenas ícones limpos sem balões */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="flex items-center gap-2 text-xs text-neutral-700 font-medium">
                  <Gift className="w-4 h-4 text-[#5865F2] shrink-0" />
                  <span>Sorteios de Frutas & Itens</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-700 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Suporte & Servidor VIP</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-700 font-medium">
                  <Users className="w-4 h-4 text-[#48B9FA] shrink-0" />
                  <span>Trades & Comunidade Ativa</span>
                </div>
              </div>
            </div>

            {/* Right Action Column */}
            <div className="w-full lg:w-auto flex flex-col items-start lg:items-end gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Servidor Aberto • Entre Agora</span>
              </div>

              <a
                href="https://discord.gg/gVVd46ZGKH"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto h-11 sm:h-12 px-8 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs sm:text-sm rounded-sm transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.02]"
              >
                <FaDiscord className="w-5 h-5" />
                <span>Entrar no Servidor do Discord</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>

              <span className="text-[11px] text-neutral-400 font-mono">
                discord.gg/gVVd46ZGKH
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
