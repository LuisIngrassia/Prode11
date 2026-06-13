import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const PRIZE_SPLITS = {
  1:  [100],
  2:  [70, 30],
  3:  [60, 25, 15],
  4:  [50, 25, 15, 10],
  5:  [45, 25, 15, 10, 5],
  6:  [40, 20, 15, 10, 8, 7],
  7:  [35, 20, 15, 10, 8, 7, 5],
  8:  [32, 19, 14, 10, 9, 7, 5, 4],
  9:  [30, 18, 13, 10, 9, 7, 6, 4, 3],
  10: [28, 17, 12, 10, 9, 7, 6, 5, 4, 2],
}

// Hook: lista de ligas del usuario
export function useLigas(userId) {
  const [ligas, setLigas]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('liga_members')
      .select('paid, ligas(*)')
      .eq('user_id', userId)
    setLigas((data || []).map(m => ({ ...m.ligas, my_paid: m.paid })))
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  async function createLiga({ nombre, entry_amount }) {
    const codigo = generateCode()
    const { data, error } = await supabase
      .from('ligas')
      .insert({ nombre, entry_amount, organizer_cut: 0, creator_id: userId, codigo })
      .select().single()
    if (error) return { error }

    await supabase.from('liga_members').insert({
      liga_id: data.id, user_id: userId, paid: false
    })
    await load()
    return { data }
  }

  async function joinLiga(codigo) {
    const { data: liga, error } = await supabase
      .from('ligas')
      .select('*')
      .eq('codigo', codigo.trim().toUpperCase())
      .single()
    if (error || !liga) return { error: 'Código no encontrado' }

    const { error: joinError } = await supabase
      .from('liga_members')
      .insert({ liga_id: liga.id, user_id: userId, paid: false })
    if (joinError?.code === '23505') return { error: 'Ya estás en esta sala' }
    if (joinError) return { error: joinError.message }

    await load()
    return { data: liga }
  }

  return { ligas, loading, createLiga, joinLiga, refresh: load }
}

// Hook: detalle de una liga (miembros + operaciones)
export function useLigaDetail(ligaId, userId) {
  const [liga, setLiga]         = useState(null)
  const [members, setMembers]   = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    if (!ligaId) return
    const [{ data: ligaData }, { data: membersData }] = await Promise.all([
      supabase.from('ligas').select('*').eq('id', ligaId).single(),
      supabase.from('liga_members').select('*').eq('liga_id', ligaId),
    ])
    setLiga(ligaData)
    setMembers(membersData || [])

    const ids = (membersData || []).map(m => m.user_id)
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from('profiles').select('id, name').in('id', ids)
      const map = {}
      profs?.forEach(p => { map[p.id] = p.name })
      setProfiles(map)
    }
    setLoading(false)
  }, [ligaId])

  useEffect(() => { load() }, [load])

  const confirmed    = members.filter(m => m.paid)
  const pending      = members.filter(m => !m.paid)
  const myMembership = members.find(m => m.user_id === userId)

  async function confirmMember(memberId) {
    await supabase.from('liga_members')
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq('liga_id', ligaId).eq('user_id', memberId)
    await load()
  }

  async function removeMember(memberId) {
    await supabase.from('liga_members')
      .delete().eq('liga_id', ligaId).eq('user_id', memberId)
    await load()
  }

  async function declarePayment(note) {
    await supabase.from('liga_members')
      .update({ note })
      .eq('liga_id', ligaId).eq('user_id', userId)
    await load()
  }

  async function updateSettings({ winner_count }) {
    await supabase.from('ligas').update({ winner_count }).eq('id', ligaId)
    await load()
  }

  async function requestPriceChange(newAmount) {
    await supabase.from('ligas')
      .update({ pending_entry_amount: newAmount })
      .eq('id', ligaId)
    await load()
  }

  return {
    liga, members, profiles, loading,
    confirmed, pending, myMembership,
    confirmMember, removeMember, declarePayment,
    updateSettings, requestPriceChange,
    refresh: load,
  }
}

export function calcLigaPrizes(liga, confirmedCount) {
  const gross  = confirmedCount * (liga.entry_amount || 0)
  const cut    = Math.floor(gross * (liga.organizer_cut ?? 0) / 100)
  const net    = gross - cut
  const n      = Math.min(Math.max(liga.winner_count || 3, 1), 10)
  const splits = PRIZE_SPLITS[n]
  const prizes = splits.map(pct => Math.floor(net * pct / 100))
  return { gross, cut, net, prizes, splits }
}
