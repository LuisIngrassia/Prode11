import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePredictions(userId) {
  const [predictions, setPredictions] = useState({})

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase.from('predictions').select('*').eq('user_id', userId)
      .then(({ data, error }) => {
        if (cancelled || error) return
        const map = {}
        data?.forEach(p => { map[p.match_id] = p })
        setPredictions(map)
      })
    return () => { cancelled = true }
  }, [userId])

  async function savePrediction(matchId, predHome, predAway) {
    const { error } = await supabase.from('predictions').upsert({
      user_id: userId,
      match_id: matchId,
      pred_home: predHome,
      pred_away: predAway
    }, { onConflict: 'user_id,match_id' })
    if (!error) {
      setPredictions(prev => ({
        ...prev,
        [matchId]: { ...prev[matchId], match_id: matchId, pred_home: predHome, pred_away: predAway }
      }))
    }
    return error
  }

  return { predictions, savePrediction }
}
