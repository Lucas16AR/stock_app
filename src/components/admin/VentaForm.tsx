"use client";

import { useActionState } from "react";
import { Producto } from "@/lib/types";
import { precioSugerido } from "@/lib/pricing";
import { registrarVenta } from "@/app/admin/(panel)/actions";

type State = { error: string | null } | undefined;

async function action(_prev: State, formData: FormData): Promise<State> {
  const result = await registrarVenta(formData);
  return result ?? { error: null };
}

export default function VentaForm({ productos }: { productos: Producto[] }) {
  const [state, formAction, pending] = useActionState<State, FormData>(action, undefined);

  return (
    <form
      action={formAction}
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
            <option key={p.id} value={p.id} data-precio={precioSugerido(p)}>
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
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Registrando..." : "Registrar venta"}
        </button>
      </div>
      {state?.error && (
        <p className="sm:col-span-3 text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </form>
  );
}
