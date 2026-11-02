-- La app ya no tiene login: el servidor de Next accede con la clave secreta (rol service_role).
-- RLS sigue activo, así que la clave pública no puede leer ni escribir estas tablas.

alter table public.equipos alter column entrenador_id drop not null;

grant select, insert, update, delete on public.equipos   to service_role;
grant select, insert, update, delete on public.jugadores to service_role;
