import { notFound } from "next/navigation"
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const supabase = await getSupabaseServer()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      // Mascarar a rota: se não autenticado, finge que a página não existe
      notFound()
    }

    const supabaseAdmin = getSupabaseService()
    if (!supabaseAdmin) {
      notFound()
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, is_active")
      .eq("user_id", user.id)
      .single()

    if (
      profileError ||
      !profile ||
      !profile.is_active ||
      !["admin", "manager"].includes(profile.role)
    ) {
      // Mascarar a rota: se não for admin/manager, finge que a página não existe
      notFound()
    }

    return <>{children}</>
  } catch (error) {
    // Se erro for disparado pelo notFound() do Next.js, re-lança para o Next.js tratar
    if ((error as any)?.digest?.includes("NEXT_NOT_FOUND")) {
      throw error
    }
    // Para qualquer outro erro inesperado, também renderiza 404 para proteger o painel
    notFound()
  }
}
