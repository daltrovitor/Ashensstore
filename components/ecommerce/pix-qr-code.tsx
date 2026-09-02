"use client"

import { useState, useEffect } from "react"
import QRCode from "qrcode"
import { Copy, Check, QrCode, ArrowRight, ShieldCheck, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { COMPANY_PIX_DATA } from "@/lib/pix/brcode"

interface PixQrCodeProps {
    pixCode: string
    amount: number
    orderId?: string
    onConfirm?: () => void
}

export function PixQrCode({ pixCode, amount, orderId, onConfirm }: PixQrCodeProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string>("")
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!pixCode) return

        QRCode.toDataURL(pixCode, {
            width: 320,
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

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(pixCode)
            setCopied(true)
            toast.success("Código Pix Copia e Cola copiado com sucesso!")
            setTimeout(() => setCopied(false), 3000)
        } catch (err) {
            console.error("Erro ao copiar:", err)
            toast.error("Não foi possível copiar automaticamente. Selecione e copie o código.")
        }
    }

    const formattedAmount = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(amount)

    const whatsappMessage = encodeURIComponent(
        `Olá Librás! Acabei de realizar o pagamento do pedido ${orderId || ""} no valor de ${formattedAmount} via Pix.`
    )

    return (
        <div className="space-y-6 max-w-lg mx-auto">
            <Card className="border-2 border-emerald-500/30 bg-emerald-50/20 shadow-sm">
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        <ShieldCheck className="h-4 w-4" /> Pagamento Direto via Pix (Sem Taxas)
                    </div>

                    <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Valor Total a Pagar</p>
                        <p className="text-3xl font-black text-emerald-600 font-sans mt-0.5">{formattedAmount}</p>
                    </div>

                    {/* QR Code Container */}
                    <div className="bg-white p-4 rounded-xl border inline-block shadow-sm">
                        {qrDataUrl ? (
                            <img
                                src={qrDataUrl}
                                alt="QR Code Pix"
                                className="w-56 h-56 mx-auto object-contain"
                            />
                        ) : (
                            <div className="w-56 h-56 flex flex-col items-center justify-center bg-muted/40 rounded-lg text-muted-foreground gap-2">
                                <QrCode className="h-10 w-10 animate-pulse text-muted-foreground/50" />
                                <span className="text-xs">Gerando QR Code...</span>
                            </div>
                        )}
                    </div>

                    {/* Dados do Recebedor */}
                    <div className="text-xs text-muted-foreground bg-white/70 p-3 rounded-lg border text-left space-y-1">
                        <div className="flex justify-between">
                            <span className="font-semibold text-foreground">Beneficiário:</span>
                            <span>{COMPANY_PIX_DATA.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-foreground">Chave Pix (CNPJ):</span>
                            <span className="font-mono">{COMPANY_PIX_DATA.cnpjFormatted}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-foreground">Cidade:</span>
                            <span>{COMPANY_PIX_DATA.city}</span>
                        </div>
                        {orderId && (
                            <div className="flex justify-between">
                                <span className="font-semibold text-foreground">Identificador / Pedido:</span>
                                <span className="font-mono">{orderId}</span>
                            </div>
                        )}
                    </div>

                    {/* Botão Copia e Cola */}
                    <div className="space-y-2">
                        <Button
                            type="button"
                            onClick={handleCopy}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 gap-2 text-sm shadow"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-5 w-5" /> Código Copiado!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-5 w-5" /> Copiar Código Pix (Copia e Cola)
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Input somente leitura com o código */}
                    <div className="text-left">
                        <p className="text-[11px] text-muted-foreground mb-1">Se preferir, selecione o código abaixo:</p>
                        <textarea
                            readOnly
                            value={pixCode}
                            rows={2}
                            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                            className="w-full text-[10px] font-mono p-2 bg-muted/50 border rounded resize-none select-all text-muted-foreground"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Como Pagar Passo a Passo */}
            <div className="border rounded-xl p-5 bg-card space-y-3 text-sm">
                <h4 className="font-bold flex items-center gap-2 text-foreground">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">i</span>
                    Como pagar com Pix:
                </h4>
                <ol className="space-y-2.5 text-xs text-muted-foreground list-decimal pl-4">
                    <li>Abra o aplicativo do seu banco ou carteira digital favorita.</li>
                    <li>Acesse a área **Pix** e selecione **"Pagar com QR Code"** ou **"Pix Copia e Cola"**.</li>
                    <li>Aponte a câmera para o QR Code acima ou cole o código copiado.</li>
                    <li>Confira o nome **LIBRAS** e o valor de **{formattedAmount}**, depois confirme o pagamento.</li>
                </ol>
            </div>

            {/* Ações pós pagamento */}
            <div className="space-y-2 pt-2">
                {onConfirm && (
                    <Button
                        type="button"
                        onClick={onConfirm}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12"
                    >
                        Já realizei o pagamento <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}

                <Button
                    type="button"
                    variant="outline"
                    className="w-full text-xs gap-2"
                    asChild
                >
                    <a
                        href={`https://wa.me/556232357122?text=${whatsappMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Phone className="h-4 w-4 text-emerald-600" />
                        Enviar comprovante via WhatsApp da Librás ((62) 3235-7122)
                    </a>
                </Button>
            </div>
        </div>
    )
}
