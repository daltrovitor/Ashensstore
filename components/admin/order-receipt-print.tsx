"use client"

import { Printer, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReceiptOrder {
    external_id: string
    receipt_number?: string
    created_at: string
    customer_name: string
    customer_phone?: string
    customer_document?: string // CNPJ/CPF
    state_registration?: string // Insc. Estadual
    machine_number?: string // Nº da Máquina
    address?: string
    neighborhood?: string // Setor
    city?: string
    state?: string
    zip?: string
    items: Array<{
        quantity: number
        unit?: string
        name: string
        unit_price: number
        total_price: number
    }>
    total: number
    payment_method?: string
    payment_status?: string
}

interface OrderReceiptPrintProps {
    order: ReceiptOrder
    onClose?: () => void
}

export function OrderReceiptPrint({ order, onClose }: OrderReceiptPrintProps) {
    const handlePrint = () => {
        window.print()
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)

    const dateFormatted = order.created_at
        ? new Date(order.created_at).toLocaleDateString("pt-BR")
        : new Date().toLocaleDateString("pt-BR")

    // Garante no mínimo 7 linhas de itens para preencher visualmente o talão como no original
    const emptyRowsCount = Math.max(0, 8 - (order.items?.length || 0))
    const emptyRows = Array.from({ length: emptyRowsCount })

    const receiptNum = order.receipt_number || order.external_id.replace(/\D/g, "").slice(-4) || "3508"

    return (
        <div className="space-y-4">
            {/* Barra superior de ações (não aparece na impressão) */}
            <div className="flex justify-between items-center bg-muted/60 p-3 rounded-lg print:hidden">
                <div className="text-xs text-muted-foreground">
                    Visualização do <strong>Talão de Pedido / Ordem de Serviço</strong> da Librás
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handlePrint} className="bg-red-600 hover:bg-red-700 text-white gap-1.5 text-xs font-bold">
                        <Printer className="w-4 h-4" /> Imprimir Talão
                    </Button>
                    {onClose && (
                        <Button size="sm" variant="outline" onClick={onClose} className="h-8 text-xs">
                            <X className="w-3.5 h-3.5 mr-1" /> Fechar
                        </Button>
                    )}
                </div>
            </div>

            {/* TALÃO OFICIAL LIBRÁS (ÁREA DE IMPRESSÃO) */}
            <div
                id="printable-receipt"
                className="bg-white border-2 border-red-600 rounded-md p-6 max-w-3xl mx-auto text-red-700 font-sans shadow-md print:shadow-none print:border-red-600 print:m-0 print:p-4 print:max-w-none text-xs leading-tight"
            >
                {/* Cabeçalho */}
                <div className="flex justify-between items-start border-b-2 border-red-600 pb-3 mb-3">
                    {/* Logotipo Librás */}
                    <div>
                        <div className="text-4xl font-black tracking-tighter text-red-600 font-serif leading-none">
                            LIBRÁS
                        </div>
                        <div className="text-[10px] tracking-widest text-red-500 font-semibold uppercase mt-0.5">
                            Balanças e Máquinas Comerciais
                        </div>
                    </div>

                    {/* Data e Número */}
                    <div className="text-center px-4">
                        <div className="text-xs font-semibold">
                            Data: <span className="font-bold underline text-black">{dateFormatted}</span>
                        </div>
                        <div className="mt-1">
                            <span className="font-serif italic text-base mr-1">№</span>
                            <span className="text-2xl font-black font-mono tracking-wider text-red-600">
                                {receiptNum}
                            </span>
                        </div>
                    </div>

                    {/* Endereço da Empresa */}
                    <div className="text-right text-[11px] leading-tight text-red-600">
                        <p className="font-bold">Av. 210, Nº 294, Setor Coimbra</p>
                        <p>Goiânia, Goiás - CEP: 74.535-280</p>
                        <p className="font-black text-sm mt-0.5">Fone: (62) 3235-7122</p>
                    </div>
                </div>

                {/* Campos do Cliente */}
                <div className="space-y-1.5 mb-3">
                    {/* Linha 1: Nome */}
                    <div className="flex items-baseline">
                        <span className="font-bold w-16 shrink-0">Nome:</span>
                        <div className="border-b border-red-600 flex-1 px-2 font-medium text-black h-5 flex items-center">
                            {order.customer_name || ""}
                        </div>
                    </div>

                    {/* Linha 2: Endereço e Setor */}
                    <div className="flex items-baseline gap-2">
                        <div className="flex items-baseline flex-1">
                            <span className="font-bold w-20 shrink-0">Endereço:</span>
                            <div className="border-b border-red-600 flex-1 px-2 font-medium text-black h-5 flex items-center">
                                {order.address || ""}
                            </div>
                        </div>
                        <div className="flex items-baseline w-52 shrink-0">
                            <span className="font-bold w-14 shrink-0">Setor:</span>
                            <div className="border-b border-red-600 flex-1 px-2 font-medium text-black h-5 flex items-center">
                                {order.neighborhood || ""}
                            </div>
                        </div>
                    </div>

                    {/* Linha 3: Cidade, Fone, Estado */}
                    <div className="flex items-baseline gap-2">
                        <div className="flex items-baseline flex-1">
                            <span className="font-bold w-16 shrink-0">Cidade:</span>
                            <div className="border-b border-red-600 flex-1 px-2 font-medium text-black h-5 flex items-center">
                                {order.city || "Goiânia"}
                            </div>
                        </div>
                        <div className="flex items-baseline w-44 shrink-0">
                            <span className="font-bold w-12 shrink-0">Fone:</span>
                            <div className="border-b border-red-600 flex-1 px-2 font-medium text-black h-5 flex items-center">
                                {order.customer_phone || ""}
                            </div>
                        </div>
                        <div className="flex items-baseline w-24 shrink-0">
                            <span className="font-bold w-14 shrink-0">Estado:</span>
                            <div className="border-b border-red-600 flex-1 px-2 font-medium text-black h-5 flex items-center">
                                {order.state || "GO"}
                            </div>
                        </div>
                    </div>

                    {/* Linha 4: CNPJ / CPF e Inscrição Estadual */}
                    <div className="flex items-baseline gap-2">
                        <div className="flex items-baseline flex-1">
                            <span className="font-bold w-24 shrink-0">CNPJ / CPF:</span>
                            <div className="border-b border-red-600 flex-1 px-2 font-medium text-black h-5 flex items-center">
                                {order.customer_document || ""}
                            </div>
                        </div>
                        <div className="flex items-baseline flex-1">
                            <span className="font-bold w-32 shrink-0">Insc. Estadual nº:</span>
                            <div className="border-b border-red-600 flex-1 px-2 font-medium text-black h-5 flex items-center">
                                {order.state_registration || ""}
                            </div>
                        </div>
                    </div>

                    {/* Linha 5: Nº da Máquina e CEP */}
                    <div className="flex items-baseline gap-2">
                        <div className="flex items-baseline flex-1">
                            <span className="font-bold w-28 shrink-0 text-red-700">Nº da Máquina:</span>
                            <div className="border-b border-red-600 flex-1 px-2 font-bold text-red-800 h-5 flex items-center">
                                {order.machine_number || "—"}
                            </div>
                        </div>
                        <div className="flex items-baseline w-48 shrink-0">
                            <span className="font-bold w-12 shrink-0">CEP:</span>
                            <div className="border-b border-red-600 flex-1 px-2 font-medium text-black h-5 flex items-center">
                                {order.zip || ""}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabela de Serviços e Itens */}
                <div className="border border-red-600 mb-3">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-red-600 text-white font-bold text-[11px] tracking-wide">
                                <th className="p-1.5 border-r border-red-400 w-16 text-center">QUANT.</th>
                                <th className="p-1.5 border-r border-red-400 w-16 text-center">UNID.</th>
                                <th className="p-1.5 border-r border-red-400">DISCRIMINAÇÃO DOS SERVIÇOS / PRODUTOS</th>
                                <th className="p-1.5 border-r border-red-400 w-24 text-right">UNITÁRIO</th>
                                <th className="p-1.5 w-24 text-right">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-red-200">
                            {order.items?.map((item, idx) => (
                                <tr key={idx} className="h-6 text-black">
                                    <td className="p-1 border-r border-red-600 text-center font-mono">
                                        {item.quantity}
                                    </td>
                                    <td className="p-1 border-r border-red-600 text-center text-[10px] uppercase">
                                        {item.unit || "un"}
                                    </td>
                                    <td className="p-1 border-r border-red-600 font-medium">
                                        {item.name}
                                    </td>
                                    <td className="p-1 border-r border-red-600 text-right font-mono">
                                        {formatCurrency(item.unit_price)}
                                    </td>
                                    <td className="p-1 text-right font-mono font-bold">
                                        {formatCurrency(item.total_price)}
                                    </td>
                                </tr>
                            ))}

                            {/* Linhas vazias para manter o layout idêntico ao talão original */}
                            {emptyRows.map((_, i) => (
                                <tr key={`empty-${i}`} className="h-6">
                                    <td className="border-r border-red-600">&nbsp;</td>
                                    <td className="border-r border-red-600">&nbsp;</td>
                                    <td className="border-r border-red-600">&nbsp;</td>
                                    <td className="border-r border-red-600">&nbsp;</td>
                                    <td>&nbsp;</td>
                                </tr>
                            ))}

                            {/* Linha de Total Geral */}
                            <tr className="bg-red-50/50 font-bold border-t-2 border-red-600 text-xs">
                                <td colSpan={3} className="p-2 border-r border-red-600 text-right text-red-700 uppercase tracking-wider">
                                    Forma de Pagto: <span className="text-black font-semibold uppercase ml-1">{order.payment_method || "À Vista"}</span>
                                </td>
                                <td className="p-2 border-r border-red-600 text-right text-red-700 uppercase font-black">
                                    TOTAL GERAL:
                                </td>
                                <td className="p-2 text-right text-red-600 font-black text-sm font-mono">
                                    {formatCurrency(order.total)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* CANHOTO DESTACÁVEL (RODAPÉ) */}
                <div className="border-t-2 border-dashed border-red-600 pt-3 mt-4 space-y-2">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 text-[10px] leading-relaxed text-red-700">
                            <strong>AVISO:</strong> Se não pegar a máquina na oficina no prazo de <strong>90 dias</strong>, será cobrado uma taxa de permanência. <strong>Só entregamos a mercadoria com a apresentação deste canhoto.</strong>
                        </div>
                        <div className="text-right shrink-0">
                            <span className="font-serif italic text-sm mr-1">№</span>
                            <span className="text-xl font-black font-mono tracking-wider text-red-600">
                                {receiptNum}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-baseline justify-between gap-6 pt-2">
                        <div className="flex items-baseline flex-1">
                            <span className="font-bold w-28 shrink-0 text-[11px]">Nº da Máquina:</span>
                            <div className="border-b border-red-600 flex-1 px-2 font-bold text-black h-5 flex items-center">
                                {order.machine_number || "—"}
                            </div>
                        </div>

                        <div className="flex items-baseline flex-1">
                            <span className="font-bold w-10 shrink-0 text-[11px]">Ass.:</span>
                            <div className="border-b border-red-600 flex-1 h-5"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estilo CSS para impressão perfeita */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-receipt, #printable-receipt * {
                        visibility: visible;
                    }
                    #printable-receipt {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        border: 2px solid #dc2626 !important;
                    }
                }
            `}</style>
        </div>
    )
}
