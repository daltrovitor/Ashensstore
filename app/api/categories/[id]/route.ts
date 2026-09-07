import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-middleware"

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const params = await paramsPromise
    const supabase = getSupabaseService() || await getSupabaseServer()
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 500 })
    }

    // Tenta primeiro na tabela categories (onde ficam os dados reais)
    const { data: catData, error: catError } = await supabase
      .from("categories")
      .select("*")
      .eq("id", params.id)
      .maybeSingle()

    if (catData) {
      return NextResponse.json(catData)
    }

    // Fallback para store_categories
    const { data: storeData } = await supabase
      .from("store_categories")
      .select("*")
      .eq("id", params.id)
      .maybeSingle()

    if (!storeData) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(storeData)
  } catch (error) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }
}

export async function PUT(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const params = await paramsPromise
    const admin = await checkAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const allowed: any = {}

    if (body.name !== undefined) allowed.name = String(body.name)
    if (body.slug !== undefined) allowed.slug = String(body.slug)
    if (body.description !== undefined) allowed.description = body.description ?? null
    if (body.display_order !== undefined) {
      allowed.display_order = parseInt(String(body.display_order || 0)) || 0
    }
    if (body.is_active !== undefined) {
      allowed.is_active = Boolean(body.is_active)
    }

    const service = getSupabaseService()
    if (!service) {
      return NextResponse.json({ error: 'Database service configuration error' }, { status: 500 })
    }

    // Atualiza na tabela categories
    const { data: updatedCat, error: catError } = await service
      .from("categories")
      .update(allowed)
      .eq("id", params.id)
      .select()

    // Também atualiza em store_categories se existir lá
    try {
      await service
        .from("store_categories")
        .update(allowed)
        .eq("id", params.id)
    } catch (_) {}

    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 500 })
    }

    return NextResponse.json(updatedCat?.[0] || null)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const params = await paramsPromise
    const admin = await checkAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const service = getSupabaseService()
    if (!service) {
      return NextResponse.json({ error: 'Database service configuration error' }, { status: 500 })
    }

    // 1. Desvincular produtos que apontam para esta categoria para não violar Foreign Key
    const { error: unlinkError } = await service
      .from("products")
      .update({ category_id: null })
      .eq("category_id", params.id)

    if (unlinkError) {
      console.error("[Categories DELETE] Unlink products error:", unlinkError)
    }

    // 2. Deletar da tabela categories (onde a categoria realmente existe)
    const { error: catDeleteError } = await service
      .from("categories")
      .delete()
      .eq("id", params.id)

    // 3. Deletar também de store_categories (para manter limpeza total)
    try {
      await service
        .from("store_categories")
        .delete()
        .eq("id", params.id)
    } catch (_) {}

    if (catDeleteError) {
      console.error("[Categories DELETE] Delete error:", catDeleteError)
      return NextResponse.json({ error: catDeleteError.message }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
