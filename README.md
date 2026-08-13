# Stock Gorras

App de stock y venta de gorras. Reemplaza al proyecto viejo en Flask
(`stock_app`) con una versión nueva en Next.js + Supabase.

## Qué hace

- **Showroom público (`/`)**: catálogo de gorras disponibles, filtro por
  categoría, página de detalle con fotos y botón de WhatsApp que arma un
  mensaje prellenado al número configurado. Pensado para linkear desde
  Instagram — no tiene carrito ni pago online, es una vidriera.
- **Panel admin (`/admin`)**: protegido con login (Supabase Auth). Permite
  cargar lotes de compra, productos (con hasta 4 fotos, categorías, cálculo
  automático de precio sugerido según costo + margen), registrar ventas
  (descuentan stock automáticamente), gestionar categorías y ver inventario
  valorizado.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack) + Tailwind CSS v4
- **Supabase**: Postgres (con Row Level Security) + Auth + Storage (bucket
  `productos` para las fotos)
- Pensado para desplegar en **Vercel**

## Desarrollo local

```bash
npm install
npm run dev
```

Abrí http://localhost:3000 (showroom) y http://localhost:3000/admin/login
(panel admin).

## Variables de entorno

No son obligatorias para correr el proyecto: `src/lib/config.ts` tiene
valores por defecto (la URL y la anon key de Supabase son públicas por
diseño, protegidas por RLS, no por secreto). Si querés sobreescribirlas
(por ejemplo al rotar la anon key), creá un `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_WHATSAPP_NUMBER=...
```

## Deploy

Pensado para Vercel (framework Next.js autodetectado, sin configuración
extra). Ver `CLAUDE.md` para el detalle del proyecto de Supabase y del
estado del deploy.
