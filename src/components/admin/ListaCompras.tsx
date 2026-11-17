"use client";

import { useState } from "react";
import Link from "next/link";
import { actualizarCompra, anularCompra } from "@/app/admin/(panel)/actions";
import { PencilIcon, UndoIcon } from "@/components/icons";
import { plural } from "@/lib/acciones";
import { formatFecha, formatFechaCorta } from "@/lib/fechas";
import { formatARS } from "@/lib/pricing";
import BotonBorrar from "./BotonBorrar";
import BotonEnviar from "./BotonEnviar";
import CamposCompra, { type LoteOpcion } from "./CamposCompra";
import FormAccion from "./FormAccion";
import MiniaturaProducto from "./MiniaturaProducto";
import { btnBorrarIcono, btnPrimario, btnSecundario } from "./estilos";

// Una compra ya armada en el servidor.
export type FilaCompra = {
  id: number;
  producto_id: number;
  nombre: string;
  foto: string | null;
  ref: string | null;
  unidades: number;
  precio: number;
  envio: number;
  extra: number;
  fecha: string;
  // Stock actual de la gorra: si es menor que las unidades, esta compra no
  // se puede anular (esas unidades ya se vendieron).
  stock: number;
  // El lote de la compra (para el envío estimado al corregirla), o null.
  lote: LoteOpcion | null;
};

// Compras de un lote (modo "lote": foto y nombre de cada gorra) o de una
// gorra (modo "producto": fecha y lote de cada compra). Cada una se puede
// corregir (unidades, precios, ref.) o anular.
export default function ListaCompras({
  compras,
  modo,
  vacio,
}: {
  compras: FilaCompra[];
  modo: "lote" | "producto";
  vacio: string;
}) {
  if (compras.length === 0) {
    return <p className="rounded-2xl bg-card px-4 py-8 text-center text-sm text-muted ring-1 ring-border">{vacio}</p>;
  }
  return (
    <ul className="overflow-hidden rounded-2xl ring-1 ring-border">
      {compras.map((c) => (
        <Fila key={c.id} c={c} modo={modo} />
      ))}
    </ul>
  );
}

function Fila({ c, modo }: { c: FilaCompra; modo: "lote" | "producto" }) {
  const [editando, setEditando] = useState(false);
  const gorra = `/admin/productos/${c.producto_id}`;
  const quien = `«${c.nombre}»${c.ref ? ` (${c.ref})` : ""}`;
  const queda = c.stock - c.unidades;
  const cuando = c.lote ? `del lote #${c.lote.id}` : `del ${formatFechaCorta(c.fecha)}`;

  return (
    <li className="border-t border-border bg-card first:border-t-0">
      <div className="flex items-center gap-3 px-3 py-2.5 md:px-4">
        {modo === "lote" && (
          <Link href={gorra} aria-label={`Ver ${quien}`} className="shrink-0 transition active:scale-95">
            <MiniaturaProducto path={c.foto} vendida={c.stock === 0} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-1.5 text-sm font-semibold text-foreground">
            {modo === "lote" ? (
              <Link href={gorra} className="min-w-0 truncate hover:text-accent">
                {c.nombre}
              </Link>
            ) : (
              <span className="min-w-0 truncate">
                {formatFecha(c.fecha)} ·{" "}
                {c.lote ? (
                  <Link href={`/admin/lotes/${c.lote.id}`} className="hover:text-accent">
                    Lote #{c.lote.id}
                  </Link>
                ) : (
                  "Sin lote"
                )}
              </span>
            )}
            {/* En el lote solo se marca la compra de más de una unidad. */}
            {(modo === "producto" || c.unidades > 1) && (
              <span className="shrink-0 rounded-full bg-hover px-1.5 text-xs font-bold ring-1 ring-border">×{c.unidades}</span>
            )}
          </p>
          {c.ref && <p className="truncate text-xs text-muted">{c.ref}</p>}
          <p className="text-xs text-muted">
            <span className="whitespace-nowrap">Compra {formatARS(c.precio)}</span>
            {" · "}
            <span className="whitespace-nowrap">Envío {formatARS(c.envio)}</span>
            {" · "}
            <span className="whitespace-nowrap">Extra {formatARS(c.extra)}</span>
            {modo === "lote" && (
              <>
                {" · "}
                {c.stock === 0 ? (
                  <span className="font-semibold uppercase tracking-wide text-accent">Vendida</span>
                ) : (
                  <span className="whitespace-nowrap">Stock {c.stock}</span>
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setEditando((e) => !e)}
            aria-expanded={editando}
            aria-label={`Corregir la compra ${cuando} de ${quien}`}
            title="Corregir"
            className={`${btnBorrarIcono} hover:bg-hover hover:text-foreground ${editando ? "bg-hover text-foreground" : ""}`}
          >
            <PencilIcon className="h-[18px] w-[18px]" />
          </button>
          <BotonBorrar
            accion={anularCompra.bind(null, c.id)}
            etiqueta={`Anular la compra ${cuando} de ${quien}`}
            titulo={`¿Anular la compra ${cuando} de ${quien}?`}
            detalle={`Se borra la compra y se ${c.unidades === 1 ? "descuenta 1 unidad" : `descuentan ${c.unidades} unidades`} del stock (queda en ${queda}). El costo promedio de la gorra se recalcula${c.lote ? " y el envío del lote se reparte de nuevo" : ""}.`}
            bloqueo={
              queda < 0
                ? `Ya se vendieron unidades de esta gorra: tiene ${plural(c.stock, "unidad", "unidades")} en stock y la compra es de ${c.unidades}. Si la cargaste mal, corregí las unidades con el lápiz.`
                : undefined
            }
            tituloBloqueo="No se puede anular esta compra"
            textoConfirmar="Anular compra"
            textoPendiente="Anulando…"
          >
            <UndoIcon className="h-[18px] w-[18px]" />
          </BotonBorrar>
        </div>
      </div>

      {editando && (
        <FormAccion
          accion={actualizarCompra.bind(null, c.id)}
          alTerminarBien={() => setEditando(false)}
          className="flex flex-col gap-3 border-t border-dashed border-border bg-background/40 px-3 py-3 md:px-4"
        >
          <p className="text-xs text-muted">
            Corregir la compra. Si cambian las unidades, el stock cambia por la diferencia
            {c.stock < c.unidades ? ` (no puede bajar de ${c.unidades - c.stock}: el resto ya se vendió)` : ""}.
          </p>
          <CamposCompra
            idPrefijo={`compra-${c.id}`}
            loteFijo={c.lote}
            unidadesPrevias={c.unidades}
            inicial={{ unidades: c.unidades, precio: c.precio, extra: c.extra, envio: c.envio, ref: c.ref }}
          />
          <div className="flex flex-wrap gap-2">
            <BotonEnviar textoPendiente="Guardando…" className={`${btnPrimario} text-sm`}>
              Guardar compra
            </BotonEnviar>
            <button type="button" onClick={() => setEditando(false)} className={btnSecundario}>
              Cancelar
            </button>
          </div>
        </FormAccion>
      )}
    </li>
  );
}
