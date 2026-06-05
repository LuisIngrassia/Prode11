import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSpecialPredictions(userId) {
  const [special, setSpecial] = useState({ champion: '', subchampion: '', locked: false })

  useEffect(() => {
    if (!userId) return
    supabase.from('special_predictions').select('*').eq('user_id', userId).single()
      .then(({ data }) => { if (data) setSpecial(data) })
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
