# Stock Gorras (INDY CAPS) — estado del proyecto

Archivo de traspaso entre sesiones (Claude Code local y Cowork). Arriba
está el estado actual y lo pendiente; abajo, el historial por versión con
el detalle de cada cambio. **Actualizado: 2026-11-14.**

> El repo de GitHub es **público**: no escribas acá emails, contraseñas
> ni datos personales.

---

## Estado actual

- **Producción**: https://stock-app-six-woad.vercel.app — sana, versión
  **v2.4.0** (commit `aa01a07`).
- **Git**: `master` local = `origin/master`. Único deploy: Vercel
  (proyecto `stock-app`). Cada push a `master` redeploya solo.
- **Base (Supabase `stockAPP`)**: activa. 50 productos visibles al
  público (48 con stock + 2 vendidas). La migración de vendidas está
  aplicada (ver v2.4.0).
- **Cron keepalive**: funcionando. Primera ejecución automática
  confirmada el 2026-11-11 a las 12:00 UTC en los logs de Supabase
  (`HEAD /rest/v1/categorias?select=id` → 200).

## Pendiente

1. **Usuario — probar las fotos en el panel** (v2.3.0): cargar un producto
   con varias fotos del celular (tiene que aparecer "N fotos listas ·
   X MB" bajo el campo) y borrar una con el ✕ al editar (tiene que
   desaparecer solo esa foto). No se pudo probar sin el login.
2. **Usuario — Render**: confirmar que no quedó una base PostgreSQL
   huérfana del proyecto Flask viejo (el web service ya se borró).
3. **Tarea 001 (prioridad 1, seguridad)** — ajustar qué datos de
   `productos` puede leer un visitante. Detalle en `tareas/001-...md`
   (carpeta privada, no se sube al repo).

## Cómo trabajar en este repo (para las dos sesiones)

**Roles (acordados el 2026-11-13):**
- **Capi** — dueño del producto y líder del equipo. Decide qué se hace,
  prioridades, todo lo de negocio, y aprueba lo irreversible (cambios de
  base en producción, borrar datos, gastos).
- **Cowork (Claude en claude.ai)** — project manager / jefe de
  desarrollo. Baja lo que pide Capi a tareas con criterio de aceptación,
  sugiere mejoras, revisa lo que hace Claude Code (diff, build y
  producción) y mantiene este archivo al día.
- **Claude Code (local)** — desarrollador. Implementa las tareas, corre
  las verificaciones antes de commitear y pushea cuando Capi lo pide.

**Flujo de tareas:** cada tarea es un archivo en `tareas/NNN-nombre.md`
(carpeta en `.gitignore`: el repo es público y ahí se describen problemas
antes de arreglarlos). Cowork la escribe → Capi la aprueba → Claude Code
la hace en la rama `tarea/NNN-nombre` y completa el informe → Cowork la
revisa → con el OK de Capi se mergea a `master`. El flujo completo está
en `tareas/README.md`. Este archivo sigue siendo el estado general y el
historial.

- Cowork no tiene credenciales de GitHub: **comiteá local y dejá la nota
  acá**; el usuario le pide el push a Claude Code, que revisa y pushea.
- Los cambios de base (migraciones, políticas RLS) van como archivo en
  `supabase/migrations/` (la carpeta la crea la tarea 001; antes no
  existía). Anotá acá si quedaron aplicados o no. En v2.4.0 la
  migración se pidió en el mensaje del commit pero no se aplicó; se
  detectó recién al verificar en producción.
- Antes de pushear: `npx tsc --noEmit && npx eslint . && npx next build`.
- Convenciones de código y marca: ver `CLAUDE.md`. Base y RLS:
  `docs/SCHEMA.md`. Seguridad: `docs/SECURITY.md`.

---

## Historial de versiones

Las versiones de la app nueva arrancan en 2.0 (la app vieja en Flask
llegó a V1.1.0). Tags de git: `first_version` y `v1.0` son de la app
Flask vieja; `v2.0.0` marca el arranque de la app nueva (`b7c5ad3`). Las
versiones 2.1.0 a 2.4.0 no tienen tag; cada una lista sus commits.

### v2.4.0 — Showroom renovado y gorras vendidas visibles (2026-11-12/13)
Commit `aa01a07` (Cowork) + migración RLS aplicada el 2026-11-13.

- **Banner de marca** arriba del catálogo, con contador de gorras e
  Instagram (`Hero.tsx`).
