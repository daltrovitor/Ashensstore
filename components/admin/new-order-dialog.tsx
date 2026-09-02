"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Printer, Store, Save } from "lucide-react"
import { toast } from "sonner"
import { fetchWithAuth } from "@/lib/utils/fetch"
import { OrderReceiptPrint } from "./order-receipt-print"

interface OrderItemForm {
    quantity: number
    unit: string
    name: string
    unit_price: string
}

const emptyItem: OrderItemForm = {
    quantity: 1,
    unit: "un",
    name: "",
    unit_price: "",
}

interface NewOrderDialogProps {
    onOrderCreated?: () => void
}

export function NewOrderDialog({ onOrderCreated }: NewOrderDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [createdOrderForPrint, setCreatedOrderForPrint] = useState<any | null>(null)

    // Form fields based on the physical Librás receipt
    const [formData, setFormData] = useState({
        receipt_number: "",
        customer_name: "",
        customer_phone: "",
        customer_document: "", // CNPJ/CPF
        state_registration: "", // Insc. Estadual
        machine_number: "", // Nº da Máquina
        address: "",
        neighborhood: "", // Setor
        city: "Goiânia",
        state: "GO",
        zip: "",
        payment_method: "pix",
        payment_status: "completed", // "completed" or "pending"
        status: "CONFIRMED", // CONFIRMED, IN_PRODUCTION, DELIVERED
    })

    const [items, setItems] = useState<OrderItemForm[]>([
        { ...emptyItem },
    ])

    const addItem = () => {
        setItems([...items, { ...emptyItem }])
    }

    const removeItem = (idx: number) => {
        if (items.length <= 1) {
            setItems([{ ...emptyItem }])
            return
        }
        setItems(items.filter((_, i) => i !== idx))
    }

    const updateItem = (idx: number, field: keyof OrderItemForm, val: any) => {
        const updated = [...items]
        updated[idx] = { ...updated[idx], [field]: val }
        setItems(updated)
    }

    const parseNum = (val: string) => {
        const num = parseFloat(val.toString().replace(/\./g, "").replace(",", "."))
        return isNaN(num) ? 0 : num
    }

    const calculateTotal = () => {
        return items.reduce((sum, item) => {
            const price = parseNum(item.unit_price)
            return sum + item.quantity * price
        }, 0)
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)

    const handleSave = async (shouldPrint: boolean = false) => {
        if (!formData.customer_name.trim()) {
            toast.error("Por favor, preencha o nome do cliente.")
            return
        }

        const validItems = items.filter((i) => i.name.trim() !== "")
        if (validItems.length === 0) {
            toast.error("Adicione pelo menos um item ou serviço ao pedido.")
            return
        }

        setIsSaving(true)

        try {
            const total = calculateTotal()
            const payload = {
                action: "create_local_order",
                data: {
                    receipt_number: formData.receipt_number || undefined,
                    customer_name: formData.customer_name,
                    customer_phone: formData.customer_phone,
                    customer_document: formData.customer_document,
                    state_registration: formData.state_registration,
                    machine_number: formData.machine_number,
                    address: formData.address,
                    neighborhood: formData.neighborhood,
                    city: formData.city,
                    state_code: formData.state,
                    zip: formData.zip,
                    payment_method: formData.payment_method,
                    payment_status: formData.payment_status,
                    status: formData.status,
                    total,
                    items: validItems.map((item) => {
                        const unitPrice = parseNum(item.unit_price)
                        return {
                            name: item.name,
                            quantity: item.quantity,
                            unit: item.unit,
                            unit_price: unitPrice,
                            total_price: item.quantity * unitPrice,
                        }
                    }),
                },
            }

            const res = await fetchWithAuth("/api/admin/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            const resData = await res.json()

            if (res.ok) {
                toast.success("Venda local / Ordem de serviço registrada com sucesso!")
                const created = resData.order || {
                    external_id: resData.external_id || "LOC-" + Date.now(),
                    created_at: new Date().toISOString(),
                    customer_name: formData.customer_name,
                    customer_phone: formData.customer_phone,
                    customer_document: formData.customer_document,
                    state_registration: formData.state_registration,
                    machine_number: formData.machine_number,
                    address: formData.address,
                    neighborhood: formData.neighborhood,
                    city: formData.city,
                    state: formData.state,
                    zip: formData.zip,
                    total,
                    payment_method: formData.payment_method,
                    items: validItems.map((item) => ({
                        quantity: item.quantity,
                        unit: item.unit,
                        name: item.name,
                        unit_price: parseNum(item.unit_price),
                        total_price: item.quantity * parseNum(item.unit_price),
                    })),
                }

                if (shouldPrint) {
                    setCreatedOrderForPrint(created)
                } else {
                    setOpen(false)
                }

                if (onOrderCreated) {
                    onOrderCreated()
                }
            } else {
                toast.error(resData.error || "Erro ao criar pedido local")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao conectar com o servidor")
        } finally {
            setIsSaving(false)
        }
    }

    const resetDialog = () => {
        setFormData({
            receipt_number: "",
            customer_name: "",
            customer_phone: "",
            customer_document: "",
            state_registration: "",
            machine_number: "",
            address: "",
            neighborhood: "",
            city: "Goiânia",
            state: "GO",
            zip: "",
            payment_method: "pix",
            payment_status: "completed",
            status: "CONFIRMED",
        })
        setItems([{ ...emptyItem }])
        setCreatedOrderForPrint(null)
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(val) => {
                setOpen(val)
                if (!val) resetDialog()
            }}
        >
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                    <Store className="w-4 h-4" /> Nova Venda Local / Talão
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                {createdOrderForPrint ? (
                    <OrderReceiptPrint
                        order={createdOrderForPrint}
                        onClose={() => {
                            setCreatedOrderForPrint(null)
                            setOpen(false)
                        }}
                    />
                ) : (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                                    <Store className="w-5 h-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-serif font-black">
                                        Criar Nova Venda Local / Ordem de Serviço
                                    </DialogTitle>
                                    <p className="text-xs text-muted-foreground">
                                        Preencha os dados do talão oficial da Librás para registrar uma venda no balcão ou serviço de oficina.
                                    </p>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-6 py-3">
                            {/* Bloco 1: Cabeçalho do Talão */}
                            <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        1. Identificação do Talão & Equipamento
                                    </h4>
                                    <span className="text-[11px] font-mono text-muted-foreground">Librás • Goiânia-GO</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Nº do Talão (Opcional)</Label>
                                        <Input
                                            placeholder="Ex: 3508"
                                            value={formData.receipt_number}
                                            onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                                            className="h-8 text-sm font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <Label className="text-xs font-bold text-red-600">
                                            Nº da Máquina / Equipamento
                                        </Label>
                                        <Input
                                            placeholder="Ex: Balança Toledo Mod. Prix 3 / Nº Série 88472"
                                            value={formData.machine_number}
                                            onChange={(e) => setFormData({ ...formData, machine_number: e.target.value })}
                                            className="h-8 text-sm border-red-200 focus-visible:ring-red-500 font-semibold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bloco 2: Dados do Cliente */}
                            <div className="p-4 rounded-xl border bg-card space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">
                                    2. Dados do Cliente
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1 sm:col-span-2">
                                        <Label className="text-xs">Nome / Razão Social *</Label>
                                        <Input
                                            placeholder="Nome completo do cliente ou empresa"
                                            value={formData.customer_name}
                                            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                            className="h-8 text-sm"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs">Telefone / WhatsApp</Label>
                                        <Input
                                            placeholder="(62) 99999-9999"
                                            value={formData.customer_phone}
                                            onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                                            className="h-8 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs">CNPJ / CPF</Label>
                                        <Input
                                            placeholder="00.000.000/0000-00"
                                            value={formData.customer_document}
                                            onChange={(e) => setFormData({ ...formData, customer_document: e.target.value })}
                                            className="h-8 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs">Inscrição Estadual nº</Label>
                                        <Input
                                            placeholder="Insc. Estadual"
                                            value={formData.state_registration}
                                            onChange={(e) => setFormData({ ...formData, state_registration: e.target.value })}
                                            className="h-8 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs">CEP</Label>
                                        <Input
                                            placeholder="74000-000"
                                            value={formData.zip}
                                            onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                            className="h-8 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-1 sm:col-span-2">
                                        <Label className="text-xs">Endereço (Rua e Número)</Label>
                                        <Input
                                            placeholder="Av. Exemplo, Nº 123"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="h-8 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs">Setor (Bairro)</Label>
                                        <Input
                                            placeholder="Ex: Setor Coimbra"
                                            value={formData.neighborhood}
                                            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                            className="h-8 text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Cidade</Label>
                                            <Input
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Estado</Label>
                                            <Input
                                                value={formData.state}
                                                maxLength={2}
                                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bloco 3: Tabela de Itens e Discriminação dos Serviços */}
                            <div className="p-4 rounded-xl border bg-card space-y-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        3. Discriminação dos Serviços e Produtos
                                    </h4>
                                    <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 text-xs gap-1">
                                        <Plus className="w-3.5 h-3.5" /> Adicionar Linha
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {items.map((item, idx) => {
                                        const unitPrice = parseNum(item.unit_price)
                                        const itemTotal = item.quantity * unitPrice

                                        return (
                                            <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 rounded-lg bg-muted/20 border">
                                                <div className="w-16">
                                                    <Label className="text-[10px] text-muted-foreground">QUANT.</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                                                        className="h-8 text-center text-xs font-mono"
                                                    />
                                                </div>

                                                <div className="w-20">
                                                    <Label className="text-[10px] text-muted-foreground">UNID.</Label>
                                                    <Input
                                                        placeholder="un"
                                                        value={item.unit}
                                                        onChange={(e) => updateItem(idx, "unit", e.target.value)}
                                                        className="h-8 text-center text-xs uppercase"
                                                    />
                                                </div>

                                                <div className="flex-1 w-full sm:w-auto">
                                                    <Label className="text-[10px] text-muted-foreground">
                                                        DISCRIMINAÇÃO DOS SERVIÇOS / PRODUTOS
                                                    </Label>
                                                    <Input
                                                        placeholder="Ex: Calibração de balança, troca de célula de carga, etc."
                                                        value={item.name}
                                                        onChange={(e) => updateItem(idx, "name", e.target.value)}
                                                        className="h-8 text-xs"
                                                    />
                                                </div>

                                                <div className="w-24">
                                                    <Label className="text-[10px] text-muted-foreground">UNITÁRIO</Label>
                                                    <Input
                                                        placeholder="0,00"
                                                        value={item.unit_price}
                                                        onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                                                        className="h-8 text-right text-xs font-mono"
                                                    />
                                                </div>

                                                <div className="w-24 text-right pr-2">
                                                    <Label className="text-[10px] text-muted-foreground block">TOTAL</Label>
                                                    <span className="font-bold text-xs font-mono block pt-1.5">
                                                        {formatCurrency(itemTotal)}
                                                    </span>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeItem(idx)}
                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 mt-4 sm:mt-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="flex justify-end items-center gap-3 pt-3 border-t">
                                    <span className="text-sm font-bold text-muted-foreground uppercase">
                                        Total do Pedido:
                                    </span>
                                    <span className="text-2xl font-black font-mono text-primary">
                                        {formatCurrency(calculateTotal())}
                                    </span>
                                </div>
                            </div>

                            {/* Bloco 4: Pagamento e Status */}
                            <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">
                                    4. Pagamento e Status do Pedido
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Forma de Pagamento</Label>
                                        <Select
                                            value={formData.payment_method}
                                            onValueChange={(val) => setFormData({ ...formData, payment_method: val })}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pix">PIX (Direto CNPJ)</SelectItem>
                                                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                                <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                                                <SelectItem value="cash">Dinheiro</SelectItem>
                                                <SelectItem value="boleto">Boleto / A Prazo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs">Status do Pagamento</Label>
                                        <Select
                                            value={formData.payment_status}
                                            onValueChange={(val) => setFormData({ ...formData, payment_status: val })}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="completed">Pago (Recebido)</SelectItem>
                                                <SelectItem value="pending">Pendente (A receber)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs">Status da Ordem / Pedido</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(val) => setFormData({ ...formData, status: val })}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                                                <SelectItem value="IN_PRODUCTION">Em Oficina / Preparação</SelectItem>
                                                <SelectItem value="DELIVERED">Entregue / Concluído</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isSaving}
                            >
                                Cancelar
                            </Button>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleSave(true)}
                                    disabled={isSaving}
                                    className="gap-1.5"
                                >
                                    <Printer className="w-4 h-4 text-red-600" /> Salvar e Imprimir Talão
                                </Button>

                                <Button
                                    type="button"
                                    onClick={() => handleSave(false)}
                                    disabled={isSaving}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                                >
                                    <Save className="w-4 h-4" /> {isSaving ? "Salvando..." : "Salvar Venda"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
