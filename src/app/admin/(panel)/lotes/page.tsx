import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Lote } from "@/lib/types";
import { formatARS } from "@/lib/pricing";
import { plural } from "@/lib/acciones";
import BotonBorrar from "@/components/admin/BotonBorrar";
import { btnPrimario, btnSecundario } from "@/components/admin/estilos";
import { eliminarLote } from "../actions";

export const revalidate = 0;

function fechaCorta(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export default async function LotesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lotes")
    .select("*, productos(id)")
    .order("fecha", { ascending: false });

  const lotes = (data ?? []) as (Lote & { productos: { id: number }[] })[];

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-foreground">Lotes de compra</h1>
        <Link href="/admin/lotes/nuevo" className={`${btnPrimario} text-sm`}>
          + Nuevo lote
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {lotes.map((l) => {
          const gorras = l.productos?.length ?? 0;
          return (
            <div
              key={l.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 ring-1 ring-border"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  Lote #{l.id} — {new Date(l.fecha).toLocaleDateString("es-AR")}
                </p>
                <p className="text-sm text-muted">
                  Costo de envío: {formatARS(l.costo_envio)} · {plural(gorras, "producto")}
                </p>
                {l.nota && <p className="truncate text-sm text-muted">{l.nota}</p>}
              </div>
              {/* Borrar va aparte, a la derecha y con espacio, para no tocarlo por Editar. */}
              <div className="flex shrink-0 items-center gap-4">
                <Link href={`/admin/lotes/${l.id}`} className={btnSecundario}>
                  Editar
                </Link>
                <BotonBorrar
                  accion={eliminarLote.bind(null, l.id)}
                  etiqueta={`Borrar el lote #${l.id}`}
                  titulo={
                    gorras > 0
                      ? `¿Borrar el lote #${l.id} del ${fechaCorta(l.fecha)}?`
                      : `¿Borrar el lote #${l.id}?`
                  }
                  detalle={
                    gorras > 0
                      ? `Tiene ${plural(gorras, "gorra")}: van a quedar sin lote. Las gorras no se borran.`
                      : "No tiene gorras asignadas."
                  }
                />
              </div>
            </div>
          );
        })}
        {lotes.length === 0 && (
          <p className="rounded-2xl bg-card p-8 text-center text-muted ring-1 ring-border">
            Todavía no cargaste lotes.
          </p>
        )}
      </div>
    </div>
  );
}
