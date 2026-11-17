"use client";

import { useState } from "react";
import { precioSugerido, formatARS } from "@/lib/pricing";

// Margen, precio sugerido y precio de venta de una gorra. El costo por
// unidad viene armado: al editar, el promedio de sus compras (no se toca
// acá); en una gorra nueva, el de la primera compra que se está cargando.
export default function PrecioCalculado({
  costo,
  margenInicial,
  precioVentaInicial,
}: {
  costo: number;
  margenInicial: number;
  precioVentaInicial: number | null;
}) {
  const [margen, setMargen] = useState(margenInicial);
  const sugerido = precioSugerido({ precio_compra: costo, costo_envio_unitario: 0, costo_extra: 0, margen });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div>
        <label htmlFor="producto-margen" className="mb-1 block text-xs text-muted">
          Margen (0.5 = 50%)
        </label>
        <input
          id="producto-margen"
          type="number"
          step="0.01"
          min={0}
          max={5}
          name="margen"
          value={margen}
          onChange={(e) => setMargen(Number(e.target.value))}
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col justify-center rounded-lg bg-card px-3 py-2 ring-1 ring-border">
        <span className="text-xs text-muted">Precio sugerido (referencia, no se muestra al cliente)</span>
        <span className="text-lg font-semibold text-foreground">{formatARS(sugerido)}</span>
      </div>
      <div>
        <label htmlFor="producto-precio-venta" className="mb-1 block text-xs text-muted">Precio de venta *</label>
        <input
          id="producto-precio-venta"
          type="number"
          step="0.01"
          name="precio_venta"
          required
          defaultValue={precioVentaInicial ?? sugerido}
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
    </div>
  );
}
