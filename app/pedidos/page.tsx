"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  MessageSquare,
  QrCode,
  Gamepad2,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  ArrowLeft
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { OrderChat } from "@/components/chat/order-chat"
import { PixQrCode } from "@/components/ecommerce/pix-qr-code"
import { generatePixPayload, COMPANY_PIX_DATA } from "@/lib/pix/brcode"

interface OrderItem {
  id?: string
  name: string
  quantity: number
  unit_price: number
  total_price?: number
}

interface Order {
  id: string
  external_id: string
  status: string
  payment_status?: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  shipping_address?: any
  total: number
  created_at: string
  items?: OrderItem[]
}

const ORDER_STEPS = [
  { key: "PENDING_PAYMENT", label: "Aguardando PIX", icon: Clock },
  { key: "PAID", label: "Pagamento Aprovado", icon: CheckCircle2 },
  { key: "IN_PRODUCTION", label: "Em Preparação", icon: Package },
  { key: "SHIPPED", label: "Em Entrega no Jogo", icon: Truck },
  { key: "DELIVERED", label: "Entregue com Sucesso", icon: CheckCircle2 },
]

function getStepIndex(status: string): number {
  if (status === 'CONFIRMED') return 1
  const idx = ORDER_STEPS.findIndex(s => s.key === status)
  return idx >= 0 ? idx : 0
}

function OrdersContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [pixModalOpen, setPixModalOpen] = useState(false)
  const [activePixPayload, setActivePixPayload] = useState<string>("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const urlOrderId = searchParams.get('order_id') || searchParams.get('orderId') || searchParams.get('id')

  const prevStatusRef = useRef<Record<string, string>>({})

  const fetchOrders = async (queryId?: string, isSilent = false) => {
    try {
      if (!isSilent) setLoading(true)
      const targetId = queryId || urlOrderId

      if (targetId) {
        // Busca pedido específico por ID
        const res = await fetch(`/api/orders/${targetId}/chat`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data.order) {
            const ord = data.order
            const prev = prevStatusRef.current[ord.id] || prevStatusRef.current[ord.external_id]
            if (prev && prev === 'PENDING_PAYMENT' && (ord.status === 'PAID' || ord.status === 'CONFIRMED')) {
              toast.success("🎉 Pagamento confirmado pelo vendedor! A entrega dos seus itens foi liberada.")
            }
            prevStatusRef.current[ord.id] = ord.status
            prevStatusRef.current[ord.external_id] = ord.status

            setOrders([ord])
            setSelectedOrder(ord)
          }
        } else if (!isSilent) {
          toast.error("Pedido não encontrado")
        }
      } else if (user?.email) {
        // Busca pedidos do usuário logado
        const res = await fetch('/api/user/orders', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const list: Order[] = data.orders || []
          list.forEach((ord) => {
            const prev = prevStatusRef.current[ord.id] || prevStatusRef.current[ord.external_id]
            if (prev && prev === 'PENDING_PAYMENT' && (ord.status === 'PAID' || ord.status === 'CONFIRMED')) {
              toast.success(`🎉 Pagamento do pedido #${ord.external_id} confirmado pelo vendedor!`)
            }
            prevStatusRef.current[ord.id] = ord.status
            prevStatusRef.current[ord.external_id] = ord.status
          })
          setOrders(list)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()

    // Polling ativo a cada 5 segundos para refletir confirmação de pagamento imediatamente
    const interval = setInterval(() => {
      fetchOrders(undefined, true)
    }, 5000)

    return () => clearInterval(interval)
  }, [user, urlOrderId])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchInput.trim()) return
    router.push(`/pedidos?order_id=${searchInput.trim()}`)
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success("Copiado para a área de transferência!")
    setTimeout(() => setCopiedId(null), 2500)
  }

  const openPixForOrder = (order: Order) => {
    const cleanTxid = order.external_id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25)
    const code = generatePixPayload({
      key: COMPANY_PIX_DATA.key,
      name: COMPANY_PIX_DATA.name,
      city: COMPANY_PIX_DATA.city,
      amount: Number(order.total),
      txid: cleanTxid,
    })
    setActivePixPayload(code)
    setSelectedOrder(order)
    setPixModalOpen(true)
  }

  const openChatForOrder = (order: Order) => {
    setSelectedOrder(order)
    setChatOpen(true)
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const formatDate = (iso: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' às ' +
           d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-5xl flex-1">
        {/* Header da Página */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">
              <Gamepad2 className="w-4 h-4 text-[#48B9FA]" />
              <span>Central do Comprador Ashens Store</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">Meus Pedidos & Entregas</h1>
            <p className="text-neutral-500 text-xs sm:text-sm mt-1">
              Acompanhe o status em tempo real e converse com o vendedor para receber seus itens.
            </p>
          </div>

          {/* Busca de Pedido por Código */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por ORD-..."
                className="pl-9 bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 rounded-md text-xs h-10 focus:border-[#48B9FA]"
              />
            </div>
            <Button
              type="submit"
              className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-medium text-xs h-10 px-4 rounded-md shrink-0 cursor-pointer shadow-xs"
            >
              Buscar
            </Button>
          </form>
        </div>

        {/* Lista de Pedidos */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#48B9FA]"></div>
            <p className="text-sm">Carregando pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 border border-neutral-200 rounded-lg bg-neutral-50/50 p-8 space-y-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#48B9FA] flex items-center justify-center mx-auto border border-blue-100">
              <Package className="w-7 h-7 text-[#48B9FA]" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">Nenhum pedido localizado</h3>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
              Você pode buscar um pedido digitando o código (ex: ORD-...) no campo de busca acima ou explorando nossa loja.
            </p>
            <Button
              onClick={() => router.push('/loja')}
              className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-medium text-xs h-10 px-6 rounded-md cursor-pointer shadow-xs"
            >
              Explorar Catálogo Blox Fruits
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const currentStep = getStepIndex(order.status)
              const shippingData = (typeof order.shipping_address === 'object' && order.shipping_address) ? order.shipping_address : {}
              const robloxNick = shippingData.roblox_username || order.customer_name

              return (
                <div
                  key={order.id}
                  className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg p-6 shadow-xs space-y-6 transition-all"
                >
                  {/* Topo do Card: ID, Data, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-neutral-900">{order.external_id}</span>
                        <button
                          onClick={() => handleCopy(order.external_id, order.external_id)}
                          title="Copiar ID do Pedido"
                          className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-900 transition cursor-pointer"
                        >
                          {copiedId === order.external_id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Criado em: {formatDate(order.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500">Total:</span>
                      <span className="text-xl font-bold text-neutral-900 font-sans">{formatPrice(order.total)}</span>
                      <span className="text-xs text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                        PIX
                      </span>
                    </div>
                  </div>

                  {/* Banner Inteligente de Status de Pagamento e Entrega */}
                  {order.status === 'PENDING_PAYMENT' && (
                    <div className="bg-amber-50/90 border-2 border-amber-300 rounded-lg p-4 sm:p-5 space-y-3 shadow-xs">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-amber-100 rounded-full text-amber-700 shrink-0 mt-0.5 animate-pulse">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <h4 className="font-bold text-amber-950 text-sm sm:text-base flex items-center gap-2">
                              ⏳ Aguardando Confirmação do Pagamento via PIX
                            </h4>
                            <span className="text-[11px] bg-amber-200/80 text-amber-900 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-amber-300">
                              <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                              Verificando em tempo real
                            </span>
                          </div>
                          <p className="text-xs text-amber-900 leading-relaxed">
                            Recebemos o aviso de pagamento do seu pedido! O vendedor está conferindo a confirmação do PIX na conta bancária. Assim que o pagamento for aprovado, seu pedido será atualizado <strong>automaticamente nesta tela</strong> e iniciaremos a entrega dos seus itens no Roblox.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-200/80 text-xs">
                        <span className="text-amber-900 font-medium">
                          Já realizou o PIX? Se desejar agilizar, envie o comprovante ou converse com o vendedor:
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => openPixForOrder(order)}
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-8 px-3.5 rounded-md cursor-pointer shadow-xs"
                          >
                            <QrCode className="w-3.5 h-3.5 mr-1.5" />
                            Ver QR Code PIX
                          </Button>
                          <Button
                            onClick={() => openChatForOrder(order)}
                            size="sm"
                            className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-semibold text-xs h-8 px-3.5 rounded-md cursor-pointer shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                            Abrir Chat do Pedido
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {(order.status === 'PAID' || order.status === 'CONFIRMED') && (
                    <div className="bg-emerald-50/90 border-2 border-emerald-400 rounded-lg p-4 sm:p-5 space-y-3 shadow-xs">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-emerald-100 rounded-full text-emerald-700 shrink-0 mt-0.5">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <h4 className="font-bold text-emerald-950 text-sm sm:text-base flex items-center gap-2">
                              ✅ Pagamento Confirmado com Sucesso!
                            </h4>
                            <span className="text-[11px] bg-emerald-200 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                              Pronto para Entrega
                            </span>
                          </div>
                          <p className="text-xs text-emerald-900 leading-relaxed">
                            O vendedor já confirmou seu pagamento! Nossa equipe está pronta para realizar a entrega dos seus itens no Roblox para o Nick <strong>&quot;{robloxNick}&quot;</strong>. Abra o chat abaixo para receber o link do servidor VIP ou combinar a troca no jogo.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-200 text-xs">
                        <span className="text-emerald-900 font-medium">
                          Fique atento ao chat do pedido para receber o link do servidor VIP:
                        </span>
                        <Button
                          onClick={() => openChatForOrder(order)}
                          className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-bold text-xs h-9 px-4 rounded-md cursor-pointer shadow-xs transition-all hover:scale-[1.02]"
                        >
                          <MessageSquare className="w-4 h-4 mr-1.5" />
                          Abrir Chat e Receber Itens no Roblox
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Exibição dos Itens Digitais Entregues Automaticamente */}
                  {order.shipping_address?.delivered_items && order.shipping_address.delivered_items.length > 0 && (
                    <div className="bg-emerald-50 border-2 border-emerald-400 rounded-lg p-4 sm:p-5 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="font-bold text-emerald-950 text-sm sm:text-base flex items-center gap-2">
                          🎁 Dados do seu Produto Entregue:
                        </h4>
                        <Badge className="bg-emerald-600 text-white font-bold text-xs">
                          Entrega Automática Concluída
                        </Badge>
                      </div>
                      <p className="text-xs text-emerald-900 leading-relaxed">
                        Abaixo estão os dados/mensagem do seu produto liberado pelo sistema. Você também pode acessar o chat completo a qualquer momento.
                      </p>
                      <div className="space-y-2 pt-1">
                        {order.shipping_address.delivered_items.map((deliv: any, idx: number) => (
                          <div key={idx} className="bg-white border border-emerald-300 rounded-md p-3.5 space-y-2 shadow-xs">
                            <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                              <span>📦 {deliv.itemName}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(deliv.message)
                                  toast.success("Dados copiados para a área de transferência!")
                                }}
                                className="flex items-center gap-1 text-[11px] font-bold text-[#48B9FA] hover:text-[#20a6f5] cursor-pointer bg-neutral-50 px-2.5 py-1 rounded border border-neutral-200 transition-colors"
                              >
                                <Copy className="w-3 h-3" /> Copiar Dados
                              </button>
                            </div>
                            <pre className="text-xs font-mono bg-neutral-50 p-2.5 rounded border border-neutral-200 text-neutral-900 whitespace-pre-wrap select-all overflow-x-auto">
                              {deliv.message}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(order.status === 'IN_PRODUCTION' || order.status === 'SHIPPED') && (
                    <div className="bg-blue-50/90 border-2 border-[#48B9FA] rounded-lg p-4 sm:p-5 space-y-3 shadow-xs">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-blue-100 rounded-full text-[#48B9FA] shrink-0 mt-0.5 animate-pulse">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <h4 className="font-bold text-blue-950 text-sm sm:text-base flex items-center gap-2">
                              🚀 Entrega em Andamento no Roblox!
                            </h4>
                            <span className="text-[11px] bg-blue-200 text-blue-900 font-bold px-2.5 py-0.5 rounded-full border border-blue-300">
                              Entrega no Jogo
                            </span>
                          </div>
                          <p className="text-xs text-blue-900 leading-relaxed">
                            O vendedor está online realizando a entrega para o jogador <strong>&quot;{robloxNick}&quot;</strong>. Entre no servidor VIP enviado no chat para receber seus itens.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-blue-200 text-xs">
                        <Button
                          onClick={() => openChatForOrder(order)}
                          className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-bold text-xs h-9 px-4 rounded-md cursor-pointer shadow-xs"
                        >
                          <MessageSquare className="w-4 h-4 mr-1.5" />
                          Ir para o Chat de Entrega
                        </Button>
                      </div>
                    </div>
                  )}

                  {order.status === 'DELIVERED' && (
                    <div className="bg-purple-50/90 border border-purple-200 rounded-lg p-4 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-full text-purple-700 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-purple-950 text-sm">Pedido Entregue com Sucesso!</h4>
                          <p className="text-purple-800 text-xs">Todos os itens foram transferidos para sua conta no Roblox ({robloxNick}). Agradecemos pela preferência!</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => openChatForOrder(order)}
                        variant="outline"
                        size="sm"
                        className="text-purple-900 border-purple-300 hover:bg-purple-100 text-xs font-medium h-8 rounded-md cursor-pointer"
                      >
                        Ver Histórico do Chat
                      </Button>
                    </div>
                  )}

                  {/* Informações de Entrega (Roblox Nick & Contato) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-neutral-50 p-4 rounded-md border border-neutral-200 text-xs">
                    <div>
                      <span className="text-neutral-500 block">Nick no Roblox:</span>
                      <div className="flex items-center gap-1.5 mt-0.5 font-bold text-neutral-900">
                        <Gamepad2 className="w-4 h-4 text-[#48B9FA]" />
                        <span>{robloxNick}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-neutral-500 block">Comprador:</span>
                      <span className="font-medium text-neutral-900 block mt-0.5">{order.customer_name}</span>
                    </div>

                    <div>
                      <span className="text-neutral-500 block">Status Atual:</span>
                      <span className="font-bold text-blue-600 block mt-0.5 uppercase">
                        {ORDER_STEPS[currentStep]?.label || order.status}
                      </span>
                    </div>
                  </div>

                  {/* Linha do Tempo / Timeline de Status */}
                  <div className="py-2">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Progresso do Pedido:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {ORDER_STEPS.map((step, idx) => {
                        const isDone = idx <= currentStep
                        const isCurrent = idx === currentStep
                        const StepIcon = step.icon

                        return (
                          <div
                            key={step.key}
                            className={`flex flex-col items-center text-center p-3 rounded-md border transition-all ${
                              isCurrent
                                ? 'bg-blue-50 border-[#48B9FA] text-[#48B9FA] font-semibold'
                                : isDone
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                            }`}
                          >
                            <StepIcon className="w-4 h-4 mb-1.5" />
                            <span className="text-[11px] font-medium leading-tight">{step.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Itens do Pedido */}
                  {order.items && order.items.length > 0 && (
                    <div className="border-t border-neutral-100 pt-4 space-y-2">
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Produtos do Pedido:</p>
                      <div className="space-y-1.5">
                        {order.items.map((it, i) => (
                          <div key={i} className="flex justify-between items-center text-xs py-1.5 px-3 rounded-md bg-neutral-50 border border-neutral-100">
                            <span className="text-neutral-800">
                              <strong className="text-blue-600 mr-1.5">{it.quantity}x</strong>
                              {it.name}
                            </span>
                            <span className="font-mono text-neutral-700">{formatPrice(it.unit_price * it.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botões de Ação do Pedido */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100">
                    <div className="flex gap-2">
                      {order.status === 'PENDING_PAYMENT' && (
                        <Button
                          onClick={() => openPixForOrder(order)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-xs h-10 px-4 rounded-md cursor-pointer"
                        >
                          <QrCode className="w-4 h-4 mr-1.5 text-amber-600" />
                          Pagar via PIX (QR Code)
                        </Button>
                      )}
                    </div>

                    <Button
                      onClick={() => openChatForOrder(order)}
                      className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-medium text-xs h-10 px-5 rounded-md cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-4 h-4 mr-1.5" />
                      Abrir Chat com o Vendedor
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal de Chat com o Vendedor */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-2xl bg-white border border-neutral-200 p-0 rounded-lg overflow-hidden shadow-lg">
          <DialogTitle className="sr-only">Chat do Pedido</DialogTitle>
          <DialogDescription className="sr-only">Conversa em tempo real entre comprador e vendedor</DialogDescription>
          {selectedOrder && (
            <OrderChat
              orderId={selectedOrder.external_id || selectedOrder.id}
              currentRole="buyer"
              defaultSenderName={selectedOrder.customer_name}
              isModal={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal do PIX QR Code */}
      <Dialog open={pixModalOpen} onOpenChange={setPixModalOpen}>
        <DialogContent className="max-w-lg bg-white border border-neutral-200 p-6 rounded-lg overflow-hidden shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 text-lg font-bold text-center">Pagamento via PIX</DialogTitle>
            <DialogDescription className="text-neutral-500 text-xs text-center">
              Pague com seu banco para liberar a entrega dos seus itens no Roblox.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && activePixPayload && (
            <PixQrCode
              pixCode={activePixPayload}
              amount={selectedOrder.total}
              orderId={selectedOrder.external_id}
              onConfirm={() => {
                setPixModalOpen(false)
                setChatOpen(true)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}

export default function PedidosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#48B9FA]"></div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  )
}
