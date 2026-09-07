"use client"

import { useState, useEffect } from "react"
import QRCode from "qrcode"
import { Copy, Check, QrCode, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { PIX_CONFIG } from "@/lib/config/pix"

interface PixQrCodeProps {
    pixCode: string
    amount: number
    orderId?: string
    onConfirm?: () => void
}

export function PixQrCode({ pixCode, amount, orderId, onConfirm }: PixQrCodeProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string>("")
    const [copiedCode, setCopiedCode] = useState(false)

    useEffect(() => {
        if (!pixCode) return

        QRCode.toDataURL(pixCode, {
            width: 380,
            margin: 2,
            color: {
                dark: "#000000",
                light: "#FFFFFF",
            },
            errorCorrectionLevel: "M",
        })
            .then((url) => setQrDataUrl(url))
            .catch((err) => {
                console.error("Erro ao gerar QR Code:", err)
            })
    }, [pixCode])

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(pixCode)
            setCopiedCode(true)
            toast.success("Código Copia e Cola copiado com sucesso!")
            setTimeout(() => setCopiedCode(false), 3000)
        } catch {
            toast.error("Não foi possível copiar automaticamente.")
        }
    }

    const formattedAmount = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(amount)

    return (
        <div className="space-y-6 max-w-md mx-auto">
            <div className="bg-white border border-neutral-200 rounded-sm p-6 sm:p-8 text-center space-y-6">
                <div>
                    <span className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
                        Valor a pagar via PIX
                    </span>
                    <p className="text-3xl font-semibold text-neutral-900 mt-1">
                        {formattedAmount}
                    </p>
                    {orderId && (
                        <p className="text-xs text-neutral-400 font-mono mt-1">
                            Pedido #{orderId}
                        </p>
                    )}
                </div>

                {/* QR Code Principal */}
                <div className="p-3 bg-white border border-neutral-200 rounded-sm inline-block shadow-sm">
                    {qrDataUrl ? (
                        <img
                            src={qrDataUrl}
                            alt="QR Code Pix"
                            className="w-64 h-64 mx-auto object-contain"
                        />
                    ) : (
                        <div className="w-64 h-64 flex flex-col items-center justify-center bg-neutral-50 text-neutral-400 gap-2">
                            <QrCode className="h-8 w-8 animate-pulse text-neutral-500" />
                            <span className="text-xs">Gerando QR Code...</span>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <p className="text-xs text-neutral-600 font-medium leading-relaxed">
                        Abra o app do seu banco e escaneie o QR Code acima para efetuar o pagamento.
                    </p>
                    <p className="text-[11px] text-neutral-400">
                        Beneficiário: <span className="text-neutral-700 font-medium">{PIX_CONFIG.name}</span>
                    </p>
                </div>

                {/* Opção Secundária: Pix Copia e Cola */}
                <div className="pt-2 border-t border-neutral-100 space-y-2">
                    <button
                        type="button"
                        onClick={handleCopyCode}
                        className="w-full h-10 text-xs font-medium text-neutral-800 bg-neutral-50 border border-neutral-300 rounded-sm hover:bg-neutral-100 hover:border-black transition-colors flex items-center justify-center gap-2"
                    >
                        {copiedCode ? (
                            <>
                                <Check className="h-4 w-4 text-emerald-600" />
                                <span>Código Copiado!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4 text-neutral-600" />
                                <span>Copiar Código Pix Copia e Cola</span>
                            </>
                        )}
                    </button>
                    <p className="text-[10px] text-neutral-400">
                        Use o botão acima se estiver realizando a compra diretamente no seu celular.
                    </p>
                </div>
            </div>

            {/* Ação pós pagamento */}
            {onConfirm && (
                <button
                    type="button"
                    onClick={onConfirm}
                    className="w-full h-12 bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-bold text-sm rounded-md transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.99]"
                >
                    <span>Já realizei o pagamento / Acompanhar Pedido</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}
