-- Tipos
create type public.dia_semana as enum (
  'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'
);

-- ❌ falta · 🤕 lesioa / gaixo · ✅ etorri da · 📚 ikasten · 🏥 medikua
create type public.estado_jugador as enum (
  'falta', 'lesioa_gaixo', 'etorri_da', 'ikasten', 'medikua'
);

-- Equipos
create table public.equipos (
  id                  uuid primary key default gen_random_uuid(),
  entrenador_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre              text not null,
  categoria           text,
  temporada           text,
  dias_entrenamiento  public.dia_semana[] not null default '{}',
  hora_inicio         time,
  hora_fin            time,
  lugar               text,
  created_at          timestamptz not null default now(),
  constraint horario_valido check (hora_fin is null or hora_inicio is null or hora_fin > hora_inicio)
);

create index equipos_entrenador_id_idx on public.equipos (entrenador_id);

-- Jugadores
create table public.jugadores (
  id          uuid primary key default gen_random_uuid(),
  equipo_id   uuid not null references public.equipos (id) on delete cascade,
  nombre      text not null,
  apellido    text not null,
  dorsal      smallint,
  estado      public.estado_jugador not null default 'etorri_da',
  created_at  timestamptz not null default now()
);

create index jugadores_equipo_id_idx on public.jugadores (equipo_id);

-- Acceso desde la Data API (solo usuarios con sesión)
grant select, insert, update, delete on public.equipos   to authenticated;
grant select, insert, update, delete on public.jugadores to authenticated;

-- RLS: cada entrenador solo ve y gestiona sus equipos y los jugadores de esos equipos
alter table public.equipos   enable row level security;
alter table public.jugadores enable row level security;

create policy "equipos: ver los propios" on public.equipos
  for select to authenticated
  using ((select auth.uid()) = entrenador_id);

create policy "equipos: crear los propios" on public.equipos
  for insert to authenticated
  with check ((select auth.uid()) = entrenador_id);

create policy "equipos: editar los propios" on public.equipos
  for update to authenticated
  using ((select auth.uid()) = entrenador_id)
  with check ((select auth.uid()) = entrenador_id);

create policy "equipos: borrar los propios" on public.equipos
  for delete to authenticated
  using ((select auth.uid()) = entrenador_id);

create policy "jugadores: ver los de mis equipos" on public.jugadores
  for select to authenticated
  using (exists (
    select 1 from public.equipos e
    where e.id = equipo_id and e.entrenador_id = (select auth.uid())
  ));

create policy "jugadores: crear en mis equipos" on public.jugadores
  for insert to authenticated
  with check (exists (
    select 1 from public.equipos e
    where e.id = equipo_id and e.entrenador_id = (select auth.uid())
  ));

create policy "jugadores: editar los de mis equipos" on public.jugadores
  for update to authenticated
  using (exists (
    select 1 from public.equipos e
    where e.id = equipo_id and e.entrenador_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.equipos e
    where e.id = equipo_id and e.entrenador_id = (select auth.uid())
  ));

create policy "jugadores: borrar los de mis equipos" on public.jugadores
  for delete to authenticated
  using (exists (
    select 1 from public.equipos e
    where e.id = equipo_id and e.entrenador_id = (select auth.uid())
  ));
