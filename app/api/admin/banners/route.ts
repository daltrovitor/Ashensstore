
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Simple in-memory fallback if table doesn't exist (temporary)
// But ideally we use a table 'banners'
// Schema assumption: banners (id uuid, title text, image_url text, active boolean, created_at timestamp)

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching banners:', error)
        // If table doesn't exist, return empty to avoid crash
        return NextResponse.json([])
    }

    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const body = await request.json()

    if (!body.image_url) {
        return NextResponse.json({ error: 'A URL da imagem é obrigatória.' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('banners')
        .insert({
            title: body.title || 'Banner Promocional',
            image_url: body.image_url,
            link_url: body.link_url || '/loja',
            active: body.active !== false,
            display_order: Number(body.display_order) || 0
        })
        .select()

    if (error) {
        console.error('Error creating banner:', error)
        return NextResponse.json({
            error: error.message,
            details: error.details,
            hint: error.hint
        }, { status: 500 })
    }

    return NextResponse.json(data?.[0] || data)
}

export async function PATCH(request: Request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
        return NextResponse.json({ error: 'ID do banner é obrigatório.' }, { status: 400 })
    }

    const updatePayload: Record<string, any> = {}
    if (updates.active !== undefined) updatePayload.active = Boolean(updates.active)
    if (updates.title !== undefined) updatePayload.title = updates.title
    if (updates.image_url !== undefined) updatePayload.image_url = updates.image_url
    if (updates.link_url !== undefined) updatePayload.link_url = updates.link_url
    if (updates.display_order !== undefined) updatePayload.display_order = Number(updates.display_order)

    const { data, error } = await supabase
        .from('banners')
        .update(updatePayload)
        .eq('id', id)
        .select()

    if (error) {
        console.error('Error updating banner:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data?.[0] || data)
}

export async function DELETE(request: Request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
