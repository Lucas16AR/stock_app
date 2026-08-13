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
