import Link from "next/link";
import { quitarDelLote } from "@/app/admin/(panel)/actions";
import { formatARS } from "@/lib/pricing";
import BotonBorrar from "./BotonBorrar";
import MiniaturaProducto from "./MiniaturaProducto";
import { btnBorrarIcono } from "./estilos";

export type GorraDeLote = {
  id: number;
  nombre: string;
  ref_interna: string | null;
  cantidad: number;
  envio: number;
  foto: string | null;
};

// Lista completa de las gorras de un lote, en su edición: foto, nombre,
// ref., stock y envío por unidad; tocar abre la gorra y el ✕ la saca del
// lote (con confirmación).
export default function GorrasDelLote({ loteId, gorras }: { loteId: number; gorras: GorraDeLote[] }) {
  if (gorras.length === 0) {
    return (
      <p className="rounded-2xl bg-card px-4 py-8 text-center text-sm text-muted ring-1 ring-border">
        Este lote todavía no tiene gorras. Agregalas con el botón de arriba.
      </p>
    );
  }

  return (
    <ul className="overflow-hidden rounded-2xl ring-1 ring-border">
      {gorras.map((g) => {
        const editar = `/admin/productos/${g.id}`;
        const quien = `«${g.nombre}»${g.ref_interna ? ` (${g.ref_interna})` : ""}`;
        return (
          <li key={g.id} className="flex items-center gap-3 border-t border-border bg-card px-3 py-2.5 first:border-t-0 md:px-4">
            <Link href={editar} aria-label={`Editar ${quien}`} className="shrink-0 transition active:scale-95">
              <MiniaturaProducto path={g.foto} vendida={g.cantidad === 0} />
            </Link>
            <Link href={editar} className="min-w-0 flex-1 hover:text-accent">
              <span className="block truncate text-sm font-semibold text-foreground">{g.nombre}</span>
              {g.ref_interna && <span className="block truncate text-xs text-muted">{g.ref_interna}</span>}
              <span className="block text-xs text-muted">
                {g.cantidad === 0 ? (
                  <span className="font-semibold uppercase tracking-wide text-accent">Vendida</span>
                ) : (
                  `Stock ${g.cantidad}`
                )}
                {" · "}Envío {formatARS(g.envio)}
              </span>
            </Link>
            <BotonBorrar
              accion={quitarDelLote.bind(null, loteId, g.id)}
              etiqueta={`Sacar ${quien} del lote`}
              titulo={`¿Sacar ${quien} del lote #${loteId}?`}
              detalle="La gorra no se borra: queda sin lote y la podés volver a asignar cuando quieras."
              textoConfirmar="Sacar del lote"
              textoPendiente="Sacando…"
              className={btnBorrarIcono}
            >
              <span aria-hidden className="text-base leading-none">✕</span>
            </BotonBorrar>
          </li>
        );
      })}
    </ul>
  );
}
