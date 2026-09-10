"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Zap,
  ShieldCheck,
  ShoppingCart,
  Gamepad2,
  MessageSquare,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  XCircle
} from "lucide-react"
import { toast } from "sonner"
import type { Product, Variant } from "@/lib/store/types"
import { useCart } from "@/hooks/use-shopping-cart"
import { PIX_CONFIG } from "@/lib/config/pix"

const formatPrice = (p: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(p)
}

export default function ProductDetailsClient({ initialProduct }: { initialProduct: Product }) {
    const { addItem, openCart } = useCart()
    const router = useRouter()

    const [product] = useState<Product>(initialProduct)
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
        if (initialProduct.variants?.length > 0) {
            const firstAvailable = initialProduct.variants.find((v: Variant) => v.in_stock) || initialProduct.variants[0]
            return firstAvailable.id
        }
        return null
    })
    const [quantity, setQuantity] = useState(1)

    const selectedVariant = product.variants?.find(v => v.id === selectedVariantId) || product.variants?.[0]
    const price = selectedVariant?.retail_price || selectedVariant?.price || product.price || 0
    const originalPrice = product.compare_at_price || (price > 0 ? price * 1.3 : 0)

    // Stock verification
    const hasVariants = Boolean(product.variants && product.variants.length > 0)
    const isAllOutOfStock = hasVariants
        ? product.variants!.every(v => v.in_stock === false || (typeof v.stock === 'number' && v.stock <= 0))
        : Boolean((product as any).in_stock === false || (typeof (product as any).stock === 'number' && (product as any).stock <= 0))

    const isCurrentVariantOutOfStock = selectedVariant
        ? (selectedVariant.in_stock === false || (typeof selectedVariant.stock === 'number' && selectedVariant.stock <= 0))
        : isAllOutOfStock

    const mainImage = product.mockups?.find(m => m.is_main)?.image_url ||
        product.mockups?.[0]?.image_url ||
        product.thumbnail_url ||
        product.images?.[0] ||
        '/ashens-logo.jpg'

    const handleAddToCart = () => {
        if (isCurrentVariantOutOfStock) {
            toast.error("Este item está com o estoque esgotado no momento.")
            return
        }

        addItem({
            id: selectedVariant?.id || product.id,
            product_id: product.id,
            variant_id: selectedVariant?.id,
            name: product.name,
            price: price,
            quantity: quantity,
            image: mainImage,
        })
        toast.success(`"${product.name}" adicionado ao carrinho!`)
    }

    const handleBuyNow = () => {
        if (isCurrentVariantOutOfStock) {
            toast.error("Este item está com o estoque esgotado no momento.")
            return
        }
        handleAddToCart()
        router.push('/checkout')
    }

    return (
        <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
            <Navbar />

            <main className="container mx-auto px-4 py-8 max-w-6xl flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Imagem do Produto */}
                    <div className="space-y-4">
                        <div className="relative aspect-square rounded-lg border border-neutral-200 overflow-hidden bg-neutral-50 p-6 flex items-center justify-center">
                            <Image
                                src={mainImage}
                                alt={product.name}
                                fill
                                className={`object-contain p-6 transition-all duration-300 ${
                                    isCurrentVariantOutOfStock ? "blur-[3px] brightness-75 scale-105" : ""
                                }`}
                                priority
                            />

                            {/* Overlay de Estoque Esgotado conforme referência visual */}
                            {isCurrentVariantOutOfStock && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4 pointer-events-none">
                                    <span className="text-white font-extrabold text-base sm:text-2xl tracking-wider uppercase text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none">
                                        ESTOQUE ESGOTADO
                                    </span>
                                </div>
                            )}

                            <div className="absolute top-4 left-4 z-20 text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-[#48B9FA] border border-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#48B9FA]" />
                                <span>Blox Fruits Oficial</span>
                            </div>
                        </div>
                    </div>

                    {/* Dados e Compra */}
                    <div className="space-y-6">
                        <div>
                            {product.category && (
                                <p className="text-xs font-semibold text-[#48B9FA] uppercase tracking-wider mb-2">
                                    {product.category.name}
                                </p>
                            )}
                            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight leading-tight">
                                {product.name}
                            </h1>
                            <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                                {isCurrentVariantOutOfStock ? (
                                    <span className="flex items-center gap-1 text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                        <XCircle className="w-4 h-4 text-rose-600" /> Estoque Esgotado
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                        <CheckCircle2 className="w-4 h-4" /> Em Estoque
                                    </span>
                                )}
                                <span>•</span>
                                <span>Entrega via Servidor VIP Roblox</span>
                            </div>
                        </div>

                        {/* Preço PIX */}
                        <div className="p-5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
                            <div className="flex items-baseline gap-3">
                                {originalPrice > price && (
                                    <span className="text-base text-neutral-400 line-through font-mono">
                                        {formatPrice(originalPrice)}
                                    </span>
                                )}
                                <span className="text-3xl sm:text-4xl font-bold text-neutral-900 font-sans tracking-tight">
                                    {formatPrice(price)}
                                </span>
                                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                                    No PIX
                                </span>
                            </div>
                            <p className="text-xs text-neutral-500">
                                Pagamento rápido com QR Code dinâmico gerado instantaneamente no checkout.
                            </p>
                        </div>

                        {/* Descrição */}
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-neutral-900">Sobre este item:</h3>
                            <p className="text-sm text-neutral-600 leading-relaxed">
                                {product.description || "Item lendário e exclusivo de Blox Fruits entregue de forma imediata via trade em servidor seguro no Roblox."}
                            </p>
                        </div>

                        {/* Botões de Ação */}
                        <div className="space-y-3 pt-2">
                            <Button
                                size="lg"
                                disabled={isCurrentVariantOutOfStock}
                                onClick={handleBuyNow}
                                className={`w-full font-semibold text-sm h-12 rounded-md shadow-xs transition-all ${
                                    isCurrentVariantOutOfStock
                                        ? "bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed hover:bg-neutral-200"
                                        : "bg-[#48B9FA] hover:bg-[#20a6f5] text-white cursor-pointer"
                                }`}
                            >
                                {isCurrentVariantOutOfStock ? (
                                    "Produto Esgotado"
                                ) : (
                                    <>
                                        <Zap className="mr-2 h-4 w-4" />
                                        Comprar Agora via PIX
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                disabled={isCurrentVariantOutOfStock}
                                onClick={handleAddToCart}
                                className={`w-full font-semibold text-sm h-12 rounded-md transition-all ${
                                    isCurrentVariantOutOfStock
                                        ? "border-neutral-200 text-neutral-400 bg-neutral-50 cursor-not-allowed hover:bg-neutral-50"
                                        : "border-neutral-300 text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                                }`}
                            >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                {isCurrentVariantOutOfStock ? "Sem Estoque" : "Adicionar ao Carrinho"}
                            </Button>
                        </div>

                        {/* Card Informativo de Como Funciona a Entrega */}
                        <div className="border border-neutral-200 rounded-lg p-5 bg-neutral-50 space-y-3">
                            <div className="flex items-center gap-2 font-semibold text-sm text-neutral-900">
                                <Gamepad2 className="w-4 h-4 text-[#48B9FA]" />
                                <span>Como funciona a entrega?</span>
                            </div>
                            <ul className="text-xs text-neutral-600 space-y-2 list-disc pl-5">
                                <li>Você finaliza a compra informando seu <strong>Nick do Roblox</strong>.</li>
                                <li>Realiza o pagamento via PIX (QR Code ou Copia e Cola gerado na hora).</li>
                                <li>Acessa o <strong>Chat do Pedido</strong> aqui mesmo na loja.</li>
                                <li>O vendedor entra em contato imediatamente com o link do servidor VIP para entregar seu item!</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
