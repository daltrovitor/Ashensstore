"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { Trash2, Plus, ExternalLink, Image as ImageIcon, Sparkles } from "lucide-react"
import { ImageUpload } from "@/components/admin/image-upload"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Banner {
    id: string
    title: string
    image_url: string
    link_url?: string
    active: boolean
    display_order?: number
    created_at?: string
}

export function BannersManager() {
    const [banners, setBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(true)
    const [title, setTitle] = useState("")
    const [imageUrl, setImageUrl] = useState("")
    const [linkUrl, setLinkUrl] = useState("/loja")
    const [active, setActive] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [bannerToDelete, setBannerToDelete] = useState<string | null>(null)

    useEffect(() => {
        fetchBanners()
    }, [])

    const fetchBanners = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/banners')
            if (res.ok) {
                const data = await res.json()
                setBanners(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error('Error fetching banners:', error)
            toast.error("Erro ao carregar banners")
        } finally {
            setLoading(false)
        }
    }

    const handleAddBanner = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!imageUrl) {
            toast.error("Informe a imagem do banner (URL ou upload)")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/admin/banners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim() || 'Banner Promocional',
                    image_url: imageUrl.trim(),
                    link_url: linkUrl.trim() || '/loja',
                    active,
                    display_order: banners.length,
                })
            })

            if (res.ok) {
                toast.success("Banner adicionado com sucesso!")
                setTitle("")
                setImageUrl("")
                setLinkUrl("/loja")
                setActive(true)
                fetchBanners()
            } else {
                const data = await res.json()
                toast.error(data.error || "Erro ao adicionar banner")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao adicionar banner")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggleActive = async (banner: Banner) => {
        try {
            const updatedState = !banner.active
            const res = await fetch('/api/admin/banners', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: banner.id, active: updatedState })
            })

            if (res.ok) {
                setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, active: updatedState } : b))
                toast.success(updatedState ? "Banner ativado no slider!" : "Banner desativado do slider.")
            } else {
                toast.error("Erro ao atualizar status do banner")
            }
        } catch (err) {
            console.error(err)
            toast.error("Erro ao atualizar status do banner")
        }
    }

    const executeDelete = async () => {
        if (!bannerToDelete) return

        try {
            const res = await fetch(`/api/admin/banners?id=${bannerToDelete}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success("Banner removido!")
                fetchBanners()
            } else {
                toast.error("Erro ao remover banner")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao remover banner")
        } finally {
            setBannerToDelete(null)
        }
    }

    const loadDefaultPreset = (num: 1 | 2) => {
        if (num === 1) {
            setTitle("Banner Blox Fruits Principal")
            setImageUrl("/banners/banner-1.jpg")
            setLinkUrl("/loja")
        } else {
            setTitle("Banner Frutas Míticas & Kitsune")
            setImageUrl("/banners/banner-2.jpg")
            setLinkUrl("/loja?categoryId=frutas")
        }
        toast.info(`Preset Banner ${num} carregado no formulário!`)
    }

    return (
        <div className="space-y-8">
            {/* Header com Ações Rápidas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-neutral-200">
                <div>
                    <h3 className="text-xl font-semibold text-neutral-900">Gerenciador de Slides do Banner</h3>
                    <p className="text-sm text-neutral-500 mt-1">
                        Configure os banners em tela cheia que aparecem de um lado ao outro na página inicial da loja.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => loadDefaultPreset(1)}
                        className="text-xs border-neutral-200 hover:border-blue-500 hover:text-blue-600"
                    >
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-500" /> Preencher Padrão 1
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => loadDefaultPreset(2)}
                        className="text-xs border-neutral-200 hover:border-blue-500 hover:text-blue-600"
                    >
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-500" /> Preencher Padrão 2
                    </Button>
                </div>
            </div>

            {/* Formulário de Adicionar Slide */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-xs">
                <h4 className="text-base font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-600" /> Adicionar Novo Slide
                </h4>
                <form onSubmit={handleAddBanner} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="banner-title" className="text-xs font-semibold text-neutral-700">
                                Título do Slide (Identificação interna / Alt text)
                            </Label>
                            <Input
                                id="banner-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Frutas Míticas em Promoção"
                                className="border-neutral-300 focus:border-blue-600 text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="banner-link" className="text-xs font-semibold text-neutral-700">
                                Link de Destino ao Clicar
                            </Label>
                            <Input
                                id="banner-link"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="Ex: /loja ou /loja?categoryId=frutas"
                                className="border-neutral-300 focus:border-blue-600 text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-neutral-700">
                            Imagem do Slide (Upload de arquivo ou URL direta)
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <div className="space-y-2">
                                <ImageUpload
                                    value={imageUrl}
                                    onChange={(url: string) => setImageUrl(url)}
                                    disabled={isSubmitting}
                                />
                                <span className="text-[11px] text-neutral-400 block">
                                    Recomendado: 1920x600 ou formato panorâmico (21:9 / 24:8).
                                </span>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="banner-direct-url" className="text-xs text-neutral-500">
                                    Ou cole uma URL direta da imagem:
                                </Label>
                                <Input
                                    id="banner-direct-url"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="Ex: /banners/banner-1.jpg ou https://..."
                                    className="border-neutral-300 text-xs font-mono"
                                />
                                {imageUrl && (
                                    <div className="mt-2 relative aspect-[21/8] w-full rounded-md overflow-hidden border border-neutral-200 bg-neutral-50">
                                        <img
                                            src={imageUrl}
                                            alt="Pré-visualização"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none'
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-neutral-100">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="banner-active"
                                checked={active}
                                onCheckedChange={setActive}
                            />
                            <Label htmlFor="banner-active" className="text-xs font-medium text-neutral-700">
                                Slide ativo e visível imediatamente na loja
                            </Label>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-6"
                        >
                            {isSubmitting ? <Spinner className="mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
                            Salvar Slide
                        </Button>
                    </div>
                </form>
            </div>

            {/* Lista de Slides Atuais */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-neutral-900">
                        Slides Cadastrados ({banners.length})
                    </h4>
                    <span className="text-xs text-neutral-500">
                        {banners.filter(b => b.active).length} ativos no slider
                    </span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16 bg-white border border-neutral-200 rounded-lg">
                        <Spinner className="size-8 text-blue-600" />
                    </div>
                ) : banners.length === 0 ? (
                    <div className="text-center py-12 bg-white border border-dashed border-neutral-300 rounded-lg text-neutral-500 space-y-3">
                        <ImageIcon className="w-10 h-10 mx-auto text-neutral-300" />
                        <p className="text-sm font-medium">Nenhum slide cadastrado no banco de dados.</p>
                        <p className="text-xs text-neutral-400">
                            A loja está usando os banners padrão automáticos. Cadastre um banner acima para personalizar!
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {banners.map((banner, index) => (
                            <div
                                key={banner.id}
                                className={`bg-white rounded-lg border overflow-hidden transition-all ${
                                    banner.active ? 'border-neutral-200 shadow-xs' : 'border-neutral-200 opacity-60'
                                }`}
                            >
                                <div className="relative aspect-[21/8] bg-neutral-100 overflow-hidden group">
                                    <img
                                        src={banner.image_url}
                                        alt={banner.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 left-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                            banner.active
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-neutral-800 text-neutral-300'
                                        }`}>
                                            Slide #{index + 1} • {banner.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setBannerToDelete(banner.id)}
                                            className="h-7 px-2 text-xs bg-red-600 hover:bg-red-700"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-4 flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <h5 className="font-semibold text-sm text-neutral-900 truncate">
                                            {banner.title}
                                        </h5>
                                        {banner.link_url && (
                                            <a
                                                href={banner.link_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5 truncate"
                                            >
                                                <span>{banner.link_url}</span>
                                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                            </a>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Label htmlFor={`toggle-${banner.id}`} className="text-xs text-neutral-500 cursor-pointer">
                                            {banner.active ? 'Visível' : 'Oculto'}
                                        </Label>
                                        <Switch
                                            id={`toggle-${banner.id}`}
                                            checked={banner.active}
                                            onCheckedChange={() => handleToggleActive(banner)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Confirmação de Exclusão */}
            <AlertDialog open={!!bannerToDelete} onOpenChange={(open) => !open && setBannerToDelete(null)}>
                <AlertDialogContent className="bg-white border border-neutral-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-neutral-900">Excluir Slide do Banner?</AlertDialogTitle>
                        <AlertDialogDescription className="text-neutral-600 text-sm">
                            Tem certeza que deseja excluir este banner? Esta ação removerá o slide permanentemente da página inicial.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-neutral-200">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Confirmar Exclusão
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
