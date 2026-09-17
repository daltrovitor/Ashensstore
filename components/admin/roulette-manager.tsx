"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  BarChart3,
  Check,
  Copy,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  Download,
  Boxes,
  DollarSign,
  Settings as SettingsIcon,
  QrCode,
  ShoppingBag,
  ExternalLink,
  Flame,
  UserPlus,
} from "lucide-react"
import { FaDiscord } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import type {
  RoulettePrize,
  RouletteCode,
  RouletteStatsSummary,
  RouletteSpinRecord,
  RedemptionType,
  PrizeRarity,
  RouletteSettings,
  RouletteSpinOrder,
} from "@/lib/roulette/types"
import type { Product } from "@/lib/store/types"

export function RouletteManager() {
  const [subTab, setSubTab] = useState<"items" | "settings" | "orders" | "codes" | "stats">("items")

  // ==========================================
  // 1. Estado dos Itens / Prêmios
  // ==========================================
  const [prizes, setPrizes] = useState<RoulettePrize[]>([])
  const [loadingPrizes, setLoadingPrizes] = useState(true)
  const [prizeModalOpen, setPrizeModalOpen] = useState(false)
  const [editingPrize, setEditingPrize] = useState<Partial<RoulettePrize> & {
    originType?: 'store_product' | 'custom'
  } | null>(null)
  const [savingPrize, setSavingPrize] = useState(false)
  const [storeProducts, setStoreProducts] = useState<Product[]>([])
  const [loadingStoreProducts, setLoadingStoreProducts] = useState(false)

  // ==========================================
  // 2. Estado das Configurações
  // ==========================================
  const [settings, setSettings] = useState<RouletteSettings>({
    spin_price: 5.0,
    is_active: true,
    suspense_near_miss_enabled: true,
    banner_title: "Roleta da Sorte Ashens",
    banner_subtitle: "Gire e ganhe Frutas Míticas, Contas Level Max e Gamepasses!",
  })
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  // ==========================================
  // 3. Estado dos Pedidos de Giros (Validação PIX)
  // ==========================================
  const [orders, setOrders] = useState<RouletteSpinOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [orderFilter, setOrderFilter] = useState<string>("all")
  const [orderSearch, setOrderSearch] = useState("")
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null)
  const [manualEmail, setManualEmail] = useState("")
  const [manualSpins, setManualSpins] = useState("5")
  const [addingManualSpins, setAddingManualSpins] = useState(false)

  // ==========================================
  // 4. Estado dos Códigos Promocionais
  // ==========================================
  const [codes, setCodes] = useState<RouletteCode[]>([])
  const [codesTotal, setCodesTotal] = useState(0)
  const [activeCodesCount, setActiveCodesCount] = useState(0)
  const [usedCodesCount, setUsedCodesCount] = useState(0)
  const [disabledCodesCount, setDisabledCodesCount] = useState(0)
  const [codeFilter, setCodeFilter] = useState("all")
  const [codeSearch, setCodeSearch] = useState("")
  const [loadingCodes, setLoadingCodes] = useState(false)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkQuantity, setBulkQuantity] = useState("50")
  const [bulkSpinsPerCode, setBulkSpinsPerCode] = useState("1")
  const [generatingBulk, setGeneratingBulk] = useState(false)
  const [lastGeneratedCodes, setLastGeneratedCodes] = useState<string[]>([])
  const [generatedModalOpen, setGeneratedModalOpen] = useState(false)

  // ==========================================
  // 5. Estado das Estatísticas & Entregas
  // ==========================================
  const [stats, setStats] = useState<RouletteStatsSummary | null>(null)
  const [recentSpins, setRecentSpins] = useState<RouletteSpinRecord[]>([])
  const [loadingStats, setLoadingStats] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // ----------------------------------------------------
  // Fetchers
  // ----------------------------------------------------
  const fetchPrizes = useCallback(async () => {
    setLoadingPrizes(true)
    try {
      const res = await fetch('/api/admin/roulette/prizes')
      const data = await res.json()
      if (data.prizes) setPrizes(data.prizes)
    } catch {
      toast.error("Erro ao carregar itens da roleta.")
    } finally {
      setLoadingPrizes(false)
    }
  }, [])

  const fetchStoreProducts = useCallback(async () => {
    if (storeProducts.length > 0) return
    setLoadingStoreProducts(true)
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      if (Array.isArray(data)) setStoreProducts(data)
    } catch {
      console.warn("Falha ao carregar produtos da loja para associação")
    } finally {
      setLoadingStoreProducts(false)
    }
  }, [storeProducts.length])

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true)
    try {
      const res = await fetch('/api/admin/roulette/settings')
      const data = await res.json()
      if (data.settings) setSettings(data.settings)
    } catch {
      toast.error("Erro ao carregar configurações da roleta.")
    } finally {
      setLoadingSettings(false)
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true)
    try {
      const params = new URLSearchParams()
      if (orderFilter !== 'all') params.set('status', orderFilter)
      const res = await fetch(`/api/admin/roulette/orders?${params.toString()}`)
      const data = await res.json()
      if (data.orders) setOrders(data.orders)
    } catch {
      toast.error("Erro ao carregar pedidos de giros.")
    } finally {
      setLoadingOrders(false)
    }
  }, [orderFilter])

  const fetchCodes = useCallback(async () => {
    setLoadingCodes(true)
    try {
      const params = new URLSearchParams()
      if (codeFilter !== 'all') params.set('status', codeFilter)
      if (codeSearch.trim()) params.set('search', codeSearch.trim())
      params.set('limit', '50')

      const res = await fetch(`/api/admin/roulette/codes?${params.toString()}`)
      const data = await res.json()
      if (data.codes) {
        setCodes(data.codes)
        setCodesTotal(data.total || 0)
        setActiveCodesCount(data.activeCount || 0)
        setUsedCodesCount(data.usedCount || 0)
        setDisabledCodesCount(data.disabledCount || 0)
      }
    } catch {
      toast.error("Erro ao carregar códigos.")
    } finally {
      setLoadingCodes(false)
    }
  }, [codeFilter, codeSearch])

  const fetchStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const res = await fetch('/api/admin/roulette/stats')
      const data = await res.json()
      if (data.stats) {
        setStats(data.stats)
        setRecentSpins(data.recentSpins || [])
      }
    } catch {
      toast.error("Erro ao carregar estatísticas.")
    } finally {
      setLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    if (subTab === 'items') {
      fetchPrizes()
      fetchStoreProducts()
    }
    if (subTab === 'settings') fetchSettings()
    if (subTab === 'orders') fetchOrders()
    if (subTab === 'codes') fetchCodes()
    if (subTab === 'stats') fetchStats()
  }, [subTab, fetchPrizes, fetchStoreProducts, fetchSettings, fetchOrders, fetchCodes, fetchStats])

  // ----------------------------------------------------
  // Ações de Prêmios / Itens
  // ----------------------------------------------------
  const handleOpenNewPrizeModal = () => {
    fetchStoreProducts()
    setEditingPrize({
      name: '',
      description: '',
      image_url: '',
      custom_image_url: '',
      use_store_image: false,
      product_id: null,
      originType: 'custom',
      rarity: 'rare',
      probability: 5,
      redemption_type: 'automatic',
      delivery_info: '',
      is_active: true,
      display_order: prizes.length + 1,
    })
    setPrizeModalOpen(true)
  }

  const handleOpenEditPrizeModal = (prize: RoulettePrize) => {
    fetchStoreProducts()
    const hasStoreProduct = Boolean(prize.product_id)
    setEditingPrize({
      ...prize,
      originType: hasStoreProduct ? 'store_product' : 'custom',
      use_store_image: prize.use_store_image ?? hasStoreProduct,
      custom_image_url: prize.custom_image_url || (!prize.use_store_image ? prize.image_url : ''),
    })
    setPrizeModalOpen(true)
  }

  const handleSelectStoreProduct = (productId: string) => {
    const prod = storeProducts.find(p => p.id === productId)
    if (!prod) return

    const storeImg = prod.thumbnail_url || prod.images?.[0] || prod.mockups?.[0]?.image_url || '/ashens-logo.jpg'
    setEditingPrize(prev => ({
      ...prev,
      product_id: prod.id,
      name: prev?.name || prod.name,
      description: prev?.description || prod.description || `Produto oficial: ${prod.name}`,
      image_url: prev?.use_store_image ? storeImg : (prev?.custom_image_url || storeImg),
    }))
  }

  const handleSavePrize = async () => {
    if (!editingPrize?.name) {
      toast.error("O nome do item é obrigatório.")
      return
    }

    let finalImageUrl = editingPrize.image_url || ''
    if (editingPrize.originType === 'store_product' && editingPrize.product_id) {
      const prod = storeProducts.find(p => p.id === editingPrize.product_id)
      const storeImg = prod?.thumbnail_url || prod?.images?.[0] || prod?.mockups?.[0]?.image_url || ''
      if (editingPrize.use_store_image) {
        finalImageUrl = storeImg || finalImageUrl
      } else {
        finalImageUrl = editingPrize.custom_image_url || storeImg || finalImageUrl
      }
    } else {
      finalImageUrl = editingPrize.custom_image_url || editingPrize.image_url || ''
    }

    if (!finalImageUrl) {
      toast.error("Informe a imagem do item (da loja ou personalizada).")
      return
    }

    setSavingPrize(true)
    try {
      const payload = {
        ...editingPrize,
        image_url: finalImageUrl,
        product_id: editingPrize.originType === 'store_product' ? editingPrize.product_id : null,
        use_store_image: editingPrize.originType === 'store_product' ? Boolean(editingPrize.use_store_image) : false,
        custom_image_url: editingPrize.custom_image_url || null,
        probability: Number(editingPrize.probability) || 1.0,
      }

      const res = await fetch('/api/admin/roulette/prizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("Item da roleta salvo com sucesso!")
        setPrizeModalOpen(false)
        setEditingPrize(null)
        fetchPrizes()
      } else {
        toast.error(data.error || "Erro ao salvar item.")
      }
    } catch {
      toast.error("Erro de conexão ao salvar item.")
    } finally {
      setSavingPrize(false)
    }
  }

  const handleDeletePrize = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este item da roleta?")) return
    try {
      const res = await fetch(`/api/admin/roulette/prizes?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("Item excluído com sucesso!")
        fetchPrizes()
      }
    } catch {
      toast.error("Erro ao excluir item.")
    }
  }

  const handleTogglePrizeStatus = async (prize: RoulettePrize) => {
    try {
      await fetch('/api/admin/roulette/prizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...prize, is_active: !prize.is_active }),
      })
      toast.success(prize.is_active ? "Item desativado." : "Item ativado!")
      fetchPrizes()
    } catch {
      toast.error("Erro ao alterar status.")
    }
  }

  // ----------------------------------------------------
  // Ações de Configurações
  // ----------------------------------------------------
  const handleSaveSettings = async () => {
    const price = Number(settings.spin_price)
    if (isNaN(price) || price <= 0) {
      toast.error("Informe um valor válido maior que R$ 0,00 para o giro.")
      return
    }

    setSavingSettings(true)
    try {
      const res = await fetch('/api/admin/roulette/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("Configurações da roleta salvas com sucesso!")
        setSettings(data.settings)
      } else {
        toast.error(data.error || "Erro ao salvar configurações.")
      }
    } catch {
      toast.error("Erro ao salvar configurações.")
    } finally {
      setSavingSettings(false)
    }
  }

  // ----------------------------------------------------
  // Ações de Validação de Pedidos PIX & Liberação de Giros
  // ----------------------------------------------------
  const handleConfirmOrder = async (order: RouletteSpinOrder) => {
    if (!confirm(`Confirmar recebimento do PIX de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)} e liberar ${order.spins_count} giros para ${order.customer_name}?`)) {
      return
    }

    setConfirmingOrderId(order.order_id)
    try {
      const res = await fetch('/api/admin/roulette/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          orderId: order.order_id,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Pagamento confirmado! ${order.spins_count} giros liberados com sucesso.`)
        fetchOrders()
      } else {
        toast.error(data.error || "Erro ao confirmar pedido.")
      }
    } catch {
      toast.error("Erro ao confirmar liberação de giros.")
    } finally {
      setConfirmingOrderId(null)
    }
  }

  const handleAddManualSpins = async (e: React.FormEvent) => {
    e.preventDefault()
    const spins = parseInt(manualSpins) || 0
    if (!manualEmail.trim() || spins <= 0) {
      toast.error("Informe um e-mail válido e quantidade de giros maior que zero.")
      return
    }

    setAddingManualSpins(true)
    try {
      const res = await fetch('/api/admin/roulette/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_manual',
          email: manualEmail.trim(),
          spinsCount: spins,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || `${spins} giros creditados com sucesso!`)
        setManualEmail("")
        setManualSpins("5")
      } else {
        toast.error(data.error || "Erro ao adicionar giros.")
      }
    } catch {
      toast.error("Erro ao adicionar giros.")
    } finally {
      setAddingManualSpins(false)
    }
  }

  // ----------------------------------------------------
  // Códigos em Massa & Entregas
  // ----------------------------------------------------
  const handleGenerateBulk = async () => {
    const qty = parseInt(bulkQuantity) || 1
    const spins = parseInt(bulkSpinsPerCode) || 1

    if (qty < 1 || qty > 500) {
      toast.error("Informe uma quantidade entre 1 e 500 códigos.")
      return
    }

    setGeneratingBulk(true)
    try {
      const res = await fetch('/api/admin/roulette/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty, spinsPerCode: spins }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || "Códigos gerados com sucesso!")
        setBulkModalOpen(false)
        const codeStrings = (data.codes as RouletteCode[]).map(c => c.code)
        setLastGeneratedCodes(codeStrings)
        setGeneratedModalOpen(true)
        fetchCodes()
      } else {
        toast.error(data.error || "Erro ao gerar códigos.")
      }
    } catch {
      toast.error("Erro ao gerar códigos.")
    } finally {
      setGeneratingBulk(false)
    }
  }

  const handleToggleCodeStatus = async (code: RouletteCode) => {
    const newStatus = code.status === 'active' ? 'disabled' : 'active'
    try {
      const res = await fetch('/api/admin/roulette/codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeId: code.id, status: newStatus }),
      })
      if (res.ok) {
        toast.success(`Código ${newStatus === 'active' ? 'reativado' : 'desativado'}!`)
        fetchCodes()
      }
    } catch {
      toast.error("Erro ao alterar status.")
    }
  }

  const handleDeliverReward = async (spinId: string) => {
    try {
      const res = await fetch('/api/admin/roulette/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spinId, notes: 'Entregue pelo painel administrativo' }),
      })
      if (res.ok) {
        toast.success("Prêmio marcado como entregue!")
        fetchStats()
      }
    } catch {
      toast.error("Erro ao atualizar entrega.")
    }
  }

  const handleCopyCode = (c: string) => {
    navigator.clipboard.writeText(c)
    setCopiedCode(c)
    toast.success("Código copiado!")
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Cálculos de métricas
  const totalProbability = prizes
    .filter(p => p.is_active)
    .reduce((sum, p) => sum + (Number(p.probability) || 0), 0)
  const isProbValid = Math.abs(totalProbability - 100) < 0.05

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length
  const confirmedOrdersCount = orders.filter(o => o.status === 'confirmed').length
  const totalRevenueSpins = orders
    .filter(o => o.status === 'confirmed')
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)

  const filteredOrders = orders.filter(o => {
    if (orderFilter !== 'all' && o.status !== orderFilter) return false
    if (!orderSearch.trim()) return true
    const term = orderSearch.toLowerCase()
    return (
      o.order_id.toLowerCase().includes(term) ||
      o.customer_name.toLowerCase().includes(term) ||
      o.customer_email.toLowerCase().includes(term) ||
      o.roblox_username.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-[#48B9FA]" />
            <span>Gerenciamento da Roleta</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Configure prêmios, chances (100%), preço do giro, validação de pagamentos PIX e suspense cinematográfico.
          </p>
        </div>

        {/* Sub-abas de Navegação */}
        <div className="flex flex-wrap bg-neutral-100 p-1 rounded-lg border border-neutral-200">
          <button
            onClick={() => setSubTab("items")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              subTab === "items"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Itens da Roleta ({prizes.length})
          </button>
          <button
            onClick={() => setSubTab("settings")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === "settings"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5 text-[#48B9FA]" />
            <span>Preço & Configurações</span>
          </button>
          <button
            onClick={() => setSubTab("orders")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === "orders"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-[#48B9FA]" />
            <span>Validação de Giros (PIX)</span>
            {pendingOrdersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingOrdersCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setSubTab("codes")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              subTab === "codes"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Códigos de Giros
          </button>
          <button
            onClick={() => setSubTab("stats")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              subTab === "stats"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            Estatísticas & Entregas
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. ABA ITENS DA ROLETA (Cards Padronizados do Mesmo Tamanho) */}
      {/* ============================================================ */}
      {subTab === "items" && (
        <div className="space-y-6">
          {/* Barra de Validação de Probabilidade Total (100%) */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isProbValid
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-3">
              {isProbValid ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold">
                  Soma das Probabilidades Ativas: {totalProbability.toFixed(1)}% {isProbValid ? "(Perfeito!)" : "(Ajuste para 100%)"}
                </p>
                <p className="text-[11px] opacity-80">
                  {isProbValid
                    ? "As probabilidades somam exatamente 100%. Todos os slots da esteira possuem o mesmo tamanho físico."
                    : "Atenção: A soma das chances deve ser igual a 100% para manter a fidelidade matemática do sorteio."}
                </p>
              </div>
            </div>

            <Button
              onClick={handleOpenNewPrizeModal}
              className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-semibold text-xs px-4 h-9 shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1" /> Adicionar Novo Item
            </Button>
          </div>

          {/* Grid de Itens da Roleta - RIGOROSAMENTE MESMO TAMANHO */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {prizes.map((prize) => {
              const prob = Number(prize.probability) || 1
              const rarity = prize.rarity || (prob <= 3 ? 'mythic' : prob <= 10 ? 'legendary' : prob <= 25 ? 'rare' : 'common')
              const isMythic = rarity === 'mythic'
              const isLegendary = rarity === 'legendary'
              const isEpic = rarity === 'epic'
              const isRare = rarity === 'rare'

              const borderColor = isMythic
                ? 'border-amber-400/80 bg-amber-50/30'
                : isLegendary
                ? 'border-purple-400/80 bg-purple-50/30'
                : isEpic
                ? 'border-pink-400/70 bg-pink-50/30'
                : isRare
                ? 'border-blue-400/70 bg-blue-50/30'
                : 'border-neutral-200 bg-white'

              const rarityLabel = isMythic ? 'MÍTICO' : isLegendary ? 'LENDÁRIO' : isEpic ? 'ÉPICO' : isRare ? 'RARO' : 'COMUM'
              const rarityBadgeClass = isMythic
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : isLegendary
                ? 'bg-purple-100 text-purple-800 border-purple-300'
                : isEpic
                ? 'bg-pink-100 text-pink-800 border-pink-300'
                : isRare
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-neutral-100 text-neutral-700 border-neutral-200'

              return (
                <div
                  key={prize.id}
                  className={`border rounded-xl p-3 flex flex-col justify-between relative shadow-xs transition-all ${borderColor} ${
                    !prize.is_active ? 'opacity-50 grayscale' : ''
                  }`}
                  style={{ height: '240px' }}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${rarityBadgeClass}`}>
                      {rarityLabel}
                    </span>
                    <span className="text-xs font-black text-[#0284c7] font-mono">
                      {prize.probability}%
                    </span>
                  </div>

                  <div className="w-20 h-20 mx-auto my-auto relative flex items-center justify-center">
                    <img
                      src={prize.image_url}
                      alt={prize.name}
                      className="w-full h-full object-contain drop-shadow-sm"
                      loading="lazy"
                    />
                  </div>

                  <div className="text-center w-full">
                    <p className="text-xs font-bold text-neutral-900 line-clamp-1 leading-snug" title={prize.name}>
                      {prize.name}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                      {prize.product_id ? (prize.use_store_image ? 'Foto da Loja' : 'Foto Personalizada') : 'Item Avulso'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between w-full mt-1">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={prize.is_active}
                        onCheckedChange={() => handleTogglePrizeStatus(prize)}
                      />
                      <span className="text-[10px] font-medium text-neutral-500">
                        {prize.is_active ? 'Ativo' : 'Off'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-neutral-500 hover:text-neutral-900"
                        onClick={() => handleOpenEditPrizeModal(prize)}
                        title="Editar Item"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                        onClick={() => handleDeletePrize(prize.id)}
                        title="Excluir Item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. ABA PREÇO & CONFIGURAÇÕES GERAIS */}
      {/* ============================================================ */}
      {subTab === "settings" && (
        <div className="max-w-3xl space-y-6">
          <Card className="border-neutral-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Preço do Giro da Roleta</span>
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Defina o valor base por giro. Os pacotes de 3, 5 e 10 giros calculam descontos progressivos automaticamente sobre esse valor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-700">Preço Unitário do Giro (R$)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral-500">R$</span>
                  <Input
                    type="number"
                    step="0.50"
                    min="1.00"
                    value={settings.spin_price}
                    onChange={(e) => setSettings(prev => ({ ...prev, spin_price: parseFloat(e.target.value) || 0 }))}
                    className="h-10 text-base font-bold w-48"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Exemplo de pacotes gerados: 1 Giro: R$ {Number(settings.spin_price).toFixed(2)} | 5 Giros (15% OFF): R$ {(Number(settings.spin_price) * 5 * 0.85).toFixed(2)} | 10 Giros (20% OFF): R$ {(Number(settings.spin_price) * 10 * 0.80).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-neutral-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <span>Animação & Suspense Cinematográfico ("Near Miss")</span>
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Gera adrenalina máxima no jogador criando a ilusão de que quase caiu em um item Mítico ou Lendário.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <div>
                  <Label className="text-xs font-bold text-neutral-900 block">Ativar Suspense de Quase Cair no Item Mais Raro</Label>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    A roleta posiciona Frutas Míticas (ex: Kitsune / Dragon) imediatamente adjacentes ao item sorteado e desacelera dramaticamente para passar raspando.
                  </p>
                </div>
                <Switch
                  checked={settings.suspense_near_miss_enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, suspense_near_miss_enabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <div>
                  <Label className="text-xs font-bold text-neutral-900 block">Status Geral da Roleta</Label>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Ative ou pause o funcionamento geral da roleta e compras de giros na loja.
                  </p>
                </div>
                <Switch
                  checked={settings.is_active}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-bold text-xs h-10 px-6 cursor-pointer mt-2"
              >
                {savingSettings ? "Salvando..." : "Salvar Configurações da Roleta"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. ABA VALIDAÇÃO DE GIROS (PIX) & LIBERAÇÃO */}
      {/* ============================================================ */}
      {subTab === "orders" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <span className="text-xs font-semibold text-neutral-500">Pedidos de Giros</span>
              <p className="text-2xl font-black text-neutral-900 mt-1">{orders.length}</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <span className="text-xs font-semibold text-amber-600">Aguardando PIX (Pendentes)</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{pendingOrdersCount}</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <span className="text-xs font-semibold text-emerald-600">Confirmados & Liberados</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{confirmedOrdersCount}</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <span className="text-xs font-semibold text-[#0284c7]">Total Faturado em Giros</span>
              <p className="text-2xl font-black text-[#0284c7] mt-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenueSpins)}
              </p>
            </div>
          </div>

          <Card className="border-neutral-200 bg-neutral-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#48B9FA]" />
                <span>Creditar Giros Manualmente para Usuário</span>
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Se o cliente comprou por fora ou precisa de uma bonificação, adicione giros diretamente pelo e-mail da conta dele.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddManualSpins} className="flex flex-col sm:flex-row items-center gap-3">
                <Input
                  type="email"
                  required
                  placeholder="E-mail da conta do usuário..."
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="h-9 text-xs flex-1 bg-white"
                />
                <Input
                  type="number"
                  min="1"
                  max="500"
                  required
                  placeholder="Giros..."
                  value={manualSpins}
                  onChange={(e) => setManualSpins(e.target.value)}
                  className="h-9 text-xs font-bold w-24 bg-white"
                />
                <Button
                  type="submit"
                  disabled={addingManualSpins}
                  className="h-9 px-4 text-xs font-bold bg-[#48B9FA] hover:bg-[#20a6f5] text-white shrink-0 cursor-pointer"
                >
                  {addingManualSpins ? "Creditando..." : "Liberar Giros"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Buscar por cliente, e-mail, nick ou ID..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={orderFilter} onValueChange={setOrderFilter}>
                <SelectTrigger className="h-9 text-xs w-44">
                  <SelectValue placeholder="Filtrar Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Pedidos</SelectItem>
                  <SelectItem value="pending">Apenas Pendentes</SelectItem>
                  <SelectItem value="confirmed">Apenas Confirmados</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrders}
                className="h-9 text-xs gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </Button>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Pedido / Data</th>
                    <th className="py-3 px-4">Cliente / Nick Roblox</th>
                    <th className="py-3 px-4 text-center">Giros</th>
                    <th className="py-3 px-4 text-right">Valor PIX</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Validação & Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loadingOrders ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-400">
                        Carregando pedidos de giros...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-400">
                        Nenhum pedido de giro encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isPending = order.status === 'pending'
                      return (
                        <tr key={order.id} className="hover:bg-neutral-50/60 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-neutral-900 block">
                              {order.order_id}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {new Date(order.created_at).toLocaleString('pt-BR')}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-neutral-900 block">{order.customer_name}</span>
                            <span className="text-[11px] text-neutral-500 block">{order.customer_email}</span>
                            <span className="text-[10px] font-semibold text-[#0284c7] bg-[#48B9FA]/10 px-1.5 py-0.5 rounded inline-block mt-0.5">
                              Roblox: {order.roblox_username}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="text-xs font-black text-neutral-900 bg-neutral-100 px-2 py-1 rounded-full">
                              {order.spins_count} {order.spins_count === 1 ? 'giro' : 'giros'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap font-black text-neutral-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isPending ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Aguardando PIX
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Confirmado
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {isPending ? (
                              <Button
                                size="sm"
                                disabled={confirmingOrderId === order.order_id}
                                onClick={() => handleConfirmOrder(order)}
                                className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{confirmingOrderId === order.order_id ? "Liberando..." : "Confirmar & Liberar Giros"}</span>
                              </Button>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                {order.redeem_code && (
                                  <span className="font-mono text-[10px] text-neutral-500 bg-neutral-100 px-2 py-1 rounded" title="Código de Resgate Reserva">
                                    {order.redeem_code}
                                  </span>
                                )}
                                <span className="text-[11px] text-emerald-600 font-bold">Liberado</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. ABA CÓDIGOS DE GIROS */}
      {/* ============================================================ */}
      {subTab === "codes" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <span className="text-xs font-semibold text-neutral-500">Total de Códigos</span>
              <p className="text-2xl font-black text-neutral-900 mt-1">{codesTotal}</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <span className="text-xs font-semibold text-emerald-600">Disponíveis / Ativos</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{activeCodesCount}</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <span className="text-xs font-semibold text-neutral-500">Utilizados / Resgatados</span>
              <p className="text-2xl font-black text-neutral-900 mt-1">{usedCodesCount}</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <span className="text-xs font-semibold text-red-500">Desativados</span>
              <p className="text-2xl font-black text-red-500 mt-1">{disabledCodesCount}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Pesquisar código..."
                value={codeSearch}
                onChange={(e) => setCodeSearch(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>

            <Button
              onClick={() => setBulkModalOpen(true)}
              className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-semibold text-xs px-4 h-9 shadow-xs shrink-0 cursor-pointer gap-1.5"
            >
              <Boxes className="w-4 h-4" />
              <span>Gerar Códigos em Massa</span>
            </Button>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4 text-center">Giros</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Resgatado Por</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {codes.map((code) => (
                    <tr key={code.id} className="hover:bg-neutral-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-900 flex items-center gap-2">
                        <span>{code.code}</span>
                        <button
                          onClick={() => handleCopyCode(code.code)}
                          className="text-neutral-400 hover:text-neutral-900 cursor-pointer"
                        >
                          {copiedCode === code.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{code.spins_count}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          code.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          code.status === 'used' ? 'bg-neutral-100 text-neutral-600' : 'bg-red-100 text-red-800'
                        }`}>
                          {code.status === 'active' ? 'Ativo' : code.status === 'used' ? 'Usado' : 'Desativado'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-500">{code.redeemed_by_email || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        {code.status !== 'used' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleCodeStatus(code)}
                            className="h-7 text-[11px]"
                          >
                            {code.status === 'active' ? 'Desativar' : 'Reativar'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. ABA ESTATÍSTICAS & ENTREGAS */}
      {/* ============================================================ */}
      {subTab === "stats" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <span className="text-xs font-semibold text-neutral-500">Giros Realizados</span>
              <p className="text-2xl font-black text-neutral-900 mt-1">{stats?.total_spins_performed || 0}</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <span className="text-xs font-semibold text-[#0284c7]">Jogadores Únicos</span>
              <p className="text-2xl font-black text-[#0284c7] mt-1">{stats?.unique_users_count || 0}</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <span className="text-xs font-semibold text-amber-600">Entregas Pendentes</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{stats?.pending_claims_count || 0}</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <span className="text-xs font-semibold text-emerald-600">Prêmios Entregues</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.delivered_claims_count || 0}</p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="text-sm font-bold text-neutral-900">Histórico de Giros Recentes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Giro / Data</th>
                    <th className="py-3 px-4">Jogador</th>
                    <th className="py-3 px-4">Prêmio Sorteado</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentSpins.map((spin) => (
                    <tr key={spin.id} className="hover:bg-neutral-50/60">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold block">{spin.spin_id}</span>
                        <span className="text-[10px] text-neutral-400">{new Date(spin.created_at).toLocaleString('pt-BR')}</span>
                      </td>
                      <td className="py-3 px-4">{spin.user_email}</td>
                      <td className="py-3 px-4 font-bold">{spin.prize_name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          spin.claim_status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {spin.claim_status === 'delivered' ? 'Entregue' : 'Pendente'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {spin.claim_status !== 'delivered' && (
                          <Button
                            size="sm"
                            onClick={() => handleDeliverReward(spin.spin_id)}
                            className="h-7 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Marcar Entregue
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ADICIONAR / EDITAR ITEM DA ROLETA (PRODUTO DA LOJA OU NOVO) */}
      {/* ============================================================ */}
      <Dialog open={prizeModalOpen} onOpenChange={setPrizeModalOpen}>
        <DialogContent className="sm:max-w-[550px] bg-white border border-neutral-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#48B9FA]" />
              <span>{editingPrize?.id ? 'Editar Item da Roleta' : 'Novo Item da Roleta'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Vincule um produto da loja ou crie um item personalizado com probabilidade e raridade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-700">Origem do Item</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={editingPrize?.originType === 'store_product' ? 'default' : 'outline'}
                  size="sm"
                  className={`h-9 text-xs font-bold cursor-pointer ${
                    editingPrize?.originType === 'store_product' ? 'bg-[#48B9FA] hover:bg-[#20a6f5] text-white' : 'border-neutral-300'
                  }`}
                  onClick={() => setEditingPrize(prev => ({ ...prev, originType: 'store_product', use_store_image: true }))}
                >
                  <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> Produto da Loja
                </Button>

                <Button
                  type="button"
                  variant={editingPrize?.originType === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  className={`h-9 text-xs font-bold cursor-pointer ${
                    editingPrize?.originType === 'custom' ? 'bg-[#48B9FA] hover:bg-[#20a6f5] text-white' : 'border-neutral-300'
                  }`}
                  onClick={() => setEditingPrize(prev => ({ ...prev, originType: 'custom', product_id: null, use_store_image: false }))}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Item Novo Avulso
                </Button>
              </div>
            </div>

            {editingPrize?.originType === 'store_product' && (
              <div className="space-y-1.5 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <Label className="text-xs font-semibold text-neutral-700">Selecione o Produto do Catálogo</Label>
                <Select
                  value={editingPrize?.product_id || ''}
                  onValueChange={handleSelectStoreProduct}
                >
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="Escolha um produto da loja..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {storeProducts.map((prod) => (
                      <SelectItem key={prod.id} value={prod.id} className="text-xs">
                        {prod.name} ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.price)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="pt-2 border-t border-neutral-200/60 mt-2 flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium text-neutral-800 block">Usar foto original do produto da loja?</Label>
                    <p className="text-[10px] text-neutral-400">
                      {editingPrize.use_store_image ? "Exibindo a imagem oficial cadastrada na loja" : "Usar foto personalizada exclusiva para a roleta"}
                    </p>
                  </div>
                  <Switch
                    checked={editingPrize?.use_store_image ?? true}
                    onCheckedChange={(checked) => setEditingPrize(prev => ({ ...prev, use_store_image: checked }))}
                  />
                </div>
              </div>
            )}

            {(editingPrize?.originType === 'custom' || !editingPrize?.use_store_image) && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-700">URL da Imagem Personalizada para a Roleta</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={editingPrize?.custom_image_url || editingPrize?.image_url || ''}
                    onChange={(e) => setEditingPrize(prev => ({
                      ...prev,
                      custom_image_url: e.target.value,
                      image_url: e.target.value,
                    }))}
                    placeholder="https://... ou /images/..."
                    className="h-9 text-xs flex-1"
                  />
                  {(editingPrize?.custom_image_url || editingPrize?.image_url) && (
                    <div className="w-9 h-9 border rounded-md p-1 bg-white flex items-center justify-center shrink-0">
                      <img
                        src={editingPrize.custom_image_url || editingPrize.image_url}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-700">Nome do Prêmio</Label>
              <Input
                value={editingPrize?.name || ''}
                onChange={(e) => setEditingPrize(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Kitsune Fruit (Física)"
                className="h-9 text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-700">Raridade</Label>
                <Select
                  value={editingPrize?.rarity || 'rare'}
                  onValueChange={(val: PrizeRarity) => setEditingPrize(prev => ({ ...prev, rarity: val }))}
                >
                  <SelectTrigger className="h-9 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mythic" className="text-amber-600 font-bold">Mítico (Kitsune, Dragon)</SelectItem>
                    <SelectItem value="legendary" className="text-purple-600 font-bold">Lendário (Dough, Buddha)</SelectItem>
                    <SelectItem value="epic" className="text-pink-600 font-bold">Épico (Gamepasses, Contas)</SelectItem>
                    <SelectItem value="rare" className="text-blue-600 font-bold">Raro (Frutas Boas)</SelectItem>
                    <SelectItem value="common" className="text-neutral-600 font-bold">Comum (Itens Básicos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-700">Probabilidade de Sorteio (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.01"
                  max="100"
                  value={editingPrize?.probability ?? 1}
                  onChange={(e) => setEditingPrize(prev => ({ ...prev, probability: parseFloat(e.target.value) || 0 }))}
                  className="h-9 text-xs font-black text-[#0284c7]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-700">Método de Resgate</Label>
              <Select
                value={editingPrize?.redemption_type || 'automatic'}
                onValueChange={(val: RedemptionType) => setEditingPrize(prev => ({ ...prev, redemption_type: val }))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Resgate Automático (Estoque Digital)</SelectItem>
                  <SelectItem value="discord">Resgate via Discord / Suporte (Manual)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-700">Descrição do Prêmio</Label>
              <Textarea
                rows={2}
                value={editingPrize?.description || ''}
                onChange={(e) => setEditingPrize(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhes que aparecem no card..."
                className="text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
              <div>
                <Label className="text-xs font-semibold text-neutral-700 block">Ativo na Roleta</Label>
                <span className="text-[10px] text-neutral-400">Pode ser sorteado pelos usuários</span>
              </div>
              <Switch
                checked={editingPrize?.is_active ?? true}
                onCheckedChange={(checked) => setEditingPrize(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrizeModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={savingPrize}
              onClick={handleSavePrize}
              className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white text-xs font-bold"
            >
              {savingPrize ? "Salvando..." : "Salvar Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: Gerar Códigos em Massa */}
      <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
        <DialogContent className="sm:max-w-[440px] bg-white border border-neutral-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#48B9FA]" />
              <span>Gerar Códigos em Massa</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-700">Quantidade de Códigos</Label>
              <Input
                type="number"
                min="1"
                max="500"
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(e.target.value)}
                className="h-9 text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-700">Giros por Código</Label>
              <Input
                type="number"
                min="1"
                value={bulkSpinsPerCode}
                onChange={(e) => setBulkSpinsPerCode(e.target.value)}
                className="h-9 text-xs font-bold"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              size="sm"
              disabled={generatingBulk}
              onClick={handleGenerateBulk}
              className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white text-xs font-bold"
            >
              {generatingBulk ? "Gerando..." : "Gerar Códigos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: Códigos Gerados */}
      <Dialog open={generatedModalOpen} onOpenChange={setGeneratedModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white border border-neutral-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{lastGeneratedCodes.length} Códigos Gerados!</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              readOnly
              rows={8}
              value={lastGeneratedCodes.join('\n')}
              className="font-mono text-xs bg-neutral-50 resize-none p-3"
            />
          </div>

          <DialogFooter>
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(lastGeneratedCodes.join('\n'))
                toast.success("Códigos copiados!")
              }}
              className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white text-xs font-bold"
            >
              Copiar Todos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
