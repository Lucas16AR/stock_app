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
  `visible_publico` (bool, default `true`), `fecha_creacion`.
- **`producto_categoria`** — tabla intermedia muchos-a-muchos
  (`producto_id`, `categoria_id`), habilita el embedding implícito de
  PostgREST (`select("*, categorias(*)")` funciona directo).
- **`fotos_producto`** — `id`, `producto_id` (FK, `CASCADE`), `path`
  (ruta dentro del bucket `productos`), `orden`. Máximo 4 fotos por
  producto (validado en la server action, no en la base).
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
