import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-middleware"
import { normalizeCategorySlug } from "@/lib/utils/category-matcher"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseService() || await getSupabaseServer()
    if (!supabase) {
      return NextResponse.json([])
    }

    const id = request.nextUrl.searchParams.get("id") ?? null

    if (id) {
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .maybeSingle()

      if (catData) {
        return NextResponse.json(catData)
      }

      const { data: storeData } = await supabase
        .from("store_categories")
        .select("*")
        .eq("id", id)
        .maybeSingle()

      return NextResponse.json(storeData ?? null)
    }

    // Busca todas as categorias da tabela categories (onde ficam os dados oficiais)
    let { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true })

    // Se estiver vazia ou der erro, tenta em store_categories
    if (!data || data.length === 0) {
      const { data: storeData } = await supabase
        .from("store_categories")
        .select("*")
        .order("display_order", { ascending: true })

      if (storeData && storeData.length > 0) {
        data = storeData
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

    const slug = normalizeCategorySlug(body.slug?.trim() || name)

    const insertObj: any = {
      name,
      slug,
      description: body.description ?? null,
      display_order: parseInt(String(body.display_order || 0)) || 0,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true
    }

    const service = getSupabaseService()
    if (!service) {
      return NextResponse.json({ error: 'Database service configuration error' }, { status: 500 })
    }

    // Inserir na tabela categories (tabela principal do banco)
    const { data, error } = await service
      .from("categories")
      .insert([insertObj])
      .select()

    if (error) {
      console.error("Error inserting into categories:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Também espelhar em store_categories para compatibilidade
    try {
      await service.from("store_categories").insert([insertObj])
    } catch (_) {}

    return NextResponse.json(data[0], { status: 201 })
  } catch (error: any) {
    console.error("POST /api/categories error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
