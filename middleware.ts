import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
    const { response, user } = await updateSession(request)

    const pathname = request.nextUrl.pathname

    // Rota administrativa configurável (ex: /painel-secreto ou default /admin)
    const configuredAdminPath = (process.env.NEXT_PUBLIC_ADMIN_PATH || '/admin').replace(/\/$/, '')
    
    const isStandardAdminPage = pathname === '/admin' || pathname.startsWith('/admin/')
    const isCustomAdminPage = configuredAdminPath !== '/admin' && (pathname === configuredAdminPath || pathname.startsWith(`${configuredAdminPath}/`))
    const isAdminApi = pathname === '/api/admin' || pathname.startsWith('/api/admin/')

    // 1. Se uma rota customizada estiver configurada e alguém tentar acessar /admin direto:
    if (configuredAdminPath !== '/admin' && isStandardAdminPage) {
        return NextResponse.rewrite(new URL('/not-found', request.url), { status: 404 })
    }

    // 2. Se for qualquer tentativa de acesso a rota administrativa (página ou API):
    if (isStandardAdminPage || isCustomAdminPage || isAdminApi) {
        // Se o usuário nem sequer estiver autenticado:
        if (!user) {
            if (isAdminApi) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 })
            }
            return NextResponse.rewrite(new URL('/not-found', request.url), { status: 404 })
        }

        // Validação de role no banco de dados via service role
        let isAdmin = false
        try {
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            )
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('role, is_active')
                .eq('user_id', user.id)
                .single()

            if (profile && profile.is_active && ['admin', 'manager'].includes(profile.role)) {
                isAdmin = true
            }
        } catch (e) {
            console.error('[Middleware] Erro ao validar perfil de admin:', e)
            isAdmin = false
        }

        if (!isAdmin) {
            if (isAdminApi) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 })
            }
            return NextResponse.rewrite(new URL('/not-found', request.url), { status: 404 })
        }

        // Se for admin autorizado acessando a rota customizada (ex: /painel-secreto), reescreve internamente para /admin
        if (isCustomAdminPage) {
            const internalPath = pathname.replace(configuredAdminPath, '/admin')
            return NextResponse.rewrite(new URL(internalPath, request.url), {
                headers: response.headers,
            })
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public assets
         * - all static files with common extensions
         */
        '/((?!_next/static|_next/image|favicon.ico|api/auth|public/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2|ttf|otf)$).*)',
    ],
}
