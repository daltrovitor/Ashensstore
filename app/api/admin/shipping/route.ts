
import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/admin-middleware'
import { getSupabaseService } from '@/lib/supabase/server'

export async function GET(request: Request) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        const supabase = getSupabaseService()
        if (!supabase) {
            return NextResponse.json({ error: 'DB Service Error' }, { status: 500 })
        }

        const { data, error } = await supabase
            .from('shipping_rules')
            .select('*')
            .order('state_code')

        if (error) {
            // Se a tabela não existir, criar padrão
            if (error.code === '42P01') {
                return NextResponse.json([
                    { state_code: 'SP', price: 15.00 },
                    { state_code: 'XX', price: 40.00 } // Default
                ])
            }
            throw error
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching shipping rules:', error)
        return NextResponse.json({ error: 'Failed to fetch shipping rules' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const auth = await checkAdminAuth(request)
        if (!auth) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        const body = await request.json()
        const { state_code, price } = body

        if (!state_code || price === undefined) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        const supabase = getSupabaseService()
        if (!supabase) return NextResponse.json({ error: 'DB Service Error' }, { status: 500 })

        // Check if exists
        const { data: existing } = await supabase
            .from('shipping_rules')
            .select('id')
            .eq('state_code', state_code)
            .single()

        let result
        if (existing) {
            result = await supabase
                .from('shipping_rules')
                .update({ price })
                .eq('state_code', state_code)
                .select()
        } else {
            result = await supabase
                .from('shipping_rules')
                .insert({ state_code, price })
                .select()
        }

        if (result.error) throw result.error

        return NextResponse.json(result.data[0])
    } catch (error) {
        console.error('Error saving shipping rule:', error)
        return NextResponse.json({ error: 'Failed to save shipping rule' }, { status: 500 })
    }
}
