"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Search, Truck, Eye, RefreshCw, LogOut, ShoppingBag, User, MapPin, CreditCard, Calendar } from "lucide-react"
import { useRequireAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Order {
  id: string
  external_id: string
  status: string
  payment_status?: string
  customer_name: string
  customer_email: string
  subtotal?: number
  shipping_cost?: number
  total: number
  currency: string
  payment_method?: string
  printful_order_id?: string
  tracking_number?: string
  tracking_url?: string
  shipping_address?: any
  items?: any[]
  is_test: boolean
  created_at: string
  updated_at: string
}

function OrdersContent() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useRequireAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/user/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      } else {
        throw new Error('Failed to fetch orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Falha ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  const handlePay = async (orderId: string) => {
    try {
      const res = await fetch('/api/checkout/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      })

      if (res.ok) {
        const { checkoutUrl } = await res.json()
        window.location.href = checkoutUrl
      } else {
        const data = await res.json()
        toast.error(data.error || 'Falha ao iniciar pagamento')
      }
    } catch (error) {
      console.error('Payment retry error:', error)
      toast.error('Erro ao conectar com servidor de pagamento')
    }
  }

  const executeCancel = async () => {
    if (!orderToCancel) return

    try {
      const res = await fetch('/api/user/orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: orderToCancel }),
      })

      if (res.ok) {
        toast.success('Pedido cancelado com sucesso')
        fetchOrders()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Falha ao cancelar pedido')
      }
    } catch (error) {
      console.error('Cancel error:', error)
      toast.error('Erro ao cancelar pedido')
    } finally {
      setOrderToCancel(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING_PAYMENT': 'bg-yellow-100 text-yellow-800',
      'PAID': 'bg-green-100 text-green-800',
      'IN_PRODUCTION': 'bg-blue-100 text-blue-800',
      'SHIPPED': 'bg-purple-100 text-purple-800',
      'DELIVERED': 'bg-emerald-100 text-emerald-800',
      'CANCELED': 'bg-red-100 text-red-800',
      'TEST_ORDER': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatStatus = (status: string) => {
    const labels: Record<string, string> = {
      'PENDING_PAYMENT': 'Pagamento Pendente',
      'PAID': 'Pago',
      'IN_PRODUCTION': 'Em Produção',
      'SHIPPED': 'Enviado',
      'DELIVERED': 'Entregue',
      'CANCELED': 'Cancelado',
      'TEST_ORDER': 'Pedido Teste'
    }
    return labels[status] || status
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.external_id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleRefresh = () => {
    fetchOrders()
  }

  // Mostra loading enquanto verifica auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8" style={{ paddingTop: '6rem' }}>
        {/* Welcome Banner */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    Olá, {user?.full_name || user?.email?.split('@')[0] || 'Cliente'}! 👋
                  </h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push('/loja')}>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Voltar para a Loja
                </Button>
                <Button variant="destructive" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Meus Pedidos</h1>
          <p className="text-muted-foreground">
            Acompanhe o status e o rastreamento dos seus pedidos
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PENDING_PAYMENT">Pagamento Pendente</SelectItem>
              <SelectItem value="PAID">Pago</SelectItem>
              <SelectItem value="IN_PRODUCTION">Em Produção</SelectItem>
              <SelectItem value="SHIPPED">Enviado</SelectItem>
              <SelectItem value="DELIVERED">Entregue</SelectItem>
              <SelectItem value="CANCELED">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-3 bg-muted rounded w-48"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-3 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Rastreamento</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">#{order.external_id}</div>
                          {order.is_test && (
                            <Badge variant="outline" className="text-xs mt-1">TESTE</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(order.status)}>
                          {formatStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>R$ {order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        {order.tracking_number ? (
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Truck className="h-4 w-4" />
                            {order.tracking_number}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Ver Resumo do Pedido"
                            onClick={() => {
                              setSelectedOrder(order)
                              setDetailsOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {order.status === 'PENDING_PAYMENT' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handlePay(order.external_id)}
                                title="Pagar Agora"
                              >
                                Pagar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setOrderToCancel(order.external_id)}
                                title="Cancelar Pedido"
                              >
                                Cancelar
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm || statusFilter !== "all"
                  ? "Nenhum pedido encontrado com os filtros aplicados"
                  : "Você ainda não fez nenhum pedido"
                }
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || statusFilter !== "all"
                  ? "Tente ajustar os filtros ou buscar por outro termo"
                  : "Explore nossa loja e faça seu primeiro pedido"
                }
              </p>
              <Button asChild>
                <a href="/loja">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Explorar Produtos
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />

      <AlertDialog open={!!orderToCancel} onOpenChange={(open) => !open && setOrderToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={executeCancel} className="bg-red-600 hover:bg-red-700">
              Sim, Cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Detalhes / Resumo do Pedido */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <DialogTitle className="text-xl font-bold font-serif">
                      Resumo do Pedido #{selectedOrder.external_id}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Realizado em {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
                    </DialogDescription>
                  </div>
                  <Badge className={getStatusBadge(selectedOrder.status)}>
                    {formatStatus(selectedOrder.status)}
                  </Badge>
                </div>
              </DialogHeader>

              {/* Itens do Pedido */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Package className="w-4 h-4" /> Itens do Pedido ({selectedOrder.items?.length || 0})
                </h4>
                <div className="divide-y border rounded-lg bg-card overflow-hidden">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item: any, idx: number) => {
                      const img = item.product_variant?.product?.thumbnail_url
                      return (
                        <div key={idx} className="p-3.5 flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden border shrink-0">
                            {img ? (
                              <img src={img} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">Qtd: {item.quantity} × {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold font-mono">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total_price || item.unit_price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Itens do pedido não detalhados.
                    </div>
                  )}
                </div>
              </div>

              {/* Dados de Entrega e Pagamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Entrega */}
                <div className="p-4 rounded-lg border bg-muted/20 space-y-2 text-xs">
                  <h4 className="font-bold text-sm flex items-center gap-1.5 text-foreground">
                    <MapPin className="w-4 h-4 text-primary" /> Endereço de Entrega
                  </h4>
                  {selectedOrder.shipping_address ? (
                    <div className="space-y-0.5 text-muted-foreground">
                      <p className="font-medium text-foreground">{selectedOrder.shipping_address.name || selectedOrder.customer_name}</p>
                      <p>{selectedOrder.shipping_address.address1}</p>
                      {selectedOrder.shipping_address.address2 && <p>{selectedOrder.shipping_address.address2}</p>}
                      <p>{selectedOrder.shipping_address.city} - {selectedOrder.shipping_address.state_code || selectedOrder.shipping_address.state}</p>
                      <p>CEP: {selectedOrder.shipping_address.zip}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Retirada no balcão / Entrega combinada</p>
                  )}
                </div>

                {/* Pagamento */}
                <div className="p-4 rounded-lg border bg-muted/20 space-y-2 text-xs">
                  <h4 className="font-bold text-sm flex items-center gap-1.5 text-foreground">
                    <CreditCard className="w-4 h-4 text-primary" /> Forma de Pagamento
                  </h4>
                  <div className="space-y-1 text-muted-foreground">
                    <p className="font-medium text-foreground capitalize">
                      {selectedOrder.payment_method === 'pix' ? '🟢 PIX Direto (CNPJ)' : selectedOrder.payment_method?.includes('card') ? '🔵 Cartão de Crédito/Débito' : selectedOrder.payment_method || 'Pagamento na Entrega'}
                    </p>
                    <p>Status: <strong className="text-foreground">{selectedOrder.payment_status === 'completed' || selectedOrder.status === 'PAID' ? 'Pago' : 'Aguardando Pagamento'}</strong></p>
                    {selectedOrder.tracking_number && (
                      <div className="pt-2 border-t mt-2">
                        <p className="font-semibold text-foreground">Rastreio:</p>
                        <a href={selectedOrder.tracking_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                          <Truck className="w-3.5 h-3.5" /> {selectedOrder.tracking_number}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Total do Pedido */}
              <div className="p-4 rounded-lg bg-muted/40 border space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>Subtotal</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.subtotal || (selectedOrder.total - (selectedOrder.shipping_cost || 0)))}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>Frete</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.shipping_cost || 0)}</span>
                </div>
                <div className="flex justify-between font-black text-lg pt-2 border-t text-foreground">
                  <span>Total Pago</span>
                  <span className="text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  )
}
