import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    supabase.from('leaderboard').select('*')
      .then(({ data }) => setLeaderboard(data || []))
  }, [])

  return leaderboard
}
