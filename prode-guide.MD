# Prode Mundial 2026 — Guía de implementación con Supabase

## Stack
- React + Vite
- Tailwind CSS
- Supabase (Auth + PostgreSQL)

---

## 1. Crear proyecto

```bash
npm create vite@latest prode-mundial -- --template react
cd prode-mundial
npm install
npm install @supabase/supabase-js
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## 2. Variables de entorno

Crear `.env` en la raíz:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

---

## 3. Cliente Supabase

`src/lib/supabase.js`

```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## 4. SQL — Tablas en Supabase

Ejecutar en **SQL Editor** de Supabase:

```sql
-- Usuarios (extiende auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  created_at timestamptz default now()
);

-- Partidos
create table public.matches (
  id serial primary key,
  date text,
  group_name text,
  home text not null,
  away text not null,
  result_home int,   -- null hasta que se cargue el resultado
  result_away int,
  phase text default 'groups' -- 'groups' | 'r16' | 'qf' | 'sf' | 'final'
);

-- Predicciones por partido
create table public.predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  match_id int references public.matches,
  pred_home int not null,
  pred_away int not null,
  points int default 0,
  unique(user_id, match_id)
);

-- Predicciones especiales (campeón / subcampeón)
create table public.special_predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade unique,
  champion text,
  subchampion text,
  locked boolean default false
);

-- Tabla de posiciones (vista calculada)
create view public.leaderboard as
select
  p.id,
  pr.name,
  coalesce(sum(pred.points), 0) +
  coalesce(
    case when sp.champion = (select home from matches where phase='final' and result_home is not null limit 1) then 15
         when sp.champion = (select away from matches where phase='final' and result_home is not null limit 1) then 15
         else 0 end, 0
  ) +
  coalesce(
    case when sp.subchampion = (select home from matches where phase='final' and result_home is not null limit 1) then 8
         when sp.subchampion = (select away from matches where phase='final' and result_home is not null limit 1) then 8
         else 0 end, 0
  ) as total_pts,
  count(pred.id) filter (where pred.points = 3) as exact_count,
  count(pred.id) filter (where pred.points = 1) as winner_count,
  sp.champion,
  sp.subchampion
from auth.users p
join public.profiles pr on pr.id = p.id
left join public.predictions pred on pred.user_id = p.id
left join public.special_predictions sp on sp.user_id = p.id
group by p.id, pr.name, sp.champion, sp.subchampion
order by total_pts desc;

-- RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.predictions enable row level security;
alter table public.special_predictions enable row level security;

-- Policies
create policy "Profiles públicos" on public.profiles for select using (true);
create policy "Editar propio perfil" on public.profiles for all using (auth.uid() = id);

create policy "Ver todas las predicciones" on public.predictions for select using (true);
create policy "Editar propias predicciones" on public.predictions for all using (auth.uid() = user_id);

create policy "Ver predicciones especiales" on public.special_predictions for select using (true);
create policy "Editar propias predicciones especiales" on public.special_predictions for all using (auth.uid() = user_id);

-- Trigger: crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Usuario'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 5. Insertar fixture inicial

```sql
insert into public.matches (date, group_name, home, away) values
('12 Jun', 'A', 'México', 'Argentina'),
('12 Jun', 'A', 'Estados Unidos', 'Ecuador'),
('13 Jun', 'B', 'Brasil', 'Colombia'),
('13 Jun', 'B', 'Uruguay', 'Paraguay'),
('14 Jun', 'C', 'España', 'Marruecos'),
('14 Jun', 'C', 'Portugal', 'Croacia'),
('15 Jun', 'D', 'Alemania', 'Japón'),
('15 Jun', 'D', 'Francia', 'Senegal'),
('16 Jun', 'E', 'Inglaterra', 'Nigeria'),
('16 Jun', 'E', 'Países Bajos', 'Dinamarca'),
('17 Jun', 'F', 'Italia', 'Corea del Sur'),
('17 Jun', 'F', 'Bélgica', 'Suiza'),
('18 Jun', 'G', 'Polonia', 'Australia'),
('18 Jun', 'G', 'Ghana', 'Camerún'),
('19 Jun', 'H', 'Canadá', 'Costa de Marfil'),
('19 Jun', 'H', 'Irán', 'Arabia Saudita');
```

---

## 6. Lógica de puntos — función SQL

Ejecutar cuando se carga un resultado real:

```sql
create or replace function public.calculate_points(match_id_input int)
returns void as $$
declare
  m record;
