import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ORGANIZER_CUT = 0.10   // 10%
const MULTIPLIERS   = [3, 1.5, 0.5]  // 1°, 2°, 3°

export function calculatePrizes(confirmedEntries, leaderboard, netPool) {
  if (!leaderboard?.length || !confirmedEntries?.length) return []

  const entryMap = {}
  confirmedEntries.forEach(e => { entryMap[e.user_id] = e })

  const top3 = leaderboard.slice(0, 3).map((player, i) => {
    const amount = entryMap[player.id]?.amount || 0
    const weight = amount * MULTIPLIERS[i]
    return { ...player, amount, weight, multiplier: MULTIPLIERS[i] }
  })

  const totalWeight = top3.reduce((s, p) => s + p.weight, 0)

  return top3.map(p => ({
    ...p,
    prize:        totalWeight > 0 ? Math.floor((p.weight / totalWeight) * netPool) : 0,
    returnRatio:  p.amount > 0 && totalWeight > 0
      ? ((p.weight / totalWeight) * netPool / p.amount).toFixed(1)
      : '—',
  }))
}

export function useEntries(userId) {
  const [entries, setEntries]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase.from('entries').select('*').order('created_at')
      .then(({ data, error }) => {
        if (cancelled) return
        setEntries(error ? [] : (data || []))
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [userId])

  const confirmed = entries.filter(e => e.confirmed)
  const pending   = entries.filter(e => !e.confirmed)
  const myEntry   = entries.find(e => e.user_id === userId) || null

  const totalGross   = confirmed.reduce((s, e) => s + e.amount, 0)
  const organizerCut = Math.floor(totalGross * ORGANIZER_CUT)
  const netPool      = totalGross - organizerCut

  async function submitEntry(amount, note) {
    const { data, error } = await supabase
      .from('entries')
      .upsert({ user_id: userId, amount, note, confirmed: false }, { onConflict: 'user_id' })
      .select().single()

    if (!error && data) {
      setEntries(prev => {
        const idx = prev.findIndex(e => e.user_id === userId)
        if (idx >= 0) { const n = [...prev]; n[idx] = data; return n }
        return [...prev, data]
      })
    }
    return { error }
  }

  async function confirmEntry(entryId) {
    const now = new Date().toISOString()
    const { error } = await supabase.from('entries')
      .update({ confirmed: true, confirmed_at: now })
      .eq('id', entryId)

    if (!error)
      setEntries(prev => prev.map(e =>
        e.id === entryId ? { ...e, confirmed: true, confirmed_at: now } : e
      ))
    return { error }
  }

  async function rejectEntry(entryId) {
    const { error } = await supabase.from('entries').delete().eq('id', entryId)
    if (!error) {
      setEntries(prev => prev.filter(e => e.id !== entryId))
    }
    return { error }
  }

  return {
    entries, loading, myEntry,
    confirmed, pending,
    totalGross, organizerCut, netPool,
    submitEntry, confirmEntry, rejectEntry,
  }
}
