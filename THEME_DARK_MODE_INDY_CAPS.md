# Modo claro/oscuro para INDY CAPS — aplicar en tu carpeta `stock_app`

Instrucciones para Claude Code: este archivo tiene el contenido COMPLETO y
final de cada archivo de texto que cambió para agregar un selector de modo
claro/oscuro (antes el sitio tenía un solo tema, el claro que ya te había
mandado). Este patch va DESPUÉS del que ya aplicaste
(`THEME_INDY_CAPS.md`) — pisa esos mismos archivos y agrega uno nuevo.

## Qué hacer

1. Por cada bloque `### archivo: <ruta>` de abajo, sobrescribí ese archivo
   en tu carpeta `stock_app` con el contenido completo que sigue (reemplazo
   total). El archivo `src/components/ThemeToggle.tsx` es nuevo, hay que
   crearlo.
2. No hay archivos binarios nuevos en este patch — los logos e íconos que
   ya guardaste en el patch anterior siguen siendo los mismos.
3. Corré `npx next typegen && npx tsc --noEmit && npx eslint .` para
   confirmar que no queda nada roto (en mi entorno de pruebas quedó todo
   limpio, 0 errores, 0 warnings).
4. Commit y push — Vercel redeploya solo.

## Cómo funciona

- Se agregó un sistema de "tokens" de color en `globals.css`
  (`--background`, `--foreground`, `--card`, `--border`, `--input-border`,
  `--muted`, `--hover`) que cambian de valor según si el elemento `<html>`
  tiene la clase `dark` o no. Todos los componentes ahora usan esos tokens
  (`bg-background`, `text-foreground`, `bg-card`, etc.) en vez de colores
  fijos, así un solo cambio de clase en `<html>` repinta todo el sitio.
- `src/components/ThemeToggle.tsx`: botón con ícono de sol/luna que
  alterna la clase `dark` en `<html>` y guarda la preferencia en
  `localStorage`. Se agregó al header del showroom público, al header del
  panel admin y a la pantalla de login.
- `src/app/layout.tsx`: tiene un script chiquito que corre ANTES de pintar
  la página (antes de que React hidrate) para aplicar el tema guardado en
  `localStorage`, o si nunca se eligió ninguno, el que prefiera el sistema
  operativo del visitante (`prefers-color-scheme`). Esto evita el
  "parpadeo" de cargar en un tema y saltar al otro medio segundo después.
- El rojo de acento (`#d6301f`) y el botón verde de WhatsApp quedan
  iguales en ambos modos (ya tenían buen contraste).

---

### archivo: `src/app/globals.css`
```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: #f5f2ec;
  --foreground: #171412;
  --card: #ffffff;
  --border: #e5e5e5;
  --input-border: #d4d4d4;
  --muted: #6b6b6b;
  --hover: #f5f5f5;
  --accent: #d6301f;
}

.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --card: #171717;
  --border: #262626;
  --input-border: #404040;
  --muted: #a3a3a3;
  --hover: #262626;
  --accent: #d6301f;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-border: var(--border);
  --color-input-border: var(--input-border);
  --color-muted: var(--muted);
  --color-hover: var(--hover);
  --color-accent: var(--accent);
  --font-sans: var(--font-inter);
  --font-display: var(--font-display);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-inter), Arial, Helvetica, sans-serif;
}

.font-display {
  font-family: var(--font-display), sans-serif;
  letter-spacing: 0.03em;
}
```

### archivo: `src/app/layout.tsx`
```tsx
import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const display = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Indy Caps",
  description: "Catálogo de gorras disponibles — Indy Caps",
};

// Corre antes de pintar la página para evitar el flash del tema
// equivocado (ej: cargar en claro y "saltar" a oscuro un instante
// después). No usa hooks de React a propósito: tiene que ejecutarse
// sincrónicamente antes de la hidratación.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
```

