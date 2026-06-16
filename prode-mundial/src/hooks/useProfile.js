import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProfile(userId) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!userId) return
    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data }) => setProfile(data))
  }, [userId])

  async function saveProfile(updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select().single()
    if (!error && data) setProfile(data)
    return { error }
  }

  return { profile, saveProfile }
}
