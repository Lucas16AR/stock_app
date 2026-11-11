# Stock Gorras — estado del proyecto

## Resumen
Reemplazo completo del viejo `stock_app` (Flask, incompleto) por una app
nueva en Next.js + Supabase. Showroom público sin carrito (botón de
WhatsApp por producto) + panel admin con login para stock/lotes/ventas.
Con identidad visual de la marca del usuario, **INDY CAPS**, aplicada, y
selector de modo claro/oscuro.

## Decisiones tomadas con el usuario
- Stack: Next.js + Supabase (no Flask, no Vercel-only sin backend).
- Alcance: panel admin interno + catálogo público tipo "vidriera" (sin
  compra online). Botón de WhatsApp con mensaje prellenado por producto.
- Sin migración de datos del proyecto viejo (arranca limpio).
- WhatsApp de contacto: 5492604647804.
- Login admin: usuario/contraseña vía Supabase Auth (un único usuario;
  email y contraseña no se guardan acá porque el repo es público). No
  planea agregar otros usuarios admin salvo que el negocio crezca mucho.
- El usuario subió el código a su repo de GitHub existente
  (`Lucas16AR/stock_app`) y va a seguir trabajando con Claude Code desde
  su compu, en esa carpeta local.

## Infraestructura creada
- Proyecto Supabase **stockAPP** (id `kkhwuifybqfgavumwmwv`, región
  `sa-east-1`, org `Lucas16AR's Org`). Se pausó el proyecto `mundialProde`
  para liberar el cupo free (2 proyectos gratis máximo).
- Esquema completo aplicado (productos, categorías, lotes, fotos, ventas)
  con RLS: lectura pública solo de productos visibles con stock, escritura
  solo autenticado. Bucket de Storage `productos` para fotos.
- Detalle completo en `docs/SCHEMA.md` dentro del repo del código.

## Deploy — RESUELTO
El usuario importó el repo directamente desde el dashboard de Vercel
(sin depender del conector de este entorno, que no tenía permiso para
crear proyectos). Está en producción en:
**https://stock-app-six-woad.vercel.app**

Verificado funcionando: showroom público, login admin, carga de
productos/categorías/lotes con fotos. Flujo completo probado por el
usuario en vivo.

## Auditoría de seguridad (2026-08-13) — CERRADA
El usuario pidió una revisión profunda de seguridad (preocupado en
particular por si había alguna API key expuesta al inspeccionar la
página). Resultado: no hay ninguna API de IA/Claude en la app (nunca se
usó). Lo único visible al inspeccionar es la anon key pública de
Supabase, que es segura por diseño (protegida por RLS, no por secreto).

Se revisó: políticas RLS (correctas), protección de Server Actions
(doble capa — RLS de fondo, no depende solo del middleware), políticas
de Storage, secretos en el repo (ninguno filtrado), `npm audit` (0
vulnerabilidades), headers HTTP de seguridad (agregados:
X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
Permissions-Policy).

Se corrigió un problema real: la subida de fotos no validaba el archivo
en el servidor (confiaba en la extensión del nombre mandado por el
cliente, se podía subir un `.html`/`.svg` con script disfrazado de
imagen). Ahora valida `Content-Type` real contra lista blanca
(jpg/png/webp/gif) + límite de 5 MB.

Informe completo en `docs/SECURITY.md` dentro del repo. "Leaked Password
Protection" de Supabase **no se pudo activar**: requiere plan Pro (el
proyecto está en el free tier), no hay forma de habilitarlo sin upgrade.
No es crítico — RLS es la capa de autorización real, no la contraseña
por sí sola. El usuario confirmó que no planea agregar más usuarios
admin por ahora.

## Diseño de marca "INDY CAPS" (2026-08-13) — HECHO
El usuario mandó el logo de su emprendimiento (dos versiones: isotipo
solo y logo completo con texto "INDY CAPS", fondo crema natural). Se
rediseñó todo el sitio (showroom público + panel admin) para combinar:

- Se pasó de un tema oscuro (negro/dorado) a un tema claro que matchea
  el crema nativo del logo: fondo `#f5f2ec`, texto casi negro, acento
  rojo `#d6301f` (ya era el color de marca).
