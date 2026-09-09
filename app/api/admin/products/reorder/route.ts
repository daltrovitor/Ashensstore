import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'
import { getSupabaseService } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const ReorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      display_order: z.number().int().min(0),
    })
  ),
})

export async function POST(request: Request) {
  try {
    const auth = await checkAdminAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseService()
    if (!supabase) {
      return NextResponse.json({ error: 'Database service configuration error' }, { status: 500 })
    }

    const body = await request.json()
    const { items } = ReorderSchema.parse(body)

    if (!items || items.length === 0) {
      return NextResponse.json({ success: true, count: 0 })
    }

    // Atualiza os produtos
    // Tenta atualizar a coluna display_order. Se a coluna não existir, atualiza via printful_id de forma segura.
    let hasColumn = true
    const testRes = await supabase
      .from('products')
      .update({ display_order: items[0].display_order })
      .eq('id', items[0].id)

    if (testRes.error && testRes.error.message.includes('display_order')) {
      hasColumn = false
    }

    if (hasColumn) {
      // Executa updates em lote com a coluna nativa
      const updates = items.map((item) =>
        supabase
          .from('products')
          .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
          .eq('id', item.id)
      )
      await Promise.all(updates)
    } else {
      // Fallback seguro usando printful_id
      const updates = items.map(async (item) => {
        const { data: current } = await supabase
          .from('products')
          .select('printful_id')
          .eq('id', item.id)
          .single()

        let baseId = current?.printful_id || 'local'
        if (baseId.startsWith('order:')) {
          const parts = baseId.split(':')
          baseId = parts.slice(2).join(':') || 'local'
        }

        return supabase
          .from('products')
          .update({
            printful_id: `order:${item.display_order}:${baseId}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id)
      })
      await Promise.all(updates)
    }

    return NextResponse.json({ success: true, count: items.length })
  } catch (error: any) {
    console.error('[Admin Products Reorder] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Falha ao reordenar produtos' },
      { status: 500 }
    )
  }
}
