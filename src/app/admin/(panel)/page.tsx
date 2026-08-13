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
