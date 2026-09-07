import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    // 1. Create an initial response
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // A public storefront must remain usable when Supabase is intentionally not configured.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
        return response
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
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
        return response
    }

    // This call will refresh the session if needed
    // We add a timeout of 8 seconds to prevent 504 Gateway Timeouts
    try {
        const getUserPromise = supabase.auth.getUser()
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 8000)
        )
        await Promise.race([getUserPromise, timeoutPromise])
    } catch (e) {
        console.error('Middleware getUser error or timeout:', e)
        // If it times out or errors, we proceed with the current response
        // This is better than hanging and causing a 504
    }

    return response
}
