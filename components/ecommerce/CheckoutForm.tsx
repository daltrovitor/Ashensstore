"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCart } from "@/hooks/use-shopping-cart"
import { Loader2, QrCode, CreditCard, CheckCircle, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { formatPhone, formatCEP } from "@/components/ui/inputMasks"
import { PixQrCode } from "@/components/ecommerce/pix-qr-code"

const formatPrice = (p: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(p)
}

const checkoutSchema = z.object({
    fullName: z.string().min(3, "Nome completo é obrigatório"),
    email: z.string().email("Email inválido"),
    phone: z.string().min(10, "Telefone inválido"),
    cep: z.string().min(8, "CEP inválido"),
    address: z.string().min(3, "Endereço obrigatório"),
    number: z.string().min(1, "Número obrigatório"),
    complement: z.string().optional(),
    city: z.string().min(2, "Cidade obrigatória"),
    state: z.string().length(2, "UF inválido"),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

export function CheckoutForm() {
    const { cart, clearCart } = useCart()
    const [isProcessing, setIsProcessing] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix")
    const [pixData, setPixData] = useState<{
        pix_code: string
        order_id: string
        total: number
    } | null>(null)

    const [shippingCost, setShippingCost] = useState(0)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            state: '',
        }
    })

    const watchedState = watch("state")
    const watchedCep = watch("cep")

    // Auto-fill address from CEP
    useEffect(() => {
        const fetchAddress = async () => {
            const cep = watchedCep?.replace(/\D/g, '')
            if (cep?.length === 8) {
                try {
                    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
                    const data = await res.json()
                    if (!data.erro) {
                        setValue('address', data.logradouro, { shouldValidate: true })
                        setValue('city', data.localidade, { shouldValidate: true })
                        setValue('state', data.uf, { shouldValidate: true })

                        if (data.complemento) {
                            setValue('complement', data.complemento, { shouldValidate: true })
                        }

                        toast.success("Endereço encontrado!")

                        // Optional: Focus on number field
                        // document.getElementById('number')?.focus()
                    } else {
                        toast.error("CEP não encontrado")
                    }
                } catch (error) {
                    console.error("Erro ao buscar CEP", error)
                }
            }
        }
        fetchAddress()
    }, [watchedCep, setValue])

    // Calculate dynamic shipping
    useEffect(() => {
        const calculateShipping = async () => {
            if (watchedState && watchedState.length === 2) {
                try {
                    const res = await fetch('/api/shipping/calculate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ state: watchedState })
                    })
                    if (res.ok) {
                        const data = await res.json()
                        setShippingCost(Number(data.price))
                        if (Number(data.price) > 0) {
                            toast.success(`Frete calculado: ${formatPrice(Number(data.price))}`)
                        }
                    }
                } catch (e) {
                    console.error("Shipping calc error", e)
                }
            }
        }
        calculateShipping()
    }, [watchedState])

    const total = cart.subtotal + shippingCost

    const onSubmit = async (data: CheckoutFormData) => {
        setIsProcessing(true)

        try {
            // Prepare order payload
            const orderPayload = {
                payment_method: paymentMethod,
                items: cart.items.map(item => ({
                    variant_id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    name: item.name
                })),
                customer: {
                    name: data.fullName,
                    email: data.email,
                    phone: data.phone
                },
                shipping_address: {
                    name: data.fullName,
                    address1: `${data.address}, ${data.number}`,
                    address2: data.complement,
                    city: data.city,
                    state_code: data.state,
                    country_code: 'BR',
                    zip: data.cep,
                    phone: data.phone,
                    email: data.email
                },
                shipping_cost: shippingCost,
                success_url: `${window.location.origin}/sucesso`,
                cancel_url: `${window.location.origin}/checkout`
            }

            const response = await fetch('/api/checkout/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderPayload),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Falha ao processar pagamento')
            }

            const result = await response.json()

            // Se for Pix, exibe a tela de QR Code e Copia e Cola
            if (result.payment_method === 'pix' && result.pix_code) {
                setPixData({
                    pix_code: result.pix_code,
                    order_id: result.order_id,
                    total: result.total || total,
                })
                clearCart()
                toast.success('Pedido gerado! Conclua o pagamento via Pix.')
                return
            }

            // If we have a checkout URL (e.g. Stripe Card), redirect
            if (result.checkout_url) {
                window.location.href = result.checkout_url
                clearCart()
            } else {
                setIsSuccess(true)
                clearCart()
            }

        } catch (error) {
            console.error('Checkout error:', error)
            toast.error('Erro ao processar pedido. Tente novamente.')
        } finally {
            setIsProcessing(false)
        }
    }

    if (pixData) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-serif font-black">Pedido Recebido com Sucesso!</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Pedido <span className="font-mono font-bold text-foreground">#{pixData.order_id}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Efetue o pagamento via Pix para confirmar seu pedido imediatamente.
                    </p>
                </div>

                <PixQrCode
                    pixCode={pixData.pix_code}
                    amount={pixData.total}
                    orderId={pixData.order_id}
                    onConfirm={() => {
                        setIsSuccess(true)
                        setPixData(null)
                    }}
                />
            </div>
        )
    }

    if (isSuccess) {
        return (
            <div className="text-center py-12">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Pedido Confirmado!</h2>
                <p className="text-muted-foreground mb-8">
                    Seu pedido foi recebido com sucesso.<br />
                    Enviaremos as atualizações para seu email.
                </p>
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest">
                    <a href="/loja">Continuar Comprando</a>
                </Button>
            </div>
        )
    }

    if (cart.items.length === 0 && !isSuccess) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Seu carrinho está vazio.</p>
                <Button asChild variant="outline">
                    <a href="/loja">Voltar para Loja</a>
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Dados Pessoais e Entrega */}
            <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="text-xl font-bold font-serif mb-6 flex items-center gap-2">
                    1. Entrega
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="fullName">Nome Completo</Label>
                        <Input id="fullName" {...register("fullName")} className={errors.fullName ? "border-red-500" : ""} />
                        {errors.fullName && <span className="text-xs text-red-500">{errors.fullName.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...register("email")} className={errors.email ? "border-red-500" : ""} />
                        {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                    </div>

                                        <div className="space-y-2">
                                                <Label htmlFor="phone">Telefone</Label>
                                                <Input id="phone" {...register("phone")} placeholder="(00) 00000-0000" className={errors.phone ? "border-red-500" : ""}
                                                    onInput={(e) => {
                                                        const input = e.currentTarget as HTMLInputElement
                                                        const pos = input.selectionStart || input.value.length
                                                        input.value = formatPhone(input.value)
                                                        // try to restore caret - set to end if not available
                                                        input.setSelectionRange(input.value.length, input.value.length)
                                                    }}
                                                />
                                                {errors.phone && <span className="text-xs text-red-500">{errors.phone.message}</span>}
                                        </div>

                                        <div className="space-y-2">
                                                <Label htmlFor="cep">CEP</Label>
                                                <Input id="cep" {...register("cep")} placeholder="00000-000" className={errors.cep ? "border-red-500" : ""}
                                                    onInput={(e) => {
                                                        const input = e.currentTarget as HTMLInputElement
                                                        input.value = formatCEP(input.value)
                                                    }}
                                                />
                                                {errors.cep && <span className="text-xs text-red-500">{errors.cep.message}</span>}
                                        </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input id="address" {...register("address")} className={errors.address ? "border-red-500" : ""} />
                        {errors.address && <span className="text-xs text-red-500">{errors.address.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="number">Número</Label>
                        <Input id="number" {...register("number")} className={errors.number ? "border-red-500" : ""} />
                        {errors.number && <span className="text-xs text-red-500">{errors.number.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="complement">Complemento</Label>
                        <Input id="complement" {...register("complement")} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input id="city" {...register("city")} className={errors.city ? "border-red-500" : ""} />
                        {errors.city && <span className="text-xs text-red-500">{errors.city.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="state">Estado</Label>
                        <Input id="state" {...register("state")} maxLength={2} placeholder="UF" className={errors.state ? "border-red-500" : ""} />
                        {errors.state && <span className="text-xs text-red-500">{errors.state.message}</span>}
                    </div>
                </div>
            </div>

            {/* 2. Seleção do Método de Pagamento */}
            <div className="bg-card p-6 rounded-xl border border-border space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-serif flex items-center gap-2">
                        2. Forma de Pagamento
                    </h3>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Checkout Seguro
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Opção PIX */}
                    <div
                        onClick={() => setPaymentMethod("pix")}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            paymentMethod === "pix"
                                ? "border-emerald-500 bg-emerald-50/30 shadow-sm"
                                : "border-border hover:border-muted-foreground/30 bg-card"
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-lg ${paymentMethod === "pix" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                                    <QrCode className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-base">PIX</h4>
                                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            Aprovação Rápida
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        QR Code & Copia e Cola direto na conta
                                    </p>
                                </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                paymentMethod === "pix" ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/40"
                            }`}>
                                {paymentMethod === "pix" && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-dashed border-border/60 text-[11px] text-muted-foreground">
                            Chave CNPJ oficial da Librás: <strong className="font-mono text-foreground">00.267.195/0001-30</strong>
                        </div>
                    </div>

                    {/* Opção Cartão (Stripe) */}
                    <div
                        onClick={() => setPaymentMethod("card")}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            paymentMethod === "card"
                                ? "border-blue-500 bg-blue-50/30 shadow-sm"
                                : "border-border hover:border-muted-foreground/30 bg-card"
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-lg ${paymentMethod === "card" ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"}`}>
                                    <CreditCard className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-base">Cartão de Crédito / Débito</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Visa, Mastercard, Elo, Hipercard, Amex
                                    </p>
                                </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                paymentMethod === "card" ? "border-blue-500 bg-blue-500" : "border-muted-foreground/40"
                            }`}>
                                {paymentMethod === "card" && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-dashed border-border/60 text-[11px] text-muted-foreground">
                            Processado em ambiente seguro com criptografia pela <strong>Stripe</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resumo do Pedido */}
            <div className="bg-muted/30 p-6 rounded-xl border border-border">
                <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(cart.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Frete</span>
                        <span>{formatPrice(shippingCost)}</span>
                    </div>
                </div>
                <div className="flex justify-between text-xl font-black uppercase pt-4 border-t border-border mb-6">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 text-lg uppercase tracking-widest"
                    disabled={isProcessing || cart.items.length === 0}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...
                        </>
                    ) : paymentMethod === "pix" ? (
                        `Gerar Pix • ${formatPrice(total)}`
                    ) : (
                        `Pagar com Cartão • ${formatPrice(total)}`
                    )}
                </Button>
            </div>
        </form>
    )
}
