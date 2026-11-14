-- Tarea 001 · Migración 1 de 2 — aditiva.
--
-- CUÁNDO: ANTES del deploy del código de la tarea 001. No rompe la versión
-- que está en producción: solo agrega una columna y limpia descripciones.
--
-- QUÉ HACE:
--   1. Agrega productos.ref_interna (text, nullable): la referencia de
--      compra (ej. "AFA 12") deja de vivir dentro de la descripción, que es
--      pública.
--   2. Para cada producto cuya descripción tenga una o más líneas que
--      empiezan con "Ref. interna" (mismo criterio que descripcionPublica()
--      en src/lib/site.ts: "Ref interna", "ref. interna:", etc.), pasa lo que
--      viene después de los dos puntos a ref_interna y saca esas líneas de
--      la descripción. Si no queda texto, la descripción queda en null.
--      Si hubiera más de una línea de referencia, se unen con " / ".
--
-- Es idempotente: si se corre dos veces, la segunda no encuentra líneas de
-- referencia y no cambia nada.

alter table public.productos add column if not exists ref_interna text;

with lineas as (
  select
    p.id,
    btrim(l.linea, E' \t\r') as linea,
    l.n
  from public.productos p
  cross join lateral regexp_split_to_table(p.descripcion, E'\n') with ordinality as l(linea, n)
  where p.descripcion ~* '(^|\n)[[:space:]]*ref\.?[[:space:]]*interna'
),
separado as (
  select
    id,
    nullif(
      string_agg(
        case when linea ~* '^ref\.?[[:space:]]*interna'
          then btrim(regexp_replace(linea, '^ref\.?[[:space:]]*interna[[:space:]]*:?', '', 'i'))
        end,
        ' / ' order by n
      ),
      ''
    ) as ref,
    nullif(
      btrim(
        string_agg(
          case when linea !~* '^ref\.?[[:space:]]*interna' then linea end,
          E'\n' order by n
        ),
        E' \t\r\n'
      ),
      ''
    ) as descripcion
  from lineas
  group by id
)
update public.productos p
set
  ref_interna = coalesce(s.ref, p.ref_interna),
  descripcion = s.descripcion
from separado s
where p.id = s.id;
