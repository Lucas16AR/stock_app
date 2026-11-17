import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { primeraFoto } from "@/lib/fotos";
import ListaProductos, { type FilaProducto } from "@/components/admin/ListaProductos";
import { btnPrimario } from "@/components/admin/estilos";

export const revalidate = 0;

type ProductoConsulta = {
  id: number;
  nombre: string;
  ref_interna: string | null;
  cantidad: number;
  precio_venta: number;
  visible_publico: boolean;
  lote_id: number | null;
  fotos_producto: { path: string; orden: number }[] | null;
  categorias: { nombre: string }[] | null;
  ventas: { count: number }[] | null;
  compras: { count: number }[] | null;
};

// Parte de datos: hace el select y le pasa a la lista (cliente) solo lo
// que muestra. El buscador, los filtros y el interruptor viven en
// ListaProductos.
export default async function ProductosPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("productos")
    .select(
      "id, nombre, ref_interna, cantidad, precio_venta, visible_publico, lote_id, fotos_producto(path, orden), categorias(nombre), ventas(count), compras(count)"
    )
    .order("fecha_creacion", { ascending: false })
    .returns<ProductoConsulta[]>();

  const productos: FilaProducto[] = (data ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    ref_interna: p.ref_interna,
    cantidad: p.cantidad,
    precio_venta: Number(p.precio_venta),
    visible_publico: p.visible_publico,
    lote_id: p.lote_id,
    foto: primeraFoto(p.fotos_producto)?.path ?? null,
    categorias: (p.categorias ?? []).map((c) => c.nombre),
    fotos: p.fotos_producto?.length ?? 0,
    ventas: p.ventas?.[0]?.count ?? 0,
    compras: p.compras?.[0]?.count ?? 0,
  }));

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-foreground">Productos</h1>
        <Link href="/admin/productos/nuevo" className={`${btnPrimario} text-sm`}>
          + Nuevo producto
        </Link>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-2xl bg-card px-4 py-6 text-sm text-accent ring-1 ring-border">
          No se pudieron cargar los productos. Recargá la página en un rato.
        </p>
      ) : (
        <ListaProductos productos={productos} />
      )}
    </div>
  );
}
