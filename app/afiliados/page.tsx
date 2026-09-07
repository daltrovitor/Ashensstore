"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import {
    DollarSign,
    Gift,
    TrendingUp,
    Copy,
    Check,
    Share2,
    MessageCircle,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    Users,
    Package
} from "lucide-react"

interface AffiliateStats {
    affiliate: {
        id: string
        user_id: string
        name: string
        email: string
        coupon_code: string
        discount_percent: number
        commission_percent: number
        created_at: string
    }
    total_sales_count: number
    paid_orders_count: number
    total_revenue: number
    total_commission: number
    orders: Array<{
        id: string
        external_id: string
        created_at: string
        total: number
        status: string
        commission: number
    }>
}

export default function AfiliadosPage() {
    const { user, loading: authLoading } = useAuth()
    const [loadingStats, setLoadingStats] = useState(true)
    const [isAffiliate, setIsAffiliate] = useState(false)
    const [stats, setStats] = useState<AffiliateStats | null>(null)
    const [couponInput, setCouponInput] = useState("")
    const [isRegistering, setIsRegistering] = useState(false)
    const [copiedCode, setCopiedCode] = useState(false)
    const [copiedLink, setCopiedLink] = useState(false)

    useEffect(() => {
        if (!authLoading) {
            loadAffiliateData()
        }
    }, [authLoading, user])

    const loadAffiliateData = async () => {
        setLoadingStats(true)
        try {
            const res = await fetch('/api/affiliates')
            if (res.ok) {
                const data = await res.json()
                if (data.authenticated && data.is_affiliate && data.stats) {
                    setIsAffiliate(true)
                    setStats(data.stats)
                } else {
                    setIsAffiliate(false)
                    setStats(null)
                }
            }
        } catch (err) {
            console.error('Erro ao carregar dados de afiliado:', err)
        } finally {
            setLoadingStats(false)
        }
    }

    const handleCreateAffiliate = async (e: React.FormEvent) => {
        e.preventDefault()
        const cleanCode = couponInput.trim().toUpperCase()

        if (!cleanCode || cleanCode.length < 3) {
            toast.error("O código do cupom deve ter pelo menos 3 letras ou números.")
            return
        }

        setIsRegistering(true)
        try {
            const res = await fetch('/api/affiliates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coupon_code: cleanCode }),
            })

            const data = await res.json()
            if (res.ok && data.success) {
                toast.success("Parabéns! Sua conta de afiliado foi ativada com sucesso.")
                setIsAffiliate(true)
                setStats(data.stats)
            } else {
                toast.error(data.error || "Erro ao criar cupom de afiliado")
            }
        } catch (err) {
            console.error(err)
            toast.error("Erro ao registrar cupom de afiliado")
        } finally {
            setIsRegistering(false)
        }
    }

    const formatPrice = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val)
    }

    const handleCopyCode = () => {
        if (!stats?.affiliate.coupon_code) return
        navigator.clipboard.writeText(stats.affiliate.coupon_code)
        setCopiedCode(true)
        toast.success("Cupom copiado com sucesso!")
        setTimeout(() => setCopiedCode(false), 2500)
    }

    const handleCopyLink = () => {
        if (!stats?.affiliate.coupon_code) return
        const url = `${window.location.origin}/loja?cupom=${stats.affiliate.coupon_code}`
        navigator.clipboard.writeText(url)
        setCopiedLink(true)
        toast.success("Link de divulgação copiado com sucesso!")
        setTimeout(() => setCopiedLink(false), 2500)
    }

    const getWhatsAppUrl = () => {
        if (!stats) return "https://wa.me/5562984638578"
        const commissionFormatted = formatPrice(stats.total_commission)
        const text = `Olá! Sou o afiliado ${stats.affiliate.name || stats.affiliate.email} (Cupom: ${stats.affiliate.coupon_code}). Gostaria de solicitar o saque das minhas comissões acumuladas na Ashens Store no valor de ${commissionFormatted}.`
        return `https://wa.me/5562984638578?text=${encodeURIComponent(text)}`
    }

    return (
        <div className="min-h-screen bg-white flex flex-col selection:bg-[#48B9FA]/20 selection:text-neutral-900">
            <Navbar />

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
                {/* Hero / Cabeçalho */}
                <div className="text-center space-y-3 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 rounded-full text-xs font-semibold text-neutral-700 tracking-wide">
                        <Sparkles className="w-3.5 h-3.5 text-[#48B9FA]" />
                        Programa Oficial de Afiliados
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
                        Ganhe <span className="text-[#48B9FA]">10% de Comissão</span> em Cada Venda
                    </h1>
                    <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                        Crie seu cupom exclusivo de 10% de desconto para seus seguidores e amigos. Cada compra realizada com ele rende 10% de comissão em dinheiro para você sacar via Pix pelo WhatsApp.
                    </p>
                </div>

                {authLoading || loadingStats ? (
                    <div className="py-16 text-center space-y-3">
                        <Spinner className="h-8 w-8 mx-auto text-[#48B9FA]" />
                        <p className="text-xs text-neutral-500">Carregando painel de afiliados...</p>
                    </div>
                ) : !user ? (
                    /* Visitante não logado */
                    <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6">
                        <div className="w-12 h-12 bg-neutral-100 border border-neutral-200 rounded-full flex items-center justify-center mx-auto text-[#48B9FA]">
                            <Users className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-neutral-900">Crie sua Conta ou Faça Login</h2>
                            <p className="text-xs text-neutral-600 leading-relaxed max-w-md mx-auto">
                                Para gerar seu cupom de 10% e acompanhar suas comissões em tempo real, conecte-se à sua conta da Ashens Store.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                            <Link
                                href="/signup"
                                className="w-full sm:w-auto h-11 px-6 bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-semibold text-xs rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                            >
                                Cadastre-se Grátis
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/login"
                                className="w-full sm:w-auto h-11 px-6 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 font-medium text-xs rounded-sm transition-colors flex items-center justify-center cursor-pointer"
                            >
                                Já tenho uma conta
                            </Link>
                        </div>
                    </div>
                ) : !isAffiliate ? (
                    /* Usuário logado, mas ainda não ativou o cupom */
                    <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-8 sm:p-10 max-w-xl mx-auto space-y-6">
                        <div className="space-y-2 text-center">
                            <h2 className="text-xl font-bold text-neutral-900">Ative seu Cupom de Afiliado</h2>
                            <p className="text-xs text-neutral-600 leading-relaxed">
                                Escolha o código que seus amigos e seguidores vão usar no checkout (ex: <strong>SEUNICK10</strong>). Eles ganham 10% de desconto e você ganha 10% de comissão.
                            </p>
                        </div>

                        <form onSubmit={handleCreateAffiliate} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-800">
                                    Código do Cupom de 10% <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        placeholder="Ex: BLOX10, PEDRO10"
                                        value={couponInput}
                                        onChange={(e) => setCouponInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                                        maxLength={20}
                                        className="bg-white border-neutral-300 focus-visible:ring-[#48B9FA] font-mono text-sm h-11 tracking-wider uppercase font-bold"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-[11px] text-neutral-400">
                                    Apenas letras e números. Mínimo 3 caracteres.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={isRegistering || couponInput.trim().length < 3}
                                className="w-full h-11 bg-[#48B9FA] hover:bg-[#20a6f5] disabled:opacity-50 text-white font-semibold text-xs rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                            >
                                {isRegistering ? (
                                    <>
                                        <Spinner className="h-4 w-4 mr-2" />
                                        Ativando Cupom...
                                    </>
                                ) : (
                                    <>
                                        <Gift className="w-4 h-4 mr-1.5" />
                                        Criar Meu Cupom e Ativar Conta de Afiliado
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                ) : (
                    /* Painel Completo do Afiliado Ativo */
                    <div className="space-y-8">
                        {/* Cards de Métricas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Card 1: Saldo de Comissões */}
                            <div className="bg-white border border-neutral-200 rounded-sm p-5 space-y-2 shadow-xs">
                                <div className="flex items-center justify-between text-xs text-neutral-500">
                                    <span>Saldo Disponível</span>
                                    <div className="p-1.5 bg-emerald-50 rounded text-emerald-600">
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-black text-emerald-600">
                                    {formatPrice(stats?.total_commission || 0)}
                                </div>
                                <div className="text-[11px] text-neutral-400">
                                    {stats?.paid_orders_count || 0} venda(s) confirmada(s)
                                </div>
                            </div>

                            {/* Card 2: Total de Pedidos */}
                            <div className="bg-white border border-neutral-200 rounded-sm p-5 space-y-2 shadow-xs">
                                <div className="flex items-center justify-between text-xs text-neutral-500">
                                    <span>Vendas Realizadas</span>
                                    <div className="p-1.5 bg-blue-50 rounded text-[#48B9FA]">
                                        <Package className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-black text-neutral-900">
                                    {stats?.total_sales_count || 0}
                                </div>
                                <div className="text-[11px] text-neutral-400">
                                    Total faturado: {formatPrice(stats?.total_revenue || 0)}
                                </div>
                            </div>

                            {/* Card 3: Cupom Ativo */}
                            <div className="bg-white border border-neutral-200 rounded-sm p-5 space-y-2 shadow-xs">
                                <div className="flex items-center justify-between text-xs text-neutral-500">
                                    <span>Seu Cupom Ativo</span>
                                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] py-0">
                                        10% OFF
                                    </Badge>
                                </div>
                                <div className="text-xl font-black font-mono text-neutral-900 truncate">
                                    {stats?.affiliate.coupon_code}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopyCode}
                                    className="text-[11px] font-semibold text-[#48B9FA] hover:text-[#20a6f5] flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                    {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    {copiedCode ? "Copiado!" : "Copiar código"}
                                </button>
                            </div>

                            {/* Card 4: Taxa de Comissão */}
                            <div className="bg-white border border-neutral-200 rounded-sm p-5 space-y-2 shadow-xs">
                                <div className="flex items-center justify-between text-xs text-neutral-500">
                                    <span>Taxa de Comissão</span>
                                    <div className="p-1.5 bg-neutral-100 rounded text-neutral-600">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-black text-neutral-900">
                                    10%
                                </div>
                                <div className="text-[11px] text-neutral-400">
                                    Sobre o valor de cada pedido
                                </div>
                            </div>
                        </div>

                        {/* Bloco de Saque via WhatsApp */}
                        <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-neutral-900">
                                        Retirada de Comissões via WhatsApp
                                    </h3>
                                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                                        Pix Imediato
                                    </Badge>
                                </div>
                                <p className="text-xs text-neutral-600 max-w-xl leading-relaxed">
                                    Para resgatar seu saldo acumulado ({formatPrice(stats?.total_commission || 0)}), clique no botão ao lado para entrar em contato diretamente com nossa equipe no WhatsApp <strong>(62) 98463-8578</strong>. O pagamento é realizado via chave Pix.
                                </p>
                            </div>

                            <a
                                href={getWhatsAppUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-xs"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Solicitar Saque via WhatsApp
                            </a>
                        </div>

                        {/* Bloco de Compartilhamento / Divulgação */}
                        <div className="bg-white border border-neutral-200 rounded-sm p-6 space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                                <Share2 className="w-4 h-4 text-[#48B9FA]" />
                                Links e Materiais de Divulgação
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-sm space-y-2">
                                    <span className="text-xs font-semibold text-neutral-800 block">Código do Cupom</span>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-white border border-neutral-300 font-mono text-xs px-3 py-2 rounded-sm text-neutral-900 font-bold">
                                            {stats?.affiliate.coupon_code}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={handleCopyCode}
                                            className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white text-xs h-9 px-3 rounded-sm cursor-pointer"
                                        >
                                            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        </Button>
                                    </div>
                                    <p className="text-[11px] text-neutral-400">
                                        Peça para seus amigos colarem esse código no carrinho ou checkout.
                                    </p>
                                </div>

                                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-sm space-y-2">
                                    <span className="text-xs font-semibold text-neutral-800 block">Link Direto com Cupom</span>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-white border border-neutral-300 text-xs px-3 py-2 rounded-sm text-neutral-600 truncate font-mono">
                                            {typeof window !== 'undefined' ? `${window.location.origin}/loja?cupom=${stats?.affiliate.coupon_code}` : `https://ashenstore.com/loja?cupom=${stats?.affiliate.coupon_code}`}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={handleCopyLink}
                                            className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white text-xs h-9 px-3 rounded-sm cursor-pointer"
                                        >
                                            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        </Button>
                                    </div>
                                    <p className="text-[11px] text-neutral-400">
                                        Quem acessar por este link verá a loja já com seu cupom indicado.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Tabela de Vendas Atribuídas */}
                        <div className="bg-white border border-neutral-200 rounded-sm p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                                    Histórico de Vendas com seu Cupom
                                </h3>
                                <span className="text-xs text-neutral-500">
                                    {stats?.orders.length || 0} registro(s)
                                </span>
                            </div>

                            {stats?.orders && stats.orders.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead>
                                            <tr className="border-b border-neutral-200 text-neutral-500">
                                                <th className="py-2.5 font-medium">Pedido</th>
                                                <th className="py-2.5 font-medium">Data</th>
                                                <th className="py-2.5 font-medium">Status</th>
                                                <th className="py-2.5 font-medium">Valor da Venda</th>
                                                <th className="py-2.5 font-medium text-right">Sua Comissão (10%)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100">
                                            {stats.orders.map((ord) => {
                                                const isPaid = ord.status === 'PAID' || ord.status === 'CONFIRMED'
                                                return (
                                                    <tr key={ord.id} className="hover:bg-neutral-50/50">
                                                        <td className="py-3 font-mono font-bold text-neutral-900">
                                                            #{ord.external_id}
                                                        </td>
                                                        <td className="py-3 text-neutral-600">
                                                            {new Date(ord.created_at).toLocaleDateString('pt-BR')}
                                                        </td>
                                                        <td className="py-3">
                                                            <Badge className={isPaid ? "bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]" : "bg-amber-100 text-amber-800 border-amber-200 text-[10px]"}>
                                                                {isPaid ? "Pago" : "Aguardando Pagamento"}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-3 text-neutral-700">
                                                            {formatPrice(ord.total)}
                                                        </td>
                                                        <td className="py-3 font-bold text-emerald-600 text-right">
                                                            +{formatPrice(ord.commission)}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-xs text-neutral-400 space-y-1">
                                    <p>Nenhuma venda registrada com seu cupom até o momento.</p>
                                    <p>Compartilhe seu cupom para começar a faturar!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Como Funciona o Programa */}
                <div className="pt-8 border-t border-neutral-200">
                    <div className="text-center space-y-1.5 mb-8">
                        <h2 className="text-xl font-bold text-neutral-900">Como Funciona o Programa</h2>
                        <p className="text-xs text-neutral-500">Três passos simples para você lucrar com a Ashens Store</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-6 space-y-2 text-center">
                            <div className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center mx-auto text-base font-bold text-[#48B9FA]">
                                1
                            </div>
                            <h3 className="text-sm font-bold text-neutral-900">Compartilhe seu Cupom</h3>
                            <p className="text-xs text-neutral-600 leading-relaxed">
                                Divulgue seu cupom ou link personalizado nas redes sociais, YouTube, Discord ou com seus amigos no Roblox.
                            </p>
                        </div>

                        <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-6 space-y-2 text-center">
                            <div className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center mx-auto text-base font-bold text-[#48B9FA]">
                                2
                            </div>
                            <h3 className="text-sm font-bold text-neutral-900">Seu Amigo Ganha 10% OFF</h3>
                            <p className="text-xs text-neutral-600 leading-relaxed">
                                Qualquer cliente que usar seu cupom na finalização da compra ganha 10% de desconto imediato no Pix.
                            </p>
                        </div>

                        <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-6 space-y-2 text-center">
                            <div className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center mx-auto text-base font-bold text-emerald-600">
                                3
                            </div>
                            <h3 className="text-sm font-bold text-neutral-900">Você Recebe 10% em Dinheiro</h3>
                            <p className="text-xs text-neutral-600 leading-relaxed">
                                10% de cada venda vai direto para o seu saldo de afiliado. Basta solicitar a retirada pelo WhatsApp para receber via Pix.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
