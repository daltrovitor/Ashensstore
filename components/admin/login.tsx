"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { fetchWithAuth } from "@/lib/utils/fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft } from "lucide-react"

interface AdminLoginProps {
  onLogin: () => void
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // admin/login.tsx
  // ... (imports e setup) ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Dev fallback: permite login direto com credenciais conhecidas sem depender do Supabase
      if (
        (email === 'admin@ashensstore.com.br' && password === 'Ashens@2024!') ||
        (email === 'admin@libras.com.br' && password === 'Libras@2024!')
      ) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('ADMIN_ACCESS_TOKEN', 'DEV_ADMIN_TOKEN')
        }

        const res = await fetchWithAuth('/api/admin/me', { method: 'POST' })
        if (!res.ok) {
          localStorage.removeItem('ADMIN_ACCESS_TOKEN')
          const err = await res.json().catch(() => ({}))
          setError(err.error || 'Acesso negado: Você não é um administrador.')
          setLoading(false)
          return
        }

        onLogin()
        return
      }

      const supabase = getSupabaseClient()

      // 1. Tenta fazer o login no Supabase
      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (authError) {
        // **Mostra o erro real do Supabase (ex: Email not confirmed)**
        console.error("Erro de Login Supabase:", authError)
        const msg = authError.message.includes("Email not confirmed")
          ? "O email precisa ser confirmado. Verifique o painel do Supabase."
          : "Email ou senha incorretos."
        setError(msg)
        setLoading(false)
        return
      }

      // 2. Salva token para ser lido pelo fetchWithAuth
      if (data?.session && typeof window !== 'undefined') {
        localStorage.setItem(
          "ADMIN_ACCESS_TOKEN",
          data.session.access_token
        )
      }

      // 3. Valida no backend (o fetchWithAuth usará o token salvo)
      const res = await fetchWithAuth("/api/admin/me", {
        method: "POST",
      })

      if (!res.ok) {
        await supabase.auth.signOut()
        localStorage.removeItem("ADMIN_ACCESS_TOKEN")

        const err = await res.json().catch(() => ({}))
        setError(err.error || "Acesso negado: Você não é um administrador.")
        setLoading(false)
        return
      }

      onLogin()
    } catch (err) {
      setError("Erro de conexão com o servidor")
    } finally {
      if (error) { // Apenas remove o loading se houve um erro, para evitar flicker no sucesso
        setLoading(false)
      }
    }
  }


  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute top-6 left-6">
        <Button
          onClick={() => router.back()}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold mb-2">Admin Librás</h1>
          <p className="text-foreground/60">
            Acesso restrito ao painel administrativo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Spinner className="mr-2" /> Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}