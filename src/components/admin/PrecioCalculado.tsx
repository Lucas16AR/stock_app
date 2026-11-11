"use client";

import { useState } from "react";
import { precioSugerido, formatARS } from "@/lib/pricing";

export default function PrecioCalculado({
  precioCompraInicial,
  envioInicial,
  extraInicial,
  margenInicial,
  precioVentaInicial,
}: {
  precioCompraInicial: number;
  envioInicial: number;
  extraInicial: number;
  margenInicial: number;
  precioVentaInicial: number | null;
}) {
  const [precioCompra, setPrecioCompra] = useState(precioCompraInicial);
  const [envio, setEnvio] = useState(envioInicial);
  const [extra, setExtra] = useState(extraInicial);
  const [margen, setMargen] = useState(margenInicial);

  const sugerido = precioSugerido({
    precio_compra: precioCompra,
    costo_envio_unitario: envio,
    costo_extra: extra,
    margen,
  });

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs text-muted">Precio compra</label>
          <input
            type="number"
            step="0.01"
            name="precio_compra"
            value={precioCompra}
            onChange={(e) => setPrecioCompra(Number(e.target.value))}
            className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Envío unitario</label>
          <input
            type="number"
            step="0.01"
            name="costo_envio_unitario"
            value={envio}
            onChange={(e) => setEnvio(Number(e.target.value))}
            className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Costo extra</label>
          <input
            type="number"
            step="0.01"
            name="costo_extra"
            value={extra}
            onChange={(e) => setExtra(Number(e.target.value))}
            className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">
            Margen (0.5 = 50%)
          </label>
          <input
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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col justify-center rounded-lg bg-card px-3 py-2 ring-1 ring-border">
          <span className="text-xs text-muted">Precio sugerido (referencia, no se muestra al cliente)</span>
          <span className="text-lg font-semibold text-foreground">{formatARS(sugerido)}</span>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Precio de venta *</label>
          <input
            type="number"
            step="0.01"
            name="precio_venta"
            required
            defaultValue={precioVentaInicial ?? sugerido}
            className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>
    </>
  );
}
