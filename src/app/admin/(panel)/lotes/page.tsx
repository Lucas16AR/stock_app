import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TarjetaLote, { type LoteConCompras } from "@/components/admin/TarjetaLote";
import { btnPrimario } from "@/components/admin/estilos";

export const revalidate = 0;

export default async function LotesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lotes")
    // Se cuenta por compras: unidades compradas y modelos (migración 006).
    .select("*, compras(producto_id, unidades, precio_compra, costo_extra, productos(id, nombre, fotos_producto(path, orden)))")
    .order("fecha", { ascending: false })
    .returns<LoteConCompras[]>();

  const lotes = data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-foreground">Lotes de compra</h1>
        <Link href="/admin/lotes/nuevo" className={`${btnPrimario} text-sm`}>
          + Nuevo lote
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-card px-4 py-6 text-sm text-accent ring-1 ring-border">
          No se pudieron cargar los lotes. Recargá la página en un rato.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {lotes.map((l) => (
          <TarjetaLote key={l.id} lote={l} />
        ))}
        {!error && lotes.length === 0 && (
          <p className="rounded-2xl bg-card p-8 text-center text-muted ring-1 ring-border">
            Todavía no cargaste lotes.
          </p>
        )}
      </div>
    </div>
  );
}
