import { ProductoPublico } from "@/lib/types";
import { normalizar } from "@/lib/site";

// Columnas de `productos` que puede leer un visitante. Tienen que coincidir
// con el GRANT de supabase/migrations/20261114000002_001b_permisos_anon.sql:
// si el showroom pide una columna que no está ahí (o `*`), la API responde
// "permission denied" y la página se cae. Para exponer una columna nueva
// hay que agregarla en los dos lados (y en el tipo ProductoPublico).
export const COLUMNAS_PUBLICAS = [
  "id",
  "nombre",
  "descripcion",
  "cantidad",
  "precio_venta",
  "visible_publico",
  "fecha_creacion",
] as const satisfies readonly (keyof ProductoPublico)[];

// Select del showroom: producto + fotos + categorías, todo con columnas
// explícitas.
export const SELECT_CATALOGO = `${COLUMNAS_PUBLICAS.join(", ")}, fotos_producto(id, producto_id, path, orden), categorias(id, nombre)`;

export type Orden = "nuevas" | "precio-asc" | "precio-desc";

export function parseOrden(valor: unknown): Orden {
  return valor === "precio-asc" || valor === "precio-desc" ? valor : "nuevas";
}

export function estaVendida(p: Pick<ProductoPublico, "cantidad">) {
  return (p.cantidad ?? 0) <= 0;
}

// Filtra por categoría y texto, y ordena. Las vendidas siempre van al
// final, para que lo primero que se vea sea lo que se puede comprar.
export function armarCatalogo(
  productos: ProductoPublico[],
  { categoriaId, q, orden }: { categoriaId?: number; q: string; orden: Orden }
) {
  const busqueda = normalizar(q);

  const filtrados = productos.filter((p) => {
    if (categoriaId && !p.categorias?.some((c) => c.id === categoriaId)) return false;
    if (!busqueda) return true;
    const texto = normalizar(
      [p.nombre, ...(p.categorias ?? []).map((c) => c.nombre)].join(" ")
    );
    return busqueda.split(/\s+/).every((palabra) => texto.includes(palabra));
  });

  return filtrados.sort((a, b) => {
    const vendidaA = estaVendida(a) ? 1 : 0;
    const vendidaB = estaVendida(b) ? 1 : 0;
    if (vendidaA !== vendidaB) return vendidaA - vendidaB;
    if (orden === "precio-asc") return a.precio_venta - b.precio_venta;
    if (orden === "precio-desc") return b.precio_venta - a.precio_venta;
    return b.fecha_creacion.localeCompare(a.fecha_creacion);
  });
}
