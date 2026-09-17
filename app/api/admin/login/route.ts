import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Tenta primeiro usar cookies (método preferido)
    let supabase = await getSupabaseServer()
    let user = null
    let error = null

    // Tenta pegar usuário via cookies
    const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser()
    
    if (!cookieError && cookieUser) {
      user = cookieUser
      error = null
    } else {
      // Fallback: tenta usar Bearer token
      const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
      
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "").trim()
        
        // Cria cliente com o token
        const { createClient } = await import('@supabase/supabase-js')
        const tempClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data: { user: tokenUser }, error: tokenError } = await tempClient.auth.getUser(token)
        
        if (!tokenError && tokenUser) {
          user = tokenUser
          error = null
          // Usa o mesmo supabase para continuar
          supabase = tempClient
        } else {
          error = tokenError
        }
      } else {
        error = { message: 'No authentication method found' }
      }
    }

    if (error || !user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Busca o perfil do usuário para verificar se é admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Retorna dados do usuário admin
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: profile.full_name,
        role: profile.role,
        is_active: profile.is_active,
      },
    })

  } catch (error) {
    console.error('[api/admin/login] Error:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
