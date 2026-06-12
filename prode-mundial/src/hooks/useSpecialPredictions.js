import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSpecialPredictions(userId) {
  const [special, setSpecial] = useState({ champion: '', subchampion: '', locked: false })

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase.from('special_predictions').select('*').eq('user_id', userId).single()
      .then(({ data, error }) => {
        if (cancelled || error) return
        if (data) setSpecial(data)
      })
    return () => { cancelled = true }
  }, [userId])

  async function saveSpecial(champion, subchampion) {
    if (special.locked) return { error: 'Ya están bloqueadas' }
    const { error } = await supabase.from('special_predictions').upsert({
      user_id: userId, champion, subchampion
    }, { onConflict: 'user_id' })
    if (!error) setSpecial(s => ({ ...s, champion, subchampion }))
    return { error }
  }

  return { special, saveSpecial }
}
