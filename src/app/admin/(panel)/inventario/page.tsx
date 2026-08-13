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
