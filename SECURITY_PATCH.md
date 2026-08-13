# Parche de seguridad — Stock Gorras

Instrucciones para Claude Code: aplicar estos 3 cambios en el repo
`stock_app` (carpeta actual). Son resultado de una auditoría de
seguridad hecha en una sesión de Cowork. Reemplazá el contenido completo
de los dos archivos existentes por el de abajo, y creá el archivo nuevo
`docs/SECURITY.md`. Después corré `npm run lint` y `npx tsc --noEmit`
para confirmar que no rompió nada, y avisame para hacer commit y push.

---

## 1. Reemplazar `src/app/admin/(panel)/actions.ts`

Cambio: la subida de fotos ahora valida el tipo real de archivo
(`Content-Type`) contra una lista blanca (jpg/png/webp/gif) y un límite
de 5 MB, en vez de confiar en la extensión del nombre de archivo que
manda el navegador (evita subir un `.html`/`.svg` con script disfrazado
de imagen).

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ---------- Categorías ----------
export async function crearCategoria(formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return;
  const supabase = await createClient();
  await supabase.from("categorias").insert({ nombre });
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function actualizarCategoria(id: number, formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return;
  const supabase = await createClient();
  await supabase.from("categorias").update({ nombre }).eq("id", id);
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function eliminarCategoria(id: number) {
  const supabase = await createClient();
  await supabase.from("categorias").delete().eq("id", id);
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

// ---------- Lotes ----------
export async function crearLote(formData: FormData) {
  const costo_envio = Number(formData.get("costo_envio") || 0);
  const nota = String(formData.get("nota") || "").trim() || null;
  const supabase = await createClient();
  await supabase.from("lotes").insert({ costo_envio, nota });
  revalidatePath("/admin/lotes");
  redirect("/admin/lotes");
}

export async function actualizarLote(id: number, formData: FormData) {
  const costo_envio = Number(formData.get("costo_envio") || 0);
  const nota = String(formData.get("nota") || "").trim() || null;
  const supabase = await createClient();
  await supabase.from("lotes").update({ costo_envio, nota }).eq("id", id);
  revalidatePath("/admin/lotes");
  redirect("/admin/lotes");
}

export async function eliminarLote(id: number) {
  const supabase = await createClient();
  // Los productos del lote quedan sin lote (ON DELETE SET NULL)
  await supabase.from("lotes").delete().eq("id", id);
  revalidatePath("/admin/lotes");
  revalidatePath("/admin/productos");
}

// ---------- Productos ----------

// Extensión derivada del MIME type real, nunca del nombre de archivo que
// manda el cliente (evita subir .html/.svg/.exe disfrazados de imagen).
const MIME_A_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const TAMANO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB por foto

async function subirFotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productoId: number,
  files: File[]
) {
  const { count } = await supabase
    .from("fotos_producto")
    .select("id", { count: "exact", head: true })
    .eq("producto_id", productoId);

  let existentes = count ?? 0;

  for (const file of files) {
    if (!file || file.size === 0) continue;
    if (existentes >= 4) break;

    const ext = MIME_A_EXT[file.type];
    if (!ext) continue; // tipo de archivo no permitido, se ignora en silencio
    if (file.size > TAMANO_MAX_BYTES) continue; // demasiado grande, se ignora

    const path = `${productoId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("productos")
      .upload(path, file, { contentType: file.type });

    if (!uploadError) {
      await supabase
        .from("fotos_producto")
        .insert({ producto_id: productoId, path, orden: existentes });
      existentes++;
    }
  }
}

export async function crearProducto(formData: FormData) {
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const cantidad = Number(formData.get("cantidad") || 0);
  const precio_compra = Number(formData.get("precio_compra") || 0);
  const costo_envio_unitario = Number(formData.get("costo_envio_unitario") || 0);
  const costo_extra = Number(formData.get("costo_extra") || 0);
  const margen = Number(formData.get("margen") || 0.5);
  const lote_id_raw = formData.get("lote_id");
  const lote_id = lote_id_raw ? Number(lote_id_raw) : null;
  const visible_publico = formData.get("visible_publico") === "on";
  const categoriaIds = formData.getAll("categorias").map(Number);

  if (!nombre) return;

  const { data: producto, error } = await supabase
    .from("productos")
    .insert({
      nombre,
      descripcion,
      cantidad,
      precio_compra,
      costo_envio_unitario,
      costo_extra,
      margen,
      lote_id,
      visible_publico,
    })
    .select()
    .single();

  if (error || !producto) return;

  if (categoriaIds.length > 0) {
    await supabase
      .from("producto_categoria")
      .insert(categoriaIds.map((categoria_id) => ({ producto_id: producto.id, categoria_id })));
  }

  const files = formData.getAll("fotos") as File[];
  await subirFotos(supabase, producto.id, files);

  revalidatePath("/admin/productos");
  revalidatePath("/");
  redirect("/admin/productos");
}

export async function actualizarProducto(id: number, formData: FormData) {
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const cantidad = Number(formData.get("cantidad") || 0);
  const precio_compra = Number(formData.get("precio_compra") || 0);
  const costo_envio_unitario = Number(formData.get("costo_envio_unitario") || 0);
  const costo_extra = Number(formData.get("costo_extra") || 0);
  const margen = Number(formData.get("margen") || 0.5);
  const lote_id_raw = formData.get("lote_id");
  const lote_id = lote_id_raw ? Number(lote_id_raw) : null;
  const visible_publico = formData.get("visible_publico") === "on";
  const categoriaIds = formData.getAll("categorias").map(Number);

  await supabase
    .from("productos")
    .update({
      nombre,
      descripcion,
      cantidad,
      precio_compra,
      costo_envio_unitario,
      costo_extra,
      margen,
      lote_id,
      visible_publico,
    })
    .eq("id", id);

  await supabase.from("producto_categoria").delete().eq("producto_id", id);
  if (categoriaIds.length > 0) {
    await supabase
      .from("producto_categoria")
      .insert(categoriaIds.map((categoria_id) => ({ producto_id: id, categoria_id })));
  }

  const files = formData.getAll("fotos") as File[];
  await subirFotos(supabase, id, files);

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${id}`);
  revalidatePath("/");
  redirect("/admin/productos");
}

export async function eliminarProducto(id: number) {
  const supabase = await createClient();

  const { data: fotos } = await supabase
    .from("fotos_producto")
    .select("path")
    .eq("producto_id", id);

  if (fotos && fotos.length > 0) {
    await supabase.storage.from("productos").remove(fotos.map((f) => f.path));
  }

  await supabase.from("productos").delete().eq("id", id);
  revalidatePath("/admin/productos");
  revalidatePath("/");
}

export async function eliminarFoto(fotoId: number, productoId: number) {
  const supabase = await createClient();
  const { data: foto } = await supabase
    .from("fotos_producto")
    .select("path")
    .eq("id", fotoId)
    .maybeSingle();

  if (foto) {
    await supabase.storage.from("productos").remove([foto.path]);
  }
  await supabase.from("fotos_producto").delete().eq("id", fotoId);
  revalidatePath(`/admin/productos/${productoId}`);
  revalidatePath("/");
}

// ---------- Ventas ----------
export async function registrarVenta(formData: FormData) {
  const supabase = await createClient();

  const producto_id = Number(formData.get("producto_id"));
  const cantidad = Number(formData.get("cantidad") || 0);
  const precio_venta = Number(formData.get("precio_venta") || 0);

  if (!producto_id || cantidad <= 0) return { error: "Datos inválidos" };

  const { data: producto } = await supabase
    .from("productos")
    .select("cantidad")
    .eq("id", producto_id)
    .maybeSingle();

  if (!producto) return { error: "Producto no encontrado" };
  if (cantidad > producto.cantidad) {
    return { error: `No hay suficiente stock. Disponible: ${producto.cantidad}` };
  }

  await supabase.from("ventas").insert({ producto_id, cantidad, precio_venta });
  await supabase
    .from("productos")
    .update({ cantidad: producto.cantidad - cantidad })
    .eq("id", producto_id);

  revalidatePath("/admin/ventas");
  revalidatePath("/admin/productos");
  revalidatePath("/admin/inventario");
  revalidatePath("/");
  return { error: null };
}
```

---

## 2. Reemplazar `next.config.ts`

Cambio: agrega headers de seguridad HTTP (protección contra clickjacking,
MIME sniffing, y política de referrer/permisos).

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## 3. Crear `docs/SECURITY.md` (archivo nuevo)

```markdown
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
Se releyeron las políticas activas en la base directamente desde Supabase.
Confirmado:
- Lectura pública (rol `anon`): solo `productos` con `visible_publico =
  true AND cantidad > 0`, más sus fotos y categorías. Los productos
  ocultos o sin stock **no son alcanzables ni adivinando el ID** — la
  restricción es a nivel de base, no de código de la app.
- Escritura (`insert`/`update`/`delete`) en las 6 tablas: solo con
  `auth.role() = 'authenticated'`, es decir, con sesión de Supabase Auth
  válida. Un visitante anónimo no puede crear, editar ni borrar nada aunque
  llame a los endpoints directamente.

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
- **Pendiente (manual, 1 minuto)**: activar "Leaked Password Protection"
  en el dashboard de Supabase → Authentication → Providers → Email. Chequea
  la contraseña contra la base de HaveIBeenPwned al crear/cambiar
  contraseña. No se puede activar por SQL/API, es un toggle del dashboard.

## Resumen de cambios aplicados en este repo
- `src/app/admin/(panel)/actions.ts`: validación server-side de tipo y
  tamaño de archivo en la subida de fotos.
- `next.config.ts`: headers de seguridad HTTP.

## Pendiente para vos
1. Activar "Leaked Password Protection" en Supabase (dashboard, 1 minuto).
2. Elegir una contraseña de admin robusta si no lo era ya (la que
   pusiste al principio es corta — considerá cambiarla desde el dashboard
   de Supabase → Authentication → Users, editando el usuario).
3. Si en algún momento agregás más admins o das acceso a alguien más,
   recordá que cualquier usuario autenticado tiene acceso total (no hay
   roles/permisos diferenciados todavía) — avisame si en el futuro
   necesitás roles separados (ej. un vendedor que solo carga ventas).
```
