import { Categoria, Lote, Producto } from "@/lib/types";
import { fotoUrl } from "@/lib/pricing";
import { SUPABASE_URL } from "@/lib/config";
import { eliminarFoto } from "@/app/admin/(panel)/actions";
import PrecioCalculado from "./PrecioCalculado";
import FotosInput from "./FotosInput";
import { MAX_FOTOS_POR_PRODUCTO } from "@/lib/fotos";

export default function ProductForm({
  producto,
  categorias,
  lotes,
  action,
}: {
  producto?: Producto;
  categorias: Categoria[];
  lotes: Lote[];
  action: (formData: FormData) => void;
}) {
  const categoriaIds = new Set(producto?.categorias?.map((c) => c.id));

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      <div>
        <label className="mb-1 block text-xs text-muted">Nombre *</label>
        <input
          name="nombre"
          required
          defaultValue={producto?.nombre}
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted">Descripción</label>
        <textarea
          name="descripcion"
          rows={3}
          defaultValue={producto?.descripcion ?? ""}
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted">
          Referencia interna — no se muestra en la página
        </label>
        <input
          name="ref_interna"
          defaultValue={producto?.ref_interna ?? ""}
          placeholder="Ej. AFA 12"
          className="w-full rounded-lg border border-dashed border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs text-muted">Stock *</label>
          <input
            type="number"
            name="cantidad"
            min={0}
            required
            defaultValue={producto?.cantidad ?? 0}
            className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Lote</label>
          <select
            name="lote_id"
            defaultValue={producto?.lote_id ?? ""}
            className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Sin lote</option>
            {lotes.map((l) => (
              <option key={l.id} value={l.id}>
                Lote #{l.id} — {new Date(l.fecha).toLocaleDateString("es-AR")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <PrecioCalculado
        precioCompraInicial={producto?.precio_compra ?? 0}
        envioInicial={producto?.costo_envio_unitario ?? 0}
        extraInicial={producto?.costo_extra ?? 0}
        margenInicial={producto?.margen ?? 0.5}
        precioVentaInicial={producto?.precio_venta ?? null}
      />

      <div>
        <label className="mb-1 block text-xs text-muted">Categorías</label>
        <div className="flex flex-wrap gap-3">
          {categorias.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5 text-sm text-muted">
              <input
                type="checkbox"
                name="categorias"
                value={c.id}
                defaultChecked={categoriaIds.has(c.id)}
              />
              {c.nombre}
            </label>
          ))}
          {categorias.length === 0 && (
            <p className="text-sm text-muted">No hay categorías creadas todavía.</p>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          name="visible_publico"
          defaultChecked={producto?.visible_publico ?? true}
        />
        Visible en el showroom público
      </label>

      {producto && producto.fotos_producto && producto.fotos_producto.length > 0 && (
        <div>
          <label className="mb-1 block text-xs text-muted">Fotos actuales</label>
          <div className="flex flex-wrap gap-3">
            {producto.fotos_producto.map((f) => (
              <div key={f.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fotoUrl(SUPABASE_URL, f.path)}
                  alt=""
                  className="h-24 w-24 rounded-lg object-cover ring-1 ring-border"
                />
                {/* No puede ser un <form> propio: quedaría anidado dentro del
                    form del producto (HTML no lo permite y el ✕ terminaba
                    guardando el producto). formAction hace que este botón
                    envíe el form exterior a otra acción. */}
                <button
                  type="submit"
                  formAction={eliminarFoto.bind(null, f.id, producto.id)}
                  formNoValidate
                  aria-label="Borrar foto"
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-white"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs text-muted">
          Agregar fotos (máx. {MAX_FOTOS_POR_PRODUCTO} en total, se achican solas)
        </label>
        <FotosInput
          restantes={MAX_FOTOS_POR_PRODUCTO - (producto?.fotos_producto?.length ?? 0)}
        />
      </div>

      <button
        type="submit"
        className="mt-2 rounded-lg bg-accent px-4 py-2 font-semibold text-white"
      >
        Guardar producto
      </button>
    </form>
  );
}
