
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, CreditCard, RefreshCw, MapPin, Package, Truck, CheckCircle2, Clock, XCircle, Store, ShoppingBag, Printer, QrCode } from "lucide-react"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { NewOrderDialog } from "@/components/admin/new-order-dialog"
import { OrderReceiptPrint } from "@/components/admin/order-receipt-print"

interface Order {
    id: string
    external_id: string
    status: string
    payment_status: string
    payment_method?: string
    total: number
    shipping_cost: number
    customer_name: string
    customer_email: string
    customer_phone?: string
    created_at: string
    items: any[]
    shipping_address: any
    payment_id?: string
}

// Delivery status steps in order
const DELIVERY_STEPS = [
    { key: "CONFIRMED", label: "Pedido Confirmado", icon: CheckCircle2, color: "text-green-600" },
    { key: "IN_PRODUCTION", label: "Em Preparação", icon: Package, color: "text-orange-500" },
    { key: "SHIPPED", label: "Enviado", icon: Truck, color: "text-blue-600" },
    { key: "DELIVERED", label: "Entregue", icon: CheckCircle2, color: "text-purple-600" },
]

const STATUS_LABELS: Record<string, string> = {
    "PENDING_PAYMENT": "Aguardando Pagamento",
    "PAID": "Pago",
    "CONFIRMED": "Pedido Confirmado",
    "IN_PRODUCTION": "Em Preparação",
    "SHIPPED": "Enviado",
    "DELIVERED": "Entregue",
    "CANCELED": "Cancelado",
}

function getDeliveryStepIndex(status: string): number {
    return DELIVERY_STEPS.findIndex(s => s.key === status)
}

function isDeliveryStatus(status: string): boolean {
    return DELIVERY_STEPS.some(s => s.key === status)
}

