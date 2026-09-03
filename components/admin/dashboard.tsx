
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  DollarSign
} from "lucide-react"
import { BannersManager } from "@/components/admin/banners-manager"
import { OrdersManager } from "@/components/admin/orders-manager"
import { CategoriesManager } from "@/components/admin/categories-manager"
import { ShippingManager } from "@/components/admin/shipping-manager"
import { InventoryManager } from "@/components/admin/inventory-manager"
import { FinancialManager } from "@/components/admin/financial-manager"
import { ImageUpload } from "@/components/admin/image-upload"
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
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [newProductOpen, setNewProductOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [categories, setCategories] = useState<Category[]>([])

  // New Product Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    stock: '10',
    imageUrl: '',
    category_id: '',
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
        console.log("Categories received:", data)
        setCategories(Array.isArray(data) ? data : [])
      } else {
        console.error("Failed to fetch categories:", res.status)
      }
    } catch (error) {
      console.error("Erro ao carregar categorias:", error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/admin/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(Array.isArray(data.products) ? data.products : [])
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      toast.error("Erro ao carregar produtos.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '', price: '', stock: '10', imageUrl: '', category_id: '', is_featured: false })
    setProductImages([])
    setVariants([])
    setEditingId(null)
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
        : [{
            name: 'Padrão',
            price: parsedPrice,
            stock: parseInt(formData.stock || '10', 10) || 10,
            in_stock: (parseInt(formData.stock || '10', 10) || 10) > 0
          }]

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
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: (product.price || product.variants?.[0]?.retail_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      stock: (product.variants?.[0]?.stock !== undefined ? product.variants[0].stock : (product.variants?.[0]?.in_stock ? 10 : 0)).toString(),
      imageUrl: product.thumbnail_url || product.images?.[0] || '',
      category_id: product.category_id || '',
      is_featured: product.is_featured
    })

    // Load existing images
    const mockupImages = product.mockups?.map(m => m.image_url) || []
    const existingImages = mockupImages.length > 0 ? mockupImages : (product.images || [])
    setProductImages(existingImages.filter(img => img !== (product.thumbnail_url || product.images?.[0] || '')))

    // Load existing variants
    if (product.variants && product.variants.length > 0) {
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

  return (
    <div className="min-h-screen bg-muted/20 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col fixed inset-y-0">
        <div className="p-6 border-b border-border">
          <h1 className="font-serif font-black text-2xl text-primary">LIBRÁS<span className="text-foreground text-sm block font-sans font-normal tracking-wide">Admin</span></h1>
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
          <Button variant={activeTab === 'banners' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('banners')}>
            <ImageIcon className="mr-2 h-4 w-4" /> Banners
          </Button>
          <Button variant={activeTab === 'categories' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('categories')}>
            <GripVertical className="mr-2 h-4 w-4" /> Categorias
          </Button>
          <Button variant={activeTab === 'shipping' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('shipping')}>
            <Truck className="mr-2 h-4 w-4" /> Frete
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
      <main className="flex-1 md:ml-64 p-8">
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

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="featured"
                            checked={formData.is_featured}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                          />
                          <Label htmlFor="featured">Produto em Destaque?</Label>
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
                          <div className="p-4 border border-dashed rounded-lg bg-muted/10 space-y-2">
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

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Imagem</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Variações</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
                        </TableRow>
                      ) : products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum produto encontrado.</TableCell>
                        </TableRow>
                      ) : (
                        products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="relative w-12 h-12 bg-muted rounded overflow-hidden">
                                {(product.thumbnail_url || product.images?.[0]) ? (
                                  <img src={product.thumbnail_url || product.images?.[0]} alt={product.name} className="object-cover w-full h-full" />
                                ) : (
                                  <ImageIcon className="w-6 h-6 m-auto text-muted-foreground opacity-50 absolute inset-0 translate-y-1/2 translate-x-1/2" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price || product.variants?.[0]?.retail_price || 0)}
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                {product.variants?.length || 0} variação(ões)
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {product.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                                <Pencil className="w-4 h-4 text-blue-500" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)}>
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
              <InventoryManager />
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
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-serif font-bold">Gerenciar Frete</h2>
              <ShippingManager />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
