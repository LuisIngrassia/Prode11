-- Permitir al admin de plataforma gestionar pagos y salas

-- Admin gestiona liga_members (confirmar/rechazar pagos)
create policy "Platform admin gestiona liga_members"
  on public.liga_members for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Admin puede borrar ligas (y sus miembros por cascade)
create policy "Platform admin gestiona ligas"
  on public.ligas for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Revocar permiso de UPDATE al creator (ya no confirma pagos)
drop policy if exists "Creator confirma pagos" on public.liga_members;
