"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import {
    Package,
    Plus,
    Trash2,
    CheckCircle2,
    Clock,
    AlertCircle,
    Copy,
    Check
} from "lucide-react"

interface DigitalStockItem {
    id: string
    productId: string
    variantId?: string
    message: string
    status: 'available' | 'delivered'
    createdAt: string
    deliveredAt?: string
    deliveredToOrderExternalId?: string
}

interface DigitalStockDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    productId: string
    productName: string
    variantId?: string
    onStockUpdated?: (newCount: number) => void
}

export function DigitalStockDialog({
    open,
    onOpenChange,
    productId,
    productName,
    variantId,
    onStockUpdated,
}: DigitalStockDialogProps) {
    const [loading, setLoading] = useState(false)
    const [adding, setAdding] = useState(false)
    const [messagesText, setMessagesText] = useState("")
    const [availableItems, setAvailableItems] = useState<DigitalStockItem[]>([])
    const [deliveredItems, setDeliveredItems] = useState<DigitalStockItem[]>([])
    const [activeTab, setActiveTab] = useState<'available' | 'delivered'>('available')
    const [copiedId, setCopiedId] = useState<string | null>(null)

    useEffect(() => {
        if (open && productId) {
            loadStock()
        }
    }, [open, productId, variantId])

    const loadStock = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ productId })
            if (variantId) params.append('variantId', variantId)

            const res = await fetch(`/api/admin/digital-stock?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                setAvailableItems(data.available || [])
                setDeliveredItems(data.delivered || [])
                if (onStockUpdated) {
                    onStockUpdated(data.totalAvailable || 0)
                }
            } else {
                toast.error("Erro ao carregar mensagens de estoque")
            }
        } catch (err) {
            console.error(err)
            toast.error("Erro ao carregar estoque")
        } finally {
            setLoading(false)
        }
    }

    const handleAddMessages = async () => {
        const lines = messagesText
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0)

        if (lines.length === 0) {
            toast.warning("Digite ao menos uma mensagem para adicionar ao estoque.")
            return
        }

        setAdding(true)
        try {
            const res = await fetch('/api/admin/digital-stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    variantId,
                    messagesText,
                }),
            })

            const data = await res.json()
            if (res.ok && data.success) {
                toast.success(data.message || `${lines.length} mensagem(ns) adicionada(s)!`)
                setMessagesText("")
                await loadStock()
            } else {
                toast.error(data.error || "Erro ao adicionar mensagens")
            }
        } catch (err) {
            console.error(err)
            toast.error("Erro ao adicionar mensagens")
        } finally {
            setAdding(false)
        }
    }

    const handleDeleteItem = async (itemId: string) => {
        try {
            const res = await fetch(`/api/admin/digital-stock?id=${itemId}`, {
                method: 'DELETE',
            })
            const data = await res.json()
            if (res.ok && data.success) {
                toast.success("Mensagem removida do estoque")
                await loadStock()
            } else {
                toast.error(data.error || "Erro ao remover mensagem")
            }
        } catch (err) {
            console.error(err)
            toast.error("Erro ao remover mensagem")
        }
    }

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        toast.success("Copiado para a área de transferência")
        setTimeout(() => setCopiedId(null), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-neutral-200">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold text-neutral-900">
                        <Package className="h-5 w-5 text-[#48B9FA]" />
                        Estoque Digital por Mensagens
                    </DialogTitle>
                    <DialogDescription className="text-xs text-neutral-500">
                        Produto: <strong className="text-neutral-900">{productName}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Explicativo e Contador */}
                    <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                            <span className="text-xs text-neutral-500 block">Status do Estoque</span>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs px-2.5 py-0.5">
                                    {availableItems.length} disponível(is)
                                </Badge>
                                <span className="text-xs text-neutral-600">
                                    {deliveredItems.length} entregue(s)
                                </span>
                            </div>
                        </div>
                        <p className="text-[11px] text-neutral-500 max-w-xs leading-relaxed">
                            Ao confirmar o pagamento de um pedido, o sistema escolhe <strong>aleatoriamente</strong> uma dessas mensagens, envia no chat do cliente e reduz o estoque.
                        </p>
                    </div>

                    {/* Formulário para Adicionar Novas Mensagens */}
                    <div className="border border-neutral-200 rounded-sm p-4 space-y-3 bg-white">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5 text-[#48B9FA]" />
                                Adicionar Mensagens ao Estoque
                            </label>
                            <span className="text-[11px] text-neutral-400">Uma mensagem por linha</span>
                        </div>
                        <Textarea
                            rows={3}
                            placeholder={`Cole aqui as mensagens/contas/chaves (uma por linha):\nEx: Conta: fulano1 | Senha: 123456\nEx: Chave: BLOX-FRUITS-XYZ999`}
                            value={messagesText}
                            onChange={(e) => setMessagesText(e.target.value)}
                            className="text-xs font-mono bg-neutral-50 border-neutral-300 focus-visible:ring-[#48B9FA] resize-none"
                        />
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-[11px] text-neutral-400">
                                {messagesText.split('\n').filter(l => l.trim().length > 0).length} mensagem(ns) a adicionar
                            </span>
                            <Button
                                size="sm"
                                onClick={handleAddMessages}
                                disabled={adding || !messagesText.trim()}
                                className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-semibold text-xs h-8 px-4 rounded-sm cursor-pointer"
                            >
                                {adding ? (
                                    <>
                                        <Spinner className="h-3 w-3 mr-1.5" />
                                        Adicionando...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        Adicionar ao Estoque
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Abas: Disponíveis vs Entregues */}
                    <div className="space-y-3">
                        <div className="flex border-b border-neutral-200 gap-4 text-xs font-medium">
                            <button
                                type="button"
                                onClick={() => setActiveTab('available')}
                                className={`pb-2 border-b-2 cursor-pointer transition-colors ${
                                    activeTab === 'available'
                                        ? 'border-[#48B9FA] text-[#48B9FA] font-bold'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-900'
                                }`}
                            >
                                Disponíveis ({availableItems.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('delivered')}
                                className={`pb-2 border-b-2 cursor-pointer transition-colors ${
                                    activeTab === 'delivered'
                                        ? 'border-[#48B9FA] text-[#48B9FA] font-bold'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-900'
                                }`}
                            >
                                Histórico de Entregas ({deliveredItems.length})
                            </button>
                        </div>

                        {loading ? (
                            <div className="py-8 text-center">
                                <Spinner className="h-6 w-6 mx-auto text-neutral-400" />
                                <span className="text-xs text-neutral-400 mt-2 block">Carregando estoque...</span>
                            </div>
                        ) : activeTab === 'available' ? (
                            availableItems.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-neutral-200 rounded-sm">
                                    <AlertCircle className="h-6 w-6 mx-auto text-amber-500 mb-1" />
                                    <p className="text-xs font-semibold text-neutral-700">Estoque Esgotado</p>
                                    <p className="text-[11px] text-neutral-400 mt-0.5">
                                        Nenhuma mensagem cadastrada. Adicione mensagens acima para liberar o estoque deste produto.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {availableItems.map((item, idx) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start justify-between gap-2 p-2.5 bg-neutral-50 border border-neutral-200 rounded-sm text-xs font-mono group"
                                        >
                                            <div className="flex items-start gap-2 overflow-hidden">
                                                <span className="text-[10px] text-neutral-400 font-sans mt-0.5">
                                                    #{idx + 1}
                                                </span>
                                                <span className="text-neutral-800 break-all select-all whitespace-pre-wrap">
                                                    {item.message}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(item.message, item.id)}
                                                    className="p-1 text-neutral-400 hover:text-neutral-700 rounded transition-colors"
                                                    title="Copiar"
                                                >
                                                    {copiedId === item.id ? (
                                                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="p-1 text-neutral-400 hover:text-red-600 rounded transition-colors"
                                                    title="Excluir mensagem do estoque"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : deliveredItems.length === 0 ? (
                            <div className="text-center py-8 border border-dashed border-neutral-200 rounded-sm">
                                <Clock className="h-6 w-6 mx-auto text-neutral-300 mb-1" />
                                <p className="text-xs font-semibold text-neutral-600">Nenhuma entrega realizada ainda</p>
                                <p className="text-[11px] text-neutral-400 mt-0.5">
                                    As mensagens sorteadas e entregues para clientes aparecerão aqui.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {deliveredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-sm text-xs font-mono space-y-1"
                                    >
                                        <div className="flex items-center justify-between text-[11px] text-neutral-500 font-sans">
                                            <span className="font-semibold text-blue-700 flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3 text-blue-600" />
                                                Pedido #{item.deliveredToOrderExternalId || 'N/A'}
                                            </span>
                                            <span>
                                                {item.deliveredAt ? new Date(item.deliveredAt).toLocaleString('pt-BR') : ''}
                                            </span>
                                        </div>
                                        <div className="text-neutral-800 break-all select-all whitespace-pre-wrap pt-0.5">
                                            {item.message}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
