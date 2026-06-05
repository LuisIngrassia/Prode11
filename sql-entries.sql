-- ================================================================
-- MIGRACIÓN: Sistema de Pozo Proporcional
-- Ejecutar DESPUÉS de sql-setup-completo.sql
-- ================================================================

-- 1. Agregar is_admin a profiles
alter table public.profiles
  add column if not exists is_admin boolean default false;

-- 2. Tabla de entradas al pozo
create table if not exists public.entries (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users on delete cascade unique,
  amount       int not null check (amount >= 500),
  confirmed    boolean default false,
  confirmed_at timestamptz,
  note         text,               -- referencia de la transferencia
  created_at   timestamptz default now()
);

-- 3. RLS
alter table public.entries enable row level security;

-- Todos los autenticados pueden ver todas las entradas (para calcular el pozo)
create policy "Ver todas las entradas"
  on public.entries for select
  using (auth.uid() is not null);

-- El usuario puede insertar/actualizar su propia entrada (si no está confirmada)
create policy "Insertar propia entrada"
  on public.entries for insert
  with check (auth.uid() = user_id);

create policy "Actualizar propia entrada sin confirmar"
  on public.entries for update
  using (auth.uid() = user_id and confirmed = false);

-- Admin puede hacer todo
create policy "Admin acceso total a entradas"
  on public.entries for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- 4. Para marcar un usuario como admin (reemplazá el email)
-- update public.profiles set is_admin = true
-- where id = (select id from auth.users where email = 'tu@email.com');
