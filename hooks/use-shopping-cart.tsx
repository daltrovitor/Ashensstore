"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { CartItem, Cart } from '@/lib/store/types'

interface CartContextType {
    cart: Cart
    addItem: (item: CartItem) => void
    removeItem: (id: string) => void
    updateQuantity: (id: string, quantity: number) => void
    clearCart: () => void
    isOpen: boolean
    openCart: () => void
    closeCart: () => void
    toggleCart: () => void
    itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'ashens_cart'

function calculateTotals(items: CartItem[]): { subtotal: number; total: number } {
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
    return {
        subtotal,
        total: subtotal, // Frete será adicionado no checkout
    }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<Cart>({
        items: [],
        subtotal: 0,
        total: 0,
    })
    const [isOpen, setIsOpen] = useState(false)
    const [isHydrated, setIsHydrated] = useState(false)

    // Carregar carrinho do localStorage ao iniciar
    useEffect(() => {
        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored)
                if (parsed.items && Array.isArray(parsed.items)) {
                    const { subtotal, total } = calculateTotals(parsed.items)
                    setCart({
                        items: parsed.items,
                        subtotal,
                        total,
                    })
                }
            }
        } catch (error) {
            console.error('Erro ao carregar carrinho:', error)
        }
        setIsHydrated(true)
    }, [])

    // Salvar carrinho no localStorage quando mudar
    useEffect(() => {
        if (!isHydrated) return
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
        } catch (error) {
            console.error('Erro ao salvar carrinho:', error)
        }
    }, [cart, isHydrated])

    const addItem = useCallback((newItem: CartItem) => {
        setCart((prev) => {
            const existingIndex = prev.items.findIndex(
                (item) => item.id === newItem.id
            )

            let newItems: CartItem[]

            if (existingIndex >= 0) {
                // Atualiza quantidade se item já existe
                newItems = prev.items.map((item, index) =>
                    index === existingIndex
                        ? { ...item, quantity: item.quantity + newItem.quantity }
                        : item
                )
            } else {
                // Adiciona novo item
                newItems = [...prev.items, newItem]
            }

            const { subtotal, total } = calculateTotals(newItems)
            return { items: newItems, subtotal, total }
        })

        // Abre o carrinho ao adicionar item
        setIsOpen(true)
    }, [])

    const removeItem = useCallback((id: string) => {
        setCart((prev) => {
            const newItems = prev.items.filter((item) => item.id !== id)
            const { subtotal, total } = calculateTotals(newItems)
            return { items: newItems, subtotal, total }
        })
    }, [])

    const updateQuantity = useCallback((id: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(id)
            return
        }

        setCart((prev) => {
            const newItems = prev.items.map((item) =>
                item.id === id ? { ...item, quantity } : item
            )
            const { subtotal, total } = calculateTotals(newItems)
            return { items: newItems, subtotal, total }
        })
    }, [removeItem])

    const clearCart = useCallback(() => {
        setCart({ items: [], subtotal: 0, total: 0 })
        setIsOpen(false)
    }, [])

    const openCart = useCallback(() => setIsOpen(true), [])
    const closeCart = useCallback(() => setIsOpen(false), [])
    const toggleCart = useCallback(() => setIsOpen((prev) => !prev), [])

    const itemCount = cart.items.reduce((acc, item) => acc + item.quantity, 0)

    return (
        <CartContext.Provider
            value={{
                cart,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                isOpen,
                openCart,
                closeCart,
                toggleCart,
                itemCount,
            }
            }
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error('useCart deve ser usado dentro de um CartProvider')
    }
    return context
}

export default useCart
