# Auditoría de seguridad

Revisión hecha el 2026-08-13. Resume qué se revisó, qué estaba bien, qué
se corrigió y qué falta hacer manualmente.

## Sobre la preocupación puntual: "la API de Claude expuesta"

Esta app **no usa la API de Claude ni ninguna API de IA**. No hay ninguna
API key de Anthropic/OpenAI en el código, en el repo, ni en el deploy —
se buscó explícitamente (`grep` de `ANTHROPIC`, `OPENAI`, `CLAUDE_API`,
`sk-ant`, etc.) y no aparece nada.

Lo que sí es visible si alguien inspecciona la página (F12 → Network o
código fuente) es la **anon key de Supabase** (`sb_publishable_...`) y la
URL del proyecto. Eso es **intencional y seguro**: es una clave pública
por diseño, pensada para vivir en el navegador del cliente. No permite
leer ni escribir nada por sí sola — todo el acceso a datos está controlado
por las políticas de Row Level Security (RLS) en Postgres, no por el
secreto de esa clave. Es el mismo modelo que usan Firebase, Clerk, Stripe
(clave pública), etc. La clave que sí sería grave exponer es la
`service_role` key, y esa nunca se usó en ningún lado de esta app.

## Qué se revisó

### 1. Row Level Security (Postgres)
Políticas leídas directamente de `pg_policies` en la base en vivo
(2026-08-13). Confirmado:
- **Escritura** (`insert`/`update`/`delete`) en las 6 tablas: solo con
  `auth.role() = 'authenticated'`, es decir, con sesión de Supabase Auth
  válida. Un visitante anónimo no puede crear, editar ni borrar nada aunque
  llame a los endpoints directamente. ✅
- **`productos`**, lectura pública: `visible_publico = true AND cantidad >
  0`. Los productos ocultos o sin stock **no son alcanzables ni adivinando
  el ID** — la restricción es a nivel de base, no de código de la app. ✅
- **`ventas` y `lotes`**: no tienen ninguna política de lectura pública.
  Los datos de ventas y costos de compra son inaccesibles para anónimos. ✅

**Desviación encontrada y CORREGIDA** (2026-08-13): `fotos_producto` y
`producto_categoria` tenían lectura pública **incondicional**
(`USING (true)`), no restringida a los productos visibles. Como el bucket
de Storage es de lectura pública, un anónimo que consultara
`fotos_producto` obtenía los `path` de las fotos de **todos** los
productos — incluidos los ocultos y los sin stock — y podía descargarlas.
No exponía ventas, costos ni credenciales, pero contradecía la intención
del diseño (que un producto oculto sea realmente invisible).

Se reemplazaron ambas políticas por una que exige que el producto padre
sea visible (migración
`restrict_public_read_fotos_and_producto_categoria`):

```sql
create policy public_read_fotos on public.fotos_producto
  for select using (
    exists (
      select 1 from public.productos p
      where p.id = fotos_producto.producto_id
        and p.visible_publico = true
        and p.cantidad > 0
    )
  );
```

Verificado con datos de prueba dentro de una transacción con `rollback`
(tres productos: visible, oculto y sin stock, cada uno con una foto).
Consultando como rol `anon`, solo aparece la foto del producto visible. ✅

`categorias` **se dejó con lectura pública a propósito**: el showroom la
consulta suelta (`src/app/page.tsx`) para armar el filtro de categorías, y
restringirla haría desaparecer categorías del filtro. Los nombres de
categoría no son información sensible.

El panel admin no se ve afectado: las políticas `admin_all_*` cubren `ALL`
para `authenticated`.

### 2. Server Actions llamadas directamente (sin pasar por la UI)
En Next.js, las Server Actions son técnicamente endpoints POST que se
pueden llamar sin usar la pantalla del panel. Verificado que esto **no es
una puerta trasera**: el middleware (`proxy.ts`) protege la navegación a
`/admin/*`, pero la protección real es la de RLS del punto anterior — si
alguien llama a `crearProducto` sin sesión, Supabase rechaza el `insert`
igual. Doble capa de protección, no depende solo del front.

### 3. Storage (fotos de producto)
- Lectura pública del bucket `productos`: sí, es necesario (son las fotos
  del catálogo).
- Escritura/borrado: solo `authenticated`.
- **Corregido**: antes se aceptaba cualquier archivo y se confiaba en la
  extensión del nombre que manda el navegador (se podía subir un `.html`
  o `.svg` con script adentro renombrado a `foto.jpg`). Ahora el servidor
  valida el `Content-Type` real contra una lista blanca (jpg/png/webp/gif)
  y un límite de 5 MB por foto; cualquier otra cosa se descarta.

### 4. Secretos en el repo
Se revisó el código y el listado del repo de GitHub: no hay ningún
archivo `.env` commiteado, ni `service_role` key, ni contraseñas en texto
plano en ningún archivo del proyecto. `.gitignore` excluye `.env*`.

### 5. Dependencias
`npm audit` sobre las dependencias del proyecto: **0 vulnerabilidades**
(críticas, altas, medias o bajas) al momento de la revisión.

### 6. Headers de seguridad HTTP
**Agregado** en `next.config.ts`: `X-Frame-Options: DENY` (evita que la
página se embeba en un iframe ajeno — protege contra clickjacking),
`X-Content-Type-Options: nosniff`, `Referrer-Policy`, y `Permissions-Policy`
deshabilitando cámara/micrófono/ubicación (no se usan).

### 7. Login / fuerza bruta
- El mensaje de error de login es genérico ("Usuario o contraseña
  incorrectos") tanto si el email no existe como si la contraseña está
  mal — no revela qué emails tienen cuenta.
- Supabase Auth tiene rate-limiting propio en el endpoint de login.
- "Leaked Password Protection" (chequeo contra HaveIBeenPwned) está
  **desactivado** — confirmado por el security advisor de Supabase, que lo
  reporta como WARN. **No es un toggle de 1 minuto como se creyó en un
  principio: requiere plan Pro** y el proyecto está en el free tier. No es
  crítico: la capa de autorización real es RLS, no la contraseña por sí
  sola. [Documentación](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

## Resumen de cambios aplicados
En el repo:
- `src/app/admin/(panel)/actions.ts`: validación server-side de tipo y
  tamaño de archivo en la subida de fotos.
- `next.config.ts`: headers de seguridad HTTP.

En la base (Supabase):
- Migración `restrict_public_read_fotos_and_producto_categoria`: la
  lectura pública de `fotos_producto` y `producto_categoria` ahora exige
  que el producto padre sea visible y tenga stock.

## Pendiente para vos
1. Elegir una contraseña de admin robusta si no lo era ya (la que
   pusiste al principio es corta — considerá cambiarla desde el dashboard
   de Supabase → Authentication → Users, editando el usuario). Tené en
   cuenta que el chequeo contra HaveIBeenPwned no está disponible en el
   plan free.
2. Si en algún momento agregás más admins o das acceso a alguien más,
   recordá que cualquier usuario autenticado tiene acceso total (no hay
   roles/permisos diferenciados todavía) — avisame si en el futuro
   necesitás roles separados (ej. un vendedor que solo carga ventas).
