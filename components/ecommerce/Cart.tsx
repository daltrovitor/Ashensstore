"use client"

import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useCart } from "@/hooks/use-shopping-cart"

const formatPrice = (p: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(p)
}

export function CartIcon() {
    const { toggleCart, itemCount } = useCart()

    return (
        <button
            onClick={toggleCart}
            className="relative p-2 text-neutral-700 hover:text-blue-600 transition-colors"
            aria-label="Carrinho de compras"
        >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
                >
                    {itemCount > 9 ? "9+" : itemCount}
                </motion.span>
            )}
        </button>
    )
}

export function CartDrawer() {
    const {
        cart,
        isOpen,
        closeCart,
        removeItem,
        updateQuantity,
        clearCart,
    } = useCart()

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeCart}
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50"
                    />

                    {/* Drawer Branco */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 26, stiffness: 220 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-neutral-200 z-50 flex flex-col shadow-2xl text-neutral-900"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-white">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                                    Seu Carrinho
                                </h2>
                                <span className="text-xs text-neutral-500 font-mono">
                                    ({cart.items.length} {cart.items.length === 1 ? "item" : "itens"})
                                </span>
                            </div>
                            <button
                                onClick={closeCart}
                                className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-sm transition-colors"
                                aria-label="Fechar carrinho"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Itens */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {cart.items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-500">
                                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600">
                                        <ShoppingBag className="w-6 h-6" />
                                    </div>
                                    <p className="text-base font-semibold text-neutral-900 mb-1">
                                        Seu carrinho está vazio
                                    </p>
                                    <p className="text-xs text-neutral-500 mb-6 max-w-[220px]">
                                        Confira as frutas míticas e gamepasses disponíveis na loja.
                                    </p>
                                    <Link
                                        href="/loja"
                                        onClick={closeCart}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-sm transition-colors"
                                    >
                                        Explorar Catálogo
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cart.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex gap-3 bg-white border border-neutral-200 rounded-sm p-3 hover:border-neutral-300 transition-colors"
                                        >
                                            {/* Imagem */}
                                            <div className="relative w-16 h-16 bg-neutral-50 rounded-sm border border-neutral-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="object-contain w-full h-full p-1"
                                                    />
                                                ) : null}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-xs text-neutral-900 line-clamp-1">
                                                    {item.name}
                                                </h3>
                                                <p className="text-sm font-semibold text-blue-600 mt-0.5">
                                                    {formatPrice(item.price * item.quantity)}
                                                </p>

                                                {/* Controles de Quantidade */}
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center border border-neutral-200 rounded-sm bg-neutral-50">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            className="p-1 hover:text-blue-600 text-neutral-600 transition"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="text-xs font-mono font-medium px-2 text-neutral-900">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="p-1 hover:text-blue-600 text-neutral-600 transition"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                                                        title="Remover item"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Rodapé / Total & Checkout */}
                        {cart.items.length > 0 && (
                            <div className="p-4 border-t border-neutral-200 bg-neutral-50/60 space-y-3">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-neutral-500">
                                        <span>Entrega Digital no Roblox:</span>
                                        <span className="text-blue-600 font-medium">
                                            Grátis (Servidor VIP)
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-baseline pt-1">
                                        <span className="text-sm font-medium text-neutral-900">Total no PIX:</span>
                                        <span className="text-xl font-semibold text-neutral-900">
                                            {formatPrice(cart.total)}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-1">
                                    <Link
                                        href="/checkout"
                                        onClick={closeCart}
                                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-sm transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                                    >
                                        <span>Ir para Pagamento PIX</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={clearCart}
                                        className="w-full text-center text-neutral-400 hover:text-red-600 text-xs py-1 transition-colors"
                                    >
                                        Limpar Carrinho
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
