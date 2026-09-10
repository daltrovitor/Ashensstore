
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import NextImage from "next/image"
import { fetchWithAuth } from "@/lib/utils/fetch"
import {
  LayoutDashboard,
  ShoppingBag,
  Plus,
  Trash2,
  Package,
  LogOut,
  Image as ImageIcon,
  ArrowLeft,
  GripVertical,
  Pencil,
  Truck,
  X,
  Boxes,
  DollarSign,
  Users,
  Menu,
  ArrowUp,
  ArrowDown,
  Filter
} from "lucide-react"
import { BannersManager } from "@/components/admin/banners-manager"
import { OrdersManager } from "@/components/admin/orders-manager"
import { CategoriesManager } from "@/components/admin/categories-manager"
import { ShippingManager } from "@/components/admin/shipping-manager"
import { InventoryManager } from "@/components/admin/inventory-manager"
import { FinancialManager } from "@/components/admin/financial-manager"
import { AffiliatesManager } from "@/components/admin/affiliates-manager"
import { ImageUpload } from "@/components/admin/image-upload"
import { DigitalStockDialog } from "@/components/admin/digital-stock-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type { Product, Category } from "@/lib/store/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface VariantForm {
  id?: string
  name: string
  size: string
  color: string
  price: string
  stock: string
  in_stock: boolean
}

