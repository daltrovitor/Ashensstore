"use client"

import { useState, useEffect, Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CheckoutForm } from "@/components/ecommerce/CheckoutForm"
import { useCart } from "@/hooks/use-shopping-cart"

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
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="mb-8 pb-4 border-b border-neutral-200">
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
            Finalizar Compra
          </h1>
          <p className="text-neutral-500 text-xs sm:text-sm mt-1">
            Informe seu usuário do Roblox e gere o QR Code Pix para efetuar o pagamento.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário de Checkout */}
          <div className="lg:col-span-2">
            <CheckoutForm />
          </div>

          {/* Resumo Lateral do Pedido */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-28 p-6 border border-neutral-200 rounded-sm bg-white space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-neutral-900">
                  Resumo da Sacola
                </h3>
                <span className="text-xs text-neutral-500 font-mono">
                  {cart.items.reduce((acc, item) => acc + item.quantity, 0)} {cart.items.reduce((acc, item) => acc + item.quantity, 0) === 1 ? 'item' : 'itens'}
                </span>
              </div>

              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center py-2 border-b border-neutral-100">
                    <div className="w-12 h-12 bg-neutral-50 rounded-sm relative overflow-hidden flex-shrink-0 border border-neutral-200 flex items-center justify-center">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="object-contain w-full h-full p-1"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs line-clamp-1 text-neutral-900">{item.name}</p>
                      <div className="flex items-center justify-between text-xs text-neutral-500 mt-1">
                        <span>Qtd: {item.quantity}</span>
                        <span className="text-neutral-900 font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totais */}
              <div className="pt-2 border-t border-neutral-200 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-neutral-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cart.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Entrega Digital</span>
                  <span className="text-neutral-900 font-medium">Grátis (Servidor VIP)</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-3 border-t border-neutral-200 text-neutral-900">
                  <span>Total no PIX:</span>
                  <span className="text-lg">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cart.subtotal)}
                  </span>
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#48B9FA]"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
