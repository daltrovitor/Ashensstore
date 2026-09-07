"use client"

import { useState, useEffect } from "react"
import {
    DollarSign,
    TrendingUp,
    CreditCard,
    QrCode,
    ShoppingBag,
    RefreshCw,
    Calendar,
    ArrowUpRight,
    PieChart as PieChartIcon,
    Clock,
    Gamepad2,
    CheckCircle2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { fetchWithAuth } from "@/lib/utils/fetch"
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts"

interface TransactionItem {
    id: string
    external_id: string
    customer_name: string
    customer_email: string
    roblox_username: string
    payment_method: string
    payment_status: string
    status: string
    total: number
    created_at: string
}

interface FinancialData {
    kpis: {
        total_revenue: number
        today_revenue: number
        month_revenue: number
        pending_revenue: number
        average_ticket: number
        paid_orders_count: number
        pending_orders_count: number
        all_orders_count: number
        conversion_rate: number
    }
    payment_methods: Array<{
        id: string
        label: string
        total: number
        count: number
        percentage: number
        color: string
    }>
    daily_chart: Array<{
        date: string
        revenue: number
        orders: number
    }>
    recent_transactions: TransactionItem[]
}

const METHOD_ICONS: Record<string, any> = {
    pix: QrCode,
    credit_card: CreditCard,
    card: CreditCard,
    other: DollarSign,
}

export function FinancialManager() {
    const [data, setData] = useState<FinancialData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedMethodFilter, setSelectedMethodFilter] = useState("all")
    const [selectedStatusFilter, setSelectedStatusFilter] = useState("all")

    useEffect(() => {
        fetchFinancial()
    }, [])

    const fetchFinancial = async () => {
        setLoading(true)
        try {
            const res = await fetchWithAuth("/api/admin/financial")
            if (res.ok) {
                const json = await res.json()
                setData(json)
            } else {
                toast.error("Erro ao carregar dados financeiros")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao conectar com o servidor")
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)

    const filteredTransactions = (data?.recent_transactions || []).filter((tx) => {
        if (selectedMethodFilter !== "all") {
            const method = (tx.payment_method || "pix").toLowerCase()
            if (!method.includes(selectedMethodFilter)) return false
        }
        if (selectedStatusFilter !== "all") {
            const isPaid = tx.status === "PAID" || tx.status === "CONFIRMED" || tx.payment_status === "completed"
            if (selectedStatusFilter === "paid" && !isPaid) return false
            if (selectedStatusFilter === "pending" && isPaid) return false
        }
        return true
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold">Gestão Financeira do E-commerce</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Faturamento, fluxo de pedidos online e métricas de conversão da Ashens Store.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchFinancial} disabled={loading} className="gap-2 cursor-pointer">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
                </Button>
            </div>

            {loading && !data ? (
                <div className="text-center py-20">
                    <Spinner />
                    <p className="text-sm text-muted-foreground mt-2">Calculando fluxo financeiro do e-commerce...</p>
                </div>
            ) : data ? (
                <>
                    {/* 4 Cards Principais */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-border/60">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Faturamento Total
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-[#48B9FA]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-foreground">
                                    {formatCurrency(data.kpis.total_revenue)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                                    {data.kpis.paid_orders_count} pedidos online pagos
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-blue-200 bg-blue-50/20">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-900">
                                    Faturamento Hoje
                                </CardTitle>
                                <Calendar className="h-4 w-4 text-[#48B9FA]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-[#48B9FA]">
                                    {formatCurrency(data.kpis.today_revenue)}
                                </div>
                                <p className="text-xs text-blue-700 mt-1">Vendas aprovadas no dia</p>
                            </CardContent>
                        </Card>

                        <Card className="border-emerald-200 bg-emerald-50/20">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                                    Faturamento do Mês
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-emerald-600">
                                    {formatCurrency(data.kpis.month_revenue)}
                                </div>
                                <p className="text-xs text-emerald-700 mt-1">Acumulado do mês corrente</p>
                            </CardContent>
                        </Card>

                        <Card className="border-purple-200 bg-purple-50/20">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-purple-800">
                                    Ticket Médio Online
                                </CardTitle>
                                <ShoppingBag className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-purple-600">
                                    {formatCurrency(data.kpis.average_ticket)}
                                </div>
                                <p className="text-xs text-purple-700 mt-1">Média por pedido concluído</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Performance do E-commerce: Conversão & Pedidos Pendentes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    Taxa de Conversão do E-commerce
                                </CardTitle>
                                <CardDescription>Proporção de pedidos que foram concluídos e pagos com sucesso</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-3xl font-black text-emerald-700">
                                        {data.kpis.conversion_rate}%
                                    </span>
                                    <Badge variant="secondary" className="font-bold text-xs bg-emerald-50 text-emerald-800 border-emerald-200">
                                        {data.kpis.paid_orders_count} de {data.kpis.all_orders_count} pedidos pagos
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Taxa calculada com base em todos os pedidos iniciados no site.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-amber-200 bg-amber-50/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2 text-amber-950">
                                    <Clock className="h-5 w-5 text-amber-600" />
                                    Faturamento Pendente (Aguardando PIX)
                                </CardTitle>
                                <CardDescription>Pedidos criados no checkout aguardando confirmação do vendedor</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-3xl font-black text-amber-700">
                                        {formatCurrency(data.kpis.pending_revenue)}
                                    </span>
                                    <Badge variant="secondary" className="font-bold text-xs bg-amber-100 text-amber-800 border-amber-300">
                                        {data.kpis.pending_orders_count} pedido(s) em aberto
                                    </Badge>
                                </div>
                                <p className="text-xs text-amber-800/80">
                                    Assim que o PIX for verificado em conta, aprove o pedido no painel para liberar a entrega.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* MÉTODOS DE PAGAMENTO DO E-COMMERCE */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold font-serif flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Métodos de Pagamento do E-commerce
                            </h3>
                            <span className="text-xs text-muted-foreground">
                                Total de {data.payment_methods.length} método(s) ativo(s)
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {data.payment_methods.map((method) => {
                                const IconComponent = METHOD_ICONS[method.id] || DollarSign
                                return (
                                    <Card key={method.id} className="border-border hover:shadow-sm transition-shadow">
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                                                        style={{ backgroundColor: method.color }}
                                                    >
                                                        <IconComponent className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-bold text-sm leading-tight">
                                                        {method.label}
                                                    </span>
                                                </div>
                                                <Badge variant="outline" className="text-xs font-bold font-mono">
                                                    {method.percentage}%
                                                </Badge>
                                            </div>

                                            <div>
                                                <div className="text-xl font-black">{formatCurrency(method.total)}</div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {method.count} transação(ões)
                                                </p>
                                            </div>

                                            {/* Barra de Progresso visual */}
                                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${Math.max(method.percentage, 4)}%`,
                                                        backgroundColor: method.color,
                                                    }}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>

                    {/* Gráficos Financeiros */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Gráfico de Barras: Faturamento Diário do E-commerce */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    Faturamento Diário do E-commerce (Últimos 30 Dias)
                                </CardTitle>
                                <CardDescription>Receita diária gerada nas vendas online da loja</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.daily_chart}>
                                        <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={11}
                                            tickLine={false}
                                            tickFormatter={(val) => `R$${val}`}
                                        />
                                        <Tooltip
                                            formatter={(value: any) => [formatCurrency(Number(value)), "Faturamento"]}
                                        />
                                        <Bar dataKey="revenue" name="Vendas Online" fill="#48B9FA" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Gráfico de Pizza: Divisão por Método de Pagamento */}
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <PieChartIcon className="h-4 w-4 text-primary" />
                                    Distribuição por Método
                                </CardTitle>
                                <CardDescription>Participação no faturamento online</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[280px] flex items-center justify-center">
                                {data.payment_methods.some((m) => m.total > 0) ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.payment_methods}
                                                dataKey="total"
                                                nameKey="label"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={80}
                                                paddingAngle={4}
                                            >
                                                {data.payment_methods.map((entry) => (
                                                    <Cell key={entry.id} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-xs text-muted-foreground text-center">
                                        Nenhuma venda registrada ainda para desenhar o gráfico.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabela de Transações / Extrato de Vendas do E-commerce */}
                    <Card>
                        <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div>
                                <CardTitle className="text-base">Extrato de Vendas do E-commerce</CardTitle>
                                <CardDescription>Histórico das vendas online e recebimentos de pedidos</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                                    <SelectTrigger className="w-[160px] h-8 text-xs cursor-pointer">
                                        <SelectValue placeholder="Status do Pedido" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os Status</SelectItem>
                                        <SelectItem value="paid">Pagos / Confirmados</SelectItem>
                                        <SelectItem value="pending">Aguardando Pagamento</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={selectedMethodFilter} onValueChange={setSelectedMethodFilter}>
                                    <SelectTrigger className="w-[140px] h-8 text-xs cursor-pointer">
                                        <SelectValue placeholder="Método" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos Métodos</SelectItem>
                                        <SelectItem value="pix">PIX</SelectItem>
                                        <SelectItem value="card">Cartão</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pedido</TableHead>
                                        <TableHead>Comprador & Nick Roblox</TableHead>
                                        <TableHead>Método</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Status Pagamento</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                Nenhum pedido encontrado para os filtros selecionados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTransactions.map((tx) => {
                                            const isPaid = tx.status === "PAID" || tx.status === "CONFIRMED" || tx.payment_status === "completed"

                                            return (
                                                <TableRow key={tx.id}>
                                                    <TableCell className="font-mono text-xs font-bold text-neutral-900">
                                                        {tx.external_id}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <span className="font-medium text-sm block">{tx.customer_name}</span>
                                                            {tx.roblox_username ? (
                                                                <span className="inline-flex items-center gap-1 text-[11px] text-[#48B9FA] font-semibold">
                                                                    <Gamepad2 className="w-3 h-3" /> {tx.roblox_username}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[11px] text-muted-foreground">{tx.customer_email}</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-xs bg-blue-50 text-[#48B9FA] border-blue-200 gap-1 font-semibold">
                                                            <QrCode className="w-3 h-3" /> PIX
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {new Date(tx.created_at).toLocaleDateString("pt-BR")}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                                                isPaid
                                                                    ? "bg-emerald-100 text-emerald-800"
                                                                    : "bg-amber-100 text-amber-800"
                                                            }`}
                                                        >
                                                            {isPaid ? "✅ Pago" : "⏳ Aguardando"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-sm">
                                                        {formatCurrency(tx.total)}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            ) : null}
        </div>
    )
}