const emptyVariant: VariantForm = { name: '', size: '', color: '', price: '', stock: '10', in_stock: true }

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState("products")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [newProductOpen, setNewProductOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [defaultVariantId, setDefaultVariantId] = useState<string | null>(null)
  const [digitalStockTarget, setDigitalStockTarget] = useState<{
    productId: string
    productName: string
    variantId?: string
  } | null>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // New Product Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    stock: '10',
    imageUrl: '',
    category_id: '',
    display_order: '0',
    is_featured: false
  })

  // Multiple images state
  const [productImages, setProductImages] = useState<string[]>([])

  // Variants state
  const [variants, setVariants] = useState<VariantForm[]>([])

  // Fetch initial data
  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [activeTab])

  const fetchCategories = async () => {
    try {
      console.log("Fetching categories...")
      const res = await fetchWithAuth('/api/categories')
      if (res.ok) {
        const data = await res.json()
        console.log("Fetched categories:", data)
        setCategories(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro ao carregar categorias")
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetchWithAuth('/api/admin/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro ao carregar produtos")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '', price: '', stock: '10', imageUrl: '', category_id: '', display_order: '0', is_featured: false })
    setProductImages([])
    setVariants([])
    setEditingId(null)
    setDefaultVariantId(null)
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products'
      const method = editingId ? 'PUT' : 'POST'

      // Combine thumbnail + additional images
      const allImages = formData.imageUrl
        ? [formData.imageUrl, ...productImages.filter(img => img !== formData.imageUrl)]
        : productImages

      const parsedPrice = parseFloat(formData.price.toString().replace(/\./g, '').replace(',', '.'))
      if (isNaN(parsedPrice)) {
        toast.error("Preço inválido")
        setIsCreating(false)
        return
      }

      // Build variants payload
      const variantsPayload = variants.length > 0
        ? variants.map(v => {
          const s = parseInt(v.stock || '10', 10)
          const stockCount = isNaN(s) ? 0 : s
          return {
            id: v.id,
            name: v.name || 'Padrão',
            size: v.size || null,
            color: v.color || null,
            price: parseFloat(v.price.toString().replace(/\./g, '').replace(',', '.')) || 0,
            stock: stockCount,
            in_stock: stockCount > 0 && v.in_stock !== false
          }
        })
        : (() => {
            const singleStock = formData.stock !== '' && !isNaN(parseInt(formData.stock, 10)) ? parseInt(formData.stock, 10) : 10
            return [{
              id: defaultVariantId || undefined,
              name: 'Padrão',
              price: parsedPrice,
              stock: singleStock,
              in_stock: singleStock > 0
            }]
          })()

      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug || formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
          description: formData.description,
          price: parsedPrice,
          thumbnail_url: formData.imageUrl || allImages[0] || null,
          images: allImages,
          category_id: (formData.category_id && formData.category_id !== "none") ? formData.category_id : null,
          display_order: parseInt(formData.display_order || '0', 10) || 0,
          is_active: true,
          is_featured: formData.is_featured,
          variants: variantsPayload
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(editingId ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!")
        setNewProductOpen(false)
        resetForm()
        fetchProducts()
      } else if (res.status === 409) {
        toast.warning("Produto duplicado!", {
          description: data.error || "Já existe um produto com este nome ou slug. Tente alterar o nome.",
          duration: 6000,
        })
      } else {
        toast.error(data.message || data.error || "Erro ao salvar produto")
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro ao salvar produto")
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingId(product.id)
    const initialStock = (product.variants?.[0]?.stock !== undefined ? product.variants[0].stock : (product.variants?.[0]?.in_stock ? 10 : 0)).toString()
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: (product.price || product.variants?.[0]?.retail_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      stock: initialStock,
      imageUrl: product.thumbnail_url || product.images?.[0] || '',
      category_id: product.category_id || '',
      display_order: (product.display_order || 0).toString(),
      is_featured: product.is_featured
    })

    // Load existing images
    const mockupImages = product.mockups?.map(m => m.image_url) || []
    const existingImages = mockupImages.length > 0 ? mockupImages : (product.images || [])
    setProductImages(existingImages.filter(img => img !== (product.thumbnail_url || product.images?.[0] || '')))

    // Check variants: if product has only 1 variant and it's standard "Padrão" without size/color, treat as standard product
    if (product.variants && product.variants.length === 1 && (!product.variants[0].size && !product.variants[0].color && (!product.variants[0].name || product.variants[0].name === 'Padrão'))) {
      setDefaultVariantId(product.variants[0].id)
      setVariants([])
    } else if (product.variants && product.variants.length > 0) {
      setDefaultVariantId(null)
      setVariants(product.variants.map(v => ({
        id: v.id,
        name: v.name || '',
        size: v.size || '',
        color: v.color || '',
        price: (v.retail_price || v.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        stock: (v.stock !== undefined ? v.stock : (v.in_stock ? 10 : 0)).toString(),
        in_stock: v.in_stock
      })))
    } else {
      setDefaultVariantId(null)
      setVariants([])
    }

    setNewProductOpen(true)
  }

  const handleDeleteProduct = (id: string) => {
    toast.warning("Deseja excluir este produto?", {
      description: "Esta ação não pode ser desfeita.",
      duration: 8000,
      action: {
        label: "Confirmar Exclusão",
        onClick: async () => {
          try {
            const res = await fetchWithAuth(`/api/admin/products/${id}`, {
              method: 'DELETE',
            })

            if (res.ok) {
              toast.success("Produto excluído com sucesso!")
              fetchProducts()
            } else {
              const data = await res.json()
              toast.error(data.error || "Erro ao excluir produto")
            }
          } catch (e) {
            console.error('Delete error:', e)
            toast.error("Erro ao excluir produto")
          }
        },
      },
      cancel: {
        label: "Cancelar",
        onClick: () => { },
      },
    })
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      onLogout()
    } catch (error) {
      console.error('Logout error:', error)
      onLogout()
    }
  }

  // --- Variant helpers ---
  const addVariant = () => {
    setVariants([...variants, { ...emptyVariant }])
  }

  const updateVariant = (index: number, field: keyof VariantForm, value: string | boolean) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }
    setVariants(updated)
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  // --- Image helpers ---
  const addProductImage = (url: string) => {
    if (url && !productImages.includes(url)) {
      setProductImages([...productImages, url])
    }
  }

  const removeProductImage = (index: number) => {
    setProductImages(productImages.filter((_, i) => i !== index))
  }

  // --- Reordering & Category Filtering helpers ---
  const filteredProducts = products.filter(p => {
    if (categoryFilter === "all") return true
    if (categoryFilter === "none") return !p.category_id
    return p.category_id === categoryFilter
  })

  const handleMoveOrder = async (productId: string, direction: 'up' | 'down') => {
    const currentList = [...filteredProducts]
    const index = currentList.findIndex(p => p.id === productId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === currentList.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const [moved] = currentList.splice(index, 1)
    currentList.splice(targetIndex, 0, moved)

    const reorderedItems = currentList.map((p, idx) => ({
      id: p.id,
      display_order: idx + 1
    }))

    // Optimistic update
    setProducts(prev => {
      const copy = [...prev]
      reorderedItems.forEach(item => {
        const found = copy.find(p => p.id === item.id)
        if (found) found.display_order = item.display_order
      })
      return copy.sort((a, b) => {
        const ordA = a.display_order && a.display_order > 0 ? a.display_order : 9999
        const ordB = b.display_order && b.display_order > 0 ? b.display_order : 9999
        if (ordA !== ordB) return ordA - ordB
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    })

    try {
      const res = await fetchWithAuth('/api/admin/products/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: reorderedItems })
      })
      if (!res.ok) {
        toast.error("Erro ao salvar ordem dos produtos")
        fetchProducts()
      } else {
        toast.success("Ordem atualizada com sucesso!")
      }
    } catch {
      toast.error("Erro de conexão ao salvar ordem")
      fetchProducts()
    }
  }

  const handleQuickCategoryChange = async (productId: string, newCategoryId: string) => {
    const target = products.find(p => p.id === productId)
    if (!target) return
    const catId = newCategoryId === 'none' ? null : newCategoryId

    // Optimistic update
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, category_id: catId } : p))

    try {
      const res = await fetchWithAuth(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: target.name,
          slug: target.slug,
          description: target.description,
          price: target.price,
          category_id: catId,
          display_order: target.display_order || 0,
          is_active: target.is_active,
          is_featured: target.is_featured,
          variants: target.variants?.map(v => ({
            id: v.id,
            name: v.name,
            price: v.retail_price || v.price,
            stock: v.stock,
            in_stock: v.in_stock
          }))
        })
      })

      if (res.ok) {
        toast.success("Categoria do produto atualizada!")
      } else {
        toast.error("Erro ao mudar categoria do produto")
        fetchProducts()
      }
    } catch {
      toast.error("Erro ao mudar categoria do produto")
      fetchProducts()
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-md overflow-hidden border border-neutral-200 bg-white flex-shrink-0">
            <NextImage src="/ashens-logo.jpg" alt="Logo" fill className="object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-xs text-neutral-900 leading-tight">Ashens Store</h1>
            <span className="text-[10px] text-blue-600 font-medium">Painel Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs px-2.5" onClick={() => window.location.href = '/'}>
            <ArrowLeft className="w-3 h-3 mr-1" /> Loja
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 top-[53px] z-30 bg-white/95 backdrop-blur-sm p-4 space-y-2 flex flex-col justify-between border-b shadow-lg animate-in fade-in-50">
          <nav className="space-y-1.5">
            <Button variant={activeTab === 'products' ? 'secondary' : 'ghost'} className="w-full justify-start text-xs font-medium" onClick={() => { setActiveTab('products'); setMobileNavOpen(false); }}>
              <ShoppingBag className="mr-2 h-4 w-4" /> Produtos
            </Button>
            <Button variant={activeTab === 'inventory' ? 'secondary' : 'ghost'} className="w-full justify-start text-xs font-medium" onClick={() => { setActiveTab('inventory'); setMobileNavOpen(false); }}>
              <Boxes className="mr-2 h-4 w-4" /> Estoque
            </Button>
            <Button variant={activeTab === 'financial' ? 'secondary' : 'ghost'} className="w-full justify-start text-xs font-medium" onClick={() => { setActiveTab('financial'); setMobileNavOpen(false); }}>
              <DollarSign className="mr-2 h-4 w-4" /> Financeiro
            </Button>
            <Button variant={activeTab === 'orders' ? 'secondary' : 'ghost'} className="w-full justify-start text-xs font-medium" onClick={() => { setActiveTab('orders'); setMobileNavOpen(false); }}>
              <Package className="mr-2 h-4 w-4" /> Pedidos
            </Button>
            <Button variant={activeTab === 'affiliates' ? 'secondary' : 'ghost'} className="w-full justify-start text-xs font-medium" onClick={() => { setActiveTab('affiliates'); setMobileNavOpen(false); }}>
              <Users className="mr-2 h-4 w-4 text-[#48B9FA]" /> Afiliados
            </Button>
            <Button variant={activeTab === 'banners' ? 'secondary' : 'ghost'} className="w-full justify-start text-xs font-medium" onClick={() => { setActiveTab('banners'); setMobileNavOpen(false); }}>
              <ImageIcon className="mr-2 h-4 w-4" /> Banners
            </Button>
            <Button variant={activeTab === 'categories' ? 'secondary' : 'ghost'} className="w-full justify-start text-xs font-medium" onClick={() => { setActiveTab('categories'); setMobileNavOpen(false); }}>
              <GripVertical className="mr-2 h-4 w-4" /> Categorias
            </Button>
          </nav>
          <div className="pt-3 border-t border-border space-y-2">
            <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 text-xs font-medium" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Sair do Painel
            </Button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col fixed inset-y-0">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-neutral-200 bg-white flex-shrink-0">
            <NextImage src="/ashens-logo.jpg" alt="Logo" fill className="object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-neutral-900 leading-tight">Ashens Store</h1>
            <span className="text-[11px] text-blue-600 font-medium">Painel Admin</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button variant={activeTab === 'products' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('products')}>
            <ShoppingBag className="mr-2 h-4 w-4" /> Produtos
          </Button>
          <Button variant={activeTab === 'inventory' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('inventory')}>
            <Boxes className="mr-2 h-4 w-4" /> Estoque
          </Button>
          <Button variant={activeTab === 'financial' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('financial')}>
            <DollarSign className="mr-2 h-4 w-4" /> Financeiro
          </Button>
          <Button variant={activeTab === 'orders' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('orders')}>
            <Package className="mr-2 h-4 w-4" /> Pedidos
          </Button>
          <Button variant={activeTab === 'affiliates' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('affiliates')}>
            <Users className="mr-2 h-4 w-4 text-[#48B9FA]" /> Afiliados
          </Button>
          <Button variant={activeTab === 'banners' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('banners')}>
            <ImageIcon className="mr-2 h-4 w-4" /> Banners
          </Button>
          <Button variant={activeTab === 'categories' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('categories')}>
            <GripVertical className="mr-2 h-4 w-4" /> Categorias
          </Button>
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/'}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar à Loja
          </Button>

          <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 sm:p-8 pt-18 md:pt-8 w-full">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-serif font-bold">Produtos</h2>
                <Dialog open={newProductOpen} onOpenChange={(open) => {
                  setNewProductOpen(open)
                  if (!open) {
                    resetForm()
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-white">
                      <Plus className="mr-2 h-4 w-4" /> Novo Produto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingId ? "Editar Produto" : "Adicionar Novo Produto"}</DialogTitle>
                      <DialogDescription>
                        {editingId ? "Edite os detalhes do produto abaixo." : "Adicione um novo produto ao catálogo."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveProduct} className="space-y-6 py-4">

                      {/* --- Informações Básicas --- */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">Informações Básicas</h3>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Nome do Produto</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="slug">Slug (URL)</Label>
                            <Input
                              id="slug"
                              value={formData.slug}
                              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                              placeholder="Auto-gerado se vazio"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="price">Preço Base (R$)</Label>
                            <Input
                              id="price"
                              type="text"
                              inputMode="decimal"
                              value={formData.price}
                              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                              placeholder="0,00"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="category">Categoria</Label>
                            <Select
                              value={formData.category_id || "none"}
                              onValueChange={(val) => setFormData({ ...formData, category_id: val === "none" ? "" : val })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nenhuma categoria</SelectItem>
                                {categories.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="display_order">Ordem / Posição (Catálogo)</Label>
                            <Input
                              id="display_order"
                              type="number"
                              min="0"
                              value={formData.display_order}
                              onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                              placeholder="Ex: 1 para o topo"
                            />
                            <p className="text-[11px] text-muted-foreground">Posição no catálogo (1 = primeiro).</p>
                          </div>
                          <div className="flex items-center space-x-2 pt-6">
                            <Switch
                              id="featured"
                              checked={formData.is_featured}
                              onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                            />
                            <Label htmlFor="featured">Produto em Destaque?</Label>
                          </div>
                        </div>
                      </div>

                      {/* --- Descrição --- */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">Descrição do Produto</h3>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Descrição completa (aparece na página do produto)</Label>
                          <Textarea
                            id="description"
                            rows={8}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Descreva o produto em detalhes: materiais, especificações, dimensões, modo de uso, etc."
                            className="resize-y min-h-[120px]"
                          />
                          <p className="text-xs text-muted-foreground">{formData.description.length} caracteres</p>
                        </div>
                      </div>

                      {/* --- Imagens --- */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">Imagens do Produto</h3>

                        <div className="grid gap-2">
                          <Label>Imagem Principal (Thumbnail)</Label>
                          <ImageUpload
                            value={formData.imageUrl}
                            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                            disabled={isCreating}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>Imagens Adicionais</Label>
                          <div className="grid grid-cols-4 gap-3">
                            {productImages.map((img, index) => (
                              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted group">
                                <img src={img} alt={`Imagem ${index + 1}`} className="object-cover w-full h-full" />
                                <button
                                  type="button"
                                  onClick={() => removeProductImage(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {/* Add new image slot */}
                            <div className="aspect-square">
                              <ImageUpload
                                value=""
                                onChange={(url) => {
                                  if (url) addProductImage(url)
                                }}
                                disabled={isCreating}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{productImages.length} imagem(ns) adicional(is)</p>
                        </div>
                      </div>

                      {/* --- Variações --- */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Variações do Produto</h3>
                          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                            <Plus className="mr-1 h-3 w-3" /> Adicionar Variação
                          </Button>
                        </div>

                        {variants.length === 0 ? (
                          <div className="p-4 border border-dashed rounded-lg bg-muted/10 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold">Variação Padrão (Sem variações adicionais)</p>
                                <p className="text-xs text-muted-foreground">O produto terá estoque e preço base unificados.</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs font-bold text-primary">Qtd. Estoque:</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={formData.stock}
                                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                                  className="w-24 h-8 text-xs font-bold font-mono text-center"
                                />
                              </div>
                            </div>
                            {editingId && (
                              <div className="pt-2 border-t border-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">Estoque com mensagens/chaves para entrega automática:</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDigitalStockTarget({
                                    productId: editingId,
                                    productName: formData.name,
                                    variantId: defaultVariantId || undefined
                                  })}
                                  className="h-8 text-xs border-[#48B9FA]/40 text-[#0284c7] hover:bg-[#48B9FA]/10 font-bold cursor-pointer"
                                >
                                  <Package className="h-3.5 w-3.5 mr-1 text-[#48B9FA]" />
                                  Gerenciar Mensagens de Estoque
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {variants.map((variant, index) => (
                              <div key={index} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-muted-foreground">Variação {index + 1}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeVariant(index)}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 px-2"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" /> Remover
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="grid gap-1">
                                    <Label className="text-xs">Nome da Variação</Label>
                                    <Input
                                      value={variant.name}
                                      onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                      placeholder="Ex: P, M, G, GG"
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div className="grid gap-1">
                                    <Label className="text-xs">Preço (R$)</Label>
                                    <Input
                                      value={variant.price}
                                      onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                      placeholder="0,00"
                                      className="h-8 text-sm"
                                      inputMode="decimal"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                  <div className="grid gap-1">
                                    <Label className="text-xs">Tamanho</Label>
                                    <Input
                                      value={variant.size}
                                      onChange={(e) => updateVariant(index, 'size', e.target.value)}
                                      placeholder="P, M, G..."
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div className="grid gap-1">
                                    <Label className="text-xs">Cor</Label>
                                    <Input
                                      value={variant.color}
                                      onChange={(e) => updateVariant(index, 'color', e.target.value)}
                                      placeholder="Preto, Branco..."
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div className="grid gap-1">
                                    <Label className="text-xs font-bold text-primary">Qtd. Estoque</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={variant.stock}
                                      onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                                      placeholder="10"
                                      className="h-8 text-sm font-bold font-mono text-center"
                                    />
                                  </div>
                                  <div className="flex items-end gap-2 pb-0.5">
                                    <Switch
                                      checked={variant.in_stock && parseInt(variant.stock || '0', 10) > 0}
                                      onCheckedChange={(checked) => updateVariant(index, 'in_stock', checked)}
                                    />
                                    <Label className="text-xs">{variant.in_stock && parseInt(variant.stock || '0', 10) > 0 ? 'Em estoque' : 'Esgotado'}</Label>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <DialogFooter>
                        <Button type="submit" disabled={isCreating} className="w-full sm:w-auto">
                          {isCreating ? 'Salvando...' : 'Salvar Produto'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Barra de Filtro de Categoria e Resumo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-neutral-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Filter className="w-4 h-4 text-[#48B9FA]" />
                  <span className="text-xs font-bold text-neutral-700">Filtrar Categoria:</span>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[200px] sm:w-[260px] h-8 text-xs font-medium">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs font-semibold">Todas as Categorias ({products.length})</SelectItem>
                      <SelectItem value="none" className="text-xs text-neutral-400">Sem Categoria</SelectItem>
                      {categories.map((c) => {
                        const count = products.filter(p => p.category_id === c.id).length
                        return (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.name} ({count})
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>Mostrando <strong>{filteredProducts.length}</strong> de <strong>{products.length}</strong> itens</span>
                  {categoryFilter !== "all" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] px-2 text-[#48B9FA] hover:text-[#0284c7] cursor-pointer"
                      onClick={() => setCategoryFilter("all")}
                    >
                      Limpar filtro
                    </Button>
                  )}
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[105px]">Posição</TableHead>
                        <TableHead className="w-[64px]">Imagem</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="w-[210px]">Categoria</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell>
                        </TableRow>
                      ) : filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum produto encontrado nesta categoria.</TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map((product, productIndex) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <div className="flex flex-col">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 hover:bg-neutral-200 text-neutral-600 disabled:opacity-25 cursor-pointer"
                                    title="Subir posição na loja"
                                    onClick={() => handleMoveOrder(product.id, 'up')}
                                    disabled={productIndex === 0}
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 hover:bg-neutral-200 text-neutral-600 disabled:opacity-25 cursor-pointer"
                                    title="Descer posição na loja"
                                    onClick={() => handleMoveOrder(product.id, 'down')}
                                    disabled={productIndex === filteredProducts.length - 1}
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
                                  #{product.display_order && product.display_order > 0 ? product.display_order : productIndex + 1}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="relative w-12 h-12 bg-muted rounded overflow-hidden">
                                {(product.thumbnail_url || product.images?.[0]) ? (
                                  <img src={product.thumbnail_url || product.images?.[0]} alt={product.name} className="object-cover w-full h-full" />
                                ) : (
                                  <ImageIcon className="w-6 h-6 m-auto text-muted-foreground opacity-50 absolute inset-0 translate-y-1/2 translate-x-1/2" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div>
                                <span className="font-semibold text-neutral-900">{product.name}</span>
                                <div className="text-[11px] text-muted-foreground">
                                  {product.variants?.length || 0} variação(ões)
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="w-[200px]">
                                <Select
                                  value={product.category_id || "none"}
                                  onValueChange={(val) => handleQuickCategoryChange(product.id, val)}
                                >
                                  <SelectTrigger className="h-8 text-xs font-medium border-neutral-200 bg-neutral-50/70 hover:bg-white truncate">
                                    <SelectValue placeholder="Sem categoria" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none" className="text-xs text-neutral-400">Sem categoria</SelectItem>
                                    {categories.map((c) => (
                                      <SelectItem key={c.id} value={c.id} className="text-xs">
                                        {c.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-neutral-900">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price || product.variants?.[0]?.retail_price || 0)}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {product.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)} title="Editar detalhes">
                                <Pencil className="w-4 h-4 text-blue-500" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)} title="Excluir produto">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <InventoryManager
                onEditProduct={(item) => {
                  const existing = products.find((p) => p.id === item.id)
                  if (existing) {
                    handleEditProduct(existing)
                  } else {
                    handleEditProduct({
                      id: item.id,
                      name: item.name,
                      slug: item.slug,
                      price: item.variants?.[0]?.price || 0,
                      thumbnail_url: item.thumbnail_url,
                      category_id: item.category_id,
                      is_active: item.is_active,
                      variants: item.variants as any,
                    } as any)
                  }
                }}
                onProductDeleted={() => {
                  fetchProducts()
                }}
              />
            </div>
          )}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <FinancialManager />
            </div>
          )}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-serif font-bold">Gerenciar Pedidos</h2>
              <OrdersManager />
            </div>
          )}
          {activeTab === 'affiliates' && (
            <div className="space-y-6">
              <AffiliatesManager />
            </div>
          )}
          {activeTab === 'banners' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-serif font-bold">Gerenciar Banners</h2>
              <BannersManager />
            </div>
          )}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-serif font-bold">Gerenciar Categorias</h2>
              <CategoriesManager />
            </div>
          )}
        </div>
      </main>

      {digitalStockTarget && (
        <DigitalStockDialog
          open={!!digitalStockTarget}
          onOpenChange={(open) => {
            if (!open) {
              setDigitalStockTarget(null)
              fetchProducts()
            }
          }}
          productId={digitalStockTarget.productId}
          productName={digitalStockTarget.productName}
          variantId={digitalStockTarget.variantId}
          onStockUpdated={(newStock) => {
            setFormData(prev => ({ ...prev, stock: newStock.toString() }))
            fetchProducts()
          }}
        />
      )}
    </div>
  )
}