### archivo: `src/components/ThemeToggle.tsx`
```tsx
"use client";

function toggle() {
  const next = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", next);
  localStorage.setItem("theme", next ? "dark" : "light");
}

export default function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar entre modo claro y oscuro"
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-hover hover:text-foreground"
    >
      {/* Sol: se muestra en modo claro (indica "pasar a oscuro") */}
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current dark:hidden">
        <path d="M20.354 15.354A9 9 0 0 1 8.646 3.646a9.003 9.003 0 1 0 11.708 11.708Z" />
      </svg>
      {/* Luna: se muestra en modo oscuro (indica "pasar a claro") */}
      <svg viewBox="0 0 24 24" className="hidden h-5 w-5 fill-current dark:block">
        <path d="M12 4.5a1 1 0 0 1 1 1V7a1 1 0 1 1-2 0V5.5a1 1 0 0 1 1-1Zm0 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0 2.5a1 1 0 0 1 1 1V20a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Zm7.5-6.5a1 1 0 0 1 1-1H21a1 1 0 1 1 0 2h-.5a1 1 0 0 1-1-1ZM3 12a1 1 0 0 1 1-1h.5a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm14.657-6.657a1 1 0 0 1 1.414 0l.354.354a1 1 0 0 1-1.415 1.414l-.353-.353a1 1 0 0 1 0-1.415Zm-11.314 11.314a1 1 0 0 1 1.414 0l.354.354a1 1 0 1 1-1.414 1.414l-.354-.353a1 1 0 0 1 0-1.415Zm11.314 1.768-.353-.354a1 1 0 1 1 1.414-1.414l.354.353a1 1 0 0 1-1.415 1.415ZM5.343 6.11l-.354-.353a1 1 0 1 1 1.415-1.415l.353.354a1 1 0 1 1-1.414 1.414Z" />
      </svg>
    </button>
  );
}
```

### archivo: `src/components/SiteHeader.tsx`
```tsx
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/mark.png"
            alt="Indy Caps"
            width={48}
            height={29}
            className="h-9 w-auto"
            priority
          />
          <span className="font-display text-2xl tracking-wide text-foreground">
            INDY CAPS
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
```

### archivo: `src/components/CategoryFilter.tsx`
```tsx
import Link from "next/link";
import { Categoria } from "@/lib/types";

export default function CategoryFilter({
  categorias,
  activa,
}: {
  categorias: Categoria[];
  activa?: number;
}) {
  if (categorias.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      <Link
        href="/"
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
          !activa
            ? "bg-accent text-white"
            : "bg-card text-muted ring-1 ring-border hover:ring-accent"
        }`}
      >
        Todas
      </Link>
      {categorias.map((c) => (
        <Link
          key={c.id}
          href={`/?categoria=${c.id}`}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            activa === c.id
              ? "bg-accent text-white"
              : "bg-card text-muted ring-1 ring-border hover:ring-accent"
          }`}
        >
          {c.nombre}
        </Link>
      ))}
    </div>
  );
}
```

### archivo: `src/components/ProductCard.tsx`
```tsx
import Link from "next/link";
import Image from "next/image";
import { Producto } from "@/lib/types";
import { formatARS, fotoUrl, precioSugerido } from "@/lib/pricing";
import { SUPABASE_URL } from "@/lib/config";

export default function ProductCard({ producto }: { producto: Producto }) {
  const foto = producto.fotos_producto?.[0];
  const precio = precioSugerido(producto);

  return (
    <Link
      href={`/producto/${producto.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border transition hover:ring-accent hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-card">
        {foto ? (
          <Image
            src={fotoUrl(SUPABASE_URL, foto.path)}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Sin foto
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="font-display text-lg leading-none text-foreground">
          {producto.nombre}
        </h3>
        <p className="text-sm font-semibold text-accent">{formatARS(precio)}</p>
      </div>
    </Link>
  );
}
```

### archivo: `src/components/SignOutButton.tsx`
```tsx
"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/admin/login");
        router.refresh();
      }}
      className="rounded-lg border border-input-border px-3 py-1.5 text-muted hover:bg-hover"
    >
      Salir
    </button>
  );
}
```

### archivo: `src/app/page.tsx`
```tsx
import { createClient } from "@/lib/supabase/server";
import { Producto, Categoria } from "@/lib/types";
import SiteHeader from "@/components/SiteHeader";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";

