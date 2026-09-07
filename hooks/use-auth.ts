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
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      const profile = data as any
      if (!error && profile) {
        let userRole = profile.role || 'customer'
        if (userRole === 'costumer') userRole = 'customer'

        setUser({
          id: userId,
          email: email,
          full_name: profile.full_name || fullName || email.split('@')[0],
          role: userRole,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
        })


        // Check if role is customer, might be RLS issue for admin, verify with API
        if ((profile.role || 'customer') === 'customer') {
          // Verify with API blindly to be sure
          fetch('/api/auth/check-role', {
            method: 'POST',
            body: JSON.stringify({ userId }),
          })
            .then(res => res.json())
            .then(bypassData => {
              if (bypassData.role && bypassData.role !== 'customer') {
                setUser(prev => prev ? ({ ...prev, role: bypassData.role }) : null)
              }
            })
            .catch(e => console.warn('Background role check failed', e))
        }

      } else {
        // Se não encontrar perfil ou der erro, tenta API antes de assumir customer
        try {
          const bypassRes = await fetch('/api/auth/check-role', {
            method: 'POST',
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
        } catch (e) {
          console.warn('API role check failed', e)
        }

        // Fallback final
        setUser({
          id: userId,
          email: email,
          full_name: fullName || email.split('@')[0],
          role: 'customer',
        })
      }
    } catch (err) {
      console.error('[useAuth] Error fetching profile:', err)
      // Tenta API no catch
      try {
        const bypassRes = await fetch('/api/auth/check-role', {
          method: 'POST',
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
      } catch (e) {
        console.warn('API role check failed in catch', e)
      }

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

        if (error) {
          console.error("Auth check error:", error)
          if (mounted) setLoading(false)
          return
        }

        if (session?.user) {
          // Profile fetch logic inline to ensure control flow
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()

          let role = profile?.role || 'customer'
          if (role === 'costumer') role = 'customer'

          // If role is customer, verify with API (bypasses RLS)
          if (role === 'customer') {
            try {
              const bypassRes = await fetch('/api/auth/check-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: session.user.id }),
              })
              if (bypassRes.ok) {
                const bypassData = await bypassRes.json()
                if (bypassData.role && bypassData.role !== 'customer') {
                  role = bypassData.role
                }
              }
            } catch (e) {
              console.warn('Background role check failed', e)
            }
          }

          if (mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              role,
              phone: profile?.phone,
              avatar_url: profile?.avatar_url,
            })
          }
        } else {
          if (mounted) setUser(null)
        }
      } catch (error) {
        console.error("Unexpected auth error:", error)
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
          // Re-run check or simple set
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

    // Buscar o perfil imediatamente após login
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
