-- Actualizar vista leaderboard: campeón 20pts, subcampeón 10pts
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
      ) then 20
      when sp.champion = (
        select away from public.matches
        where phase = 'final' and result_home is not null limit 1
      ) then 20
      else 0
    end, 0
  ) +
  coalesce(
    case
      when sp.subchampion = (
        select home from public.matches
        where phase = 'final' and result_home is not null limit 1
      ) then 10
      when sp.subchampion = (
        select away from public.matches
        where phase = 'final' and result_home is not null limit 1
      ) then 10
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