- **Buscador** que ignora tildes y mayúsculas, **orden** por novedad o
  precio y contador de resultados (`CatalogControls.tsx`,
  `src/lib/catalogo.ts`). Chips de categoría con cantidad y scroll
  horizontal en el celular.
- **Tarjetas**: categoría, badge "Pieza única", cantidad de fotos y estado
  **"Vendida"** (gris, tachada, al final del catálogo).
- **Detalle de producto**: galería deslizable con miniaturas y flechas
  (`Gallery.tsx`), cartel de vendida, botón de WhatsApp fijo abajo en el
  celular y mensaje "¿tenés alguna parecida?" para las vendidas.
- **Footer** con WhatsApp, Instagram y ubicación (`SiteFooter.tsx`) y
  botón flotante de WhatsApp (`WhatsappFloat.tsx`). Datos de la marca en
  `src/lib/site.ts`.
- **Open Graph**: el link de cada gorra se comparte con su foto, nombre y
  precio.
- Se oculta en el showroom la línea "Ref. interna" de las descripciones
  (ver Pendiente 3).
- Nuevos tokens de color de marca que no cambian con el tema: `ink`,
  `paper`, `mark-bg`, `whatsapp` (`globals.css`, documentados en
  `CLAUDE.md`).
- **Cambio de base — mostrar vendidas**: las políticas de lectura pública
  de `productos`, `fotos_producto` y `producto_categoria` dejaron de exigir
  `cantidad > 0`; ahora solo exigen `visible_publico = true`. Lo corrió el
  usuario en el SQL Editor (Cowork lo había llamado
  `public_read_incluye_vendidas`): borra las políticas `SELECT` de esas
  tres tablas que mencionaban `cantidad` y crea `public_read_productos`,
  `public_read_fotos_producto` y `public_read_producto_categoria` (`to
  anon`). Verificado por la API pública: se ven las 2 vendidas, las 48 con
  stock y ningún producto oculto. Para sacar una vendida del showroom se
  destilda "Visible al público".

### v2.3.0 — Productos: precio de venta y fotos (2026-11-11)
Commits `fe46a51`, `d1263bd` (Cowork) y `17e8a5f` (Claude Code).

- **Hasta 10 fotos por producto** (antes 4). El límite vive en
  `src/lib/fotos.ts` (`MAX_FOTOS_POR_PRODUCTO`), compartido entre el
  formulario y la Server Action.
- **Precio de venta separado del margen**: el margen pasa a ser solo una
  referencia interna. El formulario muestra el **precio sugerido**
  recalculado en vivo (`PrecioCalculado.tsx`) y un campo aparte de
  **precio de venta**, que es el que ve el cliente y el que precarga el
  formulario de ventas. Cambio de base: columna `productos.precio_venta`
  (numeric, not null, default 0), aplicada por Cowork.
- **Fotos achicadas en el navegador** (`FotosInput.tsx`): antes, el envío
  de una Server Action tenía el tope default de 1 MB y una sola foto de
  celular (2–5 MB) hacía fallar el formulario. Ahora cada foto se
  redimensiona a 1600 px como máximo y se pasa a WebP (o JPEG si el
  navegador no codifica WebP). Muestra el progreso y el peso total, y
  avisa si no entran todas (máximo 3,8 MB por envío). `bodySizeLimit` en
  `next.config.ts` pasó a 4 MB; Vercel corta a 4,5 MB por request y no se
  puede subir. Probado en Chrome: una foto de 5,4 MB quedó en 375 KB.
- **Arreglo del botón ✕ para borrar foto**: era un `<form>` anidado dentro
  del formulario del producto; el navegador descarta el interno y el ✕
  terminaba guardando el producto. Ahora es un `<button formAction>` sobre
  el formulario exterior. También pasó del rojo fijo al color de acento.

### v2.2.0 — Mantenimiento e infraestructura (2026-11-10)
Commits `5cf5853`, `89bc937` (Claude Code) y `2f740a8` (Cowork).

- **Cron keepalive**: el plan gratis de Supabase pausa el proyecto tras
  ~7 días sin actividad (el showroom quedaba vacío sin error y el login
  no andaba). `vercel.json` llama una vez por día (12:00 UTC) a
  `/api/keepalive` (`src/app/api/keepalive/route.ts`), que hace un
  `count` liviano sobre `categorias`. Si se define `CRON_SECRET` en
  Vercel, solo acepta la llamada del cron.
