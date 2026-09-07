"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { CheckCircle2, ShoppingBag, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-shopping-cart"
import { motion } from "framer-motion"

function SuccessContent() {
    const searchParams = useSearchParams()
    const orderId = searchParams.get("order_id")
    const sessionId = searchParams.get("session_id")
    const { clearCart } = useCart()
    const [isVerifying, setIsVerifying] = useState(!!sessionId)

    // Clear cart on mount if we have an orderId
    useEffect(() => {
        if (orderId) {
            clearCart()
        }
    }, [orderId, clearCart])

    // Verify payment if session_id is present
    useEffect(() => {
        if (sessionId) {
            const verifyPayment = async () => {
                try {
                    const res = await fetch(`/api/checkout/verify?sessionId=${sessionId}`)
                    const data = await res.json()

                    if (!res.ok) {
                        console.error('Falha na verificação:', data.error)
                        // toast.error('Erro ao verificar status do pagamento')
                    } else {
                        console.log('Pagamento verificado:', data)
                    }
                } catch (error) {
                    console.error('Erro ao verificar pagamento:', error)
                } finally {
                    setIsVerifying(false)
                }
            }
            verifyPayment()
        }
    }, [sessionId])

    if (isVerifying) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                <h2 className="text-2xl font-bold mb-2">Verificando pagamento...</h2>
                <p className="text-muted-foreground">Por favor, aguarde um momento.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white text-neutral-900 flex flex-col items-center justify-center text-center px-4 py-16">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="mb-6"
            >
                <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="max-w-xl mx-auto"
            >
                <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight text-neutral-900">
                    Pedido Registrado com Sucesso!
                </h1>
                <p className="text-neutral-500 mb-8 text-sm sm:text-base leading-relaxed">
                    Assim que seu PIX for confirmado, nossa equipe iniciará a entrega no Roblox. Você pode falar diretamente com o vendedor através do chat do pedido para combinar o servidor VIP ou trade.
                </p>

                {orderId && (
                    <div className="bg-neutral-50 border border-neutral-200 py-3 px-6 rounded-md inline-block mb-8">
                        <span className="text-xs text-neutral-500 uppercase tracking-wider mr-2 font-medium">Código do Pedido:</span>
                        <span className="font-mono font-bold text-neutral-900 text-sm">{orderId}</span>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {orderId ? (
                        <Button asChild size="lg" className="h-11 px-6 font-medium text-sm bg-[#48B9FA] hover:bg-[#20a6f5] text-white rounded-md shadow-xs cursor-pointer">
                            <Link href={`/pedidos?order_id=${encodeURIComponent(orderId)}`}>
                                Acompanhar & Chat com Vendedor
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    ) : (
                        <Button asChild size="lg" className="h-11 px-6 font-medium text-sm bg-[#48B9FA] hover:bg-[#20a6f5] text-white rounded-md shadow-xs cursor-pointer">
                            <Link href="/pedidos">
                                Acompanhar Pedidos
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}

                    <Button asChild variant="outline" size="lg" className="h-11 px-6 font-medium text-sm border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 rounded-md cursor-pointer">
                        <Link href="/loja">
                            <ShoppingBag className="mr-2 h-4 w-4 text-neutral-500" />
                            Continuar na Loja
                        </Link>
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-neutral-500">Carregando...</div>}>
            <SuccessContent />
        </Suspense>
    )
}
