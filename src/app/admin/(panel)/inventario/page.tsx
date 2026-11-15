import { createClient } from "@/lib/supabase/server";
import { Producto } from "@/lib/types";
import { costoTotal, formatARS, precioSugerido } from "@/lib/pricing";
import { primeraFoto } from "@/lib/fotos";
import ListaInventario, { type FilaInventario } from "@/components/admin/ListaInventario";

export const revalidate = 0;

type ProductoConsulta = Producto & {
  fotos_producto: { path: string; orden: number }[] | null;
  categorias: { nombre: string }[] | null;
};

export default async function InventarioPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("productos")
    .select("*, fotos_producto(path, orden), categorias(nombre)")
    .order("nombre")
    .returns<ProductoConsulta[]>();

  // Los costos se calculan acá: a la lista solo le llegan los números.
  const productos: FilaInventario[] = (data ?? []).map((p) => {
    const costo = costoTotal(p);
    return {
      id: p.id,
      nombre: p.nombre,
      ref_interna: p.ref_interna,
      cantidad: p.cantidad,
      costo,
      sugerido: precioSugerido(p),
      valor: costo * p.cantidad,
      foto: primeraFoto(p.fotos_producto)?.path ?? null,
      categorias: (p.categorias ?? []).map((c) => c.nombre),
    };
  });

  const valorInventario = productos.reduce((acc, p) => acc + p.valor, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl text-foreground">Inventario</h1>
        <p className="text-sm text-muted">
          Valor total en costo: <span className="text-accent">{formatARS(valorInventario)}</span>
        </p>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-2xl bg-card px-4 py-6 text-sm text-accent ring-1 ring-border">
          No se pudo cargar el inventario. Recargá la página en un rato.
        </p>
      ) : (
        <ListaInventario productos={productos} />
      )}
    </div>
  );
}
