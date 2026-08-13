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
  Solo muestran productos con `visible_publico = true` y `cantidad > 0`
  (impuesto también por RLS, no solo por el query).
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
- `revalidatePath` se llama después de cada mutación relevante (incluyendo
  siempre `"/"` cuando afecta al showroom público).

## Marca y temas (INDY CAPS)

- La identidad visual es **INDY CAPS**: acento rojo `#d6301f`, tipografía
  display Bebas Neue + Inter. Los logos están en `public/brand/`
  (`mark.png` isotipo para los headers, `logo.png` completo para el login).
- El sitio tiene **modo claro y oscuro**. Los colores viven como tokens en
  `src/app/globals.css` (`--background`, `--foreground`, `--card`,
  `--border`, `--input-border`, `--muted`, `--hover`, `--accent`), con los
  valores del modo oscuro bajo `.dark`. El variant se declara con
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
