"use client";

import { useState } from "react";
import { formatFecha } from "@/lib/fechas";
import { envioPorGorra } from "@/lib/lotes";
import { formatARS } from "@/lib/pricing";

// Un lote para elegir en una compra, con lo que hace falta para estimar
// el envío por gorra antes de guardar (la cuenta real la hace la base).
export type LoteOpcion = {
  id: number;
  fecha: string;
  nota: string | null;
  costo_envio: number;
  // Unidades que ya tiene cargadas el lote.
  unidades: number;
};

export type ValoresCompra = {
  lote_id: number | null;
  unidades: number;
  precio: number;
  extra: number;
  envio: number;
};

const campo =
  "w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

// Campos de una compra (los lee leerCompra en src/lib/compras.ts):
// unidades, precio de compra y extra por unidad, ref. y, sin lote, el
// envío por unidad. En un lote el envío no se carga: lo reparte la base y
// acá se muestra cuánto va a dar.
//
// - `lotes`: si viene, se elige el lote (o "Sin lote"); si no, va `loteFijo`.
// - `unidadesPrevias`: al corregir una compra de un lote, las unidades que
//   ya estaban contadas en el lote (para que la estimación no las sume dos veces).
export default function CamposCompra({
  lotes,
  loteFijo = null,
  inicial,
  conRef = true,
  unidadesPrevias = 0,
  onCambio,
  idPrefijo,
}: {
  lotes?: LoteOpcion[];
  loteFijo?: LoteOpcion | null;
  inicial?: Partial<ValoresCompra> & { ref?: string | null };
  conRef?: boolean;
  unidadesPrevias?: number;
  onCambio?: (v: ValoresCompra) => void;
  // Para que los id de los campos no se repitan si hay varios en la página.
  idPrefijo: string;
}) {
  const [v, setV] = useState<ValoresCompra>({
    lote_id: inicial?.lote_id ?? loteFijo?.id ?? null,
    unidades: inicial?.unidades ?? 1,
    precio: inicial?.precio ?? 0,
    extra: inicial?.extra ?? 0,
    envio: inicial?.envio ?? 0,
  });

  function cambiar(parcial: Partial<ValoresCompra>) {
    const nuevo = { ...v, ...parcial };
    setV(nuevo);
    onCambio?.(nuevo);
  }

  const lote = lotes ? (lotes.find((l) => l.id === v.lote_id) ?? null) : loteFijo;
  const unidadesLote = lote ? lote.unidades - unidadesPrevias + (v.unidades > 0 ? v.unidades : 0) : 0;
  const id = (nombre: string) => `${idPrefijo}-${nombre}`;
  const numero = (texto: string) => (texto === "" ? 0 : Number(texto));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {lotes && (
        <div className="col-span-2 sm:col-span-4">
          <label htmlFor={id("lote")} className="mb-1 block text-xs text-muted">Lote de la compra</label>
          <select
            id={id("lote")}
            name="compra_lote_id"
            value={v.lote_id ?? ""}
            onChange={(e) => cambiar({ lote_id: e.target.value ? Number(e.target.value) : null })}
            className={campo}
          >
            <option value="">Sin lote (envío a mano)</option>
            {lotes.map((l) => (
              <option key={l.id} value={l.id}>
                Lote #{l.id} — {formatFecha(l.fecha)}
                {l.nota ? ` · ${l.nota}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}
      {!lotes && <input type="hidden" name="compra_lote_id" value={loteFijo?.id ?? ""} />}

      <div>
        <label htmlFor={id("unidades")} className="mb-1 block text-xs text-muted">Unidades</label>
        <input
          id={id("unidades")}
          type="number"
          name="compra_unidades"
          min={1}
          step={1}
          required
          defaultValue={v.unidades}
          onChange={(e) => cambiar({ unidades: numero(e.target.value) })}
          className={campo}
        />
      </div>
      <div>
        <label htmlFor={id("precio")} className="mb-1 block text-xs text-muted">Precio de compra (c/u)</label>
        <input
          id={id("precio")}
          type="number"
          name="compra_precio"
          min={0}
          step="0.01"
          required
          defaultValue={v.precio}
          onChange={(e) => cambiar({ precio: numero(e.target.value) })}
          className={campo}
        />
      </div>
      <div>
        <label htmlFor={id("extra")} className="mb-1 block text-xs text-muted">Extra (c/u)</label>
        <input
          id={id("extra")}
          type="number"
          name="compra_extra"
          min={0}
          step="0.01"
          defaultValue={v.extra}
          onChange={(e) => cambiar({ extra: numero(e.target.value) })}
          className={campo}
        />
      </div>
      {lote ? (
        <div className="flex flex-col justify-center rounded-lg bg-hover px-3 py-2 text-xs text-muted">
          <span>Envío (c/u): lo reparte el lote</span>
          <span className="font-semibold text-foreground">
            ≈ {formatARS(envioPorGorra(Number(lote.costo_envio), unidadesLote))}
          </span>
        </div>
      ) : (
        <div>
          <label htmlFor={id("envio")} className="mb-1 block text-xs text-muted">Envío (c/u)</label>
          <input
            id={id("envio")}
            type="number"
            name="compra_envio"
            min={0}
            step="0.01"
            defaultValue={v.envio}
            onChange={(e) => cambiar({ envio: numero(e.target.value) })}
            className={campo}
          />
        </div>
      )}
      {conRef && (
        <div className="col-span-2 sm:col-span-4">
          <label htmlFor={id("ref")} className="mb-1 block text-xs text-muted">
            Ref. de esta compra — no se muestra en la página
          </label>
          <input
            id={id("ref")}
            name="compra_ref"
            defaultValue={inicial?.ref ?? ""}
            placeholder="Ej. AFA 12"
            className={`${campo} border-dashed`}
          />
        </div>
      )}
    </div>
  );
}

// Envío por unidad que va a tener la compra: el estimado del lote o el
// cargado a mano. Lo usa el precio sugerido de una gorra nueva.
export function envioEstimado(v: ValoresCompra, lotes: LoteOpcion[]) {
  const lote = lotes.find((l) => l.id === v.lote_id);
  if (!lote) return v.envio;
  return envioPorGorra(Number(lote.costo_envio), lote.unidades + Math.max(v.unidades, 0));
}
