"use client"

import { ProductCard } from "./ProductCard"
import type { Product } from "@/lib/store/types"
import { Gamepad2, ArrowRight } from "lucide-react"
import Link from "next/link"

interface ProductGridProps {
    products: Product[]
    title?: string
    description?: string
    showViewAll?: boolean
    viewAllLink?: string
    columns?: 2 | 3 | 4 | 5
}

export function ProductGrid({
    products,
    title,
    description,
    showViewAll = false,
    viewAllLink = "/loja",
    columns = 4,
}: ProductGridProps) {
    const gridCols = {
        2: "grid-cols-2 sm:grid-cols-2",
        3: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
    }

    return (
        <section className="py-8 md:py-12">
            {/* Header da Seção */}
            {(title || description) && (
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-6 sm:mb-8 pb-4 border-b border-neutral-200">
                    <div>
                        {title && (
                            <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="text-neutral-500 mt-1 text-xs sm:text-sm max-w-2xl">
                                {description}
                            </p>
                        )}
                    </div>

                    {showViewAll && (
                        <Link
                            href={viewAllLink}
                            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-900 hover:text-[#48B9FA] transition-colors cursor-pointer"
                        >
                            Ver todos
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    )}
                </div>
            )}

            {/* Grid de produtos */}
            {products.length > 0 ? (
                <div className={`grid ${gridCols[columns]} gap-4 sm:gap-6`}>
                    {products.map((product, index) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            priority={index < 4}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-neutral-50 rounded-sm border border-neutral-200 p-6">
                    <p className="text-base font-medium text-neutral-900">Nenhum item encontrado</p>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                        Tente ajustar os filtros de categoria ou termo de busca.
                    </p>
                </div>
            )}
        </section>
    )
}

export default ProductGrid
