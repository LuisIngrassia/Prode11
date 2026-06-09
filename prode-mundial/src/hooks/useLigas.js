import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
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

    // Creator entra pero también debe pagar — paid: false como cualquier miembro
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

// Hook: detalle de una liga (miembros + operaciones del creator)
export function useLigaDetail(ligaId, userId) {
  const [members, setMembers]   = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    if (!ligaId) return
    const { data } = await supabase
      .from('liga_members')
      .select('*')
      .eq('liga_id', ligaId)
    setMembers(data || [])

    const ids = (data || []).map(m => m.user_id)
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

  const confirmed   = members.filter(m => m.paid)
  const pending     = members.filter(m => !m.paid)
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

  return {
    members, profiles, loading,
    confirmed, pending, myMembership,
    confirmMember, removeMember, declarePayment,
    refresh: load,
  }
}

export function calcLigaPrizes(liga, confirmedCount) {
  const gross = confirmedCount * (liga.entry_amount || 0)
  const cut   = Math.floor(gross * (liga.organizer_cut ?? 0) / 100)
  const net   = gross - cut
  return {
    gross, cut, net,
    first:  Math.floor(net * 0.60),
    second: Math.floor(net * 0.25),
    third:  Math.floor(net * 0.15),
  }
}
