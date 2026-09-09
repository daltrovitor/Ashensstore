
export interface Product {
    id: string
    name: string
    slug: string
    description: string | null
    price: number // Derived or base price
    compare_at_price?: number | null
    images?: string[] // Optional simplified array
    thumbnail_url: string | null
    category_id?: string | null
    category?: Category | null
    display_order?: number
    is_active: boolean
    is_featured: boolean
    created_at: string
    variants: Variant[]
    mockups?: Mockup[]
}

export interface Mockup {
    id: string
    product_id: string
    image_url: string
    display_order: number
    is_main: boolean
}

export interface Variant {
    id: string
    product_id: string
    name: string
    size: string | null
    color: string | null
    retail_price: number // DB column is retail_price
    price?: number // Alias for compatibility if needed, but better to use retail_price
    sku?: string | null
    inventory_quantity?: number
    stock?: number
    in_stock: boolean
}

export interface CartItem {
    id: string
    product_id: string
    variant_id?: string
    name: string
    price: number
    quantity: number
    image?: string
    size?: string
    color?: string
}

export interface Cart {
    items: CartItem[]
    subtotal: number
    total: number
}

export interface Category {
    id: string
    name: string
    slug: string
    description?: string
}