- Header del showroom: isotipo + texto "INDY CAPS".
- Login admin: logo completo.
- Favicon/ícono de pestaña actualizado al isotipo de INDY CAPS.

Entregado como un `.md` de instrucciones más los 5 archivos binarios
(logos + íconos). Ya aplicado (commit `2c94b99`); el `.md` se borró del
repo.

## Modo claro/oscuro (2026-08-13) — HECHO
El usuario pidió que además del tema claro exista un modo oscuro con
selector, no uno fijo. Se implementó:

- Sistema de tokens de color en `globals.css` (`--background`,
  `--foreground`, `--card`, `--border`, `--input-border`, `--muted`,
  `--hover`) que cambian según la clase `dark` en `<html>`. Todos los
  componentes (showroom + admin, ~24 archivos) migraron de colores fijos
  a estos tokens.
- Botón de sol/luna (`ThemeToggle`, nuevo componente) en el header del
  showroom, el header del admin y el login, que alterna la clase `dark`
  y guarda la preferencia en `localStorage`.
- Script inline en `layout.tsx` que aplica el tema guardado (o el del
  sistema operativo si nunca se eligió ninguno) antes de pintar, para
  evitar parpadeo de tema equivocado al cargar.
- `tsc --noEmit` y `eslint` quedaron sin errores ni warnings.

Entregado como un segundo `.md` de instrucciones. Ya aplicado (commit
`2c94b99`); el `.md` se borró del repo, igual que el del patch de
seguridad (los cambios quedan en el historial de git y lo vigente está
en `docs/SECURITY.md` y `CLAUDE.md`).

## Acceso directo al panel admin (2026-11-10) — HECHO
El usuario pidió un botón/ícono en el showroom para entrar al panel
admin sin tipear `/admin` a mano. Se agregó un ícono de candado al lado
del `ThemeToggle` en `src/components/SiteHeader.tsx`, como `next/link`
a `/admin`. No cambia nada de seguridad: la ruta sigue protegida por el
login y el middleware existentes (`src/proxy.ts`).

El cambio se aplicó y se comiteó directamente desde una sesión de
Cowork conectada a esta carpeta vía el puente de dispositivo (commit
`2f740a8`, "Agregar acceso directo al panel admin desde el showroom").
Verificado con `tsc --noEmit` y `eslint`, sin errores. La sesión de
Cowork no tenía credenciales de GitHub, así que el push lo hizo Claude
Code local; verificado en producción (el candado aparece en el header).

## Supabase pausado y cron keepalive (2026-11-10) — HECHO
El proyecto Supabase estaba pausado por inactividad (plan gratis, ~7
días sin uso): el showroom mostraba "No hay gorras disponibles" sin
error y el login no andaba. Se restauró desde el MCP de Supabase. Para
que no vuelva a pasar se agregó un cron diario de Vercel (`vercel.json`,
12:00 UTC) que llama a `/api/keepalive`, una consulta liviana a la base.
Verificado en producción (`{"ok":true}`).

## Base reiniciada (2026-11-10)
A pedido del usuario se vaciaron todas las tablas de la app (quedaba un
lote de prueba) con `truncate ... restart identity`, así los IDs vuelven
a arrancar en 1. El usuario admin se mantuvo.

## Render (2026-11-10) — RESUELTO
Seguía conectado al repo un servicio de Render del viejo `stock_app`
Flask; con cada push intentaba `pip install -r requirements.txt` y
mandaba un mail de "build failed". El usuario lo borró desde Render. El
único deploy del repo es Vercel.

## Pendiente
- Confirmar en los logs de Vercel que el cron keepalive corra solo
  (primera ejecución: 2026-11-11 12:00 UTC).
- Usuario: revisar que en Render no haya quedado una base PostgreSQL
  huérfana del proyecto viejo.

## Código
El usuario tiene el código en su repo de GitHub y lo despliega en
Vercel. Sesiones futuras: si el usuario vuelve a Cowork para seguir
trabajando en esto, partir de este estado en vez de rehacer el
diagnóstico inicial.