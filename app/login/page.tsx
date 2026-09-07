"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)

  const message = searchParams.get('message')
  const redirectTo = searchParams.get('redirect')

  useEffect(() => {
    // Verifica se usuário já está logado
    const checkAuth = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          // Verifica o role do usuário para decidir o redirecionamento
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', session.user.id)
            .single()

          const profile = data as any
          let isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

          // Se não for admin via RLS, verifica via API para garantir
          if (!isAdmin) {
            try {
              const bypassRes = await fetch('/api/auth/check-role', {
                method: 'POST',
                body: JSON.stringify({ userId: session.user.id }),
              })
              if (bypassRes.ok) {
                const bypassData = await bypassRes.json()
                isAdmin = bypassData.role === 'admin' || bypassData.role === 'manager'
              }
            } catch (e) {
              console.warn('Login page bypass check failed', e)
            }
          }

          if (isAdmin) {
            router.replace('/admin')
          } else {
            // Se for cliente e tentou acessar admin, manda pro pedidos
            const target = redirectTo?.includes('/admin') ? '/pedidos' : (redirectTo || '/')
            router.replace(target)
          }
          return // Não mostra a tela de login
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {(message === 'created' || message === 'check-email') && (
            <Alert className="mb-6 border-blue-200 bg-blue-50 text-blue-900">
              <CheckCircle className="h-4 w-4 text-[#48B9FA]" />
              <AlertDescription>
                Conta criada com sucesso! Faça login abaixo para acessar sua conta.
              </AlertDescription>
            </Alert>
          )}

          <LoginForm
            redirectTo={redirectTo || undefined}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
