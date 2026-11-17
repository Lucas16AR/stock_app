"use client";

import { useState } from "react";
import { formatARS } from "@/lib/pricing";
import CamposCompra, { envioEstimado, type LoteOpcion, type ValoresCompra } from "./CamposCompra";
import PrecioCalculado from "./PrecioCalculado";

// Gorra nueva: su primera compra (lote, unidades = stock inicial, precio,
// extra y, sin lote, envío) y el precio, con el sugerido calculado sobre
// el costo de esa compra. La ref. de la compra es la de la gorra.
export default function PrimeraCompra({ lotes, loteInicial }: { lotes: LoteOpcion[]; loteInicial: number | null }) {
  const [v, setV] = useState<ValoresCompra>({ lote_id: loteInicial, unidades: 1, precio: 0, extra: 0, envio: 0 });
  const envio = envioEstimado(v, lotes);
  const costo = (v.precio || 0) + (v.extra || 0) + envio;

  return (
    <>
      <fieldset className="flex flex-col gap-3 rounded-2xl p-4 ring-1 ring-border">
        <legend className="px-1 text-sm font-semibold text-foreground">Primera compra</legend>
        <p className="text-xs text-muted">
          Las unidades son el stock inicial. Si después recomprás esta gorra, sumale otra compra desde el lote o
          desde su edición: no crees una gorra repetida.
        </p>
        <CamposCompra idPrefijo="primera" lotes={lotes} inicial={{ lote_id: loteInicial }} conRef={false} onCambio={setV} />
        <p className="text-xs text-muted">
          Costo por unidad: {formatARS(v.precio || 0)} + {formatARS(envio)} de envío + {formatARS(v.extra || 0)} de extra ={" "}
          <span className="font-semibold text-foreground">{formatARS(costo)}</span>
        </p>
      </fieldset>
      <PrecioCalculado costo={costo} margenInicial={0.5} precioVentaInicial={null} />
    </>
  );
}
