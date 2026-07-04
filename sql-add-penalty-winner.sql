-- ================================================================
-- PENALTY WINNER — Ejecutar en Supabase SQL Editor
-- Agrega columna para registrar quién pasa por penales
-- cuando un cruce de eliminación directa termina empatado.
-- ================================================================

alter table public.matches
  add column if not exists penalty_winner text;
