// Hello World
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, Plus, Trash2 } from "lucide-react"

interface ShippingRule {
    id: string
    state_code: string
    price: number
}

const STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export function ShippingManager() {
    const [rules, setRules] = useState<ShippingRule[]>([])
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [defaultPrice, setDefaultPrice] = useState<number>(0) // XX state

    useEffect(() => {
        fetchRules()
    }, [])

    const fetchRules = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/shipping')
            if (res.ok) {
                const data = await res.json()
                setRules(Array.isArray(data) ? data : [])

                // Find default price (XX)
                const def = data.find((r: any) => r.state_code === 'XX')
                if (def) setDefaultPrice(def.price)
            }
        } catch {
            toast.error("Erro ao carregar regras de frete")
        } finally {
            setLoading(false)
        }
    }

    const handleSaveRule = async (state_code: string, price: number) => {
        setIsSaving(true)
        try {
            const res = await fetch('/api/admin/shipping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state_code, price })
            })

            if (res.ok) {
                toast.success(`Frete para ${state_code} atualizado!`)
                fetchRules()
            } else {
                toast.error("Erro ao salvar regra")
            }
        } catch {
            toast.error("Erro ao salvar regra")
        } finally {
            setIsSaving(false)
        }
    }

    const getPriceForState = (state: string) => {
        const rule = rules.find((r) => r.state_code === state)
        return rule ? rule.price : defaultPrice
    }

    return (
        <div className="space-y-8">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-bold mb-4">Frete Padrão (Todo Brasil)</h3>
                <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium">Preço Base (R$)</label>
                        <Input
                            type="number"
                            step="0.01"
                            value={defaultPrice}
                            onChange={(e) => setDefaultPrice(parseFloat(e.target.value))}
                            onBlur={() => handleSaveRule('XX', defaultPrice)}
                        />
                    </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                    Este valor será usado se o estado não tiver uma regra específica configurada abaixo.
                </p>
            </div>

            <div className="bg-card p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-bold mb-4">Regras por Estado (UF)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {STATES.map((state) => {
                        const currentPrice = getPriceForState(state)
                        const hasRule = rules.some(r => r.state_code === state)

                        return (
                            <div key={state} className={`p-4 rounded-lg border ${hasRule ? 'bg-primary/5 border-primary' : 'bg-muted/20'}`}>
                                <div className="font-bold mb-2 text-center text-lg">{state}</div>
                                <div className="space-y-2">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        defaultValue={currentPrice}
                                        className="h-8 text-center"
                                        onBlur={(e) => {
                                            const val = parseFloat(e.target.value)
                                            if (val !== currentPrice) {
                                                handleSaveRule(state, val)
                                            }
                                        }}
                                    />
                                    {hasRule && (
                                        <div className="text-center text-xs text-primary font-medium">
                                            Personalizado
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            {loading && <div className="text-center">Carregando regras...</div>}
        </div>
    )
}
