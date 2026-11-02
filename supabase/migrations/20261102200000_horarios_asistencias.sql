-- Se puede ejecutar varias veces sin problema: cada paso comprueba si ya está hecho.

-- 1. Horario distinto para cada día de entrenamiento
create table if not exists public.equipo_horarios (
  id           uuid primary key default gen_random_uuid(),
  equipo_id    uuid not null references public.equipos (id) on delete cascade,
  dia          public.dia_semana not null,
  hora_inicio  time,
  hora_fin     time,
  unique (equipo_id, dia),
  constraint horario_dia_valido check (hora_fin is null or hora_inicio is null or hora_fin > hora_inicio)
);

-- Pasar los días/horas actuales de cada equipo a la tabla nueva y quitar las columnas antiguas
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'equipos' and column_name = 'dias_entrenamiento'
  ) then
    insert into public.equipo_horarios (equipo_id, dia, hora_inicio, hora_fin)
    select e.id, d.dia, e.hora_inicio, e.hora_fin
    from public.equipos e, unnest(e.dias_entrenamiento) as d(dia)
    on conflict (equipo_id, dia) do nothing;

    alter table public.equipos
      drop constraint if exists horario_valido,
      drop column dias_entrenamiento,
      drop column if exists hora_inicio,
      drop column if exists hora_fin;
  end if;
end $$;

-- 2. Separar lesión (🤕) y enfermedad (🤒)
do $$
begin
  if exists (
    select 1 from pg_enum
    where enumtypid = 'public.estado_jugador'::regtype and enumlabel = 'lesioa_gaixo'
  ) then
    alter type public.estado_jugador rename value 'lesioa_gaixo' to 'lesioa';
  end if;
end $$;

alter type public.estado_jugador add value if not exists 'gaixo' after 'lesioa';

-- 3. Asistencia por jugador y día
create table if not exists public.asistencias (
  id          uuid primary key default gen_random_uuid(),
  equipo_id   uuid not null references public.equipos (id) on delete cascade,
  jugador_id  uuid not null references public.jugadores (id) on delete cascade,
  fecha       date not null,
  estado      public.estado_jugador not null,
  created_at  timestamptz not null default now(),
  unique (jugador_id, fecha)
);

create index if not exists asistencias_equipo_fecha_idx on public.asistencias (equipo_id, fecha);

-- Igual que el resto: RLS activo y solo el servidor (clave secreta) accede
alter table public.equipo_horarios enable row level security;
alter table public.asistencias     enable row level security;

grant select, insert, update, delete on public.equipo_horarios to service_role;
grant select, insert, update, delete on public.asistencias     to service_role;

-- Que la API vea las tablas nuevas al momento
notify pgrst, 'reload schema';