export function OrdersManager() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("all")
    const [channelFilter, setChannelFilter] = useState("all") // all, ecommerce, local
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [printOrder, setPrintOrder] = useState<any | null>(null)
    const [printModalOpen, setPrintModalOpen] = useState(false)

    useEffect(() => {
        fetchOrders()
    }, [statusFilter])

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (statusFilter !== "all") params.append("status", statusFilter)

            const res = await fetch(`/api/admin/orders?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                setOrders(data.orders || [])
            } else {
                toast.error("Erro ao carregar pedidos")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar pedidos")
        } finally {
            setLoading(false)
        }
    }

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order)
        setDetailsOpen(true)
    }

    const handlePrintReceipt = (order: Order) => {
        const addr = order.shipping_address || {}
        setPrintOrder({
            external_id: order.external_id,
            receipt_number: addr.receipt_number,
            created_at: order.created_at,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone || addr.phone,
            customer_document: addr.customer_document,
            state_registration: addr.state_registration,
            machine_number: addr.machine_number,
            address: addr.address1,
            neighborhood: addr.neighborhood,
            city: addr.city,
            state: addr.state_code,
            zip: addr.zip,
            total: order.total,
            payment_method: order.payment_method,
            payment_status: order.payment_status,
            items: order.items?.map((item: any) => ({
                quantity: item.quantity,
                unit: item.unit || "un",
                name: item.name,
                unit_price: item.unit_price,
                total_price: item.total_price,
            })) || [],
        })
        setPrintModalOpen(true)
    }

    const filteredOrders = orders.filter((order) => {
        if (channelFilter === "all") return true
        const isLocal =
            order.shipping_address?.order_type === "local" ||
            order.shipping_address?.order_type === "loja" ||
            order.shipping_address?.order_type === "balcao"
        if (channelFilter === "local") return isLocal
        if (channelFilter === "ecommerce") return !isLocal
        return true
    })

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        setUpdatingStatus(true)
        try {
            const res = await fetch("/api/admin/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update_status",
                    data: { orderIds: [orderId], status: newStatus },
                }),
            })

            if (res.ok) {
                toast.success(`Status atualizado para: ${STATUS_LABELS[newStatus] || newStatus}`)
                fetchOrders()
                if (selectedOrder?.id === orderId) {
                    setSelectedOrder({ ...selectedOrder, status: newStatus })
                }
            } else {
                toast.error("Erro ao atualizar status")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao atualizar status")
        } finally {
            setUpdatingStatus(false)
        }
    }



    const getStatusColor = (status: string) => {
        switch (status) {
            case "PAID": return "bg-green-100 text-green-800 border-green-200"
            case "CONFIRMED": return "bg-emerald-100 text-emerald-800 border-emerald-200"
            case "PENDING_PAYMENT": return "bg-yellow-100 text-yellow-800 border-yellow-200"
            case "CANCELED": return "bg-red-100 text-red-800 border-red-200"
            case "IN_PRODUCTION": return "bg-orange-100 text-orange-800 border-orange-200"
            case "SHIPPED": return "bg-blue-100 text-blue-800 border-blue-200"
            case "DELIVERED": return "bg-purple-100 text-purple-800 border-purple-200"
            default: return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
    }

    const formatAddress = (addr: any) => {
        if (!addr) return null
        const parts = [addr.city, addr.state_code].filter(Boolean)
        return parts.join(" - ")
    }


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Status</SelectItem>
                            <SelectItem value="PENDING_PAYMENT">Aguardando Pagamento</SelectItem>
                            <SelectItem value="PAID">Pago</SelectItem>
                            <SelectItem value="CONFIRMED">Pedido Confirmado</SelectItem>
                            <SelectItem value="IN_PRODUCTION">Em Preparação</SelectItem>
                            <SelectItem value="SHIPPED">Enviado</SelectItem>
                            <SelectItem value="DELIVERED">Entregue</SelectItem>
                            <SelectItem value="CANCELED">Cancelado</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={channelFilter} onValueChange={setChannelFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Canal de Venda" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Canais</SelectItem>
                            <SelectItem value="ecommerce">🛒 E-commerce (Online)</SelectItem>
                            <SelectItem value="local">🏪 Venda Local (Balcão)</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" onClick={fetchOrders} title="Atualizar Lista">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>

                <NewOrderDialog onOrderCreated={fetchOrders} />
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID / Talão</TableHead>
                            <TableHead>Canal</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Pagamento</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                    <Spinner />
                                </TableCell>
                            </TableRow>
                        ) : filteredOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    Nenhum pedido encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders.map((order) => {
                                const isLocal =
                                    order.shipping_address?.order_type === "local" ||
                                    order.shipping_address?.order_type === "loja" ||
                                    order.shipping_address?.order_type === "balcao"

                                const method = (order.payment_method || "").toLowerCase()

                                return (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">
                                            <div className="font-bold">{order.external_id}</div>
                                            {order.shipping_address?.machine_number && (
                                                <div className="text-[10px] text-red-600 font-sans font-medium">
                                                    Máq: {order.shipping_address.machine_number}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isLocal ? (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-[11px] font-semibold">
                                                    <Store className="w-3 h-3" /> Venda Local
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 text-[11px] font-semibold">
                                                    <ShoppingBag className="w-3 h-3" /> E-commerce
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{order.customer_name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {order.shipping_address?.phone || order.customer_email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-semibold">
                                                    {method === "pix" ? "🟢 PIX Direto" : method.includes("card") ? "🔵 Cartão" : method === "cash" ? "💵 Dinheiro" : method || "—"}
                                                </span>
                                                <span className={`text-[10px] ${order.payment_status === "completed" || order.status === "PAID" ? "text-green-600 font-bold" : "text-yellow-600 font-medium"}`}>
                                                    {order.payment_status === "completed" || order.status === "PAID" ? "Pago" : "Pendente"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getStatusColor(order.status)}>
                                                {STATUS_LABELS[order.status] || order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-sm">{formatCurrency(order.total)}</TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(order)} title="Ver detalhes">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {isLocal && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handlePrintReceipt(order)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    title="Imprimir Talão / Ordem de Serviço"
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Order Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Pedido #{selectedOrder?.external_id}</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-6">
                            {/* Customer + Address */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-muted/30 rounded-lg p-4 border">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <div className="p-1.5 rounded-md bg-primary/10">
                                            <CreditCard className="h-4 w-4 text-primary" />
                                        </div>
                                        Cliente
                                    </h4>
                                    <div className="space-y-1">
                                        <p className="font-medium">{selectedOrder.customer_name}</p>
                                        <p className="text-muted-foreground">{selectedOrder.customer_email}</p>
                                        {selectedOrder.shipping_address?.phone && (
                                            <p className="text-muted-foreground">{selectedOrder.shipping_address.phone}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-muted/30 rounded-lg p-4 border">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <div className="p-1.5 rounded-md bg-blue-500/10">
                                            <MapPin className="h-4 w-4 text-blue-600" />
                                        </div>
                                        Endereço de Entrega
                                    </h4>
                                    {selectedOrder.shipping_address ? (
                                        <div className="space-y-1">
                                            <p className="font-medium">{selectedOrder.shipping_address.address1}</p>
                                            {selectedOrder.shipping_address.address2 && (
                                                <p className="text-muted-foreground">{selectedOrder.shipping_address.address2}</p>
                                            )}
                                            <p>{selectedOrder.shipping_address.city} - {selectedOrder.shipping_address.state_code}</p>
                                            <p className="text-muted-foreground">CEP: {selectedOrder.shipping_address.zip}</p>
                                            {selectedOrder.shipping_address.country_code && (
                                                <p className="text-muted-foreground text-xs">País: {selectedOrder.shipping_address.country_code}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">Endereço não disponível</p>
                                    )}
                                </div>
                            </div>

                            {/* Delivery Status Tracker */}
                            {selectedOrder.status !== "CANCELED" && selectedOrder.status !== "PENDING_PAYMENT" && (
                                <div className="bg-muted/20 rounded-lg p-5 border">
                                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                                        <div className="p-1.5 rounded-md bg-green-500/10">
                                            <Truck className="h-4 w-4 text-green-600" />
                                        </div>
                                        Acompanhamento da Entrega
                                    </h4>

                                    {/* Stepper */}
                                    <div className="flex items-center justify-between relative">
                                        {/* Progress line background */}
                                        <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-muted rounded-full" />

                                        {/* Progress line foreground */}
                                        {(() => {
                                            const currentIdx = selectedOrder.status === "PAID"
                                                ? -1
                                                : getDeliveryStepIndex(selectedOrder.status)
                                            const progress = currentIdx < 0 ? 0 : ((currentIdx) / (DELIVERY_STEPS.length - 1)) * 100
                                            return (
                                                <div
                                                    className="absolute top-5 left-[10%] h-1 bg-green-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${progress * 0.8}%` }}
                                                />
                                            )
                                        })()}

                                        {DELIVERY_STEPS.map((step, idx) => {
                                            const currentIdx = selectedOrder.status === "PAID"
                                                ? -1
                                                : getDeliveryStepIndex(selectedOrder.status)
                                            const isCompleted = currentIdx >= idx
                                            const isCurrent = currentIdx === idx
                                            const StepIcon = step.icon

                                            return (
                                                <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                                                    <button
                                                        onClick={() => {
                                                            if (!updatingStatus) {
                                                                handleUpdateStatus(selectedOrder.id, step.key)
                                                            }
                                                        }}
                                                        disabled={updatingStatus}
                                                        className={`
                                                            w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 cursor-pointer
                                                            ${isCompleted
                                                                ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-200'
                                                                : isCurrent
                                                                    ? 'bg-white border-green-500 text-green-500'
                                                                    : 'bg-white border-gray-300 text-gray-400'
                                                            }
                                                            hover:scale-110 disabled:hover:scale-100
                                                        `}
                                                        title={`Definir como: ${step.label}`}
                                                    >
                                                        <StepIcon className="h-5 w-5" />
                                                    </button>
                                                    <span className={`text-[11px] mt-2 font-medium text-center leading-tight ${isCompleted ? 'text-green-700' : 'text-muted-foreground'
                                                        }`}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>



                                    {selectedOrder.status === "DELIVERED" && (
                                        <div className="mt-4 text-center">
                                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-4 py-1.5 text-sm font-medium">
                                                ✓ Pedido entregue com sucesso
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Canceled Warning */}
                            {selectedOrder.status === "CANCELED" && (
                                <div className="bg-red-50 rounded-lg p-4 border border-red-200 flex items-center gap-3">
                                    <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                                    <div>
                                        <p className="font-medium text-red-800">Pedido Cancelado</p>
                                        <p className="text-sm text-red-600">Este pedido foi cancelado e não pode ser atualizado.</p>
                                    </div>
                                </div>
                            )}

                            {/* Pending Payment Warning */}
                            {selectedOrder.status === "PENDING_PAYMENT" && (
                                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-yellow-600 shrink-0" />
                                    <div>
                                        <p className="font-medium text-yellow-800">Aguardando Pagamento</p>
                                        <p className="text-sm text-yellow-600">O pagamento ainda não foi confirmado para este pedido.</p>
                                    </div>
                                </div>
                            )}

                            {/* Payment Info */}
                            <div className="border rounded-md p-4 bg-muted/20">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" /> Forma de Pagamento
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Método:</span>
                                        <span className="font-medium capitalize">
                                            {selectedOrder.payment_method === 'pix' ? '🟢 PIX (Direto CNPJ)' : selectedOrder.payment_method?.includes('card') ? '🔵 Cartão' : selectedOrder.payment_method === 'cash' ? '💵 Dinheiro' : selectedOrder.payment_method || 'Não especificado'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Status do Pagamento:</span>
                                        <span className="font-medium">{selectedOrder.payment_status || 'Pendente'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Transação / Referência:</span>
                                        <span className="font-mono text-xs">{selectedOrder.payment_id || selectedOrder.external_id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Informações de Venda Local / Oficina (se aplicável) */}
                            {selectedOrder.shipping_address?.order_type === 'local' && (
                                <div className="border-2 border-red-200 bg-red-50/20 rounded-md p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-red-700 flex items-center gap-2 text-sm">
                                            <Store className="h-4 w-4" /> Dados do Talão / Oficina Librás
                                        </h4>
                                        <Button
                                            size="sm"
                                            onClick={() => handlePrintReceipt(selectedOrder)}
                                            className="bg-red-600 hover:bg-red-700 text-white font-bold h-8 text-xs gap-1.5"
                                        >
                                            <Printer className="w-3.5 h-3.5" /> Imprimir Talão
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                        <div>
                                            <span className="text-muted-foreground block">Nº da Máquina:</span>
                                            <span className="font-bold text-red-800 font-mono">
                                                {selectedOrder.shipping_address.machine_number || '—'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block">CNPJ / CPF:</span>
                                            <span className="font-medium">
                                                {selectedOrder.shipping_address.customer_document || '—'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block">Insc. Estadual:</span>
                                            <span className="font-medium">
                                                {selectedOrder.shipping_address.state_registration || '—'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block">Setor (Bairro):</span>
                                            <span className="font-medium">
                                                {selectedOrder.shipping_address.neighborhood || '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Items */}
                            <div>
                                <h4 className="font-semibold mb-2">Itens</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produto</TableHead>
                                            <TableHead>Qtd</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedOrder.items?.map((item: any) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {item.product_variant?.product?.thumbnail_url && (
                                                            <img src={item.product_variant.product.thumbnail_url} className="w-8 h-8 rounded object-cover" />
                                                        )}
                                                        <div>
                                                            <p className="font-medium text-sm">{item.name}</p>
                                                            {item.product_variant && (
                                                                <p className="text-xs text-muted-foreground">Var ID: {item.product_variant.id.slice(0, 8)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.total_price)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Footer: Status changer + Total */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t pt-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Alterar Status:</span>
                                    <Select
                                        value={selectedOrder.status}
                                        onValueChange={(val) => handleUpdateStatus(selectedOrder.id, val)}
                                        disabled={updatingStatus}
                                    >
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING_PAYMENT">Aguardando Pagamento</SelectItem>
                                            <SelectItem value="PAID">Pago</SelectItem>
                                            <SelectItem value="CONFIRMED">Pedido Confirmado</SelectItem>
                                            <SelectItem value="IN_PRODUCTION">Em Preparação</SelectItem>
                                            <SelectItem value="SHIPPED">Enviado</SelectItem>
                                            <SelectItem value="DELIVERED">Entregue</SelectItem>
                                            <SelectItem value="CANCELED">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="text-right">
                                    {selectedOrder.shipping_cost > 0 && (
                                        <p className="text-xs text-muted-foreground mb-0.5">
                                            Frete: {formatCurrency(selectedOrder.shipping_cost)}
                                        </p>
                                    )}
                                    <div className="text-xl font-bold">
                                        Total: {formatCurrency(selectedOrder.total)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Print Modal for Receipt */}
            <Dialog open={printModalOpen} onOpenChange={setPrintModalOpen}>
                <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                    {printOrder && (
                        <OrderReceiptPrint
                            order={printOrder}
                            onClose={() => setPrintModalOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
