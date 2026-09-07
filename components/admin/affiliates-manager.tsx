"use client"

import { useState, useEffect } from "react"
import {
  Users,
  DollarSign,
  TrendingUp,
  Package,
  Search,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Eye,
  RefreshCw,
  Gift
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

interface OrderDetail {
  id: string
  external_id: string
  created_at: string
  total: number
  status: string
  commission: number
}

interface AffiliateUser {
  id: string
  user_id: string
  name: string
  email: string
  coupon_code: string
  discount_percent: number
  commission_percent: number
  created_at: string
  total_sales_count: number
  paid_orders_count: number
  total_revenue: number
  total_commission: number
  orders: OrderDetail[]
}

interface SummaryData {
  total_affiliates: number
  total_sales_count: number
  total_paid_orders: number
  total_revenue: number
  total_commission_pending: number
}

export function AffiliatesManager() {
  const [affiliates, setAffiliates] = useState<AffiliateUser[]>([])
  const [summary, setSummary] = useState<SummaryData>({
    total_affiliates: 0,
    total_sales_count: 0,
    total_paid_orders: 0,
    total_revenue: 0,
    total_commission_pending: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAffiliateOrders, setSelectedAffiliateOrders] = useState<AffiliateUser | null>(null)
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null)

  useEffect(() => {
    fetchAffiliates()
  }, [])

  const fetchAffiliates = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/affiliates')
      if (res.ok) {
        const data = await res.json()
        setAffiliates(data.affiliates || [])
        setSummary(data.summary || {
          total_affiliates: 0,
          total_sales_count: 0,
          total_paid_orders: 0,
          total_revenue: 0,
          total_commission_pending: 0,
        })
      } else {
        toast.error("Erro ao carregar afiliados")
      }
    } catch (err) {
      console.error('Erro ao buscar dados de afiliados:', err)
      toast.error("Falha de conexão com o servidor")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0)
  }

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCoupon(code)
    toast.success(`Cupom "${code}" copiado!`)
    setTimeout(() => setCopiedCoupon(null), 2500)
  }

  const getWhatsAppPayLink = (aff: AffiliateUser) => {
    const formattedCommission = formatPrice(aff.total_commission)
    const text = `Olá, ${aff.name}! Estou entrando em contato da Ashens Store referente ao seu saldo de afiliado acumulado (Cupom: ${aff.coupon_code}). Seu saldo atual disponível para saque é de ${formattedCommission}. Por favor, envie sua chave Pix para realização da transferência.`
    return `https://wa.me/?text=${encodeURIComponent(text)}`
  }

  const filteredAffiliates = affiliates.filter((a) => {
    const q = searchTerm.toLowerCase()
    return (
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.coupon_code.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#48B9FA]" />
            Usuários e Afiliados
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Monitore usuários que ativaram conta de afiliado, cupons em circulação, vendas atribuídas e comissões.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAffiliates}
          disabled={loading}
          className="self-start sm:self-auto text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-neutral-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total de Afiliados
            </CardTitle>
            <div className="p-2 bg-blue-50 text-[#48B9FA] rounded-md">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-neutral-900">
              {summary.total_affiliates}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Usuários cadastrados no programa
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Vendas via Cupons
            </CardTitle>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-md">
              <Package className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-neutral-900">
              {summary.total_sales_count}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              {summary.total_paid_orders} venda(s) confirmada(s)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Faturamento Gerado
            </CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-neutral-900">
              {formatPrice(summary.total_revenue)}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Total faturado com cupons de afiliados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Comissões Acumuladas
            </CardTitle>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-md">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600">
              {formatPrice(summary.total_commission_pending)}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              10% repassado aos afiliados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Afiliados */}
      <Card className="bg-white border-neutral-200 shadow-xs">
        <CardHeader className="p-4 sm:p-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold text-neutral-900">
              Lista de Afiliados Cadastrados
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              {filteredAffiliates.length} de {affiliates.length} usuário(s) encontrado(s)
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, email ou cupom..."
              className="pl-9 text-xs h-9 bg-neutral-50 border-neutral-200 focus-visible:ring-[#48B9FA]"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Spinner className="h-8 w-8 mx-auto text-[#48B9FA]" />
              <p className="text-xs text-neutral-500">Carregando afiliados...</p>
            </div>
          ) : filteredAffiliates.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 space-y-2">
              <Gift className="w-10 h-10 mx-auto text-neutral-300" />
              <p className="text-sm font-semibold text-neutral-700">
                {searchTerm ? "Nenhum afiliado encontrado para a busca." : "Nenhum afiliado registrado ainda."}
              </p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Quando os usuários se cadastrarem e ativarem cupons na página /afiliados, eles serão exibidos aqui.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-200 bg-neutral-50/70 text-xs">
                  <TableHead className="font-semibold text-neutral-700">Afiliado</TableHead>
                  <TableHead className="font-semibold text-neutral-700">Cupom de 10%</TableHead>
                  <TableHead className="font-semibold text-neutral-700">Vendas (Total/Pagas)</TableHead>
                  <TableHead className="font-semibold text-neutral-700">Faturamento Gerado</TableHead>
                  <TableHead className="font-semibold text-neutral-700">Comissão Acumulada</TableHead>
                  <TableHead className="font-semibold text-neutral-700">Data de Entrada</TableHead>
                  <TableHead className="text-right font-semibold text-neutral-700">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-neutral-100 text-xs">
                {filteredAffiliates.map((aff) => (
                  <TableRow key={aff.id} className="hover:bg-neutral-50/50">
                    <TableCell>
                      <div>
                        <div className="font-bold text-neutral-900">{aff.name}</div>
                        <div className="text-[11px] text-neutral-500">{aff.email}</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border-neutral-300 font-mono text-xs px-2 py-0.5 font-bold">
                          {aff.coupon_code}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => handleCopyCoupon(aff.coupon_code)}
                          className="p-1 text-neutral-400 hover:text-black transition-colors rounded cursor-pointer"
                          title="Copiar cupom"
                        >
                          {copiedCoupon === aff.coupon_code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-semibold text-neutral-900">{aff.paid_orders_count}</span>
                      <span className="text-neutral-400 text-[11px]"> / {aff.total_sales_count} pedido(s)</span>
                    </TableCell>

                    <TableCell className="font-semibold text-neutral-900">
                      {formatPrice(aff.total_revenue)}
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-emerald-600">
                        {formatPrice(aff.total_commission)}
                      </span>
                    </TableCell>

                    <TableCell className="text-neutral-500 text-[11px]">
                      {new Date(aff.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAffiliateOrders(aff)}
                          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Ver histórico de pedidos com este cupom"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Pedidos ({aff.orders.length})
                        </Button>

                        <a
                          href={getWhatsAppPayLink(aff)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center h-7 px-2 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-sm font-medium transition-colors cursor-pointer"
                          title="Enviar mensagem Pix de comissão no WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Pagar Pix
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes dos Pedidos do Afiliado */}
      <Dialog
        open={!!selectedAffiliateOrders}
        onOpenChange={(open) => !open && setSelectedAffiliateOrders(null)}
      >
        <DialogContent className="max-w-2xl bg-white border border-neutral-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#48B9FA]" />
              Vendas do Afiliado: {selectedAffiliateOrders?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Cupom: <strong>{selectedAffiliateOrders?.coupon_code}</strong> • Total de comissões acumuladas:{" "}
              <strong className="text-emerald-600">
                {formatPrice(selectedAffiliateOrders?.total_commission || 0)}
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto space-y-3 py-2">
            {!selectedAffiliateOrders?.orders || selectedAffiliateOrders.orders.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                Nenhum pedido atribuído a este cupom até o momento.
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-200 bg-neutral-50 text-xs">
                      <TableHead>Pedido</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead className="text-right">Comissão (10%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-neutral-100 text-xs">
                    {selectedAffiliateOrders.orders.map((order) => {
                      const isPaid = order.status === 'PAID' || order.status === 'CONFIRMED'
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono font-bold text-neutral-900">
                            #{order.external_id}
                          </TableCell>
                          <TableCell className="text-neutral-500">
                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge className={isPaid ? "bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]" : "bg-amber-100 text-amber-800 border-amber-200 text-[10px]"}>
                              {isPaid ? "Pago" : "Pendente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-neutral-800">
                            {formatPrice(order.total)}
                          </TableCell>
                          <TableCell className="font-bold text-emerald-600 text-right">
                            +{formatPrice(order.commission)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
