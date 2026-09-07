"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Shield, User, Bot, RefreshCw, Gamepad2, CheckCircle2, AlertCircle, Clock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export interface ChatMessage {
    id: string
    sender: 'buyer' | 'seller' | 'system'
    sender_name: string
    message: string
    timestamp: string
}

interface OrderChatProps {
    orderId: string
    currentRole?: 'buyer' | 'seller'
    defaultSenderName?: string
    onStatusChange?: () => void
    isModal?: boolean
}

export function OrderChat({
    orderId,
    currentRole = 'buyer',
    defaultSenderName = '',
    onStatusChange,
    isModal = false
}: OrderChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [inputMessage, setInputMessage] = useState("")
    const [orderInfo, setOrderInfo] = useState<any>(null)
    const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date())

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const pollingRef = useRef<NodeJS.Timeout | null>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchMessages = async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true)
            const res = await fetch(`/api/orders/${orderId}/chat`, { cache: 'no-store' })
            if (res.ok) {
                const data = await res.json()
                if (data.messages) {
                    setMessages(data.messages)
                }
                if (data.order) {
                    setOrderInfo(data.order)
                }
                setLastFetchTime(new Date())
            }
        } catch (error) {
            console.error('Erro ao buscar mensagens do chat:', error)
        } finally {
            if (isInitial) setLoading(false)
        }
    }

    useEffect(() => {
        fetchMessages(true)

        // Polling a cada 3.5 segundos para chat em tempo real
        pollingRef.current = setInterval(() => {
            fetchMessages(false)
        }, 3500)

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current)
        }
    }, [orderId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async (customText?: string) => {
        const textToSend = (customText || inputMessage).trim()
        if (!textToSend || sending) return

        const senderName = defaultSenderName || (currentRole === 'seller' ? 'Vendedor Ashens' : (orderInfo?.customer_name || 'Comprador'))

        try {
            setSending(true)
            const res = await fetch(`/api/orders/${orderId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: textToSend,
                    sender: currentRole,
                    sender_name: senderName,
                })
            })

            if (res.ok) {
                const data = await res.json()
                if (data.messages) {
                    setMessages(data.messages)
                }
                setInputMessage("")
            } else {
                toast.error("Erro ao enviar mensagem")
            }
        } catch (error) {
            console.error("Erro no envio:", error)
            toast.error("Erro de conexão ao enviar mensagem")
        } finally {
            setSending(false)
        }
    }

    // Sugestões rápidas de mensagens
    const quickSuggestions = currentRole === 'seller' ? [
        "Olá! Já localizei seu pedido. Estou gerando o link do servidor VIP!",
        "Pode entrar neste servidor privado para a troca?",
        "Itens entregues com sucesso! Obrigado pela compra na Ashens Store.",
    ] : [
        orderInfo?.roblox_username ? `Meu nick no Roblox é: ${orderInfo.roblox_username}` : "Qual o próximo passo para entrega?",
        "Já realizei o pagamento via PIX!",
        "Estou pronto no jogo, pode mandar o convite!",
    ]

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING_PAYMENT':
                return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-semibold text-xs">Aguardando Confirmação</Badge>
            case 'PAID':
            case 'CONFIRMED':
                return <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold text-xs">Pago / Confirmado</Badge>
            case 'IN_PRODUCTION':
                return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300 font-semibold text-xs">Em Preparação</Badge>
            case 'SHIPPED':
                return <Badge variant="outline" className="bg-cyan-50 text-cyan-800 border-cyan-300 font-semibold text-xs">Entrega no Jogo</Badge>
            case 'DELIVERED':
                return <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-300 font-semibold text-xs">Entregue</Badge>
            default:
                return <Badge variant="outline" className="bg-neutral-100 text-neutral-800 border-neutral-300 font-semibold text-xs">{status}</Badge>
        }
    }

    return (
        <div className={`flex flex-col bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm ${isModal ? 'h-[600px] max-h-[85vh]' : 'h-[650px] w-full'}`}>
            {/* Header do Chat */}
            <div className="bg-neutral-50 border-b border-neutral-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-[#48B9FA]">
                        <Gamepad2 className="w-5 h-5" />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse"></span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-neutral-900 text-sm">Chat do Pedido</h3>
                            <span className="font-mono text-xs text-neutral-700 bg-neutral-200/70 px-2 py-0.5 rounded border border-neutral-300">
                                {orderInfo?.external_id || orderId}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                            <span>Vendedor ↔ Comprador</span>
                            {orderInfo?.roblox_username && (
                                <>
                                    <span>•</span>
                                    <span className="text-[#48B9FA] font-semibold">Roblox: {orderInfo.roblox_username}</span>
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {orderInfo && getStatusBadge(orderInfo.status)}
                    <button
                        onClick={() => fetchMessages(false)}
                        title="Atualizar mensagens"
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Banner de Ajuda / Entrega */}
            <div className="bg-blue-50/60 border-b border-blue-100 px-4 py-2 flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#48B9FA]" />
                    <span>Conectado em tempo real com o suporte oficial da Ashens Store.</span>
                </div>
                <span className="text-[11px] text-blue-600 font-medium">Entrega rápida</span>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/40">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-400 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#48B9FA]"></div>
                        <p className="text-sm">Carregando conversa do pedido...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                        <Gamepad2 className="w-12 h-12 text-neutral-300 mb-2" />
                        <p className="font-semibold text-neutral-800">Nenhuma mensagem ainda</p>
                        <p className="text-xs max-w-xs mt-1 text-neutral-500">
                            Envie seu nick do Roblox ou tire suas dúvidas para iniciar a entrega.
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isSystem = msg.sender === 'system'
                        const isMine = (currentRole === 'buyer' && msg.sender === 'buyer') ||
                                       (currentRole === 'seller' && msg.sender === 'seller')
                        const isSeller = msg.sender === 'seller'

                        if (isSystem) {
                            return (
                                <div key={msg.id} className="flex justify-center my-3">
                                    <div className="bg-white border border-neutral-200 rounded-md px-4 py-2.5 max-w-[90%] text-center shadow-xs">
                                        <div className="flex items-center justify-center gap-1.5 text-[#48B9FA] text-xs font-semibold mb-1">
                                            <Bot className="w-3.5 h-3.5" />
                                            <span>{msg.sender_name}</span>
                                        </div>
                                        <p className="text-xs text-neutral-700 leading-relaxed">{msg.message}</p>
                                        <span className="text-[10px] text-neutral-400 block mt-1">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                            >
                                <div className="flex items-center gap-1.5 mb-1 px-1">
                                    {isSeller && (
                                        <Shield className="w-3 h-3 text-[#48B9FA]" />
                                    )}
                                    <span className="text-[11px] font-semibold text-neutral-700">
                                        {msg.sender_name}
                                    </span>
                                    {isSeller && (
                                        <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1 rounded uppercase font-bold tracking-wider">
                                            Vendedor
                                        </span>
                                    )}
                                    <span className="text-[10px] text-neutral-400 ml-1">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <div
                                    className={`max-w-[82%] rounded-md px-4 py-2.5 text-sm leading-relaxed break-words ${
                                        isMine
                                            ? 'bg-[#48B9FA] text-white rounded-tr-none shadow-xs'
                                            : isSeller
                                            ? 'bg-white border border-neutral-200 text-neutral-900 rounded-tl-none shadow-xs'
                                            : 'bg-white text-neutral-900 rounded-tl-none border border-neutral-200 shadow-xs'
                                    }`}
                                >
                                    {msg.message}
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Sugestões Rápidas */}
            <div className="bg-neutral-50 px-4 pt-2 pb-2 border-t border-neutral-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] uppercase font-bold text-neutral-400 shrink-0">Sugestões:</span>
                {quickSuggestions.map((sug, i) => (
                    <button
                        key={i}
                        onClick={() => handleSendMessage(sug)}
                        disabled={sending}
                        className="text-xs bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 px-2.5 py-1 rounded-md whitespace-nowrap transition-all shrink-0 cursor-pointer shadow-xs"
                    >
                        {sug}
                    </button>
                ))}
            </div>

            {/* Input e Envio */}
            <div className="bg-white p-3 border-t border-neutral-200">
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        handleSendMessage()
                    }}
                    className="flex items-center gap-2"
                >
                    <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder={currentRole === 'seller' ? "Responder ao comprador..." : "Digite uma mensagem para o vendedor..."}
                        disabled={sending}
                        className="bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-[#48B9FA] text-sm h-10 rounded-md"
                    />
                    <Button
                        type="submit"
                        disabled={sending || !inputMessage.trim()}
                        className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white font-medium h-10 px-5 rounded-md transition-all cursor-pointer shadow-xs"
                    >
                        {sending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                            <>
                                <span>Enviar</span>
                                <Send className="w-4 h-4 ml-1.5" />
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
