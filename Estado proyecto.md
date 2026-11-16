# Stock Gorras (INDY CAPS) — estado del proyecto

Archivo de traspaso entre sesiones (Claude Code local y Cowork). Arriba
está el estado actual y lo pendiente; abajo, el historial por versión con
el detalle de cada cambio. **Actualizado: 2026-11-16.**

> El repo de GitHub es **público**: no escribas acá emails, contraseñas
> ni datos personales.

---

## Estado actual

- **Producción**: https://stock-app-six-woad.vercel.app — sana, versión
  **v2.8.0** (código en `06c36fc`).
- **Git**: `master` local = `origin/master`, sin ramas de tarea
  abiertas. Único deploy: Vercel (proyecto `stock-app`). Cada push a
  `master` redeploya solo.
- **Base (Supabase `stockAPP`)**: activa. 50 productos, todos visibles y
  con stock. Sin ventas registradas: Capi anuló a propósito las 2 ventas
  del 12/11 (gorras 59 y 60) el 2026-11-16. Todas las migraciones están
  aplicadas: la de vendidas (v2.4.0), las dos de la tarea 001 (v2.5.0) y
  la de funciones de ventas (v2.8.0). El visitante solo lee las columnas
  públicas y no puede escribir nada ni usar las funciones de ventas.
- **Cron keepalive**: funcionando. Primera ejecución automática
  confirmada el 2026-11-11 a las 12:00 UTC en los logs de Supabase
  (`HEAD /rest/v1/categorias?select=id` → 200).

## Pendiente

1. **Usuario — probar las fotos en el panel** (v2.3.0): cargar un producto
   con varias fotos del celular (tiene que aparecer "N fotos listas ·
   X MB" bajo el campo) y borrar una con el ✕ al editar (tiene que
   desaparecer solo esa foto). No se pudo probar sin el login.
2. **Tarea aprobada: 003** (lotes; detalle en `tareas/`). Arranca
   cuando Capi la pide. Puede usar `MiniaturaProducto` (v2.7.0) y
   `formatFecha()` / `hoyAR()` de `src/lib/fechas.ts` (v2.8.0).
3. **Posible tarea (a proponer por Cowork)** — permisos por defecto de
   las tablas nuevas: Supabase le sigue dando todos los permisos a anon
   en cada tabla que se cree. Hasta resolverlo, revisar los permisos en
   la misma migración que crea la tabla (regla en `docs/SCHEMA.md`).
4. **Posible tarea (riesgo bajo)** — las fotos de productos ocultos
   siguen en el bucket público; sus URLs llevan un UUID. Quedó fuera de
   alcance de la 001.
5. **Para la 003** (nota de la revisión de la 002): las fechas de lotes
   (`fechaCorta()`) y el selector de lote del formulario de producto
   todavía usan `toLocaleDateString` sin zona horaria. Hay que pasarlos
   a `formatFecha()`.

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
  `supabase/migrations/` (existe desde la tarea 001), con un comentario
  de cuándo se aplican respecto del deploy. Anotá acá si quedaron
  aplicados o no. En v2.4.0 la
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
versiones 2.1.0 en adelante no tienen tag; cada una lista sus commits.

### v2.8.0 — Ventas: selector con foto, fecha de venta y anular (2026-11-16)
Tarea 005. Commit `06c36fc` (Claude Code), más la migración 005, que
aplicó Cowork antes del deploy con el OK de Capi. Revisada por Cowork y
probada por Capi en la vista previa. Deploy a producción el 2026-11-16.

- **Migración `20261115000001_005_funciones_ventas.sql`** (aplicada por
  Cowork el 2026-11-15 ~22:37 UTC, antes del deploy; es aditiva):
  - Crea las funciones `registrar_venta` y `anular_venta`. Cada una
    valida y toca el stock en una sola transacción, con la fila del
    producto bloqueada. Antes eran tres pedidos sueltos: si fallaba uno
    en el medio, la venta quedaba sin descontar stock o al revés.
  - Son `SECURITY INVOKER` y solo `authenticated` puede ejecutarlas: se
    le saca a `anon` el `EXECUTE` que Supabase da por defecto.
  - Una venta "futura" se mide en días de Argentina.
