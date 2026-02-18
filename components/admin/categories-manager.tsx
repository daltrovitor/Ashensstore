"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Trash2, Plus, GripVertical } from "lucide-react"
import { fetchWithAuth } from "@/lib/utils/fetch"

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

    // Form state
    const [name, setName] = useState("")
    const [slug, setSlug] = useState("")
    const [description, setDescription] = useState("")

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
                                onChange={(e) => {
                                    setName(e.target.value)
                                    // Auto-slug if slug is empty
                                    if (!slug) {
                                        // Keeping slug empty so backend generates it is safer, 
                                        // or we can pre-fill it here visually if we want.
                                    }
                                }}
                                placeholder="Ex: Abrasivos"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Slug (URL) <span className="text-muted-foreground text-xs font-normal">(Opcional)</span></label>
                            <Input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="abrasivos"
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
                                        <p className="font-semibold">{category.name}</p>
                                        <p className="text-xs text-muted-foreground">/{category.slug}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
