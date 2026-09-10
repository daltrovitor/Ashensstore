"use client"

import { useState, useEffect } from "react"
import {
    Boxes,
    CheckCircle2,
    XCircle,
    Search,
    RefreshCw,
    TrendingUp,
    DollarSign,
    Package,
    Save,
    AlertCircle,
    Image as ImageIcon,
    Pencil,
    Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { fetchWithAuth } from "@/lib/utils/fetch"
import { DigitalStockDialog } from "@/components/admin/digital-stock-dialog"

export interface VariantItem {
    id: string
    product_id: string
    name: string
    price: number
    retail_price: number
    cost_price: number
    in_stock: boolean
    stock?: number
    size: string | null
    color: string | null
}

export interface ProductItem {
    id: string
    name: string
    slug: string
    thumbnail_url: string | null
    category_id: string | null
    category_name: string
    is_active: boolean
    variants: VariantItem[]
}

interface InventorySummary {
    total_products: number
    total_variants: number
    in_stock_variants: number
    out_of_stock_variants: number
    stock_health_percentage: number
    estimated_retail_value: number
    estimated_cost_value: number
}

interface InventoryManagerProps {
    onEditProduct?: (product: ProductItem) => void
    onProductDeleted?: () => void
}

export function InventoryManager({ onEditProduct, onProductDeleted }: InventoryManagerProps = {}) {
    const [products, setProducts] = useState<ProductItem[]>([])
    const [summary, setSummary] = useState<InventorySummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all") // all, in_stock, out_of_stock
    const [savingId, setSavingId] = useState<string | null>(null)
    const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [digitalStockTarget, setDigitalStockTarget] = useState<{
        productId: string
        productName: string
        variantId?: string
    } | null>(null)

    // Local edits for cost / retail price / stock quantity before saving
    const [priceEdits, setPriceEdits] = useState<Record<string, { retail_price?: string; cost_price?: string; stock?: string }>>({})
    const [isSavingAll, setIsSavingAll] = useState(false)

    useEffect(() => {
        fetchInventory()
    }, [])

    const fetchInventory = async () => {
        setLoading(true)
        try {
            const res = await fetchWithAuth("/api/admin/inventory")
            if (res.ok) {
                const data = await res.json()
                setProducts(data.products || [])
                setSummary(data.summary || null)
            } else {
                toast.error("Erro ao carregar dados de estoque")
            }
        } catch (error) {
            console.error("Erro:", error)
            toast.error("Erro ao conectar com o servidor")
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStock = async (variant: VariantItem) => {
        const newStatus = !variant.in_stock
        setSavingId(variant.id)

        try {
            const res = await fetchWithAuth("/api/admin/inventory", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    variant_id: variant.id,
                    in_stock: newStatus,
                }),
            })

            if (res.ok) {
                toast.success(`Estoque ${newStatus ? "ativado" : "pausado"} para ${variant.name}`)
                // Update local state
                setProducts((prev) =>
                    prev.map((p) => ({
                        ...p,
                        variants: p.variants.map((v) =>
                            v.id === variant.id ? { ...v, in_stock: newStatus } : v
                        ),
                    }))
                )
                // Refresh summary in background
                fetchInventory()
            } else {
                toast.error("Erro ao atualizar status de estoque")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao salvar alteração")
        } finally {
            setSavingId(null)
        }
    }

    const handleSavePrices = async (variant: VariantItem) => {
        const edit = priceEdits[variant.id]
        if (!edit) return

        setSavingId(variant.id)
        try {
            const payload: any = { variant_id: variant.id }
            if (edit.retail_price !== undefined) {
                const num = parseFloat(edit.retail_price.replace(/\./g, "").replace(",", "."))
                if (!isNaN(num)) payload.retail_price = num
            }
            if (edit.cost_price !== undefined) {
                const num = parseFloat(edit.cost_price.replace(/\./g, "").replace(",", "."))
                if (!isNaN(num)) payload.cost_price = num
            }
            if (edit.stock !== undefined) {
                const s = parseInt(edit.stock, 10)
                if (!isNaN(s)) {
                    payload.stock = Math.max(0, s)
                    payload.in_stock = s > 0
                }
            }

            const res = await fetchWithAuth("/api/admin/inventory", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (res.ok) {
                toast.success("Dados do produto atualizados com sucesso!")
                // Clear local edit for this variant
                setPriceEdits((prev) => {
                    const copy = { ...prev }
                    delete copy[variant.id]
                    return copy
                })
                fetchInventory()
            } else {
                toast.error("Erro ao salvar preços")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao conectar com o servidor")
        } finally {
            setSavingId(null)
        }
    }

    const handleSaveAllPending = async () => {
        const variantIds = Object.keys(priceEdits)
        if (variantIds.length === 0) return

        setIsSavingAll(true)
        try {
            let successCount = 0
            for (const vId of variantIds) {
                const edit = priceEdits[vId]
                const payload: any = { variant_id: vId }
                if (edit.retail_price !== undefined) {
                    const num = parseFloat(edit.retail_price.replace(/\./g, "").replace(",", "."))
                    if (!isNaN(num)) payload.retail_price = num
                }
                if (edit.cost_price !== undefined) {
                    const num = parseFloat(edit.cost_price.replace(/\./g, "").replace(",", "."))
                    if (!isNaN(num)) payload.cost_price = num
                }
                if (edit.stock !== undefined) {
                    const s = parseInt(edit.stock, 10)
                    if (!isNaN(s)) {
                        payload.stock = Math.max(0, s)
                        payload.in_stock = s > 0
                    }
                }

                const res = await fetchWithAuth("/api/admin/inventory", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })
                if (res.ok) successCount++
            }

            toast.success(`${successCount} item(ns) de estoque atualizado(s) com sucesso!`)
            setPriceEdits({})
            fetchInventory()
        } catch (error) {
            console.error(error)
            toast.error("Erro ao salvar alterações no estoque")
        } finally {
            setIsSavingAll(false)
        }
    }

    const handleDeleteProduct = async () => {
        if (!productToDelete) return
        setIsDeleting(true)
        try {
            const res = await fetchWithAuth(`/api/admin/products/${productToDelete.id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                toast.success(`Produto "${productToDelete.name}" excluído com sucesso!`)
                setProducts(prev => prev.filter(p => p.id !== productToDelete.id))
                setProductToDelete(null)
                onProductDeleted?.()
                fetchInventory()
            } else {
                const data = await res.json()
                toast.error(data.error || "Erro ao excluir produto")
            }
        } catch (e) {
            console.error("Delete product error:", e)
            toast.error("Erro ao conectar com o servidor para excluir produto")
        } finally {
            setIsDeleting(false)
        }
    }

    // Filter products
    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.variants.some((v) => v.name.toLowerCase().includes(searchTerm.toLowerCase()))

        if (!matchesSearch) return false

        if (statusFilter === "in_stock") {
            return product.variants.some((v) => v.in_stock)
        }
        if (statusFilter === "out_of_stock") {
            return product.variants.some((v) => !v.in_stock)
        }
        return true
    })

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)

    return (
        <div className="space-y-6">
            {/* Header com Atualização */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold">Controle de Estoque</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Gerencie a disponibilidade, preços de custo e margens de produtos e variações.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchInventory} disabled={loading} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
                </Button>
            </div>

            {/* Cards de Resumo */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-border/60">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Total de Produtos
                            </CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black">{summary.total_products}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {summary.total_variants} variações cadastradas
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-200 bg-emerald-50/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                                Em Estoque
                            </CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-emerald-600">
                                {summary.in_stock_variants}
                            </div>
                            <p className="text-xs text-emerald-700 mt-1">
                                {summary.stock_health_percentage}% do catálogo disponível
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-red-700">
                                Esgotados / Pausados
                            </CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-red-600">
                                {summary.out_of_stock_variants}
                            </div>
                            <p className="text-xs text-red-700 mt-1">
                                Itens indisponíveis para venda
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                                Valor de Venda do Catálogo
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-blue-700">
                                {formatCurrency(summary.estimated_retail_value)}
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                                Custo total estimado: {formatCurrency(summary.estimated_cost_value)}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filtros e Busca */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por produto, variação ou categoria..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Disponibilidade" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Itens</SelectItem>
                        <SelectItem value="in_stock">Em Estoque</SelectItem>
                        <SelectItem value="out_of_stock">Esgotados</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Barra de Alterações Pendentes com Salvamento em Lote */}
            {Object.keys(priceEdits).length > 0 && (
                <div className="sticky top-2 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-neutral-900 text-white rounded-lg shadow-xl border border-neutral-700 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs sm:text-sm font-semibold">
                            {Object.keys(priceEdits).length} item(ns) com alterações não salvas no estoque / preços
                        </span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-neutral-300 border-neutral-600 hover:bg-neutral-800 hover:text-white cursor-pointer"
                            onClick={() => setPriceEdits({})}
                            disabled={isSavingAll}
                        >
                            Descartar
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm cursor-pointer"
                            onClick={handleSaveAllPending}
                            disabled={isSavingAll}
                        >
                            <Save className="w-3.5 h-3.5" />
                            {isSavingAll ? "Salvando Todas..." : "Salvar Todas as Alterações"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Tabela de Estoque */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto w-full">
                        <Table className="min-w-[980px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Foto</TableHead>
                                    <TableHead className="min-w-[200px]">Produto / Variação</TableHead>
                                    <TableHead className="min-w-[130px]">Categoria</TableHead>
                                    <TableHead className="w-28">Qtd. Estoque</TableHead>
                                    <TableHead className="w-28">Preço Venda (R$)</TableHead>
                                    <TableHead className="w-24">Preço Custo (R$)</TableHead>
                                    <TableHead className="w-20">Margem (%)</TableHead>
                                    <TableHead className="min-w-[170px]">Status Estoque</TableHead>
                                    <TableHead className="text-right min-w-[130px]">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-12">
                                            <Spinner />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                                            Nenhum produto encontrado com os filtros aplicados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProducts.flatMap((product) =>
                                        (product.variants || []).map((variant, vIdx) => {
                                            const retailVal =
                                                priceEdits[variant.id]?.retail_price !== undefined
                                                    ? (priceEdits[variant.id]?.retail_price ?? "")
                                                    : (variant.retail_price || variant.price || 0).toString()

                                            const costVal =
                                                priceEdits[variant.id]?.cost_price !== undefined
                                                    ? (priceEdits[variant.id]?.cost_price ?? "")
                                                    : (variant.cost_price || 0).toString()

                                            const stockVal =
                                                priceEdits[variant.id]?.stock !== undefined
                                                    ? (priceEdits[variant.id]?.stock ?? "")
                                                    : (variant.stock !== undefined ? variant.stock : (variant.in_stock ? 10 : 0)).toString()

                                            const currentRetail = parseFloat((retailVal || "0").replace(/\./g, "").replace(",", ".")) || 0
                                            const currentCost = parseFloat((costVal || "0").replace(/\./g, "").replace(",", ".")) || 0
                                            const numStock = parseInt(stockVal || "0", 10) || 0
                                            const margin =
                                                currentRetail > 0
                                                    ? Math.round(((currentRetail - currentCost) / currentRetail) * 100)
                                                    : 0

                                            const hasPendingEdit = !!priceEdits[variant.id]

                                            return (
                                                <TableRow key={variant.id} className={!variant.in_stock || numStock === 0 ? "bg-muted/10" : ""}>
                                                    <TableCell>
                                                        <div className="w-10 h-10 rounded-md overflow-hidden bg-muted border flex items-center justify-center">
                                                            {product.thumbnail_url ? (
                                                                <img
                                                                    src={product.thumbnail_url}
                                                                    alt={product.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <span className="font-semibold text-sm">{product.name}</span>
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                                                    {variant.name || "Padrão"}
                                                                </Badge>
                                                                {variant.size && <span>Tam: {variant.size}</span>}
                                                                {variant.color && <span>Cor: {variant.color}</span>}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-xs text-muted-foreground">
                                                            {product.category_name}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    className={`w-20 h-8 text-xs font-mono font-bold text-center ${
                                                                        numStock === 0 ? "border-red-400 bg-red-50 text-red-700" : ""
                                                                    }`}
                                                                    value={stockVal}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleSavePrices(variant)
                                                                    }}
                                                                    onChange={(e) => {
                                                                        setPriceEdits((prev) => ({
                                                                            ...prev,
                                                                            [variant.id]: {
                                                                                ...prev[variant.id],
                                                                                stock: e.target.value,
                                                                            },
                                                                        }))
                                                                    }}
                                                                />
                                                                <span className="text-[10px] text-muted-foreground">un</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-mono font-bold cursor-pointer transition-colors"
                                                                    title="Zerar estoque (0)"
                                                                    onClick={() => {
                                                                        setPriceEdits(prev => ({
                                                                            ...prev,
                                                                            [variant.id]: { ...prev[variant.id], stock: "0" }
                                                                        }))
                                                                    }}
                                                                >
                                                                    0
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-mono font-bold cursor-pointer transition-colors"
                                                                    title="Adicionar +5 ao estoque"
                                                                    onClick={() => {
                                                                        setPriceEdits(prev => ({
                                                                            ...prev,
                                                                            [variant.id]: { ...prev[variant.id], stock: (numStock + 5).toString() }
                                                                        }))
                                                                    }}
                                                                >
                                                                    +5
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-mono font-bold cursor-pointer transition-colors"
                                                                    title="Adicionar +10 ao estoque"
                                                                    onClick={() => {
                                                                        setPriceEdits(prev => ({
                                                                            ...prev,
                                                                            [variant.id]: { ...prev[variant.id], stock: (numStock + 10).toString() }
                                                                        }))
                                                                    }}
                                                                >
                                                                    +10
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            className="w-24 h-8 text-xs font-mono"
                                                            value={retailVal}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSavePrices(variant)
                                                            }}
                                                            onChange={(e) => {
                                                                setPriceEdits((prev) => ({
                                                                    ...prev,
                                                                    [variant.id]: {
                                                                        ...prev[variant.id],
                                                                        retail_price: e.target.value,
                                                                    },
                                                                }))
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            className="w-24 h-8 text-xs font-mono"
                                                            value={costVal}
                                                            placeholder="0,00"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSavePrices(variant)
                                                            }}
                                                            onChange={(e) => {
                                                                setPriceEdits((prev) => ({
                                                                    ...prev,
                                                                    [variant.id]: {
                                                                        ...prev[variant.id],
                                                                        cost_price: e.target.value,
                                                                    },
                                                                }))
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                                margin > 40
                                                                    ? "bg-green-100 text-green-800"
                                                                    : margin > 20
                                                                    ? "bg-yellow-100 text-yellow-800"
                                                                    : "bg-gray-100 text-gray-700"
                                                                }`}
                                                        >
                                                            {margin}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={variant.in_stock && numStock > 0}
                                                                onCheckedChange={() => handleToggleStock(variant)}
                                                                disabled={savingId === variant.id}
                                                            />
                                                            <span
                                                                className={`text-xs font-semibold ${
                                                                    variant.in_stock && numStock > 0 ? "text-emerald-700" : "text-red-600"
                                                                }`}
                                                            >
                                                                {variant.in_stock && numStock > 0 ? `Em Estoque (${numStock})` : "Esgotado"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 px-2 gap-1 text-xs border-[#48B9FA]/40 text-[#0284c7] hover:bg-[#48B9FA]/10 font-medium cursor-pointer"
                                                                onClick={() => setDigitalStockTarget({
                                                                    productId: product.id,
                                                                    productName: product.name,
                                                                    variantId: variant.id,
                                                                })}
                                                                title="Gerenciar mensagens de estoque para entrega automática"
                                                            >
                                                                <Boxes className="h-3.5 w-3.5 text-[#48B9FA]" />
                                                                <span>Mensagens</span>
                                                            </Button>

                                                            {hasPendingEdit && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="default"
                                                                    className="h-8 px-2.5 gap-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                    onClick={() => handleSavePrices(variant)}
                                                                    disabled={savingId === variant.id}
                                                                    title="Salvar alterações de preço/estoque"
                                                                >
                                                                    <Save className="h-3.5 w-3.5" /> Salvar
                                                                </Button>
                                                            )}

                                                            {onEditProduct && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                    onClick={() => onEditProduct(product)}
                                                                    title="Editar produto completo (fotos, nome, categoria)"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            )}

                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => setProductToDelete(product)}
                                                                title="Excluir este produto"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Diálogo de Confirmação de Exclusão de Produto */}
            <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o produto <strong>"{productToDelete?.name}"</strong>? 
                            Esta ação removerá permanentemente o produto, suas variações e fotos associadas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleDeleteProduct()
                            }}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {digitalStockTarget && (
                <DigitalStockDialog
                    open={!!digitalStockTarget}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDigitalStockTarget(null)
                            fetchInventory()
                        }
                    }}
                    productId={digitalStockTarget.productId}
                    productName={digitalStockTarget.productName}
                    variantId={digitalStockTarget.variantId}
                    onStockUpdated={() => {
                        fetchInventory()
                    }}
                />
            )}
        </div>
    )
}
