"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams, useRouter } from "next/navigation"

export function RouteMasker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Função central para mascarar a barra de endereços do navegador para a raiz '/'
  const maskUrlToRoot = () => {
    if (typeof window === "undefined") return

    try {
      // Se o pathname ou search atual na barra de endereços for diferente de '/', mascara
      if (window.location.pathname !== "/" || window.location.search.length > 0) {
        window.history.replaceState(window.history.state, "", "/")
      }
    } catch {
      // Ignora restrições silenciosamente
    }
  }

  // Executa imediatamente sempre que o Next.js alterar rota ou parâmetros de busca
  useEffect(() => {
    maskUrlToRoot()

    // Agenda checagens nos próximos ticks para cobrir animações ou re-renders
    const t1 = setTimeout(maskUrlToRoot, 10)
    const t2 = setTimeout(maskUrlToRoot, 50)
    const t3 = setTimeout(maskUrlToRoot, 150)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [pathname, searchParams])

  // Monitoramento global de eventos do histórico e cliques no documento
  useEffect(() => {
    if (typeof window === "undefined") return

    // 1. Ao disparar evento de navegação no histórico (voltar / avançar)
    const handlePopState = () => {
      maskUrlToRoot()
    }
    window.addEventListener("popstate", handlePopState)

    // 2. Intercepta cliques gerais para forçar máscara pós-transição do Next.js
    const handleClick = () => {
      setTimeout(maskUrlToRoot, 20)
      setTimeout(maskUrlToRoot, 100)
    }
    document.addEventListener("click", handleClick, { capture: true, passive: true })

    // 3. Atalho secreto para Administradores: Ctrl + Shift + A (ou Alt + Shift + A)
    // Permite ao dono da loja navegar direto para o painel de administração sem precisar digitar URL
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey || e.altKey) && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault()
        const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH || "/admin"
        router.push(adminPath)
      }
    }
    window.addEventListener("keydown", handleKeyDown)

    // Máscara inicial ao montar o componente
    maskUrlToRoot()

    return () => {
      window.removeEventListener("popstate", handlePopState)
      document.removeEventListener("click", handleClick, { capture: true })
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [router])

  return null
}
