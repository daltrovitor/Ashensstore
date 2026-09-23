// Hello World
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
  ArrowRight,
  CheckCircle2,
  XCircle,
  Lock,
  Headphones,
  RotateCcw,
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
                                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                        <CheckCircle2 className="w-4 h-4" /> Em Estoque
                                    </span>
                                )}
                                <span className="text-neutral-300">•</span>
                                <span className="text-neutral-600 font-medium">Entrega Automática</span>
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

                        {/* Descrição do Produto */}
                        <div className="border border-neutral-200 rounded-lg p-5 bg-white space-y-3">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-800">
                                Descrição do produto
                            </h3>

                            <div className="space-y-3">
                                <div className="flex items-start gap-2.5 p-3 rounded-md bg-emerald-50/70 border border-emerald-200/80 text-emerald-950">
                                    <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-emerald-800">
                                            Entrega automática após o pagamento!
                                        </p>
                                        <p className="text-xs text-emerald-700 mt-0.5">
                                            Receba seu produto <strong>na hora</strong>, direto no site e no seu e-mail.
                                        </p>
                                    </div>
                                </div>

                                <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line pt-1">
                                    {product.description || "Item oficial entregue de forma imediata com segurança e garantia."}
                                </p>
                            </div>
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

                        {/* 1. Card INFORMAÇÕES (Fiel à referência da Imagem 3) */}
                        <div className="border border-neutral-200 rounded-lg p-5 bg-neutral-50/80 space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800">
                                Informações
                            </h3>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Zap className="w-4 h-4 text-[#48B9FA] shrink-0 mt-0.5" />
                                    <p className="text-xs sm:text-[13px] font-medium text-neutral-700 leading-snug">
                                        Entrega automática após confirmação do pagamento.
                                    </p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Lock className="w-4 h-4 text-[#48B9FA] shrink-0 mt-0.5" />
                                    <p className="text-xs sm:text-[13px] font-medium text-neutral-700 leading-snug">
                                        Pagamento 100% seguro e criptografado.
                                    </p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Headphones className="w-4 h-4 text-[#48B9FA] shrink-0 mt-0.5" />
                                    <p className="text-xs sm:text-[13px] font-medium text-neutral-700 leading-snug">
                                        Suporte disponível em caso de dúvidas.
                                    </p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <RotateCcw className="w-4 h-4 text-[#48B9FA] shrink-0 mt-0.5" />
                                    <p className="text-xs sm:text-[13px] font-medium text-neutral-700 leading-snug">
                                        Garantia de reembolso em casos de problemas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Card FORMAS DE PAGAMENTO (Fiel à referência da Imagem 3) */}
                        <div className="border border-neutral-200 rounded-lg p-5 bg-neutral-50/80 space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800">
                                Formas de Pagamento
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-900 text-white text-xs font-bold shadow-2xs">
                                    <svg className="w-3.5 h-3.5 fill-[#00BDAE]" viewBox="0 0 512 512">
                                        <path d="M407.9 339.4L339.4 408c-45.7 45.7-120.9 45.7-166.7 0L104.1 339.4c-45.7-45.7-45.7-120.9 0-166.7L172.6 104.1c45.7-45.7 120.9-45.7 166.7 0l68.5 68.5c45.7 45.7 45.7 120.9 0 166.8zM256 160l-96 96 96 96 96-96-96-96z" />
                                    </svg>
                                    <span>Pix</span>
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
