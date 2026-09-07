"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Trash2, Plus, GripVertical, Pencil } from "lucide-react"
import { fetchWithAuth } from "@/lib/utils/fetch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Category {
    id: string
    name: string
    slug: string
    description?: string
    display_order: number
}

export function CategoriesManager() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state (criação)
    const [name, setName] = useState("")
    const [slug, setSlug] = useState("")
    const [description, setDescription] = useState("")

    // Form state (edição)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [editName, setEditName] = useState("")
    const [editSlug, setEditSlug] = useState("")
    const [editDescription, setEditDescription] = useState("")
    const [editOrder, setEditOrder] = useState<number>(1)
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            setLoading(true)
            console.log("CategoriesManager: Fetching /api/categories")
            const res = await fetchWithAuth('/api/categories')
            if (res.ok) {
                const data = await res.json()
                console.log("CategoriesManager: Received data:", data)
                setCategories(Array.isArray(data) ? data : [])
            } else {
                console.error("CategoriesManager: Fetch failed", res.status)
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
            toast.error("Erro ao carregar categorias")
        } finally {
            setLoading(false)
        }
    }

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) {
            toast.error("Nome é obrigatório")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    slug: slug || undefined, // API auto-generates if missing
                    description,
                    display_order: categories.length + 1
                })
            })

            if (res.ok) {
                toast.success("Categoria criada com sucesso!")
                setName("")
                setSlug("")
                setDescription("")
                fetchCategories()
            } else {
                const data = await res.json()
                toast.error(data.error || "Erro ao criar categoria")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao criar categoria")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteCategory = (id: string) => {
        toast.warning("Excluir esta categoria?", {
            description: "Produtos nesta categoria não serão excluídos.",
            action: {
                label: "Excluir",
                onClick: async () => {
                    try {
                        const res = await fetch(`/api/categories/${id}`, {
                            method: 'DELETE'
                        })

                        if (res.ok) {
                            toast.success("Categoria removida!")
                            fetchCategories()
                        } else {
                            toast.error("Erro ao remover categoria")
                        }
                    } catch (error) {
                        console.error(error)
                        toast.error("Erro ao remover categoria")
                    }
                }
            },
            cancel: { label: "Cancelar", onClick: () => { } }
        })
    }

    const openEditCategory = (cat: Category) => {
        setEditingCategory(cat)
        setEditName(cat.name)
        setEditSlug(cat.slug)
        setEditDescription(cat.description || "")
        setEditOrder(cat.display_order || 1)
    }

    const handleUpdateCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingCategory) return
        if (!editName.trim()) {
            toast.error("Nome da categoria é obrigatório")
            return
        }

        setIsUpdating(true)
        try {
            const res = await fetch(`/api/categories/${editingCategory.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName.trim(),
                    slug: editSlug.trim() || undefined,
                    description: editDescription.trim() || null,
                    display_order: Number(editOrder) || 1
                })
            })

            if (res.ok) {
                toast.success("Categoria atualizada com sucesso!")
                setEditingCategory(null)
                fetchCategories()
            } else {
                const data = await res.json()
                toast.error(data.error || "Erro ao atualizar categoria")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao atualizar categoria")
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Create Category Form */}
            <div className="bg-card p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-bold mb-4">Adicionar Nova Categoria</h3>
                <form onSubmit={handleAddCategory} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nome</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Frutas Míticas"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Slug (URL) <span className="text-muted-foreground text-xs font-normal">(Opcional)</span></label>
                            <Input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="frutas-miticas"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Descrição</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descrição curta da categoria"
                            rows={2}
                        />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Adicionar Categoria
                    </Button>
                </form>
            </div>

            {/* List Categories */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold">Categorias Existentes</h3>
                {loading ? (
                    <div className="text-center py-8">Carregando...</div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                        Nenhuma categoria encontrada.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {categories.map((category) => (
                            <div key={category.id} className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-background rounded border">
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">{category.name}</p>
                                            <span className="text-[10px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded">
                                                Ordem: {category.display_order}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">/{category.slug}</p>
                                        {category.description && (
                                            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{category.description}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEditCategory(category)}
                                        title="Editar Categoria"
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteCategory(category.id)}
                                        title="Excluir Categoria"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Edição de Categoria */}
            <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar Categoria</DialogTitle>
                        <DialogDescription>
                            Altere os dados da categoria abaixo. As mudanças serão refletidas imediatamente no menu e filtros da loja.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateCategory} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="edit-cat-name" className="text-sm font-medium">Nome da Categoria</Label>
                            <Input
                                id="edit-cat-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Ex: Frutas Míticas"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="edit-cat-slug" className="text-sm font-medium">Slug (URL)</Label>
                                <Input
                                    id="edit-cat-slug"
                                    value={editSlug}
                                    onChange={(e) => setEditSlug(e.target.value)}
                                    placeholder="frutas-miticas"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-cat-order" className="text-sm font-medium">Ordem de Exibição</Label>
                                <Input
                                    id="edit-cat-order"
                                    type="number"
                                    min="0"
                                    value={editOrder}
                                    onChange={(e) => setEditOrder(parseInt(e.target.value, 10) || 0)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-cat-desc" className="text-sm font-medium">Descrição</Label>
                            <Textarea
                                id="edit-cat-desc"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Descrição da categoria"
                                rows={3}
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingCategory(null)}
                                disabled={isUpdating}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isUpdating} className="bg-primary text-white">
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                                    </>
                                ) : (
                                    "Salvar Alterações"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