export const revalidate = 0;

export default async function HomePage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const categoriaId = searchParams.categoria
    ? Number(Array.isArray(searchParams.categoria) ? searchParams.categoria[0] : searchParams.categoria)
    : undefined;

  const supabase = await createClient();

  const { data: categorias } = await supabase
    .from("categorias")
    .select("*")
    .order("nombre")
    .returns<Categoria[]>();

  const query = supabase
    .from("productos")
    .select("*, fotos_producto(*), categorias(*)")
    .order("fecha_creacion", { ascending: false });

  const { data: productos } = await query.returns<Producto[]>();

  const productosFiltrados = categoriaId
    ? (productos ?? []).filter((p) =>
        p.categorias?.some((c) => c.id === categoriaId)
      )
    : productos ?? [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-2 pb-10">
        <div className="px-2 pt-6">
          <h1 className="font-display text-3xl text-foreground">
            Gorras disponibles
          </h1>
          <p className="mt-1 text-sm text-muted">
            Tocá una gorra para ver fotos y consultar por WhatsApp.
          </p>
        </div>
        <CategoryFilter categorias={categorias ?? []} activa={categoriaId} />

        {productosFiltrados.length === 0 ? (
          <p className="px-4 py-16 text-center text-muted">
            No hay gorras disponibles por el momento. Volvé a pasar pronto 🧢
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-2 sm:grid-cols-3 lg:grid-cols-4">
            {productosFiltrados.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        )}
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} Indy Caps
      </footer>
    </>
  );
}
```

### archivo: `src/app/producto/[id]/page.tsx`
```tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Producto } from "@/lib/types";
import { formatARS, fotoUrl, precioSugerido } from "@/lib/pricing";
import { SUPABASE_URL } from "@/lib/config";
import SiteHeader from "@/components/SiteHeader";
import WhatsappButton from "@/components/WhatsappButton";

export const revalidate = 0;

export default async function ProductoPage(props: PageProps<"/producto/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("productos")
    .select("*, fotos_producto(*), categorias(*)")
    .eq("id", id)
    .maybeSingle();

  const producto = data as Producto | null;

  if (!producto) notFound();

  const fotos = producto.fotos_producto ?? [];
  const precio = precioSugerido(producto);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10">
        <Link href="/" className="inline-block py-4 text-sm text-muted hover:text-accent">
          ← Volver al catálogo
        </Link>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
          {fotos.length > 0 ? (
            fotos
              .slice()
              .sort((a, b) => a.orden - b.orden)
              .map((f, i: number) => (
                <div
                  key={f.id}
                  className={`relative aspect-square overflow-hidden rounded-2xl bg-card ${
                    i === 0 ? "col-span-2" : ""
                  }`}
                >
                  <Image
                    src={fotoUrl(SUPABASE_URL, f.path)}
                    alt={producto.nombre}
                    fill
                    sizes="(max-width: 640px) 100vw, 640px"
                    className="object-cover"
                    priority={i === 0}
                  />
                </div>
              ))
          ) : (
            <div className="col-span-2 flex aspect-square items-center justify-center rounded-2xl bg-card text-muted">
              Sin fotos
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <div>
            <h1 className="font-display text-3xl text-foreground">{producto.nombre}</h1>
            {producto.categorias && producto.categorias.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {producto.categorias.map((c) => (
                  <span
                    key={c.id}
                    className="rounded-full bg-card px-3 py-0.5 text-xs text-muted ring-1 ring-border"
                  >
                    {c.nombre}
                  </span>
                ))}
              </div>
            )}
          </div>

          {producto.descripcion && (
            <p className="text-sm leading-relaxed text-muted">{producto.descripcion}</p>
          )}

          <p className="font-display text-2xl text-accent">{formatARS(precio)}</p>

          <div className="pt-2">
            <WhatsappButton nombreProducto={producto.nombre} />
          </div>
        </div>
      </main>
    </>
  );
}
```

### archivo: `src/app/admin/login/page.tsx`
```tsx
"use client";

