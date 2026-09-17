"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Zap, Check, QrCode, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useCart } from "@/hooks/use-shopping-cart"
import { PixQrCode } from "@/components/ecommerce/pix-qr-code"
import { toast } from "sonner"

interface BuySpinsSectionProps {
  spinPrice?: number
  userEmail?: string
  userName?: string
}

export function BuySpinsSection({
  spinPrice = 5.0,
  userEmail = "",
  userName = "",
}: BuySpinsSectionProps) {
  const router = useRouter()
  const { addItem, openCart } = useCart()

  // Estado do Modal de Compra Rápida PIX
  const [pixModalOpen, setPixModalOpen] = useState(false)
  const [selectedSpins, setSelectedSpins] = useState<number>(5)
  const [name, setName] = useState(userName)
  const [email, setEmail] = useState(userEmail)
  const [robloxUsername, setRobloxUsername] = useState("")
  const [phone, setPhone] = useState("")
  const [isGeneratingPix, setIsGeneratingPix] = useState(false)
  const [activePixOrder, setActivePixOrder] = useState<{
    orderId: string
    pixCode: string
    amount: number
  } | null>(null)

  const unitPrice = Number(spinPrice) > 0 ? Number(spinPrice) : 5.0

  // Pacotes pré-definidos baseados no preço configurado pelo admin
  const packages = [
    {
      id: "giro-roleta-1",
      name: "1 Giro da Roleta",
      spins: 1,
      price: unitPrice,
      description: "1 tentativa na Roleta da Sorte Ashens.",
    },
    {
      id: "giro-roleta-5",
      name: "5 Giros da Roleta",
      spins: 5,
      price: Math.round(unitPrice * 5 * 0.85 * 100) / 100, // 15% OFF
      oldPrice: unitPrice * 5,
      isPopular: true,
      badge: "MAIS POPULAR (-15%)",
      description: "Pacote intermediário com 15% de desconto.",
    },
    {
      id: "giro-roleta-10",
      name: "10 Giros da Roleta",
      spins: 10,
      price: Math.round(unitPrice * 10 * 0.80 * 100) / 100, // 20% OFF
      oldPrice: unitPrice * 10,
      badge: "MELHOR VALOR (-20%)",
      description: "Maior chance de tirar Frutas Míticas com 20% de desconto.",
    },
  ]

  // Calcula valor dinâmico para qualquer quantidade no modal
  const calculateModalPrice = (spins: number) => {
    let total = unitPrice * spins
    if (spins >= 10) total *= 0.80
    else if (spins >= 5) total *= 0.85
    else if (spins >= 3) total *= 0.90
    return Math.round(total * 100) / 100
  }

  const handleOpenPixModal = (spins: number) => {
    setSelectedSpins(spins)
    setActivePixOrder(null)
    if (userEmail && !email) setEmail(userEmail)
    if (userName && !name) setName(userName)
    setPixModalOpen(true)
  }

  const handleAddToCart = (pkg: typeof packages[0]) => {
    addItem({
      id: pkg.id,
      product_id: pkg.id,
      name: pkg.name,
      price: pkg.price,
      quantity: 1,
      image: '/ashens-logo.jpg',
    })
    toast.success(`${pkg.name} adicionado ao carrinho!`)
    openCart()
  }

  // Gera Pedido Direto PIX
  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Informe seu nome completo.")
      return
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error("Informe um e-mail válido para liberação dos giros.")
      return
    }
    if (!robloxUsername.trim()) {
      toast.error("Informe seu Nick do Roblox.")
      return
    }

    setIsGeneratingPix(true)
    try {
      const res = await fetch('/api/roulette/buy-spins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim() || undefined,
          robloxUsername: robloxUsername.trim(),
          spinsCount: selectedSpins,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("PIX gerado com sucesso!")
        setActivePixOrder({
          orderId: data.order.order_id,
          pixCode: data.pix_code,
          amount: data.order.total_amount,
        })
      } else {
        toast.error(data.error || "Erro ao gerar PIX.")
      }
    } catch {
      toast.error("Erro de conexão ao gerar pedido.")
    } finally {
      setIsGeneratingPix(false)
    }
  }

  const modalTotal = calculateModalPrice(selectedSpins)

  return (
    <div id="comprar-giros" className="space-y-6 scroll-mt-24">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#48B9FA]/10 border border-[#48B9FA]/20 flex items-center justify-center text-[#48B9FA]">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Comprar Giros da Roleta
            </h2>
            <p className="text-xs text-neutral-500">
              Preço oficial de R$ {unitPrice.toFixed(2).replace('.', ',')} por giro com descontos progressivos em pacotes!
            </p>
          </div>
        </div>

        <Button
          onClick={() => handleOpenPixModal(5)}
          className="bg-gradient-to-r from-[#48B9FA] to-blue-600 hover:from-[#3caaf0] hover:to-blue-700 text-white text-xs font-bold px-4 h-9 shadow-xs shrink-0 cursor-pointer"
        >
          <QrCode className="w-4 h-4 mr-1.5" /> Pagar com PIX Rápido
        </Button>
      </div>

      {/* Cards de Pacotes com Dimensões Padronizadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`bg-white border rounded-2xl p-6 flex flex-col justify-between relative transition-all duration-200 hover:shadow-lg ${
              pkg.isPopular
                ? 'border-[#48B9FA] ring-2 ring-[#48B9FA]/20 shadow-md'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            {pkg.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-xs ${
                  pkg.isPopular
                    ? 'bg-[#48B9FA] text-white'
                    : 'bg-neutral-900 text-amber-300'
                }`}>
                  {pkg.badge}
                </span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-base text-neutral-900">
                  {pkg.name}
                </h3>
                <span className="text-xs font-bold text-[#48B9FA] bg-[#48B9FA]/10 px-2.5 py-0.5 rounded-full">
                  {pkg.spins} {pkg.spins === 1 ? 'Giro' : 'Giros'}
                </span>
              </div>

              <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
                {pkg.description}
              </p>

              {/* Preço */}
              <div className="mb-6">
                {pkg.oldPrice && (
                  <span className="text-xs text-neutral-400 line-through block font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pkg.oldPrice)}
                  </span>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-neutral-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pkg.price)}
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">à vista no PIX</span>
                </div>
              </div>

              {/* Vantagens */}
              <ul className="space-y-2 text-xs text-neutral-600 mb-6 border-t border-neutral-100 pt-4">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Liberação rápida após confirmação do PIX</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Crédito automático no saldo do seu usuário</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Código de resgate reserva gerado</span>
                </li>
              </ul>
            </div>

            {/* Ações */}
            <div className="space-y-2">
              <Button
                onClick={() => handleOpenPixModal(pkg.spins)}
                className="w-full h-11 bg-gradient-to-r from-[#48B9FA] to-blue-600 hover:from-[#3caaf0] hover:to-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Pagar via PIX Instantâneo</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAddToCart(pkg)}
                className="w-full h-10 border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-medium text-xs rounded-lg cursor-pointer"
              >
                Adicionar à Sacola da Loja
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE COMPRA RÁPIDA VIA PIX */}
      <Dialog open={pixModalOpen} onOpenChange={setPixModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white border border-neutral-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#48B9FA]" />
              <span>Comprar Giros da Roleta via PIX</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Pagamento instantâneo. Assim que o pagamento for identificado, o administrador validará e seus giros serão creditados!
            </DialogDescription>
          </DialogHeader>

          {!activePixOrder ? (
            <form onSubmit={handleGeneratePix} className="space-y-4 py-2 text-xs">
              {/* Quantidade de Giros */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-700">Quantidade de Giros</Label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[1, 3, 5, 10].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant={selectedSpins === num ? 'default' : 'outline'}
                      size="sm"
                      className={`h-8 text-xs font-bold cursor-pointer ${
                        selectedSpins === num ? 'bg-[#48B9FA] hover:bg-[#20a6f5] text-white' : 'border-neutral-300'
                      }`}
                      onClick={() => setSelectedSpins(num)}
                    >
                      {num} {num === 1 ? 'Giro' : 'Giros'}
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={selectedSpins}
                  onChange={(e) => setSelectedSpins(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-9 text-xs font-bold"
                />
              </div>

              {/* Total a pagar */}
              <div className="bg-[#48B9FA]/10 border border-[#48B9FA]/20 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-neutral-600 font-medium block">Total do Pedido:</span>
                  <span className="text-lg font-black text-neutral-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(modalTotal)}
                  </span>
                </div>
                {selectedSpins >= 5 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Desconto Aplicado!
                  </span>
                )}
              </div>

              {/* Nome */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-700">Seu Nome Completo</Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome e Sobrenome"
                  className="h-9 text-xs"
                />
              </div>

              {/* E-mail */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-700">Seu E-mail</Label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu-email@gmail.com"
                  className="h-9 text-xs"
                />
              </div>

              {/* Nick do Roblox */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-700">Nick do Roblox</Label>
                <Input
                  required
                  value={robloxUsername}
                  onChange={(e) => setRobloxUsername(e.target.value)}
                  placeholder="Ex: VitorBlox123"
                  className="h-9 text-xs"
                />
              </div>

              {/* WhatsApp (Opcional) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-700">WhatsApp / Telefone (Opcional)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(DDD) 99999-9999"
                  className="h-9 text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={isGeneratingPix}
                className="w-full h-11 bg-gradient-to-r from-[#48B9FA] to-blue-600 hover:from-[#3caaf0] hover:to-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm cursor-pointer mt-2"
              >
                {isGeneratingPix ? "Gerando PIX..." : "Gerar QR Code PIX Agora"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 py-2">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pedido <strong>{activePixOrder.orderId}</strong> gerado! Efetue o pagamento abaixo.</span>
              </div>

              <PixQrCode
                pixCode={activePixOrder.pixCode}
                amount={activePixOrder.amount}
                orderId={activePixOrder.orderId}
              />

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-600 space-y-1">
                <p className="font-semibold text-neutral-900">Como funciona a liberação:</p>
                <p>1. Abra o app do seu banco e pague com o QR Code ou o Copia e Cola.</p>
                <p>2. Assim que o pagamento cair, o administrador confirmará o pedido.</p>
                <p>3. Os <strong>{selectedSpins} giros</strong> serão liberados automaticamente no seu saldo na roleta!</p>
              </div>

              <Button
                variant="outline"
                onClick={() => setPixModalOpen(false)}
                className="w-full text-xs font-bold"
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