begin
  select * into m from public.matches where id = match_id_input;

  update public.predictions
  set points =
    case
      when pred_home = m.result_home and pred_away = m.result_away then 3
      when
        (pred_home > pred_away and m.result_home > m.result_away) or
        (pred_home < pred_away and m.result_home < m.result_away) or
        (pred_home = pred_away and m.result_home = m.result_away)
        then 1
      else 0
    end
  where match_id = match_id_input;
end;
$$ language plpgsql security definer;
```

Llamar así cuando cargás un resultado:
```sql
select calculate_points(1); -- reemplazá 1 con el id del partido
```

---

## 7. Hooks de React

### `src/hooks/useAuth.js`
```js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function signUp(email, password, name) {
    return supabase.auth.signUp({
      email, password,
      options: { data: { name } }
    })
  }

  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  return { user, loading, signUp, signIn, signOut }
}
```

### `src/hooks/useMatches.js`
```js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useMatches() {
  const [matches, setMatches] = useState([])

  useEffect(() => {
    supabase.from('matches').select('*').order('id')
      .then(({ data }) => setMatches(data || []))
  }, [])

  return matches
}
```

### `src/hooks/usePredictions.js`
```js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePredictions(userId) {
  const [predictions, setPredictions] = useState({})

  useEffect(() => {
    if (!userId) return
    supabase.from('predictions').select('*').eq('user_id', userId)
      .then(({ data }) => {
        const map = {}
        data?.forEach(p => { map[p.match_id] = p })
        setPredictions(map)
      })
  }, [userId])

  async function savePrediction(matchId, predHome, predAway) {
    const { error } = await supabase.from('predictions').upsert({
      user_id: userId,
      match_id: matchId,
      pred_home: predHome,
      pred_away: predAway
    }, { onConflict: 'user_id,match_id' })
    return error
  }

  return { predictions, savePrediction }
}
```

### `src/hooks/useSpecialPredictions.js`
```js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSpecialPredictions(userId) {
  const [special, setSpecial] = useState({ champion: '', subchampion: '', locked: false })

  useEffect(() => {
    if (!userId) return
    supabase.from('special_predictions').select('*').eq('user_id', userId).single()
      .then(({ data }) => { if (data) setSpecial(data) })
  }, [userId])

  async function saveSpecial(champion, subchampion) {
    if (special.locked) return { error: 'Ya están bloqueadas' }
    const { error } = await supabase.from('special_predictions').upsert({
      user_id: userId, champion, subchampion
    }, { onConflict: 'user_id' })
    if (!error) setSpecial(s => ({ ...s, champion, subchampion }))
    return { error }
  }

  return { special, saveSpecial }
}
```

### `src/hooks/useLeaderboard.js`
```js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    supabase.from('leaderboard').select('*')
      .then(({ data }) => setLeaderboard(data || []))
  }, [])

  return leaderboard
}
```

---

## 8. Cargar resultados (Admin)

En Supabase Dashboard → Table Editor → `matches`, editás `result_home` y `result_away` directamente.

O desde código con un componente admin protegido:

```js
async function updateResult(matchId, resultHome, resultAway) {
  await supabase.from('matches').update({
    result_home: resultHome,
    result_away: resultAway
  }).eq('id', matchId)

  // Recalcular puntos
  await supabase.rpc('calculate_points', { match_id_input: matchId })
}
```

---

## 9. Estructura de carpetas

```
src/
├── lib/
│   └── supabase.js
├── hooks/
│   ├── useAuth.js
│   ├── useMatches.js
│   ├── usePredictions.js
│   ├── useSpecialPredictions.js
│   └── useLeaderboard.js
├── components/
│   ├── LoginScreen.jsx
│   ├── Header.jsx
│   ├── Fixture.jsx
│   ├── Leaderboard.jsx
│   ├── PreTournament.jsx
│   └── PointsInfo.jsx
├── App.jsx
└── main.jsx
```

---

## 10. Deploy en Vercel

```bash
npm install -g vercel
vercel
```

Agregar en Vercel → Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Resumen de flujo

1. Usuario se registra → trigger crea perfil automáticamente
2. Antes del torneo → elige campeón/subcampeón (se bloquea al empezar)
3. Por partido → ingresa predicción (home:away)
4. Admin carga resultado real → SQL recalcula puntos automáticamente
5. Leaderboard se actualiza en tiempo real desde la vista SQL