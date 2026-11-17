-- Tarea 006 — compras por gorra: recompras, stock múltiple, costo
-- promedio y envío repartido por lote.
--
-- CUÁNDO: ANTES del deploy del código de la tarea 006. Es aditiva para el
-- código que está en producción: crea la tabla `compras`, agrega
-- `ventas.costo_unitario`, carga una compra por gorra (backfill) y
-- reemplaza `registrar_venta` con la misma firma (ahora también guarda el
-- costo). El código viejo sigue andando con ella.
--   Entre aplicarla y el deploy, NO editar en el admin viejo costos, stock
--   ni lotes de las gorras: lo que se escriba directo en `productos` no
--   queda en `compras` (y el próximo recálculo lo pisa). Ventas sí.
--   El código nuevo SÍ la necesita: sin ella, cargar o anular compras da
--   "falta aplicar la migración 006".
--
-- QUÉ HACE:
--   - `compras`: cada ingreso de unidades de una gorra (lote, unidades,
--     precio de compra, envío y extra por unidad, ref. de esa compra).
--   - `productos.cantidad` sigue siendo el stock, pero solo lo tocan las
--     funciones: registrar_compra / actualizar_compra / anular_compra (y
--     registrar_venta / anular_venta, de la 005).
--   - `productos.precio_compra`, `costo_envio_unitario` y `costo_extra`
--     pasan a ser un caché: el promedio ponderado (por unidades) de sus
--     compras, que recalcula recalcular_costos(). `productos.lote_id` es el
--     lote de la última compra (caché, para el filtro "Sin lote").
--   - El envío por unidad de las compras de un lote es
--     round(costo_envio del lote / unidades de sus compras). Se reparte
--     solo (repartir_envio_lote) al cargar, cambiar o anular una compra del
--     lote, y la server action lo llama al editar el costo de envío.
--   - `ventas.costo_unitario`: el costo de la gorra al momento de la venta
--     (registrar_venta lo congela). La ganancia del dashboard usa ese valor.
--   Todas son SECURITY INVOKER: corren con el RLS del admin logueado.
--
-- ERRORES (los traduce la server action, src/lib/compras.ts):
--   unidades_invalidas, precio_invalido, producto_no_encontrado,
--   lote_no_encontrado, compra_no_encontrada,
--   unidades_vendidas:<stock actual> (anular o bajar unidades dejaría el
--   stock negativo: esas unidades ya se vendieron).
--
-- SE PUEDE VOLVER A APLICAR: `if not exists`, el backfill salta las gorras
-- que ya tienen compras y las políticas se recrean.
--
-- VERIFICACIÓN después de aplicar (lote #1 al 2026-11-17): 49 compras,
-- 50 unidades (stock + vendidas), todas con $ 420 de envío; la `cantidad`
-- de cada gorra igual que antes; todas las ventas con costo_unitario.
--
-- VUELTA ATRÁS (y volver a desplegar la versión anterior del código):
--   drop function public.eliminar_lote(bigint);
--   drop function public.actualizar_compra(bigint, int, numeric, numeric, text, numeric);
--   drop function public.anular_compra(bigint);
--   drop function public.registrar_compra(bigint, bigint, int, numeric, numeric, text, numeric);
--   drop function public.repartir_envio_lote(bigint);
--   drop function public.recalcular_costos(bigint);
--   drop table public.compras;
--   alter table public.ventas drop column costo_unitario;
--   y volver a crear registrar_venta como en la migración 005.
--   (Los costos y el stock de `productos` quedan como estén en ese momento.)

-- ---------- Tabla ----------

create table if not exists public.compras (
  id bigint generated always as identity primary key,
  producto_id bigint not null references public.productos(id) on delete cascade,
  lote_id bigint references public.lotes(id) on delete set null,
  unidades int not null check (unidades > 0),
  precio_compra numeric not null default 0 check (precio_compra >= 0),
  costo_envio_unitario numeric not null default 0 check (costo_envio_unitario >= 0),
  costo_extra numeric not null default 0 check (costo_extra >= 0),
  ref_interna text,
  fecha timestamptz not null default now()
);
create index if not exists compras_producto_idx on public.compras(producto_id);
create index if not exists compras_lote_idx on public.compras(lote_id);

alter table public.ventas add column if not exists costo_unitario numeric;

-- ---------- Permisos y RLS ----------
-- Supabase le da todos los permisos a anon en cada tabla nueva (y en su
-- secuencia): se los saca. Mismo criterio que las demás tablas del admin.

alter table public.compras enable row level security;
drop policy if exists admin_all_compras on public.compras;
create policy admin_all_compras on public.compras
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

revoke all on table public.compras from anon, public;
grant select, insert, update, delete on table public.compras to authenticated;
revoke all on sequence public.compras_id_seq from anon, public;
grant usage, select on sequence public.compras_id_seq to authenticated;

-- ---------- Backfill ----------
-- Una compra por gorra con todo lo que entró: stock actual + vendidas, con
-- los costos, el lote y la ref. que tiene hoy. La fecha es la del lote (o
-- la de alta de la gorra si no tiene lote).

insert into public.compras (producto_id, lote_id, unidades, precio_compra, costo_envio_unitario, costo_extra, ref_interna, fecha)
select p.id, p.lote_id, p.cantidad + coalesce(v.vend, 0), p.precio_compra, p.costo_envio_unitario, p.costo_extra,
       p.ref_interna, coalesce(l.fecha, p.fecha_creacion)
  from public.productos p
  left join (select producto_id, sum(cantidad) vend from public.ventas group by 1) v on v.producto_id = p.id
  left join public.lotes l on l.id = p.lote_id
 where p.cantidad + coalesce(v.vend, 0) > 0
   and not exists (select 1 from public.compras c where c.producto_id = p.id);

-- Las ventas que ya existen se quedan con el costo de hoy de su gorra.
update public.ventas v
   set costo_unitario = p.precio_compra + p.costo_envio_unitario + p.costo_extra
  from public.productos p
 where p.id = v.producto_id
   and v.costo_unitario is null;

-- ---------- Funciones ----------

-- Promedio ponderado (por unidades) de las compras de la gorra, guardado
-- en las columnas de costo de `productos`, y el lote de la última compra.
-- Sin compras: queda sin lote y los costos como estaban (no hay de dónde
-- sacar un promedio).
create or replace function public.recalcular_costos(p_producto_id bigint) returns void
language plpgsql security invoker set search_path = public as $$
declare
  c record;
begin
  select sum(unidades) as unidades,
         round(sum(unidades * precio_compra) / sum(unidades), 2) as pc,
         round(sum(unidades * costo_envio_unitario) / sum(unidades), 2) as env,
         round(sum(unidades * costo_extra) / sum(unidades), 2) as ext,
         (array_agg(lote_id order by fecha desc, id desc) filter (where lote_id is not null))[1] as ultimo_lote
    into c
    from compras
   where producto_id = p_producto_id;

  if c.unidades is null then
    update productos set lote_id = null where id = p_producto_id;
    return;
  end if;

  update productos
     set precio_compra = c.pc,
         costo_envio_unitario = c.env,
         costo_extra = c.ext,
         lote_id = c.ultimo_lote
   where id = p_producto_id;
end
$$;

-- Envío por unidad de las compras de un lote = costo de envío del lote /
-- unidades de sus compras, redondeado a pesos. Después recalcula el costo
-- de cada gorra del lote.
create or replace function public.repartir_envio_lote(p_lote_id bigint) returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_total bigint;
  v_costo numeric;
  v_por numeric;
  r record;
begin
  if p_lote_id is null then return; end if;
  select costo_envio into v_costo from lotes where id = p_lote_id;
  select coalesce(sum(unidades), 0) into v_total from compras where lote_id = p_lote_id;
  if v_costo is null or v_total = 0 then return; end if;
  v_por := round(v_costo / v_total);
  update compras set costo_envio_unitario = v_por where lote_id = p_lote_id;
  for r in select distinct producto_id from compras where lote_id = p_lote_id loop
    perform recalcular_costos(r.producto_id);
  end loop;
end
$$;

-- Carga una compra: suma las unidades al stock, recalcula el costo de la
-- gorra y reparte el envío del lote. En un lote, el envío lo pone el
-- reparto (p_envio se ignora); sin lote, se usa p_envio.
create or replace function public.registrar_compra(
  p_producto_id bigint,
  p_lote_id bigint,
  p_unidades int,
  p_precio numeric,
  p_extra numeric default 0,
  p_ref text default null,
  p_envio numeric default 0
) returns bigint
language plpgsql security invoker set search_path = public as $$
declare
  v_id bigint;
begin
  if p_unidades is null or p_unidades <= 0 then
    raise exception 'unidades_invalidas';
  end if;
  if p_precio is null or p_precio < 0 or coalesce(p_extra, 0) < 0 or coalesce(p_envio, 0) < 0 then
    raise exception 'precio_invalido';
  end if;
  perform 1 from productos where id = p_producto_id for update;
  if not found then
    raise exception 'producto_no_encontrado';
  end if;
  if p_lote_id is not null and not exists (select 1 from lotes where id = p_lote_id) then
    raise exception 'lote_no_encontrado';
  end if;

  insert into compras (producto_id, lote_id, unidades, precio_compra, costo_envio_unitario, costo_extra, ref_interna, fecha)
  values (p_producto_id, p_lote_id, p_unidades, p_precio,
          case when p_lote_id is null then coalesce(p_envio, 0) else 0 end,
          coalesce(p_extra, 0), nullif(btrim(p_ref), ''),
          coalesce((select fecha from lotes where id = p_lote_id), now()))
  returning id into v_id;

  update productos set cantidad = cantidad + p_unidades where id = p_producto_id;
  perform recalcular_costos(p_producto_id);
  perform repartir_envio_lote(p_lote_id);
  return v_id;
end
$$;

-- Corrige una compra mal cargada (unidades, precio, extra, ref.; el envío
-- solo si no tiene lote). Si cambian las unidades, ajusta el stock por la
-- diferencia sin dejarlo negativo.
create or replace function public.actualizar_compra(
  p_compra_id bigint,
  p_unidades int,
  p_precio numeric,
  p_extra numeric default 0,
  p_ref text default null,
  p_envio numeric default null
) returns void
language plpgsql security invoker set search_path = public as $$
declare
  c compras%rowtype;
  v_stock int;
begin
  if p_unidades is null or p_unidades <= 0 then
    raise exception 'unidades_invalidas';
  end if;
  if p_precio is null or p_precio < 0 or coalesce(p_extra, 0) < 0 or coalesce(p_envio, 0) < 0 then
    raise exception 'precio_invalido';
  end if;
  select * into c from compras where id = p_compra_id for update;
  if not found then
    raise exception 'compra_no_encontrada';
  end if;
  select cantidad into v_stock from productos where id = c.producto_id for update;
  if v_stock + (p_unidades - c.unidades) < 0 then
    raise exception 'unidades_vendidas:%', v_stock;
  end if;

  update compras
     set unidades = p_unidades,
         precio_compra = p_precio,
         costo_extra = coalesce(p_extra, 0),
         ref_interna = nullif(btrim(p_ref), ''),
         costo_envio_unitario = case when c.lote_id is null then coalesce(p_envio, c.costo_envio_unitario)
                                     else c.costo_envio_unitario end
   where id = p_compra_id;

  update productos set cantidad = cantidad + (p_unidades - c.unidades) where id = c.producto_id;
  perform recalcular_costos(c.producto_id);
  perform repartir_envio_lote(c.lote_id);
end
$$;

-- Anula una compra: la borra y saca sus unidades del stock. Si ya se
-- vendieron (el stock es menor que las unidades), no deja.
create or replace function public.anular_compra(p_compra_id bigint) returns void
language plpgsql security invoker set search_path = public as $$
declare
  c compras%rowtype;
  v_stock int;
begin
  select * into c from compras where id = p_compra_id for update;
  if not found then
    raise exception 'compra_no_encontrada';
  end if;
  select cantidad into v_stock from productos where id = c.producto_id for update;
  if v_stock < c.unidades then
    raise exception 'unidades_vendidas:%', v_stock;
  end if;

  delete from compras where id = p_compra_id;
  update productos set cantidad = cantidad - c.unidades where id = c.producto_id;
  perform recalcular_costos(c.producto_id);
  perform repartir_envio_lote(c.lote_id);
end
$$;

-- Borra un lote. Sus compras quedan sin lote (on delete set null) con el
-- último envío calculado; las gorras y su stock no cambian. Se recalcula
-- el lote de cada gorra (puede tener compras en otro lote).
create or replace function public.eliminar_lote(p_lote_id bigint) returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_productos bigint[];
begin
  perform 1 from lotes where id = p_lote_id for update;
  if not found then
    raise exception 'lote_no_encontrado';
  end if;
  select coalesce(array_agg(distinct producto_id), '{}') into v_productos from compras where lote_id = p_lote_id;
  delete from lotes where id = p_lote_id;
  perform recalcular_costos(x) from unnest(v_productos) as x;
end
$$;

-- Igual que en la 005 (misma firma), y además congela el costo de la
-- gorra en la venta.
create or replace function public.registrar_venta(
  p_producto_id bigint,
  p_cantidad int,
  p_precio numeric,
  p_fecha timestamptz default now()
) returns bigint
language plpgsql security invoker set search_path = public as $$
declare
  v_stock int;
  v_costo numeric;
  v_id bigint;
  v_fecha timestamptz := coalesce(p_fecha, now());
begin
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'cantidad_invalida';
  end if;
  if p_precio is null or p_precio < 0 then
    raise exception 'precio_invalido';
  end if;
  -- "Futura" se mide en días de Argentina.
  if (v_fecha at time zone 'America/Argentina/Buenos_Aires')::date
     > (now() at time zone 'America/Argentina/Buenos_Aires')::date then
    raise exception 'fecha_futura';
  end if;

  select cantidad, precio_compra + costo_envio_unitario + costo_extra
    into v_stock, v_costo
    from productos
   where id = p_producto_id
     for update;
  if not found then
    raise exception 'producto_no_encontrado';
  end if;
  if v_stock < p_cantidad then
    raise exception 'stock_insuficiente:%', v_stock;
  end if;

  insert into ventas (producto_id, cantidad, precio_venta, fecha, costo_unitario)
  values (p_producto_id, p_cantidad, p_precio, v_fecha, v_costo)
  returning id into v_id;

  update productos set cantidad = cantidad - p_cantidad where id = p_producto_id;
  return v_id;
end
$$;

-- Supabase le da EXECUTE a anon en toda función nueva: solo authenticated.
-- (registrar_venta conserva sus permisos con create or replace, pero que
-- quede escrito.)
revoke all on function public.recalcular_costos(bigint) from public, anon;
revoke all on function public.repartir_envio_lote(bigint) from public, anon;
revoke all on function public.registrar_compra(bigint, bigint, int, numeric, numeric, text, numeric) from public, anon;
revoke all on function public.actualizar_compra(bigint, int, numeric, numeric, text, numeric) from public, anon;
revoke all on function public.anular_compra(bigint) from public, anon;
revoke all on function public.eliminar_lote(bigint) from public, anon;
revoke all on function public.registrar_venta(bigint, int, numeric, timestamptz) from public, anon;

grant execute on function public.recalcular_costos(bigint) to authenticated;
grant execute on function public.repartir_envio_lote(bigint) to authenticated;
grant execute on function public.registrar_compra(bigint, bigint, int, numeric, numeric, text, numeric) to authenticated;
grant execute on function public.actualizar_compra(bigint, int, numeric, numeric, text, numeric) to authenticated;
grant execute on function public.anular_compra(bigint) to authenticated;
grant execute on function public.eliminar_lote(bigint) to authenticated;
grant execute on function public.registrar_venta(bigint, int, numeric, timestamptz) to authenticated;
