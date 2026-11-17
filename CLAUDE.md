@AGENTS.md

# Stock Gorras — guía para trabajar en este repo

Ver también `README.md` (setup) y `docs/SCHEMA.md` (base de datos).

## Qué es esto

Reemplazo del viejo `stock_app` (Flask). App de stock/venta de gorras:
showroom público sin carrito (con botón de WhatsApp por producto) + panel
admin protegido con login para cargar stock, lotes de compra y ventas.

## Stack y estructura

- Next.js 16 (App Router, TypeScript), Tailwind v4, Supabase (Postgres +
  Auth + Storage).
- `src/app/page.tsx` y `src/app/producto/[id]/page.tsx`: showroom público.
  Solo muestran productos con `visible_publico = true` (impuesto también
  por RLS, no solo por el query); los de `cantidad = 0` se muestran al
  final del catálogo con el cartel "Vendida".
- `src/app/admin/login/`: login (fuera del route group protegido).
- `src/app/admin/(panel)/`: todo lo protegido (dashboard, productos, lotes,
  ventas, categorías, inventario) comparte `layout.tsx` con la nav. Las
  server actions de mutaciones viven en `src/app/admin/(panel)/actions.ts`.
- `src/proxy.ts` (antes `middleware.ts` — Next 16 renombró la convención):
  redirige a `/admin/login` si no hay sesión en rutas `/admin/*`.
- `src/lib/config.ts`: URL y anon key de Supabase + número de WhatsApp.
  Son valores públicos (protegidos por RLS, no por secreto), están
  hardcodeados como fallback y se pueden pisar con env vars si hace falta
  rotarlos.

## Supabase

- Proyecto: `stockAPP` (ver `docs/SCHEMA.md` para las tablas y políticas
  RLS completas).
- Bucket de Storage `productos` (público para lectura, solo `authenticated`
  puede escribir/borrar).
- Usuario admin creado directamente en `auth.users` vía SQL (no hay
  self-signup). Para crear otro admin, insertar en Supabase Auth desde el
  dashboard o pedir que se genere otro usuario por SQL.

## Convenciones

- Todo el texto de la UI está en español (es el público del showroom).
- Los nombres de tablas/columnas en la base están en español
  (`productos`, `cantidad`, `precio_compra`, etc.) — mantené esa
  convención si agregás columnas.
- Las mutaciones son Server Actions (`"use server"`), no hay API routes
  para CRUD.
- **Toda Server Action del admin devuelve `Resultado`**
  (`src/lib/acciones.ts`: `exito(mensaje, redirigirA?)` o
  `fallo(error)`), nunca ignora el `error` de Supabase y no usa
  `redirect()`: si hay que ir a otra página, devuelve `redirigirA` y
  navega el cliente después de mostrar el aviso. `mensajeError()` traduce
  los errores de Postgres a castellano. En un archivo `"use server"` solo
  se exportan acciones (todo lo exportado queda invocable desde el
  navegador); los helpers van en `src/lib/`.
- Componentes del admin para esas acciones (`src/components/admin/`):
  - `FormAccion` — el `<form>`: llama a la acción, muestra el aviso con
    sonido y navega si hace falta. No vacía el formulario si hubo error.
  - `BotonEnviar` — botón de envío con spinner, deshabilitado mientras
    corre (`textoPendiente`: "Guardando…", "Registrando…").
  - `BotonBorrar` — **toda acción destructiva** pasa por acá: diálogo de
    confirmación con `titulo`, `detalle` (consecuencias) o `bloqueo`
    (cuando no se puede borrar y qué hacer en su lugar). Para acciones
    que no son "borrar" se cambia el texto del botón con
    `textoConfirmar` / `textoPendiente` (ej. "Anular venta" / "Anulando…")
    y el ícono con `children`; con `tipoAviso="exito"` suena como un
    "listo" en vez de un borrado (ej. repartir el envío de un lote).
  - `NoExiste` — aviso dentro del panel cuando algo ya no existe. Lo usan
    los `not-found.tsx` del panel (lote, gorra y uno general), así un
    `notFound()` no muestra el 404 genérico de Next.
  - `avisar.exito / borrado / error` (`avisar.ts`) para avisos sueltos;
    `<Avisos />` va una sola vez en el layout del panel.
  - Clases de botón en `estilos.ts` (`btnPrimario`, `btnSecundario`,
    `btnBorrarIcono`, `btnIcono`), todas con `active:scale-95`.
  - `BotonBorrar` acepta `tituloBloqueo` cuando la acción no es borrar
    (ej. "No se puede anular esta compra").
  - `MiniaturaProducto` — foto cuadrada de la gorra en los listados (o
    ícono de gorra si no tiene). La portada sale de `primeraFoto()`
    (`src/lib/fotos.ts`).
  - `Interruptor` — el switch. `SwitchVisible` lo usa en el listado
    (optimista, llama a `cambiarVisible`) y `CampoVisible` en el
    formulario de producto. Una gorra con precio de venta 0 no se publica
    (`MENSAJE_SIN_PRECIO`).
  - `Buscador` + `FiltrosRapidos` — búsqueda sin tildes
    (`textoBuscable` / `coincide` de `src/lib/busqueda.ts`) y chips con
    contador.
- **Ventas**: nunca se insertan ni borran directo en la tabla. Se usan
  las funciones `registrar_venta` / `anular_venta` con `supabase.rpc`,
  que tocan el stock en la misma transacción (ver `docs/SCHEMA.md`). Sus
  errores se traducen con `mensajeErrorVenta()` (`src/lib/ventas.ts`).
