import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-middleware"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseService() || await getSupabaseServer()
    if (!supabase) {
      return NextResponse.json([])
    }

    const id = request.nextUrl.searchParams.get("id") ?? null

    if (id) {
      const { data, error } = await supabase
        .from("store_categories")
        .select("*")
        .eq("id", id)
        .maybeSingle()

      if (!data) {
        // Tenta buscar na tabela categories
        const { data: catData } = await supabase
          .from("categories")
          .select("*")
          .eq("id", id)
          .maybeSingle()
        return NextResponse.json(catData ?? null)
      }
      return NextResponse.json(data ?? null)
    }

    // Busca todas as categorias da tabela store_categories
    let { data, error } = await supabase
      .from("store_categories")
      .select("*")
      .order("display_order", { ascending: true })

    // Se estiver vazia ou com erro, tenta na tabela categories
    if (!data || data.length === 0) {
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true })

      if (catData && catData.length > 0) {
        data = catData
      }
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("GET /api/categories error:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const name = body.name ? String(body.name).trim() : ""
    if (!name) {
      return NextResponse.json({ error: "Missing category name" }, { status: 400 })
    }

    const slug =
      body.slug?.trim() ||
      name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "")

    const insertObj: any = {
      name,
      slug,
      description: body.description ?? null,
      display_order: parseInt(String(body.display_order || 0)) || 0,
    }

    const service = getSupabaseService()
    if (!service) {
      return NextResponse.json({ error: 'Database service configuration error' }, { status: 500 })
    }

    const { data, error } = await service
      .from("store_categories")
      .insert([insertObj])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error: any) {
    console.error("POST /api/categories error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
