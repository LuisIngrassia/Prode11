import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user,       setUser]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [isRecovery, setIsRecovery] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function signUp(email, password, name) {
    return supabase.auth.signUp({ email, password, options: { data: { name } } })
  }

  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  async function resetPassword(email) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) setIsRecovery(false)
    return { error }
  }

  return { user, loading, isRecovery, signUp, signIn, signOut, resetPassword, updatePassword }
}