import { useActionState } from "react";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl bg-card p-6 ring-1 ring-border"
      >
        <div className="mb-2 flex justify-center">
          <Image
            src="/brand/logo.png"
            alt="Indy Caps"
            width={200}
            height={160}
            className="h-16 w-auto"
            priority
          />
        </div>
        <h1 className="font-display text-2xl text-foreground">Panel admin</h1>
        <p className="mt-1 text-sm text-muted">
          Ingresá para administrar el stock.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg bg-accent px-4 py-2 font-semibold text-white transition disabled:opacity-60"
          >
            {pending ? "Ingresando..." : "Ingresar"}
          </button>
        </div>
      </form>
    </main>
  );
}
```

### archivo: `src/app/admin/(panel)/layout.tsx`
```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/lotes", label: "Lotes" },
  { href: "/admin/ventas", label: "Ventas" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/inventario", label: "Inventario" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="font-display text-xl text-foreground">
            INDY CAPS<span className="text-accent">.</span> admin
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="hidden sm:inline">{user?.email}</span>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-muted hover:bg-hover hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
```

### archivo: `src/app/admin/(panel)/page.tsx`
```tsx
import { createClient } from "@/lib/supabase/server";
import { formatARS } from "@/lib/pricing";

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: productos }, { data: ventas }, { count: totalLotes }] = await Promise.all([
    supabase.from("productos").select("id, cantidad, precio_compra, costo_envio_unitario, costo_extra"),
    supabase.from("ventas").select("id, cantidad, precio_venta, producto_id, fecha"),
    supabase.from("lotes").select("id", { count: "exact", head: true }),
  ]);

  const totalStock = (productos ?? []).reduce((acc, p) => acc + p.cantidad, 0);
  const totalVentas = (ventas ?? []).reduce((acc, v) => acc + v.cantidad, 0);

  const costoPorProducto = new Map(
    (productos ?? []).map((p) => [
      p.id,
      (p.precio_compra || 0) + (p.costo_envio_unitario || 0) + (p.costo_extra || 0),
    ])
  );

  const ganancia = (ventas ?? []).reduce((acc, v) => {
    const costo = costoPorProducto.get(v.producto_id) ?? 0;
    return acc + (v.precio_venta - costo) * v.cantidad;
  }, 0);

  const stats = [
    { label: "Stock total", value: totalStock },
    { label: "Ventas totales (u.)", value: totalVentas },
    { label: "Lotes cargados", value: totalLotes ?? 0 },
    { label: "Ganancia estimada", value: formatARS(ganancia) },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Dashboard</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-1 font-display text-2xl text-accent">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### archivo: `src/app/admin/(panel)/categorias/page.tsx`
```tsx
import { createClient } from "@/lib/supabase/server";
import { Categoria } from "@/lib/types";
import { crearCategoria, eliminarCategoria } from "../actions";

export const revalidate = 0;

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("categorias").select("*").order("nombre");
  const categorias = (data ?? []) as Categoria[];

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Categorías</h1>

      <form action={crearCategoria} className="mt-4 flex max-w-md gap-2">
        <input
          name="nombre"
          required
          placeholder="Nombre de la categoría"
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
        <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">
          Agregar
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-2">
        {categorias.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-xl bg-card px-4 py-2 ring-1 ring-border"
          >
            <span className="text-foreground">{c.nombre}</span>
            <form
              action={async () => {
                "use server";
                await eliminarCategoria(c.id);
              }}
            >
              <button className="rounded-lg border border-red-300 dark:border-red-900 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950">
                Eliminar
              </button>
            </form>
          </div>
        ))}
        {categorias.length === 0 && (
          <p className="rounded-2xl bg-card p-8 text-center text-muted ring-1 ring-border">
            Todavía no hay categorías.
          </p>
        )}
      </div>
    </div>
  );
}
```

### archivo: `src/app/admin/(panel)/inventario/page.tsx`
```tsx
import { createClient } from "@/lib/supabase/server";
import { Producto } from "@/lib/types";
import { costoTotal, formatARS, precioSugerido } from "@/lib/pricing";

export const revalidate = 0;

export default async function InventarioPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("productos").select("*").order("nombre");
  const productos = (data ?? []) as Producto[];

  const valorInventario = productos.reduce(
    (acc, p) => acc + costoTotal(p) * p.cantidad,
    0
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl text-foreground">Inventario</h1>
        <p className="text-sm text-muted">
          Valor total en costo: <span className="text-accent">{formatARS(valorInventario)}</span>
        </p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-card text-muted">
            <tr>
              <th className="px-4 py-2">Producto</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Costo unitario</th>
              <th className="px-4 py-2">Precio sugerido</th>
              <th className="px-4 py-2">Valor stock</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} className="border-t border-border bg-card">
                <td className="px-4 py-2 text-foreground">{p.nombre}</td>
                <td className={`px-4 py-2 ${p.cantidad <= 2 ? "text-red-600 dark:text-red-400" : ""}`}>
                  {p.cantidad}
                </td>
                <td className="px-4 py-2">{formatARS(costoTotal(p))}</td>
                <td className="px-4 py-2 text-accent">{formatARS(precioSugerido(p))}</td>
                <td className="px-4 py-2">{formatARS(costoTotal(p) * p.cantidad)}</td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No hay productos cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### archivo: `src/app/admin/(panel)/lotes/page.tsx`
```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Lote } from "@/lib/types";
import { formatARS } from "@/lib/pricing";
import { eliminarLote } from "../actions";

