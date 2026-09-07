import { NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth/service'
import { readAffiliates, getAffiliateStats } from '@/lib/affiliates/service'
import { getSupabaseService } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const profile = await getCurrentProfile()

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 })
    }

    const affiliates = readAffiliates()
    const supabase = getSupabaseService()

    // Buscar perfis adicionais se disponíveis para cruzar dados
    let userProfilesMap: Record<string, any> = {}
    if (supabase) {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, full_name, created_at')

        if (profiles) {
          for (const p of profiles) {
            userProfilesMap[p.user_id] = p
          }
        }
      } catch (err) {
        console.error('[Admin Affiliates API] Erro ao carregar profiles:', err)
      }
    }

    // Calcular estatísticas de cada afiliado
    const affiliatesWithStats = await Promise.all(
      affiliates.map(async (aff) => {
        const stats = await getAffiliateStats(aff.user_id)
        const profileInfo = userProfilesMap[aff.user_id]

        return {
          id: aff.id,
          user_id: aff.user_id,
          name: aff.name || profileInfo?.full_name || aff.email?.split('@')[0] || 'Afiliado',
          email: aff.email || profileInfo?.email || 'Sem email',
          coupon_code: aff.coupon_code,
          discount_percent: aff.discount_percent || 10,
          commission_percent: aff.commission_percent || 10,
          created_at: aff.created_at || profileInfo?.created_at || new Date().toISOString(),
          total_sales_count: stats?.total_sales_count || 0,
          paid_orders_count: stats?.paid_orders_count || 0,
          total_revenue: stats?.total_revenue || 0,
          total_commission: stats?.total_commission || 0,
          orders: stats?.orders || [],
        }
      })
    )

    // Ordenar pelos afiliados com mais vendas primeiro
    affiliatesWithStats.sort((a, b) => b.total_revenue - a.total_revenue)

    // Métricas gerais consolidadas
    const summary = {
      total_affiliates: affiliatesWithStats.length,
      total_sales_count: affiliatesWithStats.reduce((acc, a) => acc + a.total_sales_count, 0),
      total_paid_orders: affiliatesWithStats.reduce((acc, a) => acc + a.paid_orders_count, 0),
      total_revenue: affiliatesWithStats.reduce((acc, a) => acc + a.total_revenue, 0),
      total_commission_pending: affiliatesWithStats.reduce((acc, a) => acc + a.total_commission, 0),
    }

    return NextResponse.json({
      summary,
      affiliates: affiliatesWithStats,
    })
  } catch (error: any) {
    console.error('[Admin Affiliates GET Error]:', error)
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 })
  }
}
