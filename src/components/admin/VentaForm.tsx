"use client";

import { Producto } from "@/lib/types";
import { registrarVenta } from "@/app/admin/(panel)/actions";
import FormAccion from "./FormAccion";
import BotonEnviar from "./BotonEnviar";
import { btnPrimario } from "./estilos";

export default function VentaForm({ productos }: { productos: Producto[] }) {
  return (
    <FormAccion
      accion={registrarVenta}
      limpiarAlTerminar
      className="grid max-w-2xl grid-cols-1 gap-3 rounded-2xl bg-card p-4 ring-1 ring-border sm:grid-cols-3"
    >
      <div className="sm:col-span-3">
        <label className="mb-1 block text-xs text-muted">Producto</label>
        <select
          name="producto_id"
          required
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          onChange={(e) => {
            const opt = e.target.selectedOptions[0];
            const precioInput = e.currentTarget.form?.elements.namedItem(
              "precio_venta"
            ) as HTMLInputElement | null;
            if (precioInput && opt?.dataset.precio) {
              precioInput.value = opt.dataset.precio;
            }
          }}
        >
          <option value="">Seleccioná un producto</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id} data-precio={p.precio_venta}>
              {p.nombre} (stock: {p.cantidad})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Cantidad</label>
        <input
          type="number"
          name="cantidad"
          min={1}
          required
          defaultValue={1}
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Precio de venta</label>
        <input
          type="number"
          step="0.01"
          name="precio_venta"
          required
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div className="flex items-end">
        <BotonEnviar textoPendiente="Registrando…" className={`${btnPrimario} w-full`}>
          Registrar venta
        </BotonEnviar>
      </div>
    </FormAccion>
  );
}
