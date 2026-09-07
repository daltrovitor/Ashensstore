/**
 * POST /api/auth/signup
 * Registro de novo usuário
 */

import { NextResponse } from 'next/server'
import { signUp } from '@/lib/auth/service'
import { getSupabaseService } from '@/lib/supabase/server'
import { z } from 'zod'

const SignUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, fullName } = SignUpSchema.parse(body)

    // Criação sem necessidade de confirmação por email
    const supabaseAdmin = getSupabaseService()
    let userId: string | undefined
    let userEmail: string | undefined

    if (supabaseAdmin) {
      const { data: adminUser, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || email.split('@')[0],
        },
      })

      if (adminErr) {
        throw adminErr
      }

      userId = adminUser.user?.id
      userEmail = adminUser.user?.email
    } else {
      const data = await signUp(email, password, fullName)
      userId = data.user?.id
      userEmail = data.user?.email
    }

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso! Você já pode entrar.',
      user: {
        id: userId,
        email: userEmail,
      }
    })

  } catch (error) {
    console.error('[Auth API] Sign up error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }))
        },
        { status: 400 }
      )
    }

    // Erros do Supabase
    const errorMessage = error instanceof Error ? error.message : 'Falha ao criar conta'
    
    if (errorMessage.includes('User already registered')) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