- **Fechas del admin en hora argentina**: el servidor corre en UTC. Usá
  `formatFecha()` / `hoyAR()` de `src/lib/fechas.ts`, nunca
  `toLocaleDateString` sin `timeZone`. Un día elegido en un formulario
  (venta, lote) se guarda con `fechaParaGuardar()`: si es hoy, `now()`;
  si no, el mediodía de ese día en Argentina.
- **Compras (tarea 006)**: cada ingreso de unidades de una gorra es una
  fila de `compras` (lote, unidades, precio, envío y extra por unidad,
  ref.). Nunca se escribe directo en `compras`, ni en `cantidad`,
  `precio_compra`, `costo_envio_unitario`, `costo_extra` o `lote_id` de
  `productos`: se usan `registrar_compra` / `actualizar_compra` /
  `anular_compra` / `eliminar_lote` / `repartir_envio_lote` con
  `supabase.rpc`, que mantienen el stock, el **costo promedio
  ponderado** de la gorra y el **envío repartido por unidad** del lote
  (ver `docs/SCHEMA.md`). Sus errores se traducen con
  `mensajeErrorCompra()` y los campos de un formulario de compra
  (`compra_*`) se leen con `leerCompra()` (`src/lib/compras.ts`).
  - Una recompra se carga como compra nueva de la misma gorra (desde el
    lote con "Cargar gorras" → "Ya la tengo", o desde la gorra con
    "+ Sumar compra"), **no** como gorra repetida: la tienda tiene que
    mostrar una sola tarjeta. Al crear una gorra, `NombreConAviso`
    muestra las parecidas (`parecidas()` de `src/lib/busqueda.ts`).
  - Componentes: `CamposCompra` (los campos, con el envío estimado si
    hay lote), `ListaCompras` (corregir / anular), `CargarGorras`,
    `SumarCompra`, `PrimeraCompra` (gorra nueva) y `ChipCompras`.
  - La ganancia usa `ventas.costo_unitario` (el costo al venderse).
- **Lotes**: un lote se cuenta por sus compras: "50 gorras · 49
  modelos" (`resumenCompras()`). El envío se reparte solo al cargar,
  corregir o anular una compra y al guardar el lote (`actualizarLote`
  llama a `repartir_envio_lote`); no hay botón de repartir.
  `envioPorGorra()` (`src/lib/lotes.ts`) hace la misma cuenta que la
  base, solo para mostrarla.
- Los listados con interacción se separan en dos: la página (server
  component) hace el select y arma filas planas; la lista (client
  component, ej. `ListaProductos`) busca, filtra y dibuja. En el celular
  las filas son tarjetas; en la compu, una grilla tipo tabla (los
  bloques con `md:contents` se convierten en celdas).
- El showroom **nunca** usa `select("*")` sobre `productos`: el rol anon
  solo puede leer ciertas columnas (ver "Permisos de tabla del rol anon"
  en `docs/SCHEMA.md`). Usá `SELECT_CATALOGO` de `src/lib/catalogo.ts` y
  el tipo `ProductoPublico`. Una columna nueva que tenga que verse en la
  página necesita también una migración con su `GRANT`.
- Los cambios de base van como archivo en `supabase/migrations/`, con un
  comentario de cuándo se aplican respecto del deploy.
- `revalidatePath` se llama después de cada mutación relevante (incluyendo
  siempre `"/"` cuando afecta al showroom público).

## Marca y temas (INDY CAPS)

- La identidad visual es **INDY CAPS**: acento rojo `#d6301f`, tipografía
  display Bebas Neue + Inter. Los logos están en `public/brand/`
  (`mark.png` isotipo para los headers, `logo.png` completo para el login).
- El sitio tiene **modo claro y oscuro**. Los colores viven como tokens en
  `src/app/globals.css` (`--background`, `--foreground`, `--card`,
  `--border`, `--input-border`, `--muted`, `--hover`, `--accent`,
  `--exito` — verde de los avisos de "listo" del admin), con los
  valores del modo oscuro bajo `.dark`. Además hay tokens de marca que
  **no** cambian con el tema: `ink` (superficie siempre oscura: banner,
  badges sobre fotos), `paper` (crema sobre `ink`), `mark-bg` (fondo
  exacto de `mark.png`) y `whatsapp` (verde de los botones). El variant se declara con
  `@custom-variant dark (&:where(.dark, .dark *))`.
- **No uses colores fijos en los componentes** (ni `bg-neutral-900` ni
  `bg-[#f5f2ec]`): usá las clases de token (`bg-background`,
  `text-foreground`, `bg-card`, `border-border`, `text-muted`, etc.), así
  un solo cambio de clase en `<html>` repinta todo el sitio.
- `src/components/ThemeToggle.tsx` alterna la clase `dark` en `<html>` y
  guarda la preferencia en `localStorage`. Está en el header del showroom,
  el del panel admin y el login.
- `src/app/layout.tsx` tiene un script inline que aplica el tema guardado
  (o el del sistema vía `prefers-color-scheme`) **antes** de pintar, para
  evitar el flash de tema equivocado. Si tocás el layout, no lo saques.

## Estado del deploy

En producción en Vercel: **https://stock-app-six-woad.vercel.app**
El proyecto se importó manualmente desde el dashboard de Vercel (el
conector automático no tenía permisos para crear proyectos). Cada push a
`master` redeploya solo.

Supabase está en el plan gratis, que pausa el proyecto tras ~7 días sin
actividad (el showroom queda vacío sin error y el login no anda). Para
evitarlo, `vercel.json` define un cron diario que llama a
`/api/keepalive` (`src/app/api/keepalive/route.ts`), que hace una consulta
liviana a la base. Si se define `CRON_SECRET` en Vercel, el endpoint solo
acepta la llamada del cron.
