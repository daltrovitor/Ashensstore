"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/hooks/use-shopping-cart"
import { Loader2, QrCode, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { formatPhone } from "@/components/ui/inputMasks"
import { PixQrCode } from "@/components/ecommerce/pix-qr-code"

const checkoutSchema = z.object({
    fullName: z.string().min(2, "Nome completo é obrigatório"),
    robloxUsername: z.string().min(2, "Nick do Roblox é obrigatório para a entrega"),
    email: z.string().email("E-mail válido é obrigatório"),
    phone: z.string().min(10, "WhatsApp / Telefone válido é obrigatório"),
    deliveryNotes: z.string().optional(),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

export function CheckoutForm() {
    const { cart, clearCart } = useCart()
    const router = useRouter()
    const [isProcessing, setIsProcessing] = useState(false)
    const [pixData, setPixData] = useState<{
        pix_code: string
        order_id: string
        total: number
    } | null>(null)
    const [couponInput, setCouponInput] = useState("")
    const [appliedCoupon, setAppliedCoupon] = useState<{
        code: string
        discount_percent: number
    } | null>(null)
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            fullName: '',
            robloxUsername: '',
            email: '',
            phone: '',
            deliveryNotes: '',
        }
    })

    const formatPrice = (p: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(p)
    }

    const discountAmount = appliedCoupon ? Math.round((cart.total * (appliedCoupon.discount_percent / 100)) * 100) / 100 : 0
    const finalTotal = Math.max(0, cart.total - discountAmount)

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return
        setIsValidatingCoupon(true)
        try {
            const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(couponInput.trim())}`)
            const data = await res.json()
            if (res.ok && data.valid) {
                setAppliedCoupon({
                    code: data.coupon_code,
                    discount_percent: data.discount_percent || 10,
                })
                toast.success(`Cupom "${data.coupon_code}" aplicado com 10% de desconto!`)
            } else {
                toast.error(data.error || "Cupom inválido")
            }
        } catch {
            toast.error("Erro ao validar cupom")
        } finally {
            setIsValidatingCoupon(false)
        }
    }

    const onSubmit = async (data: CheckoutFormData) => {
        if (!cart.items || cart.items.length === 0) {
            toast.error("Seu carrinho está vazio")
            return
        }

        setIsProcessing(true)

        try {
            const payload = {
                payment_method: 'pix' as const,
                coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
                items: cart.items.map(item => ({
                    variant_id: item.variant_id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                })),
                customer: {
                    name: data.fullName,
                    roblox_username: data.robloxUsername,
                    email: data.email,
                    phone: data.phone,
                    delivery_notes: data.deliveryNotes,
                },
            }

            const res = await fetch('/api/checkout/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const result = await res.json()

            if (!res.ok || !result.success) {
                throw new Error(result.error || result.message || 'Erro ao processar pedido')
            }

            setPixData({
                pix_code: result.pix_code,
                order_id: result.order_id,
                total: result.total,
            })

            // Limpa o carrinho após gerar o pedido
            clearCart()
            toast.success("Pedido gerado com sucesso!")

        } catch (error: any) {
            console.error('Erro no checkout:', error)
            toast.error(error.message || "Falha ao gerar pedido. Tente novamente.")
        } finally {
            setIsProcessing(false)
        }
    }

    // Se o pedido PIX foi gerado, exibe o QR Code Pix diretamente
    if (pixData) {
        return (
            <div className="space-y-6">
                <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-6 text-center space-y-2">
                    <h2 className="text-xl font-bold text-neutral-900">Pedido #{pixData.order_id}</h2>
                    <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
                        Escaneie o QR Code abaixo com o app do seu banco para pagar via PIX. Após pagar, clique no botão azul abaixo <strong>&quot;Já realizei o pagamento / Acompanhar Pedido&quot;</strong> para acompanhar a confirmação em tempo real e receber seus itens no Roblox.
                    </p>
                </div>

                <PixQrCode
                    pixCode={pixData.pix_code}
                    amount={pixData.total}
                    orderId={pixData.order_id}
                    onConfirm={() => {
                        router.push(`/pedidos?order_id=${encodeURIComponent(pixData.order_id)}`)
                    }}
                />
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações da Entrega no Roblox */}
            <div className="bg-white border border-neutral-200 rounded-sm p-6 space-y-4">
                <div className="border-b border-neutral-200 pb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                        1. Dados para Entrega no Roblox
                    </h3>
                </div>

                {/* Nick do Roblox */}
                <div className="space-y-1.5">
                    <Label htmlFor="robloxUsername" className="text-neutral-800 text-xs font-medium">
                        Nome de Usuário no Roblox (Nick) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="robloxUsername"
                        placeholder="Ex: SeuNickNoRoblox"
                        {...register("robloxUsername")}
                        className="bg-neutral-50 border-neutral-300 focus-visible:ring-[#48B9FA] text-neutral-900 text-xs h-10 rounded-sm"
                    />
                    {errors.robloxUsername && (
                        <p className="text-xs text-red-500">{errors.robloxUsername.message}</p>
                    )}
                    <p className="text-[11px] text-neutral-400">
                        Informe o @usuário exato da sua conta para realizarmos a entrega via trade ou servidor VIP.
                    </p>
                </div>

                {/* Observações de Entrega */}
                <div className="space-y-1.5">
                    <Label htmlFor="deliveryNotes" className="text-neutral-800 text-xs font-medium">
                        Instruções ou Observações (Opcional)
                    </Label>
                    <Textarea
                        id="deliveryNotes"
                        placeholder="Ex: Estou no Segundo Mar, posso receber hoje à noite..."
                        rows={2}
                        {...register("deliveryNotes")}
                        className="bg-neutral-50 border-neutral-300 focus-visible:ring-[#48B9FA] text-neutral-900 text-xs rounded-sm resize-none"
                    />
                </div>
            </div>

            {/* Informações do Comprador */}
            <div className="bg-white border border-neutral-200 rounded-sm p-6 space-y-4">
                <div className="border-b border-neutral-200 pb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                        2. Dados de Contato
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nome Completo */}
                    <div className="space-y-1.5">
                        <Label htmlFor="fullName" className="text-neutral-800 text-xs font-medium">
                            Nome Completo <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="fullName"
                            placeholder="Seu nome completo"
                            {...register("fullName")}
                            className="bg-neutral-50 border-neutral-300 focus-visible:ring-[#48B9FA] text-neutral-900 text-xs h-10 rounded-sm"
                        />
                        {errors.fullName && (
                            <p className="text-xs text-red-500">{errors.fullName.message}</p>
                        )}
                    </div>

                    {/* WhatsApp / Telefone */}
                    <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-neutral-800 text-xs font-medium">
                            WhatsApp / Celular <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="phone"
                            placeholder="(00) 00000-0000"
                            {...register("phone")}
                            onChange={(e) => setValue("phone", formatPhone(e.target.value), { shouldValidate: true })}
                            className="bg-neutral-50 border-neutral-300 focus-visible:ring-[#48B9FA] text-neutral-900 text-xs h-10 rounded-sm"
                        />
                        {errors.phone && (
                            <p className="text-xs text-red-500">{errors.phone.message}</p>
                        )}
                    </div>

                    {/* E-mail */}
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="email" className="text-neutral-800 text-xs font-medium">
                            E-mail <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="seuemail@exemplo.com"
                            {...register("email")}
                            className="bg-neutral-50 border-neutral-300 focus-visible:ring-[#48B9FA] text-neutral-900 text-xs h-10 rounded-sm"
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500">{errors.email.message}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Resumo do Pedido & Total */}
            <div className="bg-white border border-neutral-200 rounded-sm p-6 space-y-4">
                <div className="border-b border-neutral-200 pb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                        3. Resumo & Pagamento PIX
                    </h3>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {cart.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-xs py-1.5 border-b border-neutral-100">
                            <span className="text-neutral-700">
                                {item.quantity}x {item.name}
                            </span>
                            <span className="font-medium text-neutral-900">
                                {formatPrice(item.price * item.quantity)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Campo de Cupom de Desconto */}
                <div className="pt-2 border-t border-neutral-100 space-y-1.5">
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Possui cupom de desconto?"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            disabled={!!appliedCoupon || isValidatingCoupon}
                            className="text-xs h-9 bg-neutral-50 border-neutral-300 font-mono uppercase"
                        />
                        {appliedCoupon ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setAppliedCoupon(null)
                                    setCouponInput("")
                                }}
                                className="text-xs text-red-500 hover:underline px-2 cursor-pointer shrink-0 font-medium"
                            >
                                Remover
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleApplyCoupon}
                                disabled={!couponInput.trim() || isValidatingCoupon}
                                className="h-9 px-3 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold rounded-sm cursor-pointer shrink-0"
                            >
                                {isValidatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Aplicar"}
                            </button>
                        )}
                    </div>
                    {appliedCoupon && (
                        <p className="text-[11px] text-emerald-600 font-medium">
                            ✓ Cupom <strong>{appliedCoupon.code}</strong> aplicado (-{appliedCoupon.discount_percent}%)
                        </p>
                    )}
                </div>

                <div className="pt-2 border-t border-neutral-200 space-y-1.5">
                    {appliedCoupon && (
                        <>
                            <div className="flex justify-between items-center text-xs text-neutral-600">
                                <span>Subtotal:</span>
                                <span>{formatPrice(cart.total)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-medium text-emerald-600">
                                <span>Desconto ({appliedCoupon.code} -10%):</span>
                                <span>-{formatPrice(discountAmount)}</span>
                            </div>
                        </>
                    )}
                    <div className="flex justify-between items-baseline pt-1">
                        <span className="text-sm font-medium text-neutral-900">Total a pagar via PIX:</span>
                        <span className="text-xl font-semibold text-neutral-900">
                            {formatPrice(finalTotal)}
                        </span>
                    </div>
                </div>

                {/* Botão de Finalizar */}
                <button
                    type="submit"
                    disabled={isProcessing || cart.items.length === 0}
                    className="w-full h-12 bg-[#48B9FA] hover:bg-[#20a6f5] disabled:opacity-50 text-white font-semibold text-sm rounded-sm transition-colors flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-xs"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Gerando QR Code PIX...</span>
                        </>
                    ) : (
                        <>
                            <QrCode className="h-4 w-4" />
                            <span>Gerar QR Code PIX</span>
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </button>
            </div>
        </form>
    )
}
