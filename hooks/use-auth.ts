// Hello World
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"

interface User {
  id: string
  email: string
  full_name?: string
  role?: string
  phone?: string
  avatar_url?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchProfile = async (userId: string, email: string, fullName?: string) => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setUser({
            id: userId,
            email: email,
            full_name: data.user.full_name || fullName || email.split('@')[0],
            role: data.user.role || 'customer',
            phone: data.user.phone,
            avatar_url: data.user.avatar_url,
          })
          return
        }
      }

      const bypassRes = await fetch('/api/auth/check-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (bypassRes.ok) {
        const bypassData = await bypassRes.json()
        setUser({
          id: userId,
          email: email,
          full_name: fullName || email.split('@')[0],
          role: bypassData.role || 'customer',
        })
        return
      }

      setUser({
        id: userId,
        email: email,
        full_name: fullName || email.split('@')[0],
        role: 'customer',
      })
    } catch {
      setUser({
        id: userId,
        email: email,
        full_name: fullName || email.split('@')[0],
        role: 'customer',
      })
    }
  }

  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session?.user) {
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        try {
          const res = await fetch('/api/auth/me')
          if (res.ok) {
            const data = await res.json()
            if (mounted && data.user) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                full_name: data.user.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                role: data.user.role || 'customer',
                phone: data.user.phone,
                avatar_url: data.user.avatar_url,
              })
              return
            }
          }
        } catch {}

        if (mounted) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            role: 'customer',
          })
        }
      } catch {
        if (mounted) setUser(null)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkSession()

    const { data: { subscription } } = getSupabaseClient().auth.onAuthStateChange(
      (event: any, session: any) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
        } else if (event === 'SIGNED_IN' && session?.user) {
          checkSession()
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    if (data.user) {
      await fetchProfile(
        data.user.id,
        data.user.email || '',
        data.user.user_metadata?.full_name
      )
    }

    return data
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  const signOut = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const resetPassword = async (email: string) => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      throw new Error(error.message)
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }
}

export function useRequireAuth() {
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!auth.loading && !auth.user) {
      router.push('/login')
    }
  }, [auth.loading, auth.user, router])

  return auth
}

export function useAdminAuth() {
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!auth.loading) {
      if (!auth.user) {
        router.push('/login')
      } else if (!['admin', 'manager'].includes(auth.user.role || '')) {
        router.push('/unauthorized')
      }
    }
  }, [auth.loading, auth.user, router])

  return auth
}
