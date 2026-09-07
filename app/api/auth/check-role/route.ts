
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json({ error: 'UserId required' }, { status: 400 })
        }

        // Usar chave de serviço para ignorar RLS e garantir leitura correta
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!url || !serviceKey) {
            console.warn('Supabase admin credentials missing for check-role. Returning fallback role customer.')
            return NextResponse.json({ role: 'customer' })
        }

        const supabaseAdmin = createClient(url, serviceKey)

        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('role, email, full_name')
            .eq('user_id', userId)
            .single()

        if (profile) {
            let role = profile.role || 'customer'
            if (role === 'costumer') role = 'customer'
            return NextResponse.json({ role })
        }

        if (error) {
            console.error('Error fetching role (admin bypass):', error)
            return NextResponse.json({ role: 'customer' })
        }
    } catch (error) {
        console.error('Server error checking role:', error)
        return NextResponse.json({ role: 'customer' }, { status: 500 })
    }
}