- **Selector visual**: buscador sin tildes y grilla de gorras con stock,
  con foto, ref. interna, precio y stock (2 columnas en el celular).
  La gorra elegida queda arriba, con "Cambiar", y precarga su precio.
- **Fecha de la venta**: por defecto hoy en hora argentina, sin fechas
  futuras. Si no es hoy, se guarda el mediodía de ese día (-03:00).
- **Anular una venta**: con confirmación ("La gorra vuelve al stock…").
  Borra la venta y devuelve el stock en una sola transacción.
- **Historial**:
  - Miniatura, nombre + ref., fecha en hora argentina, cantidad, precio
    y total.
  - Tarjetas en el celular.
  - Total del mes actual arriba.
- **Por dentro**:
  - `src/lib/fechas.ts`: `formatFecha`, `hoyAR`, etc. Fechas del admin
    en hora argentina: el servidor corre en UTC, así que una venta a las
    23:00 se mostraba con el día siguiente.
  - `src/lib/ventas.ts`: traduce los errores de las funciones ("No hay
    stock suficiente: queda 1").
  - `HistorialVentas` y `VentaForm`, rehechos.
  - `BotonBorrar` acepta `textoConfirmar` / `textoPendiente`.
  - Reglas nuevas en `CLAUDE.md`: las ventas solo pasan por las
    funciones, y las fechas usan `src/lib/fechas.ts`. Las funciones
    quedaron documentadas en `docs/SCHEMA.md`.
- **Verificado**:
  - Migración en PGlite: 29 comprobaciones, incluida la atomicidad
    (si falla el descuento de stock, la venta no queda).
  - Fechas: 11 comprobaciones (el caso de las 23:00).
  - Interfaz en Chrome sin ventana: 35 comprobaciones.
  - En producción (Cowork): permisos, `anon` → 42501, y una prueba de
    punta a punta dentro de un bloque que se deshizo.
  - Prueba de Capi en la vista previa.
  - Después del deploy: el inicio muestra las 50 gorras y `/admin` sin
    sesión lleva al login.
- **Datos**: durante la prueba, Capi anuló también las 2 ventas reales
  (gorras 59 y 60), a propósito: los logs muestran 4 anulaciones
  confirmadas una por una. Las dos gorras volvieron a tener stock 1 y la
  tabla `ventas` quedó vacía.

### v2.7.0 — Productos e inventario con foto, visible con un toque y buscador (2026-11-15)
Tarea 004. Commits `0e9d988` y `c31b418` (Claude Code). Sin cambios de
base ni del showroom público. Revisada por Cowork y probada por Capi en
la vista previa antes del merge. Deploy a producción el 2026-11-15.

- **Foto en los listados**: Productos e Inventario muestran la foto de
  portada de cada gorra (`MiniaturaProducto`; si no tiene foto, un ícono
  de gorra) y, debajo del nombre, la referencia interna. Así se
  distinguen las gorras que se llaman igual. En el celular cada gorra es
  una tarjeta, sin scroll de costado; en la compu, una tabla. Tocar la
  foto o el nombre abre la edición. En Inventario abre la fila entera.
- **Visible con un toque**: un interruptor en el listado publica u
  oculta la gorra sin entrar a editarla. Cambia al instante; si falla,
  vuelve a su lugar con el aviso de error. Avisa "Publicada en la
  tienda" / "Oculta de la tienda", con sonido. El mismo interruptor
  reemplaza al checkbox del formulario.
- **Sin precio no se publica**: una gorra con precio de venta 0 no se
  puede publicar. Lo frenan el interruptor, la acción `cambiarVisible`
  (la condición va en el mismo UPDATE) y el formulario al guardar.
- **Buscador y filtros** en Productos:
  - Busca por nombre, categoría o ref. interna, sin importar tildes.
  - Filtros rápidos con contador: Todas, Publicadas, Ocultas, Sin
    precio, Vendidas y Sin lote.
  - Contador "Mostrando N de M".
  - Inventario tiene el mismo buscador.
- **Inventario**: las vendidas se ven atenuadas, con la etiqueta
  "Vendida". Se sacó el rojo de "stock bajo" por decisión de Capi: casi
  todas son piezas únicas, así que el stock 1 es lo normal y marcaba
  casi todo.
- **Por dentro**: cada listado se divide en dos. La página (server) hace
  el select y arma filas planas; la lista (client) busca, filtra y
  dibuja. Hay una sola fila para el celular y la compu (`md:contents`).
  Componentes nuevos: `MiniaturaProducto`, `Interruptor`,
  `SwitchVisible`, `CampoVisible`, `Buscador`, `FiltrosRapidos`,
  `ListaProductos` y `ListaInventario`. También se sumaron
  `src/lib/busqueda.ts` y `primeraFoto()`. Todo quedó documentado en
  `CLAUDE.md`.
- **Verificado**:
  - 42 comprobaciones en Chrome sin ventana, a 390 px y 1280 px, en
    claro y oscuro: fotos, tarjetas, búsquedas, filtros, la guarda de
    precio sin pedido al servidor, el switch optimista que vuelve a su
    lugar si la base rechaza, y el formulario.
  - Prueba de Capi en la vista previa.
  - Después del deploy: el inicio muestra las 50 gorras, `/admin` sin
    sesión lleva al login y la base quedó con las 50 visibles.

### v2.6.0 — Panel que responde: botones, confirmaciones y avisos con sonido (2026-11-14)
Tarea 002. Commit `3a06fd3` (Claude Code). Sin cambios de base ni del
showroom público. Revisada por Cowork y probada por Capi en la vista
previa antes del merge. Deploy a producción el 2026-11-14.

- **Botones con reacción**: los botones de guardar y registrar muestran
  un spinner y un texto de progreso ("Guardando…", "Registrando…",
  "Ingresando…"), y quedan deshabilitados mientras la acción corre. Si se
  toca dos veces, la acción corre una sola vez. Todos los botones se
  achican al tocarlos. Al tocar el menú aparece al instante un esqueleto
  de carga, y la sección activa queda resaltada.
- **Confirmación antes de borrar**: lotes, productos, categorías y fotos
  piden confirmación en un diálogo que dice qué se borra y qué pasa
  después (por ejemplo, "Tiene 12 gorras: van a quedar sin lote"). El
  foco arranca en Cancelar, y Escape o un toque afuera cierran el diálogo
  sin borrar. Si una gorra tiene ventas, no ofrece borrarla: lo explica y
  sugiere ocultarla. "Eliminar" pasó a un ícono de tacho, separado de
  "Editar".
- **Avisos con sonido**: cada acción muestra un aviso (verde si salió
  bien, rojo con el motivo si no). Aparecen abajo, para no tapar el
  menú en el celular. El sonido se arma con Web Audio, sin archivos ni
  librerías: dos notas para éxito, un tono que baja para borrado y dos
  pulsos graves para error. El parlante del header lo silencia, y la
  opción se recuerda.
- **Ver la tienda desde el admin**: "Ver tienda" en el header y "Ver en la
  tienda" al editar una gorra (deshabilitado si está oculta). Los dos
  abren en otra pestaña.
- **Por dentro**:
  - Toda Server Action devuelve `Resultado` (`src/lib/acciones.ts`). No
    se usa `redirect()` y nunca se ignora el error de Supabase. Los
    errores de Postgres se traducen a castellano.
  - Borrar o editar algo que ya no existe se avisa, en vez de decir
    "borrado".
  - Borrar una gorra borra primero la fila y después las fotos. Antes era
    al revés: si la fila no se podía borrar, las fotos ya se habían
    perdido.
  - Las fotos que fallan al subir se informan en el aviso y no dejan
    archivos huérfanos.
  - Si una venta se registra pero falla el descuento de stock, se avisa
    como error.
  - Un formulario con error conserva lo escrito.
- **Componentes nuevos** en `src/components/admin/`: `FormAccion`,
  `BotonEnviar`, `BotonBorrar`, `Avisos`, `avisar.ts`, `BotonSonido`,
  `NavAdmin` y `estilos.ts`. Las reglas para usarlos están en `CLAUDE.md`.
  Hay un token nuevo, `--exito`.
- **Verificado**: 27 comprobaciones en Chrome sin ventana, a 390 px y en
  escritorio: doble toque, spinner, avisos y sonidos, diálogo, bloqueo por
  ventas, silenciar, navegación y sin scroll horizontal. Después del
  deploy: el inicio muestra las 50 gorras, `/admin` sin sesión lleva al
  login y en la base no quedaron restos de la prueba.

### v2.5.0 — Columnas internas cerradas a la API pública (2026-11-14)
Tarea 001 (prioridad 1, seguridad). Commits `250e985` (Cowork: roles y
flujo de tareas) y `c7e57f3` (Claude Code), más dos migraciones
aplicadas en producción.

- **El problema**: RLS limitaba qué filas lee un visitante, pero no qué
  columnas. Con la anon key, que es pública, se podían leer por la API el
  `precio_compra`, el `margen`, los costos de envío y extra, el `lote_id`
  y la "Ref. interna" de cada gorra publicada. Además anon tenía todos los
  permisos de tabla por defecto de Supabase (RLS frenaba las escrituras,
  pero los permisos existían).
- **Migración `20261114000001_001a_ref_interna.sql`** (aplicada por Cowork
  el 2026-11-14 ~02:20, antes del deploy): columna nueva
  `productos.ref_interna`, solo para el admin, y traslado de las
  referencias que estaban como línea `Ref. interna: …` en `descripcion`.
  Resultado: los 50 productos con `ref_interna` cargada y la descripción
  vacía (era lo único que tenían).
- **Código** (deploy de `c7e57f3` el 2026-11-14 05:32 UTC):
  - El showroom pide columnas explícitas (`SELECT_CATALOGO` y
    `COLUMNAS_PUBLICAS` en `src/lib/catalogo.ts`) y usa el tipo
    `ProductoPublico`. El compilador frena cualquier uso de costos,
    margen, lote o referencia en una página pública.
  - Admin: campo "Referencia interna — no se muestra en la página" en el
    formulario de producto, guardado en crear y editar. Capi lo probó en
    la vista previa.
- **Migración `20261114000002_001b_permisos_anon.sql`** (aplicada por
  Cowork el 2026-11-14 ~05:35, después del deploy): anon queda solo con
  `SELECT` de las 7 columnas públicas de `productos`, `SELECT` de
  `fotos_producto`, `producto_categoria` y `categorias`, y ningún permiso
  en `lotes` y `ventas`. El archivo incluye el SQL para volver atrás.
- **Verificado en producción**: `select=*` y cada columna interna → 42501;
  las columnas públicas → 50 filas; ninguna descripción conserva la
  referencia; `lotes` y `ventas` → 42501; PATCH, POST y DELETE sin login →
  42501; el inicio muestra 48 disponibles + 2 vendidas; el detalle y el
  Open Graph andan; `/api/keepalive` → `{"ok":true}`.
- **Reglas nuevas** (en `CLAUDE.md` y `docs/SCHEMA.md`):
  - El showroom nunca usa `select("*")` sobre `productos`.
  - Una columna nueva que tenga que verse en la página necesita una
    migración con su `GRANT`, y sumarla a `COLUMNAS_PUBLICAS` y a
    `ProductoPublico`.
  - Las migraciones van como archivo en `supabase/migrations/`.
- **Proceso**: primera tarea con el flujo nuevo (tarea escrita por
  Cowork, aprobada por Capi, hecha por Claude Code en su rama, revisada
  por Cowork y pasada a producción en 4 pasos con OK de Capi).

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
    existe). El 2026-11-14 Capi confirmó que en Render no queda nada del
    proyecto viejo (ni el servicio ni una base).

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
