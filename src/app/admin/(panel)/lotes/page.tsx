import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Lote } from "@/lib/types";
import { formatARS } from "@/lib/pricing";
import { eliminarLote } from "../actions";

export const revalidate = 0;

export default async function LotesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lotes")
    .select("*, productos(id)")
    .order("fecha", { ascending: false });

  const lotes = (data ?? []) as (Lote & { productos: { id: number }[] })[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-neutral-50">Lotes de compra</h1>
        <Link
          href="/admin/lotes/nuevo"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-neutral-950"
        >
          + Nuevo lote
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {lotes.map((l) => (
          <div
            key={l.id}
            className="flex items-center justify-between rounded-2xl bg-neutral-900 p-4 ring-1 ring-neutral-800"
          >
            <div>
              <p className="font-medium text-neutral-100">
                Lote #{l.id} — {new Date(l.fecha).toLocaleDateString("es-AR")}
              </p>
              <p className="text-sm text-neutral-400">
                Costo de envío: {formatARS(l.costo_envio)} · {l.productos?.length ?? 0} producto(s)
              </p>
              {l.nota && <p className="text-sm text-neutral-500">{l.nota}</p>}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/lotes/${l.id}`}
                className="rounded-lg border border-neutral-700 px-3 py-1 text-sm text-neutral-300 hover:bg-neutral-800"
              >
                Editar
              </Link>
              <form
                action={async () => {
                  "use server";
                  await eliminarLote(l.id);
                }}
              >
                <button className="rounded-lg border border-red-900 px-3 py-1 text-sm text-red-400 hover:bg-red-950">
                  Eliminar
                </button>
              </form>
            </div>
          </div>
        ))}
        {lotes.length === 0 && (
          <p className="rounded-2xl bg-neutral-900 p-8 text-center text-neutral-500 ring-1 ring-neutral-800">
            Todavía no cargaste lotes.
          </p>
        )}
      </div>
    </div>
  );
}