export const revalidate = 0;

export default async function LotesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lotes")
    .select("*, productos(id)")
    .order("fecha", { ascending: false });

  const lotes = (data ?? []) as (Lote & { productos: { id: number }[] })[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Lotes de compra</h1>
        <Link
          href="/admin/lotes/nuevo"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          + Nuevo lote
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {lotes.map((l) => (
          <div
            key={l.id}
            className="flex items-center justify-between rounded-2xl bg-card p-4 ring-1 ring-border"
          >
            <div>
              <p className="font-medium text-foreground">
                Lote #{l.id} — {new Date(l.fecha).toLocaleDateString("es-AR")}
              </p>
              <p className="text-sm text-muted">
                Costo de envío: {formatARS(l.costo_envio)} · {l.productos?.length ?? 0} producto(s)
              </p>
              {l.nota && <p className="text-sm text-muted">{l.nota}</p>}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/lotes/${l.id}`}
                className="rounded-lg border border-input-border px-3 py-1 text-sm text-muted hover:bg-hover"
              >
                Editar
              </Link>
              <form
                action={async () => {
                  "use server";
                  await eliminarLote(l.id);
                }}
              >
                <button className="rounded-lg border border-red-300 dark:border-red-900 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950">
                  Eliminar
                </button>
              </form>
            </div>
          </div>
        ))}
        {lotes.length === 0 && (
          <p className="rounded-2xl bg-card p-8 text-center text-muted ring-1 ring-border">
            Todavía no cargaste lotes.
          </p>
        )}
      </div>
    </div>
  );
}
```

### archivo: `src/app/admin/(panel)/lotes/[id]/page.tsx`
```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Lote } from "@/lib/types";
import LoteForm from "@/components/admin/LoteForm";
import { actualizarLote } from "../../actions";

export default async function EditarLotePage(props: PageProps<"/admin/lotes/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data } = await supabase.from("lotes").select("*").eq("id", id).maybeSingle();
  const lote = data as Lote | null;
  if (!lote) notFound();

  const actualizarConId = actualizarLote.bind(null, lote.id);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Editar lote #{lote.id}</h1>
      <div className="mt-4">
        <LoteForm lote={lote} action={actualizarConId} />
      </div>
    </div>
  );
}
```

### archivo: `src/app/admin/(panel)/lotes/nuevo/page.tsx`
```tsx
import LoteForm from "@/components/admin/LoteForm";
import { crearLote } from "../../actions";

export default function NuevoLotePage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Nuevo lote</h1>
      <div className="mt-4">
        <LoteForm action={crearLote} />
      </div>
    </div>
  );
}
```

### archivo: `src/app/admin/(panel)/productos/page.tsx`
```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Producto } from "@/lib/types";
import { formatARS, precioSugerido } from "@/lib/pricing";
import { eliminarProducto } from "../actions";

export const revalidate = 0;

export default async function ProductosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("productos")
    .select("*, fotos_producto(*), categorias(*)")
    .order("fecha_creacion", { ascending: false });

  const productos = (data ?? []) as Producto[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-card text-muted">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Precio sugerido</th>
              <th className="px-4 py-2">Visible</th>
              <th className="px-4 py-2">Categorías</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} className="border-t border-border bg-card">
                <td className="px-4 py-2 text-foreground">{p.nombre}</td>
                <td className="px-4 py-2">{p.cantidad}</td>
                <td className="px-4 py-2 text-accent">{formatARS(precioSugerido(p))}</td>
                <td className="px-4 py-2">{p.visible_publico ? "Sí" : "No"}</td>
                <td className="px-4 py-2 text-muted">
                  {p.categorias?.map((c) => c.nombre).join(", ") || "-"}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="rounded-lg border border-input-border px-3 py-1 text-muted hover:bg-hover"
                    >
                      Editar
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await eliminarProducto(p.id);
                      }}
                    >
                      <button className="rounded-lg border border-red-300 dark:border-red-900 px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950">
                        Eliminar
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Todavía no cargaste productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### archivo: `src/app/admin/(panel)/productos/[id]/page.tsx`
```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Categoria, Lote, Producto } from "@/lib/types";
import ProductForm from "@/components/admin/ProductForm";
import { actualizarProducto } from "../../actions";

export default async function EditarProductoPage(
  props: PageProps<"/admin/productos/[id]">
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: productoData }, { data: categorias }, { data: lotes }] = await Promise.all([
    supabase
      .from("productos")
      .select("*, fotos_producto(*), categorias(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categorias").select("*").order("nombre").returns<Categoria[]>(),
    supabase.from("lotes").select("*").order("fecha", { ascending: false }).returns<Lote[]>(),
  ]);

  const producto = productoData as Producto | null;
  if (!producto) notFound();

  const actualizarConId = actualizarProducto.bind(null, producto.id);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Editar producto</h1>
      <div className="mt-4">
        <ProductForm
          producto={producto}
          categorias={categorias ?? []}
          lotes={lotes ?? []}
          action={actualizarConId}
        />
      </div>
    </div>
  );
}
```

### archivo: `src/app/admin/(panel)/productos/nuevo/page.tsx`
```tsx
import { createClient } from "@/lib/supabase/server";
import { Categoria, Lote } from "@/lib/types";
import ProductForm from "@/components/admin/ProductForm";
import { crearProducto } from "../../actions";

