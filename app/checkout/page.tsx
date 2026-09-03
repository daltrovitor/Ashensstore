
"use client"

import { useState, useEffect, Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CheckoutForm } from "@/components/ecommerce/CheckoutForm"
import { useCart } from "@/hooks/use-shopping-cart"
import { Loader2 } from "lucide-react"

function CheckoutContent() {
  const { cart } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-32">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-serif font-bold mb-8 text-center md:text-left">Finalizar Compra</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Formulário de Checkout */}
            <div className="lg:col-span-2">
              <CheckoutForm />
            </div>

            {/* Resumo do Carrinho (Lateral) */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-32 p-6 border rounded-xl bg-muted/10">
                <h3 className="font-serif font-bold text-xl mb-4">Resumo do Pedido</h3>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3 items-center">
                      <div className="w-14 h-14 bg-muted rounded-md relative overflow-hidden flex-shrink-0 border border-border">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                            <span className="text-[10px]">Sem foto</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm line-clamp-1 text-foreground">{item.name}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
                          <span>Qtd: {item.quantity}</span>
                          <span className="text-primary font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totais do Resumo */}
                <div className="mt-6 pt-4 border-t border-border space-y-2.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({cart.items.reduce((acc, item) => acc + item.quantity, 0)} {cart.items.reduce((acc, item) => acc + item.quantity, 0) === 1 ? 'item' : 'itens'})</span>
                    <span className="font-medium text-foreground">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cart.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Frete</span>
                    <span className="text-xs text-muted-foreground italic">Calculado no endereço</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-3 border-t border-border">
                    <span>Total dos Produtos</span>
                    <span className="text-primary font-black text-lg">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cart.subtotal)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-emerald-50/60 border border-emerald-200/50 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <span>🔒 Compra 100% protegida com entrega garantida</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
