"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react"
import { toast } from "sonner"
import { getSupabaseClient } from "@/lib/supabase/client"

interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
}

export function LoginForm({ onSuccess, redirectTo }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = getSupabaseClient()

      // 1. Login com Supabase diretamente no client (sessão fica no browser)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos')
        }
        if (authError.message.includes('Email not confirmed')) {
          throw new Error('Email não confirmado. Verifique sua caixa de entrada.')
        }
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Falha ao fazer login')
      }

      // 2. Buscar role do perfil
      let userRole = 'customer'
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', authData.user.id)
          .single()

        const profile = data as any
        if (profile?.role) {
          userRole = profile.role
        }

        // Se RLS falhar ou retornar 'customer' incorretamente (como para admin@monstercave.com), tentar bypass pelo servidor
        if (!userRole || userRole === 'customer') {
          try {
            const bypassRes = await fetch('/api/auth/check-role', {
              method: 'POST',
              body: JSON.stringify({ userId: authData.user.id }),
            })
            if (bypassRes.ok) {
              const bypassData = await bypassRes.json()
              if (bypassData.role) userRole = bypassData.role
            }
          } catch (e) {
            console.warn('Bypass role check failed', e)
          }
        }
      } catch (err) {
        console.warn('Could not fetch role, defaulting to customer:', err)
        // Fallback para API de check-role
        try {
          const bypassRes = await fetch('/api/auth/check-role', {
            method: 'POST',
            body: JSON.stringify({ userId: authData.user.id }),
          })
          if (bypassRes.ok) {
            const bypassData = await bypassRes.json()
            if (bypassData.role) userRole = bypassData.role
          }
        } catch (e) {
          console.warn('Critical role check failure', e)
        }
      }

      toast.success("Login realizado com sucesso!")

      const isAdmin = userRole === 'admin' || userRole === 'manager'

      const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH || '/admin'

      if (onSuccess) {
        onSuccess()
      } else if (isAdmin) {
        router.push(adminPath)
      } else {
        // Clientes: se tentarem ir para admin, mandamos para pedidos
        const target = redirectTo?.includes('/admin') || (adminPath !== '/admin' && redirectTo?.includes(adminPath)) ? '/pedidos' : (redirectTo || '/pedidos')
        router.push(target)
      }

    } catch (error) {
      console.error("Login error:", error)
      setError(error instanceof Error ? error.message : "Falha ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
        <CardDescription>
          Digite seu email e senha para acessar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <a
            href="/reset-password"
            className="text-primary hover:underline"
          >
            Esqueceu sua senha?
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
