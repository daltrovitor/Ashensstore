import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json([])
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    const { data, error } = await supabase
      .from('banners')
      .select('id, title, image_url, mobile_image_url, link_url, display_order, active')
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[Public Banners API] Error fetching banners:', error.message)
      return NextResponse.json([])
    }

    return NextResponse.json(data || [])
  } catch (err) {
    console.error('[Public Banners API] Unexpected error:', err)
    return NextResponse.json([])
  }
}
