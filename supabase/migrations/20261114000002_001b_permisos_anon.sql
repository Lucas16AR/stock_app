-- Tarea 001 · Migración 2 de 2 — permisos del rol anon (visitante).
--
-- CUÁNDO: DESPUÉS de que el código de la tarea 001 esté desplegado y
-- verificado en producción. Si se aplica antes, el showroom viejo (que
-- pide select("*")) recibe "permission denied" y la página se cae.
--
-- QUÉ HACE:
--   RLS decide QUÉ FILAS ve un visitante; esto decide QUÉ COLUMNAS y qué
--   operaciones. Hasta ahora anon tenía todos los permisos por defecto de
--   Supabase (INSERT, UPDATE, DELETE, TRUNCATE…) sobre las tablas de la app
--   y podía leer por la API costos, margen, lote y ref. interna.
--   - Saca todos los permisos de anon en las 6 tablas de la app.
--   - Le devuelve solo SELECT, y en `productos` únicamente las columnas
--     que usa el showroom (COLUMNAS_PUBLICAS en src/lib/catalogo.ts).
--   - lotes y ventas quedan sin ningún permiso para anon.
--   No toca los permisos de `authenticated` (el admin) ni las políticas RLS.
--
-- OJO A FUTURO: una columna nueva en `productos` NO es legible por anon
-- hasta que se agregue a este GRANT (y a COLUMNAS_PUBLICAS). Las políticas
-- RLS de fotos_producto y producto_categoria consultan productos.id y
-- productos.visible_publico como anon: esas dos columnas tienen que
-- seguir en el GRANT.
--
-- VUELTA ATRÁS (si algo se rompe y hace falta volver al estado anterior):
--   grant all on public.productos, public.fotos_producto,
--     public.producto_categoria, public.categorias, public.lotes,
--     public.ventas to anon;

revoke all on table
  public.productos,
  public.fotos_producto,
  public.producto_categoria,
  public.categorias,
  public.lotes,
  public.ventas
from anon;

grant select (id, nombre, descripcion, cantidad, precio_venta, visible_publico, fecha_creacion)
  on public.productos to anon;

grant select on public.fotos_producto, public.producto_categoria, public.categorias to anon;
