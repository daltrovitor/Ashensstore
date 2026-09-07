import Link from "next/link"
import Image from "next/image"
import { ShieldCheck, Zap, MessageSquare } from "lucide-react"
import { FaDiscord, FaWhatsapp, FaInstagram } from "react-icons/fa"

export function Footer() {
  return (
    <footer className="bg-white text-neutral-600 border-t border-neutral-200 pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Col - Apenas a Logo Grande */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="inline-block group">
              <Image
                src="/ashens-logo.jpg"
                alt="Ashens Store"
                width={200}
                height={60}
                className="object-contain h-14 sm:h-16 w-auto"
              />
            </Link>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Sua loja especializada em Blox Fruits! Frutas Míticas, Gamepasses e Contas exclusivas com entrega 100% segura via PIX e atendimento em tempo real pelo chat integrado.
            </p>
            <div className="flex gap-2 pt-1">
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-md bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                aria-label="Discord"
              >
                <FaDiscord className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-md bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-pink-600 hover:border-pink-300 hover:bg-pink-50/50 transition-all"
                aria-label="Instagram"
              >
                <FaInstagram className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-md bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
                aria-label="WhatsApp"
              >
                <FaWhatsapp className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Categorias */}
          <div>
            <h4 className="font-semibold uppercase tracking-wider text-xs text-neutral-900 mb-4">
              Catálogo Blox Fruits
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-600">
              <li>
                <Link href="/loja?categoryId=frutas" className="hover:text-blue-600 transition-colors">
                  🍏 Frutas Físicas & Míticas
                </Link>
              </li>
              <li>
                <Link href="/loja?categoryId=gamepasses" className="hover:text-blue-600 transition-colors">
                  ⚡ Gamepasses (2x Mastery, Money, etc.)
                </Link>
              </li>
              <li>
                <Link href="/loja?categoryId=contas" className="hover:text-blue-600 transition-colors">
                  ⚔️ Contas Level Máximo & PVP
                </Link>
              </li>
              <li>
                <Link href="/loja?categoryId=racas" className="hover:text-blue-600 transition-colors">
                  🌟 Raças V4 Full Gear
                </Link>
              </li>
              <li>
                <Link href="/loja?featured=true" className="hover:text-blue-600 transition-colors">
                  🔥 Mais Populares & Destaques
                </Link>
              </li>
            </ul>
          </div>

          {/* Central do Comprador */}
          <div>
            <h4 className="font-semibold uppercase tracking-wider text-xs text-neutral-900 mb-4">
              Atendimento & Pedidos
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-600">
              <li>
                <Link href="/pedidos" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Acompanhar Pedido & Chat</span>
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-blue-600 transition-colors">
                  🛒 Finalizar Compra
                </Link>
              </li>
              <li>
                <span className="text-neutral-500">
                  ⚡ Horário de Entrega: 08:00 às 00:00 (Segunda a Domingo)
                </span>
              </li>
              <li>
                <span className="text-neutral-500">
                  🎮 Entrega via Servidor VIP Roblox
                </span>
              </li>
            </ul>
          </div>

          {/* Pagamento Seguro PIX */}
          <div className="space-y-4">
            <h4 className="font-semibold uppercase tracking-wider text-xs text-neutral-900">
              Pagamento 100% via PIX
            </h4>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Aprovação Instantânea via PIX</span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Pague de forma ágil e segura com QR Code dinâmico gerado diretamente no checkout.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-600">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Sem taxas adicionais • Liberação imediata</span>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer Roblox & Copyright */}
        <div className="border-t border-neutral-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-neutral-500">
          <p className="text-center md:text-left leading-relaxed max-w-2xl">
            © {new Date().getFullYear()} Ashens Store. Todos os direitos reservados. Não possuímos afiliação direta com a Roblox Corporation ou Blox Fruits. Todas as marcas registradas pertencem aos seus respectivos proprietários.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-blue-600 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-600" /> Entrega Rápida & Garantida
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
