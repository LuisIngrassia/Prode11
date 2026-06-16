-- Fix: la política auto-referencial en liga_members causa que load()
-- devuelva vacío inmediatamente después del insert.
-- Solución: usar una función security definer para evitar la recursión.

-- 1. Eliminar política problemática
drop policy if exists "Ver miembros de ligas en las que estoy" on public.liga_members;

-- 2. Función que obtiene mis liga_ids SIN pasar por RLS (security definer = bypasea RLS)
create or replace function public.my_liga_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select liga_id from public.liga_members where user_id = auth.uid();
$$;

-- 3. Nueva política usando la función (sin recursión)
create policy "Ver miembros de mis ligas"
  on public.liga_members for select
  using (
    -- Ves tu propia fila siempre
    user_id = auth.uid()
    or
    -- Ves miembros de ligas donde estás
    liga_id in (select public.my_liga_ids())
    or
    -- El creator ve todos sus miembros
    exists (
      select 1 from public.ligas
      where id = liga_id and creator_id = auth.uid()
    )
  );
