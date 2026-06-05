-- ================================================================
-- SEGURIDAD — Ejecutar en Supabase SQL Editor
-- Protege matches de ediciones no autorizadas
-- Arregla leaderboard para no depender de auth.users directamente
-- ================================================================

-- 1. Proteger tabla matches
--    (sin esto, cualquier usuario autenticado puede editar resultados)
alter table public.matches enable row level security;

create policy "Matches lectura pública"
  on public.matches for select
  using (true);

create policy "Solo admin puede actualizar resultados"
  on public.matches for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- 2. Arreglar vista leaderboard
--    La versión anterior usaba auth.users (puede tener problemas de permisos).
--    Esta usa solo public.profiles que ya tiene el id y name del usuario.

create or replace view public.leaderboard as
select
  pr.id,
  pr.name,
  coalesce(sum(pred.points), 0) +
  coalesce(
    case
      when sp.champion = (
        select home from public.matches
        where phase = 'final' and result_home is not null limit 1
      ) then 15
      when sp.champion = (
        select away from public.matches
        where phase = 'final' and result_home is not null limit 1
      ) then 15
      else 0
    end, 0
  ) +
  coalesce(
    case
      when sp.subchampion = (
        select home from public.matches
        where phase = 'final' and result_home is not null limit 1
      ) then 8
      when sp.subchampion = (
        select away from public.matches
        where phase = 'final' and result_home is not null limit 1
      ) then 8
      else 0
    end, 0
  ) as total_pts,
  count(pred.id) filter (where pred.points = 3) as exact_count,
  count(pred.id) filter (where pred.points = 1) as winner_count,
  sp.champion,
  sp.subchampion
from public.profiles pr
left join public.predictions pred on pred.user_id = pr.id
left join public.special_predictions sp on sp.user_id = pr.id
group by pr.id, pr.name, sp.champion, sp.subchampion
order by total_pts desc;
