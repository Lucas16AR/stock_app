# Base de datos (Supabase / Postgres)

Proyecto Supabase: **stockAPP** (región `sa-east-1`, org `Lucas16AR's Org`).

## Tablas

- **`categorias`** — `id`, `nombre` (único).
- **`lotes`** — lotes de compra. `id`, `fecha`, `costo_envio`, `nota`.
- **`productos`** — `id`, `nombre`, `descripcion`, `cantidad` (stock),
  `precio_compra`, `costo_envio_unitario`, `costo_extra`, `margen`
  (0 a 5, ej. `0.5` = 50%, **solo de referencia interna, nunca se
  muestra al público**), `precio_venta` (numeric, el precio real que
  ve el cliente — se carga a mano en el panel admin, no se calcula
  solo), `lote_id` (FK a `lotes`, `SET NULL` on delete),
  `ref_interna` (text, nullable — referencia de compra, ej. `AFA 12`;
  **solo admin**, antes vivía como una línea `Ref. interna: …` dentro de
  `descripcion`), `visible_publico` (bool, default `true`),
  `fecha_creacion`.
- **`producto_categoria`** — tabla intermedia muchos-a-muchos
  (`producto_id`, `categoria_id`), habilita el embedding implícito de
  PostgREST (`select("*, categorias(*)")` funciona directo).
- **`fotos_producto`** — `id`, `producto_id` (FK, `CASCADE`), `path`
  (ruta dentro del bucket `productos`), `orden`. Máximo 10 fotos por
  producto (`MAX_FOTOS_POR_PRODUCTO` en `src/lib/fotos.ts`, validado en la
  server action, no en la base).
- **`ventas`** — `id`, `producto_id` (FK, `RESTRICT`), `cantidad`,
  `precio_venta`, `fecha`. Al insertar una venta, la server action
  descuenta `productos.cantidad` en el mismo flujo (no hay trigger).

## Margen vs. precio de venta

`margen` es una referencia interna para el admin: sirve para calcular
un "precio sugerido" (no se guarda en la base, se calcula en
`src/lib/pricing.ts`), pero **nunca se muestra al público**:

```
costo_total = precio_compra + costo_envio_unitario + costo_extra
precio_sugerido = costo_total * (1 + margen)
```

El precio que efectivamente ven los clientes (showroom, detalle de
producto) es `productos.precio_venta`, un campo independiente que el
admin carga a mano al crear/editar el producto. El formulario de
alta/edición muestra el precio sugerido como referencia al lado del
campo de precio de venta, recalculado en vivo mientras se edita el
costo o el margen, pero el admin puede escribir cualquier valor ahí.

## Row Level Security

Todas las tablas tienen RLS habilitado:

- **Lectura pública** (rol `anon`):
  - `productos`: solo donde `visible_publico = true` (desde 2026-11-12 se
    incluyen las vendidas, `cantidad = 0`, para mostrarlas con el cartel
    "Vendida"; para sacar una del showroom se destilda `visible_publico`).
  - `fotos_producto` y `producto_categoria`: solo las filas cuyo producto
    padre cumple esa misma condición (la política hace un `exists` contra
    `productos`). Antes eran `USING (true)`, lo que filtraba las fotos de
    productos ocultos o sin stock — ver `docs/SECURITY.md`.
  - `categorias`: sin restricción, a propósito. El showroom la consulta
    suelta para armar el filtro de categorías y los nombres no son
    sensibles.
- **Sin lectura pública**: `ventas` y `lotes` (datos de venta y costos de
  compra son inaccesibles para anónimos).
- **Todo permitido** para `authenticated` (el panel admin) en las 6
  tablas — no hay un rol "admin" separado, cualquier usuario logueado
  vía Supabase Auth tiene acceso total. Como no hay self-signup, la
  única forma de entrar es con un usuario creado a mano.

## Permisos de tabla del rol `anon` (tarea 001)

RLS decide **qué filas** ve un visitante; los permisos de tabla deciden
**qué columnas** y qué operaciones. Con la migración
`supabase/migrations/20261114000002_001b_permisos_anon.sql`:

- `productos`: solo `SELECT` de `id`, `nombre`, `descripcion`,
  `cantidad`, `precio_venta`, `visible_publico`, `fecha_creacion`. Los
  costos, el margen, `lote_id` y `ref_interna` no son legibles; un
  `select=*` como anon da *permission denied* (42501).
- `fotos_producto`, `producto_categoria`, `categorias`: solo `SELECT`.
- `lotes`, `ventas`: ningún permiso.
- Sin `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE` para anon en ninguna tabla.

Consecuencias para el código:

- El showroom tiene que pedir columnas explícitas: usa `SELECT_CATALOGO` /
  `COLUMNAS_PUBLICAS` (`src/lib/catalogo.ts`) y el tipo `ProductoPublico`.
- **Una columna nueva en `productos` no es legible por anon** hasta
  agregarla al `GRANT` (con una migración nueva), a `COLUMNAS_PUBLICAS` y
  a `ProductoPublico`.
- Las políticas RLS de `fotos_producto` y `producto_categoria` leen
  `productos.id` y `productos.visible_publico` como anon: esas columnas
  tienen que seguir en el `GRANT`.
- Una **tabla nueva** recibe de Supabase todos los permisos para anon por
  defecto: revisarlos en la misma migración que la crea.

## Migraciones

Desde la tarea 001, todo cambio de base va como archivo en
`supabase/migrations/` (`AAAAMMDDhhmmss_descripcion.sql`), con un
comentario que dice **cuándo se aplica respecto del deploy**. Las
anteriores (esquema inicial, RLS de fotos, vendidas, `precio_venta`) se
aplicaron sin archivo y están descritas en este documento y en
`docs/SECURITY.md`.

## Storage

Bucket **`productos`** (público):

- Lectura: cualquiera.
- Insert/update/delete: solo `authenticated`.
- Convención de `path`: `{producto_id}/{uuid}.{ext}`.

## Crear un usuario admin nuevo

No hay pantalla de registro. Para agregar un admin, desde el SQL editor
de Supabase (o pidiéndole a Claude que lo haga vía MCP):

```sql
with new_user as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
    'authenticated', 'authenticated', '<email>',
    crypt('<password>', gen_salt('bf')),
    now(), now(), now(), '{"provider":"email","providers":["email"]}',
    '{}', false, '', '', '', ''
  )
  returning id, email
)
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), new_user.id, new_user.id::text,
  jsonb_build_object('sub', new_user.id::text, 'email', new_user.email),
  'email', now(), now(), now()
from new_user;
```

Requiere la extensión `pgcrypto` (ya habilitada en este proyecto).