- **Acceso al panel desde el showroom**: ícono de candado al lado del
  selector de tema en el header, que lleva a `/admin`. La ruta sigue
  protegida por el login y `src/proxy.ts`.
- **Limpieza del repo**: se borraron `SECURITY_PATCH.md`,
  `THEME_INDY_CAPS.md` y `THEME_DARK_MODE_INDY_CAPS.md` (instrucciones de
  patches ya aplicados; quedan en el historial de git) y se sacó el email
  del admin de este archivo.
- **Operaciones (sin commit)**:
  - Se restauró el proyecto Supabase, que estaba pausado.
  - A pedido del usuario se vaciaron todas las tablas de la app con
    `truncate ... restart identity`: los IDs volvieron a arrancar en 1.
    El usuario admin se mantuvo.
  - Se borró de Render un servicio viejo del `stock_app` Flask que seguía
    conectado al repo y fallaba en cada push (`requirements.txt` no
    existe).

### v2.1.0 — Seguridad, marca INDY CAPS y modo oscuro (2026-08-13)
Commits `a4f44c1`, `58ca425`, `2c94b99`, `5ca1fd0`.

- **Auditoría de seguridad**: no hay ninguna API key secreta en la app;
  lo único visible al inspeccionar es la anon key de Supabase, pública
  por diseño (la protección es RLS). Se revisaron RLS, Server Actions,
  Storage, secretos en el repo y `npm audit` (0 vulnerabilidades).
  - Se corrigió la subida de fotos: valida el `Content-Type` real contra
    una lista blanca (jpg/png/webp/gif) y 5 MB por foto, en vez de confiar
    en la extensión que manda el cliente.
  - Headers HTTP de seguridad en `next.config.ts` (X-Frame-Options,
    X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
  - La lectura pública de `fotos_producto` y `producto_categoria` pasó a
    exigir que el producto padre sea visible (antes era `USING (true)`).
  - "Leaked Password Protection" no se pudo activar: requiere el plan Pro.
  - Detalle en `docs/SECURITY.md`.
- **Identidad INDY CAPS**: fondo crema, acento rojo `#d6301f`, Bebas Neue +
  Inter, isotipo en los headers, logo completo en el login, favicon nuevo.
- **Modo claro/oscuro**: tokens de color en `globals.css`, botón de
  sol/luna (`ThemeToggle.tsx`) en showroom, admin y login, y script
  inline en `layout.tsx` que aplica el tema antes de pintar.

### v2.0.0 — App nueva en Next.js + Supabase (2026-08-12)
Commit `b7c5ad3`.

- Reemplazo completo del `stock_app` en Flask: showroom público sin
  carrito, con botón de WhatsApp por producto, y panel admin con login
  para productos, categorías, lotes, ventas e inventario.
- Supabase: esquema completo con RLS (lectura pública solo de productos
  visibles con stock, escritura solo autenticado) y bucket `productos`
  para fotos. Detalle en `docs/SCHEMA.md`.
- Deploy en Vercel, importado a mano desde el dashboard.

---

## Decisiones tomadas con el usuario

- Stack: Next.js + Supabase (no Flask).
- Alcance: catálogo público tipo "vidriera" (sin compra online) + panel
  admin interno. Botón de WhatsApp con mensaje prellenado por producto.
- Sin migración de datos del proyecto viejo (arrancó limpio).
- WhatsApp de contacto: 5492604647804. Instagram: `indycaps16`.
  Ubicación: San Rafael, Mendoza.
- Un único usuario admin vía Supabase Auth (sin self-signup). No planea
  agregar más salvo que el negocio crezca. Cualquier usuario logueado
  tiene acceso total (no hay roles).
- Las gorras vendidas siguen visibles con el cartel "Vendida" (v2.4.0).
- El precio que ve el cliente se carga a mano; el margen es solo
  referencia (v2.3.0).

## Infraestructura

- **Supabase** `stockAPP` (id `kkhwuifybqfgavumwmwv`, región `sa-east-1`,
  plan gratis). El plan gratis permite 2 proyectos activos; `mundialProde`
  está pausado para liberar el cupo.
- **Vercel** proyecto `stock-app` (plan Hobby: un cron por día como
  máximo y solo la última hora de logs).
- **GitHub** `Lucas16AR/stock_app` (público).
