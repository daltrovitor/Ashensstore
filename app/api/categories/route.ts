import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-middleware"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseService() || await getSupabaseServer()
    const id = request.nextUrl.searchParams.get("id") ?? null

    let query = supabase
      .from("store_categories")
      .select("*")
      .order("display_order", { ascending: true })

    if (id) {
      const { data, error } = await query.eq("id", id).single()
      if (error && error.code !== "PGRST116") {
        return NextResponse.json({ error: "Category not found" }, { status: 404 })
      }
      return NextResponse.json(data ?? null)
    }

    const { data, error } = await query
    if (error) {
      console.error("GET /api/categories Database Error:", error)
      throw error
    }

    console.log(`GET /api/categories: Found ${data?.length || 0} categories in store_categories`)
    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("GET /api/categories error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 }
    )
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