export default async function NuevoProductoPage() {
  const supabase = await createClient();
  const [{ data: categorias }, { data: lotes }] = await Promise.all([
    supabase.from("categorias").select("*").order("nombre").returns<Categoria[]>(),
    supabase.from("lotes").select("*").order("fecha", { ascending: false }).returns<Lote[]>(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Nuevo producto</h1>
      <div className="mt-4">
        <ProductForm categorias={categorias ?? []} lotes={lotes ?? []} action={crearProducto} />
      </div>
    </div>
  );
}
```

### archivo: `src/app/admin/(panel)/ventas/page.tsx`
```tsx
import { createClient } from "@/lib/supabase/server";
import { Producto, Venta } from "@/lib/types";
import { formatARS } from "@/lib/pricing";
import VentaForm from "@/components/admin/VentaForm";

export const revalidate = 0;

export default async function VentasPage() {
  const supabase = await createClient();

  const [{ data: productos }, { data: ventas }] = await Promise.all([
    supabase.from("productos").select("*").gt("cantidad", 0).order("nombre").returns<Producto[]>(),
    supabase
      .from("ventas")
      .select("*, productos(nombre)")
      .order("fecha", { ascending: false })
      .limit(50),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Ventas</h1>

      <div className="mt-4">
        <VentaForm productos={productos ?? []} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl ring-1 ring-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-card text-muted">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Producto</th>
              <th className="px-4 py-2">Cantidad</th>
              <th className="px-4 py-2">Precio</th>
              <th className="px-4 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {((ventas ?? []) as (Venta & { productos: { nombre: string } | null })[]).map((v) => (
              <tr key={v.id} className="border-t border-border bg-card">
                <td className="px-4 py-2 text-muted">
                  {new Date(v.fecha).toLocaleDateString("es-AR")}
                </td>
                <td className="px-4 py-2 text-foreground">{v.productos?.nombre ?? "-"}</td>
                <td className="px-4 py-2">{v.cantidad}</td>
                <td className="px-4 py-2">{formatARS(v.precio_venta)}</td>
                <td className="px-4 py-2 text-accent">{formatARS(v.precio_venta * v.cantidad)}</td>
              </tr>
            ))}
            {(!ventas || ventas.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Todavía no hay ventas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### archivo: `src/components/admin/LoteForm.tsx`
```tsx
import { Lote } from "@/lib/types";

export default function LoteForm({
  lote,
  action,
}: {
  lote?: Lote;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <div>
        <label className="mb-1 block text-xs text-muted">Costo de envío</label>
        <input
          type="number"
          step="0.01"
          name="costo_envio"
          defaultValue={lote?.costo_envio ?? 0}
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Nota (opcional)</label>
        <input
          name="nota"
          defaultValue={lote?.nota ?? ""}
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <button
        type="submit"
        className="mt-2 rounded-lg bg-accent px-4 py-2 font-semibold text-white"
      >
        Guardar lote
      </button>
    </form>
  );
}
```

### archivo: `src/components/admin/ProductForm.tsx`
```tsx
import { Categoria, Lote, Producto } from "@/lib/types";
import { fotoUrl } from "@/lib/pricing";
import { SUPABASE_URL } from "@/lib/config";
import { eliminarFoto } from "@/app/admin/(panel)/actions";

export default function ProductForm({
  producto,
  categorias,
  lotes,
  action,
}: {
  producto?: Producto;
  categorias: Categoria[];
  lotes: Lote[];
  action: (formData: FormData) => void;
}) {
  const categoriaIds = new Set(producto?.categorias?.map((c) => c.id));

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      <div>
        <label className="mb-1 block text-xs text-muted">Nombre *</label>
        <input
          name="nombre"
          required
          defaultValue={producto?.nombre}
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted">Descripción</label>
        <textarea
          name="descripcion"
          rows={3}
          defaultValue={producto?.descripcion ?? ""}
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs text-muted">Stock *</label>
          <input
            type="number"
            name="cantidad"
            min={0}
            required
            defaultValue={producto?.cantidad ?? 0}
            className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Precio compra</label>
          <input
            type="number"
            step="0.01"
            name="precio_compra"
            defaultValue={producto?.precio_compra ?? 0}
            className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Envío unitario</label>
          <input
            type="number"
            step="0.01"
            name="costo_envio_unitario"
            defaultValue={producto?.costo_envio_unitario ?? 0}
            className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Costo extra</label>
          <input
            type="number"
            step="0.01"
            name="costo_extra"
            defaultValue={producto?.costo_extra ?? 0}
            className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs text-muted">
            Margen (0.5 = 50%)
          </label>
          <input
            type="number"
            step="0.01"
            min={0}
            max={5}
            name="margen"
            defaultValue={producto?.margen ?? 0.5}
            className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Lote</label>
          <select
            name="lote_id"
            defaultValue={producto?.lote_id ?? ""}
            className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Sin lote</option>
            {lotes.map((l) => (
              <option key={l.id} value={l.id}>
                Lote #{l.id} — {new Date(l.fecha).toLocaleDateString("es-AR")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted">Categorías</label>
        <div className="flex flex-wrap gap-3">
          {categorias.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5 text-sm text-muted">
              <input
                type="checkbox"
                name="categorias"
                value={c.id}
                defaultChecked={categoriaIds.has(c.id)}
              />
              {c.nombre}
            </label>
          ))}
          {categorias.length === 0 && (
            <p className="text-sm text-muted">No hay categorías creadas todavía.</p>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          name="visible_publico"
          defaultChecked={producto?.visible_publico ?? true}
        />
        Visible en el showroom público
      </label>

      {producto && producto.fotos_producto && producto.fotos_producto.length > 0 && (
        <div>
          <label className="mb-1 block text-xs text-muted">Fotos actuales</label>
          <div className="flex flex-wrap gap-3">
            {producto.fotos_producto.map((f) => (
              <div key={f.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fotoUrl(SUPABASE_URL, f.path)}
                  alt=""
                  className="h-24 w-24 rounded-lg object-cover ring-1 ring-border"
                />
                <form
                  action={async () => {
                    "use server";
                    await eliminarFoto(f.id, producto.id);
                  }}
                  className="absolute -right-2 -top-2"
                >
                  <button className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                    ✕
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs text-muted">
          Agregar fotos (máx. 4 en total)
        </label>
        <input
          type="file"
          name="fotos"
          multiple
          accept="image/*"
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm text-muted"
        />
      </div>

      <button
        type="submit"
        className="mt-2 rounded-lg bg-accent px-4 py-2 font-semibold text-white"
      >
        Guardar producto
      </button>
    </form>
  );
}
```

### archivo: `src/components/admin/VentaForm.tsx`
```tsx
"use client";

import { useActionState } from "react";
import { Producto } from "@/lib/types";
import { precioSugerido } from "@/lib/pricing";
import { registrarVenta } from "@/app/admin/(panel)/actions";

type State = { error: string | null } | undefined;

async function action(_prev: State, formData: FormData): Promise<State> {
  const result = await registrarVenta(formData);
  return result ?? { error: null };
}

export default function VentaForm({ productos }: { productos: Producto[] }) {
  const [state, formAction, pending] = useActionState<State, FormData>(action, undefined);

  return (
    <form
      action={formAction}
      className="grid max-w-2xl grid-cols-1 gap-3 rounded-2xl bg-card p-4 ring-1 ring-border sm:grid-cols-3"
    >
      <div className="sm:col-span-3">
        <label className="mb-1 block text-xs text-muted">Producto</label>
        <select
          name="producto_id"
          required
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          onChange={(e) => {
            const opt = e.target.selectedOptions[0];
            const precioInput = e.currentTarget.form?.elements.namedItem(
              "precio_venta"
            ) as HTMLInputElement | null;
            if (precioInput && opt?.dataset.precio) {
              precioInput.value = opt.dataset.precio;
            }
          }}
        >
          <option value="">Seleccioná un producto</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id} data-precio={precioSugerido(p)}>
              {p.nombre} (stock: {p.cantidad})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Cantidad</label>
        <input
          type="number"
          name="cantidad"
          min={1}
          required
          defaultValue={1}
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Precio de venta</label>
        <input
          type="number"
          step="0.01"
          name="precio_venta"
          required
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Registrando..." : "Registrar venta"}
        </button>
      </div>
      {state?.error && (
        <p className="sm:col-span-3 text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </form>
  );
}
```

