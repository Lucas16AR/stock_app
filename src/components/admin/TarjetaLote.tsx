import Link from "next/link";
import { Lote } from "@/lib/types";
import { formatARS } from "@/lib/pricing";
import { plural } from "@/lib/acciones";
import { resumenCompras, textoCompras } from "@/lib/compras";
import { primeraFoto } from "@/lib/fotos";
import { formatFecha, formatFechaCorta } from "@/lib/fechas";
import { eliminarLote } from "@/app/admin/(panel)/actions";
import BotonBorrar from "./BotonBorrar";
import MiniaturaProducto from "./MiniaturaProducto";
import { btnSecundario } from "./estilos";

// Cuántas miniaturas se muestran por lote en el listado.
const MINIATURAS = 6;

export type LoteConCompras = Lote & {
  compras:
    | {
        producto_id: number;
        unidades: number;
        precio_compra: number;
        costo_extra: number;
        productos: { id: number; nombre: string; fotos_producto: { path: string; orden: number }[] | null } | null;
      }[]
    | null;
};

// Un lote en el listado de lotes: fecha, envío, unidades compradas y
// modelos (contados por sus compras), nota, miniaturas de sus gorras
// (hasta 6 y "+N") y los botones de editar y borrar.
export default function TarjetaLote({ lote: l }: { lote: LoteConCompras }) {
  const compras = l.compras ?? [];
  const resumen = resumenCompras(compras);
  // Una miniatura por gorra, aunque tenga más de una compra en el lote.
  const gorras = [...new Map(compras.flatMap((c) => (c.productos ? [[c.productos.id, c.productos] as const] : []))).values()].sort(
    (a, b) => a.id - b.id
  );
  const muestra = gorras.slice(0, MINIATURAS);
  const resto = gorras.length - muestra.length;
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/admin/lotes/${l.id}`} className="min-w-0 hover:text-accent">
          <p className="font-medium text-foreground">
            Lote #{l.id} — {formatFecha(l.fecha)}
          </p>
          <p className="text-sm text-muted">
            <span className="whitespace-nowrap">Envío {formatARS(l.costo_envio)}</span> ·{" "}
            <span className="whitespace-nowrap font-semibold text-foreground">{plural(resumen.unidades, "gorra")}</span>
            {resumen.modelos > 0 && (
              <>
                {" · "}
                <span className="whitespace-nowrap">{plural(resumen.modelos, "modelo")}</span>
              </>
            )}
          </p>
          {l.nota && <p className="truncate text-sm text-muted">{l.nota}</p>}
        </Link>
        {/* Borrar va aparte, a la derecha y con espacio, para no tocarlo por Editar. */}
        <div className="flex shrink-0 items-center gap-4">
          <Link href={`/admin/lotes/${l.id}`} className={btnSecundario}>
            Editar
          </Link>
          <BotonBorrar
            accion={eliminarLote.bind(null, l.id)}
            etiqueta={`Borrar el lote #${l.id}`}
            titulo={
              resumen.compras > 0
                ? `¿Borrar el lote #${l.id} del ${formatFechaCorta(l.fecha)}?`
                : `¿Borrar el lote #${l.id}?`
            }
            detalle={
              resumen.compras > 0
                ? `Tiene ${textoCompras(resumen.compras, resumen.unidades)}. Las compras quedan sin lote; las gorras y su stock no cambian.`
                : "No tiene gorras cargadas."
            }
          />
        </div>
      </div>

      {gorras.length > 0 ? (
        <Link
          href={`/admin/lotes/${l.id}`}
          aria-label={`Ver las gorras del lote #${l.id}`}
          className="flex items-center gap-2"
        >
          {muestra.map((g) => (
            <MiniaturaProducto
              key={g.id}
              path={primeraFoto(g.fotos_producto)?.path}
              className="h-10 w-10 sm:h-12 sm:w-12"
              sizes="48px"
            />
          ))}
          {resto > 0 && <span className="pl-1 text-sm font-semibold text-muted">+{resto}</span>}
        </Link>
      ) : (
        <p className="text-sm text-muted">
          Sin gorras.{" "}
          <Link href={`/admin/lotes/${l.id}`} className="font-semibold text-accent hover:underline">
            Cargarle gorras
          </Link>
        </p>
      )}
    </div>
  );
}
