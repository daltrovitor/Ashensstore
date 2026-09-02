"use client"

import { useState, useEffect } from "react"
import {
    DollarSign,
    TrendingUp,
    CreditCard,
    QrCode,
    Banknote,
    FileText,
    ShoppingBag,
    Store,
    RefreshCw,
    Calendar,
    ArrowUpRight,
    PieChart as PieChartIcon
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

interface FinancialData {
    kpis: {
        total_revenue: number
        today_revenue: number
        month_revenue: number
        average_ticket: number
        paid_orders_count: number
        all_orders_count: number
    }
    channels: {
        ecommerce: { total: number; count: number; percentage: number }
        local: { total: number; count: number; percentage: number }
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
        ecommerce: number
        local: number
        total: number
    }>
    recent_transactions: any[]
}

const METHOD_ICONS: Record<string, any> = {
    pix: QrCode,
    credit_card: CreditCard,
    debit_card: CreditCard,
    card: CreditCard,
    cash: Banknote,
    boleto: FileText,
    other: DollarSign,
}

export function FinancialManager() {
    const [data, setData] = useState<FinancialData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedMethodFilter, setSelectedMethodFilter] = useState("all")
    const [selectedChannelFilter, setSelectedChannelFilter] = useState("all")

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
            const method = (tx.payment_method || "other").toLowerCase()
            if (!method.includes(selectedMethodFilter)) return false
        }
        if (selectedChannelFilter !== "all") {
            const type = tx.shipping_address?.order_type || "ecommerce"
            if (selectedChannelFilter === "local" && type !== "local" && type !== "loja" && type !== "balcao") return false
            if (selectedChannelFilter === "ecommerce" && (type === "local" || type === "loja" || type === "balcao")) return false
        }
        return true
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold">Gestão Financeira</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Faturamento, fluxo de caixa e separação detalhada por métodos de pagamento e canais.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchFinancial} disabled={loading} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
                </Button>
            </div>

            {loading && !data ? (
                <div className="text-center py-20">
                    <Spinner />
                    <p className="text-sm text-muted-foreground mt-2">Calculando fluxo financeiro...</p>
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
                                <DollarSign className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-foreground">
                                    {formatCurrency(data.kpis.total_revenue)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                                    {data.kpis.paid_orders_count} pedidos pagos no total
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-emerald-200 bg-emerald-50/20">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                                    Faturamento Hoje
                                </CardTitle>
                                <Calendar className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-emerald-600">
                                    {formatCurrency(data.kpis.today_revenue)}
                                </div>
                                <p className="text-xs text-emerald-700 mt-1">Entradas do dia atual</p>
                            </CardContent>
                        </Card>

                        <Card className="border-blue-200 bg-blue-50/20">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-800">
                                    Faturamento do Mês
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-blue-600">
                                    {formatCurrency(data.kpis.month_revenue)}
                                </div>
                                <p className="text-xs text-blue-700 mt-1">Acumulado do mês corrente</p>
                            </CardContent>
                        </Card>

                        <Card className="border-purple-200 bg-purple-50/20">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-purple-800">
                                    Ticket Médio
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-purple-600">
                                    {formatCurrency(data.kpis.average_ticket)}
                                </div>
                                <p className="text-xs text-purple-700 mt-1">Média por pedido concluído</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Comparativo de Canais: E-commerce vs Venda Local */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                                    🛒 Canal: E-commerce (Loja Online)
                                </CardTitle>
                                <CardDescription>Vendas realizadas através do site</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-2xl font-black text-blue-700">
                                        {formatCurrency(data.channels.ecommerce.total)}
                                    </span>
                                    <Badge variant="secondary" className="font-bold">
                                        {data.channels.ecommerce.percentage}% do total
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {data.channels.ecommerce.count} venda(s) registrada(s)
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Store className="h-5 w-5 text-emerald-600" />
                                    🏪 Canal: Venda Local / Oficina (Balcão)
                                </CardTitle>
                                <CardDescription>Vendas e ordens de serviço criadas pela loja</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-2xl font-black text-emerald-700">
                                        {formatCurrency(data.channels.local.total)}
                                    </span>
                                    <Badge variant="secondary" className="font-bold">
                                        {data.channels.local.percentage}% do total
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {data.channels.local.count} venda(s) registrada(s)
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* MÉTODOS DE PAGAMENTO SEPARADOS */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold font-serif flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Métodos de Pagamento Separados
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
                        {/* Gráfico de Barras: Faturamento Diário */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    Faturamento Diário dos Últimos 30 Dias
                                </CardTitle>
                                <CardDescription>Comparação diária entre E-commerce e Venda Local</CardDescription>
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
                                            formatter={(value: any) => [formatCurrency(Number(value)), ""]}
                                        />
                                        <Legend />
                                        <Bar dataKey="ecommerce" name="E-commerce" fill="#2563EB" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="local" name="Venda Local" fill="#10B981" radius={[4, 4, 0, 0]} />
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
                                <CardDescription>Participação no faturamento total</CardDescription>
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

                    {/* Tabela de Transações / Fluxo Financeiro Recente */}
                    <Card>
                        <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div>
                                <CardTitle className="text-base">Extrato Financeiro Recente</CardTitle>
                                <CardDescription>Histórico das últimas movimentações e pagamentos</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={selectedChannelFilter} onValueChange={setSelectedChannelFilter}>
                                    <SelectTrigger className="w-[140px] h-8 text-xs">
                                        <SelectValue placeholder="Canal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos Canais</SelectItem>
                                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                                        <SelectItem value="local">Venda Local</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={selectedMethodFilter} onValueChange={setSelectedMethodFilter}>
                                    <SelectTrigger className="w-[140px] h-8 text-xs">
                                        <SelectValue placeholder="Método" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos Métodos</SelectItem>
                                        <SelectItem value="pix">PIX</SelectItem>
                                        <SelectItem value="card">Cartão</SelectItem>
                                        <SelectItem value="cash">Dinheiro</SelectItem>
                                        <SelectItem value="boleto">Boleto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pedido</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Canal</TableHead>
                                        <TableHead>Método de Pagamento</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Status Pagamento</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                Nenhuma transação encontrada para os filtros selecionados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTransactions.map((tx: any) => {
                                            const isLocal =
                                                tx.shipping_address?.order_type === "local" ||
                                                tx.shipping_address?.order_type === "loja" ||
                                                tx.shipping_address?.order_type === "balcao"

                                            const method = (tx.payment_method || "other").toLowerCase()

                                            return (
                                                <TableRow key={tx.id}>
                                                    <TableCell className="font-mono text-xs font-bold">
                                                        {tx.external_id}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-medium text-sm">{tx.customer_name || "Cliente Balcão"}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {isLocal ? (
                                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-[11px]">
                                                                <Store className="w-3 h-3" /> Venda Local
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 text-[11px]">
                                                                <ShoppingBag className="w-3 h-3" /> E-commerce
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="capitalize text-xs">
                                                            {method === "pix" ? "🟢 PIX Direto" : method.includes("card") ? "🔵 Cartão" : method === "cash" ? "💵 Dinheiro" : method}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {new Date(tx.created_at).toLocaleDateString("pt-BR")}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                tx.payment_status === "completed" || tx.status === "PAID"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-yellow-100 text-yellow-700"
                                                            }`}
                                                        >
                                                            {tx.payment_status === "completed" || tx.status === "PAID" ? "Pago" : "Pendente"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        {formatCurrency(parseFloat(tx.total) || 0)}
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
