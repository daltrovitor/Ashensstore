import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    // 1. Create an initial response
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 2. Optimized client creation
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    // Update the request cookies (so subsequent calls see the change)
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

                    // Create a new response to set the cookies
                    response = NextResponse.next({
                        request,
                    })

                    // Set the cookies on the new response
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 3. Only call getUser for actual page/api requests that might need it
    // This helps avoid hitting Supabase for trivial requests that escaped the matcher
    const url = new URL(request.url)
    if (url.pathname.startsWith('/_next') ||
        url.pathname.includes('.') ||
        url.pathname.startsWith('/monitoring')) {
        return { response, user: null, supabase }
    }

    let user = null
    try {
        const getUserPromise = supabase.auth.getUser()
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 8000)
        )
        const result = await Promise.race([getUserPromise, timeoutPromise]) as any
        user = result?.data?.user || null
    } catch (e) {
        console.error('Middleware getUser error or timeout:', e)
        // If it times out or errors, we proceed with the current response
        // This is better than hanging and causing a 504
    }

    return { response, user, supabase }
}
