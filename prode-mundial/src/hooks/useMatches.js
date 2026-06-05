import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useMatches() {
  const [matches, setMatches] = useState([])

  const load = useCallback(() => {
    supabase.from('matches').select('*').order('match_number', { ascending: true })
      .then(({ data }) => setMatches(data || []))
  }, [])

  useEffect(() => { load() }, [load])

  return { matches, refreshMatches: load }
}
