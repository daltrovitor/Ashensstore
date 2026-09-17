"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { fetchWithAuth } from '@/lib/utils/fetch'
import AdminDashboard from "@/components/admin/dashboard"
import { toast } from "sonner"

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        // Adiciona timeout para não ficar carregando infinitamente
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

        const res = await fetchWithAuth('/api/admin/me', {
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!mounted) return

        if (res.ok) {
          setIsAuthenticated(true)
        } else if (res.status === 401 || res.status === 404) {
          // Sessão expirada ou não autorizada -> vai para login comum sem vazar rota
          router.push('/login')
        } else if (res.status === 403) {
          router.push('/')
        } else {
          // Other errors
          toast.error('Erro ao verificar permissões.')
          // Do not redirect blindly to login to avoid loops if API is down
        }
      } catch (err) {
        console.error('Auth check failed', err)
        if (mounted) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            toast.error('O servidor demorou muito para responder.')
          } else {
            toast.error('Erro de conexão ao verificar permissões.')
          }
          // Do not redirect on catch to prevent loops on transient network errors
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-foreground animate-pulse">Carregando...</div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <AdminDashboard onLogout={() => router.push('/login')} />
  )
}
