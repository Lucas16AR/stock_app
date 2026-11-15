-- Tarea 005 — funciones atómicas para registrar y anular ventas.
--
-- CUÁNDO: ANTES del deploy del código de la tarea 005. Es aditiva (solo
-- crea dos funciones): la versión que está en producción no las usa, así
-- que no se rompe nada si se aplica antes. El código nuevo SÍ las
-- necesita: sin esta migración, registrar o anular una venta da error.
--
-- QUÉ HACE:
--   Hasta ahora registrar una venta eran tres pedidos sueltos (leer stock,
--   insertar la venta, descontar stock): si algo fallaba en el medio, la
--   venta quedaba sin descontar o al revés. Estas funciones hacen cada
--   operación en una sola transacción y bloquean la fila del producto
--   (FOR UPDATE) para que dos ventas simultáneas no vendan la misma gorra.
--   - registrar_venta: valida, inserta la venta y descuenta el stock.
--   - anular_venta: borra la venta y devuelve la cantidad al stock.
--   Son SECURITY INVOKER: corren con los permisos y el RLS de quien las
--   llama (el admin logueado, cubierto por las políticas admin_all_*).
--
-- ERRORES (los traduce la server action, src/lib/ventas.ts):
--   cantidad_invalida, precio_invalido, fecha_futura,
--   producto_no_encontrado, stock_insuficiente:<stock actual>,
--   venta_no_encontrada.
--
-- PERMISOS: Supabase le da EXECUTE a anon en toda función nueva del
-- esquema public (privilegios por defecto). Acá se le saca a anon y a
-- PUBLIC y se le da solo a authenticated. Aunque anon pudiera llamarlas,
-- no tiene permisos sobre ventas ni para escribir productos (migración
-- 001b), así que fallarían igual: esto es una segunda barrera.
--
-- VUELTA ATRÁS:
--   drop function public.registrar_venta(bigint, int, numeric, timestamptz);
--   drop function public.anular_venta(bigint);
--   (y volver a desplegar la versión anterior del código)

create or replace function public.registrar_venta(
  p_producto_id bigint,
  p_cantidad int,
  p_precio numeric,
  p_fecha timestamptz default now()
) returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_stock int;
  v_id bigint;
  v_fecha timestamptz := coalesce(p_fecha, now());
begin
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'cantidad_invalida';
  end if;
  if p_precio is null or p_precio < 0 then
    raise exception 'precio_invalido';
  end if;
  -- "Futura" se mide en días de Argentina: una venta de hoy a cualquier
  -- hora vale; una de mañana, no.
  if (v_fecha at time zone 'America/Argentina/Buenos_Aires')::date
     > (now() at time zone 'America/Argentina/Buenos_Aires')::date then
    raise exception 'fecha_futura';
  end if;

  select cantidad into v_stock
    from productos
   where id = p_producto_id
     for update;
  if not found then
    raise exception 'producto_no_encontrado';
  end if;
  if v_stock < p_cantidad then
    raise exception 'stock_insuficiente:%', v_stock;
  end if;

  insert into ventas (producto_id, cantidad, precio_venta, fecha)
  values (p_producto_id, p_cantidad, p_precio, v_fecha)
  returning id into v_id;

  update productos
     set cantidad = cantidad - p_cantidad
   where id = p_producto_id;

  return v_id;
end
$$;

create or replace function public.anular_venta(p_venta_id bigint)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v ventas%rowtype;
begin
  select * into v
    from ventas
   where id = p_venta_id
     for update;
  if not found then
    raise exception 'venta_no_encontrada';
  end if;

  delete from ventas where id = p_venta_id;

  update productos
     set cantidad = cantidad + v.cantidad
   where id = v.producto_id;
end
$$;

revoke all on function public.registrar_venta(bigint, int, numeric, timestamptz) from public, anon;
revoke all on function public.anular_venta(bigint) from public, anon;
grant execute on function public.registrar_venta(bigint, int, numeric, timestamptz) to authenticated;
grant execute on function public.anular_venta(bigint) to authenticated;
