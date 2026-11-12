import { Producto } from "@/lib/types";
import { normalizar } from "@/lib/site";

export type Orden = "nuevas" | "precio-asc" | "precio-desc";

export function parseOrden(valor: unknown): Orden {
  return valor === "precio-asc" || valor === "precio-desc" ? valor : "nuevas";
}

export function estaVendida(p: Pick<Producto, "cantidad">) {
  return (p.cantidad ?? 0) <= 0;
}

// Filtra por categoría y texto, y ordena. Las vendidas siempre van al
// final, para que lo primero que se vea sea lo que se puede comprar.
export function armarCatalogo(
  productos: Producto[],
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
