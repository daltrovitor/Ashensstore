"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Tag,
  Plus,
  Search,
  Check,
  Copy,
  Pencil,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Percent,
  Calendar,
  Layers,
  Sparkles,
  HelpCircle,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import type { Coupon, CouponSummary, CouponDiscountType, CouponApplicability } from "@/lib/coupons/service"

interface ProductOption {
  id: string
  name: string
  price: number
}

interface CategoryOption {
  id: string
  name: string
}

const emptyFormData = {
  code: '',
  description: '',
  discount_type: 'percentage' as CouponDiscountType,
  discount_value: '',
  max_discount: '',
  min_order_value: '',
  max_uses: '',
  max_uses_per_customer: '1',
  start_date: '',
  expiration_date: '',
  is_active: true,
  applicability: 'all' as CouponApplicability,
  applicable_product_ids: [] as string[],
  applicable_category_ids: [] as string[],
  allow_stacking: false,
}

export function CouponsManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [summary, setSummary] = useState<CouponSummary>({
    total_coupons: 0,
    active_coupons: 0,
    expired_coupons: 0,
    total_uses: 0,
    total_discount_granted: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'fixed'>('all')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyFormData)
  const [isSaving, setIsSaving] = useState(false)

  // Confirmação de exclusão
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Produtos e Categorias disponíveis para associação
  const [availableProducts, setAvailableProducts] = useState<ProductOption[]>([])
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([])
  const [productSearch, setProductSearch] = useState("")

  useEffect(() => {
    fetchCoupons()
    fetchProductsAndCategories()
  }, [])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/coupons')
      if (res.ok) {
        const data = await res.json()
        setCoupons(data.coupons || [])
        setSummary(data.summary || {
          total_coupons: 0,
          active_coupons: 0,
          expired_coupons: 0,
          total_uses: 0,
          total_discount_granted: 0,
        })
      } else {
        toast.error("Erro ao carregar cupons")
      }
    } catch (error) {
      console.error(error)
      toast.error("Falha de conexão com o servidor")
    } finally {
      setLoading(false)
    }
  }

  const fetchProductsAndCategories = async () => {
    try {
      // Buscar categorias
      const catRes = await fetch('/api/categories')
      if (catRes.ok) {
        const cats = await catRes.json()
        if (Array.isArray(cats)) {
          setAvailableCategories(cats.map(c => ({ id: c.id, name: c.name })))
        }
      }

      // Buscar produtos
      const prodRes = await fetch('/api/products')
      if (prodRes.ok) {
        const prods = await prodRes.json()
        if (Array.isArray(prods)) {
          setAvailableProducts(prods.map(p => ({ id: p.id, name: p.name, price: p.price || 0 })))
        }
      }
    } catch (error) {
      console.warn("Aviso ao carregar produtos/categorias para o formulário:", error)
    }
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0)
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Sem limite"
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date)
    } catch {
      return dateStr
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`Código "${code}" copiado!`)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggleStatus: true }),
      })

      if (res.ok) {
        const data = await res.json()
        setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: data.is_active } : c))
        toast.success(`Cupom "${coupon.code}" ${data.is_active ? 'ativado' : 'desativado'}!`)
        fetchCoupons()
      } else {
        toast.error("Erro ao alterar status do cupom")
      }
    } catch {
      toast.error("Erro de conexão")
    }
  }

  const openCreateModal = () => {
    setEditingCouponId(null)
    setFormData(emptyFormData)
    setProductSearch("")
    setIsModalOpen(true)
  }

  const openEditModal = (coupon: Coupon) => {
    setEditingCouponId(coupon.id)
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value ? coupon.discount_value.toString() : '',
      max_discount: coupon.max_discount ? coupon.max_discount.toString() : '',
      min_order_value: coupon.min_order_value ? coupon.min_order_value.toString() : '',
      max_uses: coupon.max_uses ? coupon.max_uses.toString() : '',
      max_uses_per_customer: coupon.max_uses_per_customer ? coupon.max_uses_per_customer.toString() : '1',
      start_date: coupon.start_date ? coupon.start_date.substring(0, 10) : '',
      expiration_date: coupon.expiration_date ? coupon.expiration_date.substring(0, 10) : '',
      is_active: coupon.is_active,
      applicability: coupon.applicability || 'all',
      applicable_product_ids: coupon.applicable_product_ids || [],
      applicable_category_ids: coupon.applicable_category_ids || [],
      allow_stacking: Boolean(coupon.allow_stacking),
    })
    setProductSearch("")
    setIsModalOpen(true)
  }

  const handleGenerateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let rand = ''
    for (let i = 0; i < 5; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, code: `ASHEN${rand}` }))
  }

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code.trim()) {
      toast.error("Informe o código do cupom")
      return
    }

    const valNum = Number(formData.discount_value)
    if (isNaN(valNum) || valNum <= 0) {
      toast.error("Informe um valor de desconto válido e maior que zero")
      return
    }

    if (formData.discount_type === 'percentage' && valNum > 100) {
      toast.error("O desconto percentual não pode ultrapassar 100%")
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        discount_type: formData.discount_type,
        discount_value: valNum,
        max_discount: formData.max_discount ? Number(formData.max_discount) : null,
        min_order_value: formData.min_order_value ? Number(formData.min_order_value) : null,
        max_uses: formData.max_uses ? Number(formData.max_uses) : null,
        max_uses_per_customer: formData.max_uses_per_customer ? Number(formData.max_uses_per_customer) : null,
        start_date: formData.start_date || null,
        expiration_date: formData.expiration_date || null,
        is_active: formData.is_active,
        applicability: formData.applicability,
        applicable_product_ids: formData.applicability === 'products' ? formData.applicable_product_ids : [],
        applicable_category_ids: formData.applicability === 'categories' ? formData.applicable_category_ids : [],
        allow_stacking: formData.allow_stacking,
      }

      const url = editingCouponId ? `/api/admin/coupons/${editingCouponId}` : '/api/admin/coupons'
      const method = editingCouponId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(editingCouponId ? `Cupom "${data.code}" atualizado com sucesso!` : `Cupom "${data.code}" criado com sucesso!`)
        setIsModalOpen(false)
        fetchCoupons()
      } else {
        toast.error(data.error || "Erro ao salvar cupom")
      }
    } catch {
      toast.error("Erro de conexão ao salvar cupom")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCoupon = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/coupons/${deletingId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success("Cupom excluído com sucesso!")
        setDeletingId(null)
        fetchCoupons()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao excluir cupom")
      }
    } catch {
      toast.error("Erro de conexão ao excluir cupom")
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtragem de Cupons
  const filteredCoupons = useMemo(() => {
    const now = new Date()
    return coupons.filter(c => {
      // Busca
      const matchSearch = !searchTerm.trim() ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))

      if (!matchSearch) return false

      // Tipo
      if (typeFilter !== 'all' && c.discount_type !== typeFilter) {
        return false
      }

      // Status
      const isExpired = c.expiration_date ? new Date(c.expiration_date) < now : false
      if (statusFilter === 'active') {
        return c.is_active && !isExpired
      }
      if (statusFilter === 'inactive') {
        return !c.is_active
      }
      if (statusFilter === 'expired') {
        return isExpired
      }

      return true
    })
  }, [coupons, searchTerm, statusFilter, typeFilter])

  // Produtos filtrados para seleção no modal
  const filteredModalProducts = useMemo(() => {
    if (!productSearch.trim()) return availableProducts
    return availableProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
  }, [availableProducts, productSearch])

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-6 h-6 text-[#48B9FA]" />
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
              Gerenciar Cupons
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Crie cupons promocionais, configure regras de desconto e monitore utilizações na loja.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCoupons}
            disabled={loading}
            className="h-9 text-xs cursor-pointer border-neutral-200 hover:bg-neutral-100"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            size="sm"
            onClick={openCreateModal}
            className="h-9 text-xs bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Criar cupom
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <Card className="bg-white border-neutral-200/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total de Cupons
            </CardTitle>
            <Tag className="w-4 h-4 text-neutral-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-neutral-900">{summary.total_coupons}</div>
            <p className="text-[11px] text-neutral-400 mt-0.5">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Cupons Ativos
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">{summary.active_coupons}</div>
            <p className="text-[11px] text-neutral-400 mt-0.5">Prontos para uso</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Expirados
            </CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-amber-600">{summary.expired_coupons}</div>
            <p className="text-[11px] text-neutral-400 mt-0.5">Data limite vencida</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Utilizações
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-[#48B9FA]" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-[#0284c7]">{summary.total_uses}</div>
            <p className="text-[11px] text-neutral-400 mt-0.5">Pedidos com desconto</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1 bg-white border-neutral-200/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Concedido
            </CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">
              {formatPrice(summary.total_discount_granted)}
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">Economia aos clientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <Card className="bg-white border-neutral-200/80 shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Campo de Busca */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Buscar por código ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs bg-neutral-50/70 border-neutral-200 focus-visible:ring-[#48B9FA]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtros Dropdowns */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger className="h-9 text-xs w-full sm:w-[130px] border-neutral-200 bg-neutral-50/70">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos os Status</SelectItem>
                  <SelectItem value="active" className="text-xs text-emerald-600 font-medium">Ativos</SelectItem>
                  <SelectItem value="inactive" className="text-xs text-neutral-500">Inativos</SelectItem>
                  <SelectItem value="expired" className="text-xs text-amber-600">Expirados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(val: any) => setTypeFilter(val)}>
                <SelectTrigger className="h-9 text-xs w-full sm:w-[130px] border-neutral-200 bg-neutral-50/70">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos os Tipos</SelectItem>
                  <SelectItem value="percentage" className="text-xs">Porcentagem (%)</SelectItem>
                  <SelectItem value="fixed" className="text-xs">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Cupons */}
      <Card className="bg-white border-neutral-200/80 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-neutral-50/70">
              <TableRow className="border-neutral-200">
                <TableHead className="text-xs font-semibold text-neutral-700 py-3">Código</TableHead>
                <TableHead className="text-xs font-semibold text-neutral-700 py-3">Desconto</TableHead>
                <TableHead className="text-xs font-semibold text-neutral-700 py-3">Usos</TableHead>
                <TableHead className="text-xs font-semibold text-neutral-700 py-3">Validade</TableHead>
                <TableHead className="text-xs font-semibold text-neutral-700 py-3">Status</TableHead>
                <TableHead className="text-xs font-semibold text-neutral-700 py-3 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-xs text-neutral-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#48B9FA]" />
                      <span>Carregando cupons...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCoupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-xs text-neutral-500">
                    <Tag className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="font-medium text-neutral-700">Nenhum cupom encontrado</p>
                    <p className="text-neutral-400 mt-0.5">
                      {searchTerm ? 'Tente ajustar os termos da busca.' : 'Clique em "+ Criar cupom" para começar.'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCoupons.map((c) => {
                  const now = new Date()
                  const isExpired = c.expiration_date ? new Date(c.expiration_date) < now : false
                  const hasReachedMax = c.max_uses ? (c.current_uses || 0) >= c.max_uses : false

                  return (
                    <TableRow key={c.id} className="border-neutral-100 hover:bg-neutral-50/50">
                      {/* Código */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-neutral-100 text-neutral-900 border border-neutral-200 rounded-sm">
                            {c.code}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCode(c.code)}
                            className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                            title="Copiar código"
                          >
                            {copiedCode === c.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                        {c.description && (
                          <p className="text-[11px] text-neutral-500 mt-1 line-clamp-1">
                            {c.description}
                          </p>
                        )}
                        {c.applicability !== 'all' && (
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-200 text-blue-700 bg-blue-50/50">
                              {c.applicability === 'products' ? 'Produtos selecionados' : 'Categorias selecionadas'}
                            </Badge>
                          </div>
                        )}
                      </TableCell>

                      {/* Desconto */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-neutral-900">
                            {c.discount_type === 'percentage'
                              ? `${c.discount_value}% OFF`
                              : `${formatPrice(c.discount_value)} OFF`}
                          </span>
                        </div>
                        {c.max_discount && c.discount_type === 'percentage' && (
                          <p className="text-[10px] text-neutral-500 mt-0.5">
                            Teto máx: {formatPrice(c.max_discount)}
                          </p>
                        )}
                        {c.min_order_value && c.min_order_value > 0 && (
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            Mínimo: {formatPrice(c.min_order_value)}
                          </p>
                        )}
                      </TableCell>

                      {/* Usos */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-medium text-neutral-800">
                            {c.current_uses || 0}
                            {c.max_uses ? ` / ${c.max_uses}` : ' (ilimitado)'}
                          </span>
                        </div>
                        {c.max_uses_per_customer && (
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            Máx {c.max_uses_per_customer} por cliente
                          </p>
                        )}
                      </TableCell>

                      {/* Validade */}
                      <TableCell className="py-3">
                        {isExpired ? (
                          <Badge variant="outline" className="text-[11px] px-2 py-0.5 border-amber-200 text-amber-700 bg-amber-50">
                            <Clock className="w-3 h-3 mr-1" />
                            Expirado ({formatDate(c.expiration_date)})
                          </Badge>
                        ) : c.expiration_date ? (
                          <span className="text-xs text-neutral-600">
                            Até {formatDate(c.expiration_date)}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">
                            Sem expiração
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={c.is_active && !isExpired && !hasReachedMax}
                            disabled={isExpired || hasReachedMax}
                            onCheckedChange={() => handleToggleStatus(c)}
                            className="cursor-pointer data-[state=checked]:bg-emerald-500"
                          />
                          <span className={`text-[11px] font-medium ${
                            !c.is_active
                              ? 'text-neutral-400'
                              : isExpired
                              ? 'text-amber-600'
                              : hasReachedMax
                              ? 'text-red-500'
                              : 'text-emerald-600'
                          }`}>
                            {!c.is_active ? 'Inativo' : isExpired ? 'Expirado' : hasReachedMax ? 'Esgotado' : 'Ativo'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Ações */}
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(c)}
                            className="h-8 w-8 p-0 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                            title="Editar cupom"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingId(c.id)}
                            className="h-8 w-8 p-0 text-neutral-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            title="Excluir cupom"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Criação / Edição de Cupom */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-neutral-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#48B9FA]" />
              {editingCouponId ? 'Editar Cupom' : 'Criar Novo Cupom'}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Preencha os dados e restrições do cupom. Os descontos serão aplicados no checkout.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCoupon} className="space-y-5 pt-2">
            {/* Código e Gerador */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="coupon-code" className="text-xs font-semibold text-neutral-800">
                  Código do Cupom <span className="text-red-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={handleGenerateRandomCode}
                  className="text-xs text-[#0284c7] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Gerar código aleatório
                </button>
              </div>
              <Input
                id="coupon-code"
                placeholder="Ex: ASHEN10, VERAO2026, VIP15"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                className="font-mono text-sm uppercase bg-neutral-50 border-neutral-300 focus-visible:ring-[#48B9FA]"
                required
              />
              <p className="text-[11px] text-neutral-400">
                Apenas letras, números e hífen. Exibido em maiúsculas para o cliente.
              </p>
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label htmlFor="coupon-description" className="text-xs font-semibold text-neutral-800">
                Descrição Interna (Opcional)
              </Label>
              <Input
                id="coupon-description"
                placeholder="Ex: Cupom divulgado no Discord / Promoção de Férias"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="text-xs bg-neutral-50 border-neutral-300"
              />
            </div>

            {/* Tipo de Desconto e Valor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-neutral-50/80 rounded-md border border-neutral-200">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-800">
                  Tipo de Desconto <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={formData.discount_type === 'percentage' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, discount_type: 'percentage' })}
                    className={`h-9 text-xs cursor-pointer font-medium ${
                      formData.discount_type === 'percentage'
                        ? 'bg-neutral-900 text-white'
                        : 'border-neutral-300 hover:bg-neutral-100'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5 mr-1" />
                    Porcentagem (%)
                  </Button>
                  <Button
                    type="button"
                    variant={formData.discount_type === 'fixed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, discount_type: 'fixed' })}
                    className={`h-9 text-xs cursor-pointer font-medium ${
                      formData.discount_type === 'fixed'
                        ? 'bg-neutral-900 text-white'
                        : 'border-neutral-300 hover:bg-neutral-100'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5 mr-1" />
                    Valor Fixo (R$)
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="discount-value" className="text-xs font-semibold text-neutral-800">
                  Valor do Desconto <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="discount-value"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                    placeholder={formData.discount_type === 'percentage' ? 'Ex: 15 para 15%' : 'Ex: 20.00 para R$ 20,00'}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    className="text-xs bg-white border-neutral-300 pl-8"
                    required
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-semibold">
                    {formData.discount_type === 'percentage' ? '%' : 'R$'}
                  </span>
                </div>
              </div>
            </div>

            {/* Limites e Condições Financeiras */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="max-discount" className="text-xs font-semibold text-neutral-800">
                  Desconto Máximo em R$ (Opcional)
                </Label>
                <Input
                  id="max-discount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 50.00 (teto para %)"
                  value={formData.max_discount}
                  onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                  className="text-xs bg-neutral-50 border-neutral-300"
                />
                <p className="text-[11px] text-neutral-400">
                  Trava o desconto no teto máximo caso seja percentual.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="min-order-value" className="text-xs font-semibold text-neutral-800">
                  Valor Mínimo da Compra (Opcional)
                </Label>
                <Input
                  id="min-order-value"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 30.00"
                  value={formData.min_order_value}
                  onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                  className="text-xs bg-neutral-50 border-neutral-300"
                />
                <p className="text-[11px] text-neutral-400">
                  O subtotal dos itens deve atingir esse valor.
                </p>
              </div>
            </div>

            {/* Limites de Usos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="max-uses" className="text-xs font-semibold text-neutral-800">
                  Quantidade Máxima de Usos Geral
                </Label>
                <Input
                  id="max-uses"
                  type="number"
                  min="1"
                  placeholder="Vazio para ilimitado (ex: 100)"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  className="text-xs bg-neutral-50 border-neutral-300"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="max-uses-per-customer" className="text-xs font-semibold text-neutral-800">
                  Limite de Usos por Cliente
                </Label>
                <Input
                  id="max-uses-per-customer"
                  type="number"
                  min="1"
                  placeholder="Ex: 1 uso por cliente"
                  value={formData.max_uses_per_customer}
                  onChange={(e) => setFormData({ ...formData, max_uses_per_customer: e.target.value })}
                  className="text-xs bg-neutral-50 border-neutral-300"
                />
              </div>
            </div>

            {/* Validade: Início e Expiração */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="start-date" className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  Data de Início (Opcional)
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="text-xs bg-neutral-50 border-neutral-300"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expiration-date" className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  Data de Expiração (Opcional)
                </Label>
                <Input
                  id="expiration-date"
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                  className="text-xs bg-neutral-50 border-neutral-300"
                />
              </div>
            </div>

            {/* Produtos Aplicáveis */}
            <div className="space-y-3 p-4 bg-neutral-50 rounded-md border border-neutral-200">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#48B9FA]" />
                  Produtos Aplicáveis
                </Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={formData.applicability === 'all' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, applicability: 'all' })}
                    className="h-7 text-[11px] px-2.5 cursor-pointer"
                  >
                    Todos
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={formData.applicability === 'products' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, applicability: 'products' })}
                    className="h-7 text-[11px] px-2.5 cursor-pointer"
                  >
                    Produtos Específicos
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={formData.applicability === 'categories' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, applicability: 'categories' })}
                    className="h-7 text-[11px] px-2.5 cursor-pointer"
                  >
                    Categorias
                  </Button>
                </div>
              </div>

              {formData.applicability === 'products' && (
                <div className="space-y-2 pt-2">
                  <Input
                    placeholder="Buscar produto para selecionar..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="h-8 text-xs bg-white border-neutral-300"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-white rounded border border-neutral-200">
                    {filteredModalProducts.length === 0 ? (
                      <p className="text-[11px] text-neutral-400 text-center py-2">Nenhum produto encontrado</p>
                    ) : (
                      filteredModalProducts.map((p) => {
                        const isChecked = formData.applicable_product_ids.includes(p.id)
                        return (
                          <label
                            key={p.id}
                            className="flex items-center justify-between p-1.5 rounded hover:bg-neutral-50 cursor-pointer text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({ ...prev, applicable_product_ids: [...prev.applicable_product_ids, p.id] }))
                                  } else {
                                    setFormData(prev => ({ ...prev, applicable_product_ids: prev.applicable_product_ids.filter(id => id !== p.id) }))
                                  }
                                }}
                                className="rounded text-[#48B9FA] focus:ring-[#48B9FA]"
                              />
                              <span className="font-medium text-neutral-800">{p.name}</span>
                            </div>
                            <span className="text-[11px] text-neutral-500 font-mono">{formatPrice(p.price)}</span>
                          </label>
                        )
                      })
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    {formData.applicable_product_ids.length} produto(s) selecionado(s).
                  </p>
                </div>
              )}

              {formData.applicability === 'categories' && (
                <div className="space-y-2 pt-2">
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-white rounded border border-neutral-200">
                    {availableCategories.length === 0 ? (
                      <p className="text-[11px] text-neutral-400 text-center py-2">Nenhuma categoria cadastrada</p>
                    ) : (
                      availableCategories.map((c) => {
                        const isChecked = formData.applicable_category_ids.includes(c.id)
                        return (
                          <label
                            key={c.id}
                            className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-50 cursor-pointer text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({ ...prev, applicable_category_ids: [...prev.applicable_category_ids, c.id] }))
                                } else {
                                  setFormData(prev => ({ ...prev, applicable_category_ids: prev.applicable_category_ids.filter(id => id !== c.id) }))
                                }
                              }}
                              className="rounded text-[#48B9FA] focus:ring-[#48B9FA]"
                            />
                            <span className="font-medium text-neutral-800">{c.name}</span>
                          </label>
                        )
                      })
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    {formData.applicable_category_ids.length} categoria(s) selecionada(s).
                  </p>
                </div>
              )}
            </div>

            {/* Configurações Adicionais */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-neutral-200">
              <div className="flex items-center gap-2">
                <Switch
                  id="coupon-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  className="cursor-pointer data-[state=checked]:bg-emerald-500"
                />
                <Label htmlFor="coupon-active" className="text-xs font-semibold text-neutral-800 cursor-pointer">
                  Cupom Ativo
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="coupon-stacking"
                  checked={formData.allow_stacking}
                  onCheckedChange={(checked) => setFormData({ ...formData, allow_stacking: checked })}
                  className="cursor-pointer"
                />
                <Label htmlFor="coupon-stacking" className="text-xs text-neutral-600 cursor-pointer">
                  Permitir combinar com outras promoções
                </Label>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="text-xs cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="text-xs bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-semibold cursor-pointer"
              >
                {isSaving ? "Salvando..." : editingCouponId ? "Atualizar Cupom" : "Criar Cupom"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="max-w-md bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Excluir Cupom
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-600 pt-1">
              Tem certeza de que deseja excluir este cupom? Esta ação não pode ser desfeita. O histórico de utilizações anteriores de pedidos já realizados será mantido.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingId(null)}
              disabled={isDeleting}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteCoupon}
              disabled={isDeleting}
              className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isDeleting ? "Excluindo..." : "Sim, Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
