"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Loader2,
  Trash2,
  Plus,
  Pencil,
  Sparkles,
  Layers,
  Upload,
  Image as ImageIcon,
  X,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
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
import type { Category } from "@/lib/store/types"

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // ==========================================
  // ESTADOS - CATEGORIA PRINCIPAL (ESQUERDA)
  // ==========================================
  const [mainName, setMainName] = useState("")
  const [mainSlug, setMainSlug] = useState("")
  const [mainDescription, setMainDescription] = useState("")
  const [mainImageUrl, setMainImageUrl] = useState("")
  const [isUploadingMainImg, setIsUploadingMainImg] = useState(false)
  const [isSubmittingMain, setIsSubmittingMain] = useState(false)
  const mainFileInputRef = useRef<HTMLInputElement>(null)

  // ==========================================
  // ESTADOS - CATEGORIA COMUM (DIREITA)
  // ==========================================
  const [commonName, setCommonName] = useState("")
  const [commonSlug, setCommonSlug] = useState("")
  const [commonDescription, setCommonDescription] = useState("")
  const [commonParentId, setCommonParentId] = useState<string>("")
  const [isSubmittingCommon, setIsSubmittingCommon] = useState(false)

  // ==========================================
  // ESTADOS - EDIÇÃO MODAL
  // ==========================================
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editName, setEditName] = useState("")
  const [editSlug, setEditSlug] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editOrder, setEditOrder] = useState<number>(1)
  const [editImageUrl, setEditImageUrl] = useState("")
  const [editParentId, setEditParentId] = useState<string>("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploadingEditImg, setIsUploadingEditImg] = useState(false)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await fetchWithAuth("/api/categories")
      if (res.ok) {
        const data = await res.json()
        setCategories(Array.isArray(data) ? data : [])
      } else {
        toast.error("Erro ao carregar categorias")
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("Erro ao carregar categorias")
    } finally {
      setLoading(false)
    }
  }

  // Separação das categorias em Principais e Comuns
  const mainCategories = categories.filter((c) => c.is_main === true)
  const commonCategories = categories.filter((c) => c.is_main !== true)

  // Upload genérico de imagem para o Supabase Storage via /api/upload
  const handleFileUpload = async (
    file: File,
    onSuccess: (url: string) => void,
    setLoadingState: (loading: boolean) => void
  ) => {
    try {
      setLoadingState(true)
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Falha no envio da imagem")
      }

      const data = await res.json()
      if (data.url) {
        onSuccess(data.url)
        toast.success("Imagem enviada com sucesso!")
      } else {
        throw new Error("URL não retornada pelo servidor")
      }
    } catch (error: any) {
      console.error("Erro no upload:", error)
      toast.error(error.message || "Erro ao fazer upload da imagem")
    } finally {
      setLoadingState(false)
    }
  }

  // ==========================================
  // CRIAR CATEGORIA PRINCIPAL
  // ==========================================
  const handleCreateMainCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mainName.trim()) {
      toast.error("Nome da categoria principal é obrigatório")
      return
    }

    setIsSubmittingMain(true)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mainName.trim(),
          slug: mainSlug.trim() || undefined,
          description: mainDescription.trim(),
          is_main: true,
          image_url: mainImageUrl.trim() || null,
          parent_id: null,
          display_order: mainCategories.length + 1,
        }),
      })

      if (res.ok) {
        toast.success("Categoria Principal criada com sucesso!")
        setMainName("")
        setMainSlug("")
        setMainDescription("")
        setMainImageUrl("")
        if (mainFileInputRef.current) mainFileInputRef.current.value = ""
        fetchCategories()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao criar categoria principal")
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro ao criar categoria principal")
    } finally {
      setIsSubmittingMain(false)
    }
  }

  // ==========================================
  // CRIAR CATEGORIA COMUM
  // ==========================================
  const handleCreateCommonCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commonName.trim()) {
      toast.error("Nome da categoria comum é obrigatório")
      return
    }

    setIsSubmittingCommon(true)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: commonName.trim(),
          slug: commonSlug.trim() || undefined,
          description: commonDescription.trim(),
          is_main: false,
          image_url: null, // Categorias comuns não contêm imagem
          parent_id: commonParentId ? commonParentId : null,
          display_order: commonCategories.length + 1,
        }),
      })

      if (res.ok) {
        toast.success("Categoria Comum criada com sucesso!")
        setCommonName("")
        setCommonSlug("")
        setCommonDescription("")
        setCommonParentId("")
        fetchCategories()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao criar categoria comum")
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro ao criar categoria comum")
    } finally {
      setIsSubmittingCommon(false)
    }
  }

  // ==========================================
  // EXCLUSÃO DE CATEGORIA
  // ==========================================
  const handleDeleteCategory = (cat: Category) => {
    const isMain = cat.is_main === true
    toast.warning(`Excluir ${isMain ? "a Categoria Principal" : "a Categoria Comum"} "${cat.name}"?`, {
      description: isMain
        ? "Categorias comuns vinculadas a ela não serão apagadas, apenas desvinculadas."
        : "Produtos cadastrados nesta categoria não serão excluídos.",
      action: {
        label: "Excluir",
        onClick: async () => {
          try {
            const res = await fetch(`/api/categories/${cat.id}`, {
              method: "DELETE",
            })

            if (res.ok) {
              toast.success("Categoria excluída com sucesso!")
              fetchCategories()
            } else {
              toast.error("Erro ao remover categoria")
            }
          } catch (error) {
            console.error(error)
            toast.error("Erro ao remover categoria")
          }
        },
      },
      cancel: { label: "Cancelar", onClick: () => {} },
    })
  }

  // ==========================================
  // EDIÇÃO DE CATEGORIA
  // ==========================================
  const openEditModal = (cat: Category) => {
    setEditingCategory(cat)
    setEditName(cat.name)
    setEditSlug(cat.slug)
    setEditDescription(cat.description || "")
    setEditOrder(cat.display_order || 1)
    setEditImageUrl(cat.image_url || "")
    setEditParentId(cat.parent_id || "")
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
      const isMain = editingCategory.is_main === true
      const payload = {
        name: editName.trim(),
        slug: editSlug.trim() || undefined,
        description: editDescription.trim(),
        display_order: Number(editOrder) || 1,
        is_main: isMain,
        image_url: isMain ? (editImageUrl.trim() || null) : null,
        parent_id: isMain ? null : (editParentId || null),
      }

      const res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      {/* Header Informativo da Gestão de Categorias */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-[#0284c7]" />
              <span>Hierarquia de Categorias</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl leading-relaxed">
              Organize sua loja com dois níveis: <strong>Categorias Principais</strong> (jogos e destaques com imagem no topo) e <strong>Categorias Comuns</strong> (subcategorias normais sem imagem que aparecem ao rolar a página).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0284c7]">
              {mainCategories.length} Principal(is)
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700">
              {commonCategories.length} Comum(ns)
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-neutral-200">
          <Loader2 className="w-8 h-8 animate-spin text-[#0284c7] mb-2" />
          <p className="text-xs text-neutral-500 font-medium">Carregando categorias...</p>
        </div>
      ) : (
        /* GRID DE DUAS COLUNAS: LADO ESQUERDO (PRINCIPAIS) / LADO DIREITO (COMUNS) */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          
          {/* ==================================================================== */}
          {/* LADO 1: CATEGORIAS PRINCIPAIS (COM IMAGEM - TOPO DA LOJA)            */}
          {/* ==================================================================== */}
          <div className="space-y-6">
            <div className="bg-white border-2 border-[#48B9FA]/40 rounded-xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#48B9FA] text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg tracking-wider">
                Topo da Loja • Com Imagem
              </div>

              <div className="mb-5">
                <div className="flex items-center gap-2 text-neutral-900 font-bold text-base sm:text-lg">
                  <Sparkles className="w-5 h-5 text-[#0284c7]" />
                  <h3>Categorias Principais</h3>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Aparecem lá em cima no grid &ldquo;Escolha um jogo&rdquo;. As imagens são adicionadas por você.
                </p>
              </div>

              {/* Formulário de Criação - Categoria Principal */}
              <form onSubmit={handleCreateMainCategory} className="space-y-4 pt-2 border-t border-neutral-100">
                <div>
                  <Label htmlFor="main-name" className="text-xs font-semibold text-neutral-700">
                    Nome da Categoria Principal *
                  </Label>
                  <Input
                    id="main-name"
                    placeholder="Ex: Blox Fruits, Adopt Me!, Grow a Garden..."
                    value={mainName}
                    onChange={(e) => setMainName(e.target.value)}
                    className="mt-1 h-9 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="main-slug" className="text-xs font-semibold text-neutral-700">
                      Slug URL (opcional)
                    </Label>
                    <Input
                      id="main-slug"
                      placeholder="Ex: blox-fruits"
                      value={mainSlug}
                      onChange={(e) => setMainSlug(e.target.value)}
                      className="mt-1 h-9 text-xs"
                    />
                  </div>

                  <div>
                    <Label htmlFor="main-desc" className="text-xs font-semibold text-neutral-700">
                      Descrição Curta
                    </Label>
                    <Input
                      id="main-desc"
                      placeholder="Ex: Frutas permanentes e gamepasses..."
                      value={mainDescription}
                      onChange={(e) => setMainDescription(e.target.value)}
                      className="mt-1 h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Campo de Imagem - Upload ou URL */}
                <div className="bg-neutral-50 border border-neutral-200/90 rounded-lg p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#0284c7]" />
                      <span>Imagem da Categoria Principal</span>
                    </Label>
                    <span className="text-[10px] text-neutral-400 font-medium">Recomendado 16:9 ou banner</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 items-center">
                    <input
                      type="file"
                      ref={mainFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileUpload(file, setMainImageUrl, setIsUploadingMainImg)
                        }
                      }}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingMainImg}
                      onClick={() => mainFileInputRef.current?.click()}
                      className="w-full sm:w-auto text-xs h-9 bg-white hover:bg-neutral-100 cursor-pointer border-neutral-300 shrink-0"
                    >
                      {isUploadingMainImg ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-[#0284c7]" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 mr-1.5 text-[#0284c7]" />
                          Selecionar Imagem
                        </>
                      )}
                    </Button>

                    <Input
                      placeholder="Ou cole a URL direta da imagem..."
                      value={mainImageUrl}
                      onChange={(e) => setMainImageUrl(e.target.value)}
                      className="h-9 text-xs bg-white flex-1"
                    />
                  </div>

                  {/* Preview da Imagem Selecionada */}
                  {mainImageUrl && (
                    <div className="relative w-full h-28 rounded-md overflow-hidden border border-neutral-200 bg-neutral-100 flex items-center justify-center">
                      <img
                        src={mainImageUrl}
                        alt="Preview da Categoria Principal"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setMainImageUrl("")
                          if (mainFileInputRef.current) mainFileInputRef.current.value = ""
                        }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/70 hover:bg-black text-white transition-colors cursor-pointer"
                        title="Remover imagem"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingMain || isUploadingMainImg}
                  className="w-full bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-bold text-xs h-10 transition-all shadow-xs cursor-pointer"
                >
                  {isSubmittingMain ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando Categoria Principal...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1.5" />
                      Criar Categoria Principal
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Lista de Categorias Principais Cadastradas */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <h4 className="font-bold text-sm text-neutral-900">
                  Categorias Principais Cadastradas ({mainCategories.length})
                </h4>
                <span className="text-[11px] text-neutral-400 font-medium">Exibidas no grid do topo</span>
              </div>

              {mainCategories.length === 0 ? (
                <div className="text-center py-10 px-4 bg-neutral-50 border border-dashed border-neutral-200 rounded-lg space-y-2">
                  <Sparkles className="w-8 h-8 text-neutral-400 mx-auto" />
                  <p className="text-xs sm:text-sm font-semibold text-neutral-700">
                    Nenhuma categoria principal cadastrada ainda.
                  </p>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    Use o formulário acima para cadastrar os jogos ou categorias principais do topo e fazer o upload de suas próprias imagens.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {mainCategories.map((cat, idx) => {
                    const childCount = commonCategories.filter((c) => c.parent_id === cat.id).length
                    return (
                      <div
                        key={cat.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-neutral-200 hover:border-[#48B9FA]/60 bg-neutral-50/50 hover:bg-white transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          {/* Miniatura da Imagem */}
                          <div className="w-16 h-12 rounded-md overflow-hidden bg-neutral-200 shrink-0 border border-neutral-200 relative flex items-center justify-center">
                            {cat.image_url ? (
                              <img
                                src={cat.image_url}
                                alt={cat.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-neutral-400" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-neutral-900 truncate">
                                {cat.name}
                              </span>
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-50 text-[#0284c7] font-semibold border border-blue-200">
                                Principal #{idx + 1}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-500 truncate">
                              /{cat.slug} • {childCount} subcategoria(s) comum(ns) vinculada(s)
                            </p>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(cat)}
                            className="h-8 px-2.5 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1 text-[#0284c7]" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(cat)}
                            className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ==================================================================== */}
          {/* LADO 2: CATEGORIAS COMUNS (SEM IMAGEM - HIERARQUIA / ROLAGEM)        */}
          {/* ==================================================================== */}
          <div className="space-y-6">
            <div className="bg-white border border-neutral-300 rounded-xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-neutral-800 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg tracking-wider">
                Subcategorias • Rolagem da Loja
              </div>

              <div className="mb-5">
                <div className="flex items-center gap-2 text-neutral-900 font-bold text-base sm:text-lg">
                  <Layers className="w-5 h-5 text-neutral-700" />
                  <h3>Categorias Comuns</h3>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Não possuem imagem. Ficam dentro das categorias principais e aparecem ao rolar a página.
                </p>
              </div>

              {/* Formulário de Criação - Categoria Comum */}
              <form onSubmit={handleCreateCommonCategory} className="space-y-4 pt-2 border-t border-neutral-100">
                <div>
                  <Label htmlFor="common-name" className="text-xs font-semibold text-neutral-700">
                    Nome da Categoria Comum *
                  </Label>
                  <Input
                    id="common-name"
                    placeholder="Ex: Frutas no Inventário, Gamepasses, Raças V4, Contas..."
                    value={commonName}
                    onChange={(e) => setCommonName(e.target.value)}
                    className="mt-1 h-9 text-xs"
                    required
                  />
                </div>

                {/* Seleção da Categoria Principal à qual pertence (Hierarquia) */}
                <div>
                  <Label htmlFor="common-parent" className="text-xs font-semibold text-neutral-700">
                    Pertence à Categoria Principal (Hierarquia)
                  </Label>
                  <select
                    id="common-parent"
                    value={commonParentId}
                    onChange={(e) => setCommonParentId(e.target.value)}
                    className="mt-1 w-full bg-white border border-neutral-200 rounded-md h-9 px-3 text-xs text-neutral-800 focus:outline-none focus:border-[#48B9FA] transition-colors"
                  >
                    <option value="">-- Nenhuma (Categoria Comum Geral) --</option>
                    {mainCategories.map((main) => (
                      <option key={main.id} value={main.id}>
                        ⭐ {main.name} (/{main.slug})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Vincule esta categoria comum a uma categoria principal para mantê-la organizada.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="common-slug" className="text-xs font-semibold text-neutral-700">
                      Slug URL (opcional)
                    </Label>
                    <Input
                      id="common-slug"
                      placeholder="Ex: frutas-inventario"
                      value={commonSlug}
                      onChange={(e) => setCommonSlug(e.target.value)}
                      className="mt-1 h-9 text-xs"
                    />
                  </div>

                  <div>
                    <Label htmlFor="common-desc" className="text-xs font-semibold text-neutral-700">
                      Descrição Curta
                    </Label>
                    <Input
                      id="common-desc"
                      placeholder="Ex: Todas as frutas físicas para entrega..."
                      value={commonDescription}
                      onChange={(e) => setCommonDescription(e.target.value)}
                      className="mt-1 h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Nota visual explicando que comuns não têm imagem conforme instrução */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-md p-2.5 text-[11px] text-neutral-500 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>Categorias comuns funcionam como antes: não contêm imagem e exibem produtos no catálogo.</span>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingCommon}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs h-10 transition-all shadow-xs cursor-pointer"
                >
                  {isSubmittingCommon ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando Categoria Comum...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1.5" />
                      Criar Categoria Comum
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Lista de Categorias Comuns Cadastradas */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <h4 className="font-bold text-sm text-neutral-900">
                  Categorias Comuns Cadastradas ({commonCategories.length})
                </h4>
                <span className="text-[11px] text-neutral-400 font-medium">Exibidas na rolagem dos produtos</span>
              </div>

              {commonCategories.length === 0 ? (
                <div className="text-center py-10 px-4 bg-neutral-50 border border-dashed border-neutral-200 rounded-lg space-y-2">
                  <Layers className="w-8 h-8 text-neutral-400 mx-auto" />
                  <p className="text-xs sm:text-sm font-semibold text-neutral-700">
                    Nenhuma categoria comum cadastrada.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 max-h-[550px] overflow-y-auto pr-1">
                  {commonCategories.map((cat, idx) => {
                    const parentMain = mainCategories.find((m) => m.id === cat.parent_id)

                    return (
                      <div
                        key={cat.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border border-neutral-200 hover:border-neutral-300 bg-white transition-all shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-neutral-900 truncate">
                              {cat.name}
                            </span>
                            {parentMain ? (
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-50 text-[#0284c7] font-semibold border border-blue-200 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                {parentMain.name}
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-neutral-100 text-neutral-500 font-medium border border-neutral-200">
                                Geral
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                            /{cat.slug} {cat.description ? `• ${cat.description}` : ""}
                          </p>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(cat)}
                            className="h-7 px-2 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1 text-[#0284c7]" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(cat)}
                            className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL DE EDIÇÃO (ADAPTA SE FOR PRINCIPAL OU COMUM)                    */}
      {/* ==================================================================== */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="max-w-md sm:max-w-lg bg-white border border-neutral-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
              {editingCategory?.is_main ? (
                <>
                  <Sparkles className="w-4 h-4 text-[#0284c7]" />
                  <span>Editar Categoria Principal</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4 text-neutral-700" />
                  <span>Editar Categoria Comum</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              {editingCategory?.is_main
                ? "Atualize as informações e a imagem personalizada da categoria principal do topo."
                : "Atualize os dados e a qual categoria principal esta categoria comum pertence."}
            </DialogDescription>
          </DialogHeader>

          {editingCategory && (
            <form onSubmit={handleUpdateCategory} className="space-y-4 py-2">
              <div>
                <Label htmlFor="edit-name" className="text-xs font-semibold text-neutral-700">
                  Nome da Categoria *
                </Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-slug" className="text-xs font-semibold text-neutral-700">
                    Slug URL
                  </Label>
                  <Input
                    id="edit-slug"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-order" className="text-xs font-semibold text-neutral-700">
                    Ordem de Exibição
                  </Label>
                  <Input
                    id="edit-order"
                    type="number"
                    value={editOrder}
                    onChange={(e) => setEditOrder(parseInt(e.target.value) || 1)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-desc" className="text-xs font-semibold text-neutral-700">
                  Descrição
                </Label>
                <Textarea
                  id="edit-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="mt-1 text-xs resize-none"
                />
              </div>

              {/* Se for Categoria Comum: Seleção da Categoria Principal Pai */}
              {!editingCategory.is_main && (
                <div>
                  <Label htmlFor="edit-parent" className="text-xs font-semibold text-neutral-700">
                    Pertence à Categoria Principal
                  </Label>
                  <select
                    id="edit-parent"
                    value={editParentId}
                    onChange={(e) => setEditParentId(e.target.value)}
                    className="mt-1 w-full bg-white border border-neutral-200 rounded-md h-9 px-3 text-xs text-neutral-800 focus:outline-none focus:border-[#48B9FA]"
                  >
                    <option value="">-- Nenhuma (Categoria Comum Geral) --</option>
                    {mainCategories
                      .filter((m) => m.id !== editingCategory.id)
                      .map((main) => (
                        <option key={main.id} value={main.id}>
                          ⭐ {main.name} (/{main.slug})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Se for Categoria Principal: Upload e URL de Imagem */}
              {editingCategory.is_main && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-2.5">
                  <Label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#0284c7]" />
                    <span>Imagem da Categoria Principal</span>
                  </Label>

                  <div className="flex gap-2 items-center">
                    <input
                      type="file"
                      ref={editFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileUpload(file, setEditImageUrl, setIsUploadingEditImg)
                        }
                      }}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingEditImg}
                      onClick={() => editFileInputRef.current?.click()}
                      className="text-xs h-9 bg-white border-neutral-300 shrink-0"
                    >
                      {isUploadingEditImg ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-[#0284c7]" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 mr-1 text-[#0284c7]" />
                          Alterar Imagem
                        </>
                      )}
                    </Button>

                    <Input
                      placeholder="Ou cole a URL direta..."
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      className="h-9 text-xs bg-white flex-1"
                    />
                  </div>

                  {editImageUrl && (
                    <div className="relative w-full h-24 rounded-md overflow-hidden border border-neutral-200 bg-neutral-100 flex items-center justify-center">
                      <img
                        src={editImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditImageUrl("")
                          if (editFileInputRef.current) editFileInputRef.current.value = ""
                        }}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-black text-white transition-colors cursor-pointer"
                        title="Remover imagem"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingCategory(null)}
                  className="text-xs h-9 cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUpdating || isUploadingEditImg}
                  className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white text-xs h-9 font-bold cursor-pointer"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
