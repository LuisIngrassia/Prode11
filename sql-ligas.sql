-- ================================================================
-- LIGAS PRIVADAS — Ejecutar en Supabase SQL Editor
-- ================================================================

-- 1. Tabla de salas/ligas
create table if not exists public.ligas (
  id             uuid default gen_random_uuid() primary key,
  nombre         text not null,
  codigo         text unique not null,       -- código de invitación (ej: "AMIG26")
  creator_id     uuid references auth.users on delete cascade,
  entry_amount   int not null default 0,      -- 0 = libre (sin premio)
  organizer_cut  int not null default 10      -- % que se queda el creador
    check (organizer_cut between 0 and 30),
  created_at     timestamptz default now()
);

-- 2. Miembros de cada sala
create table if not exists public.liga_members (
  liga_id   uuid references public.ligas on delete cascade,
  user_id   uuid references auth.users on delete cascade,
  paid      boolean default false,
  paid_at   timestamptz,
  note      text,                             -- referencia de la transferencia
  primary key (liga_id, user_id)
);

-- 3. RLS — ligas
alter table public.ligas enable row level security;

create policy "Ver ligas"
  on public.ligas for select
  using (auth.uid() is not null);

create policy "Crear liga"
  on public.ligas for insert
  with check (auth.uid() = creator_id);

create policy "Creator edita su liga"
  on public.ligas for update
  using (auth.uid() = creator_id);

create policy "Creator elimina su liga"
  on public.ligas for delete
  using (auth.uid() = creator_id);

-- 4. RLS — liga_members
alter table public.liga_members enable row level security;

-- Ver miembros: solo los que también son miembros de la misma liga
create policy "Ver miembros de ligas en las que estoy"
  on public.liga_members for select
  using (
    exists (
      select 1 from public.liga_members lm2
      where lm2.liga_id = liga_id and lm2.user_id = auth.uid()
    )
    or
    exists (
      select 1 from public.ligas l
      where l.id = liga_id and l.creator_id = auth.uid()
    )
  );

create policy "Unirse a una liga"
  on public.liga_members for insert
  with check (auth.uid() = user_id);

-- Creator confirma pagos de su sala
create policy "Creator confirma pagos"
  on public.liga_members for update
  using (
    exists (
      select 1 from public.ligas
      where id = liga_id and creator_id = auth.uid()
    )
  );

-- Uno mismo puede salir; creator puede remover miembros
create policy "Salir o ser removido"
  on public.liga_members for delete
  using (
    auth.uid() = user_id
    or
    exists (
      select 1 from public.ligas
      where id = liga_id and creator_id = auth.uid()
    )
  );
