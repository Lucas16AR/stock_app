import { Categoria, Lote, Producto } from "@/lib/types";
import { fotoUrl } from "@/lib/pricing";
import { SUPABASE_URL } from "@/lib/config";
import { eliminarFoto } from "@/app/admin/(panel)/actions";

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
        <label className="mb-1 block text-xs text-neutral-400">Nombre *</label>
        <input
          name="nombre"
          required
          defaultValue={producto?.nombre}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-neutral-400">Descripción</label>
        <textarea
          name="descripcion"
          rows={3}
          defaultValue={producto?.descripcion ?? ""}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Stock *</label>
          <input
            type="number"
            name="cantidad"
            min={0}
            required
            defaultValue={producto?.cantidad ?? 0}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Precio compra</label>
          <input
            type="number"
            step="0.01"
            name="precio_compra"
            defaultValue={producto?.precio_compra ?? 0}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Envío unitario</label>
          <input
            type="number"
            step="0.01"
            name="costo_envio_unitario"
            defaultValue={producto?.costo_envio_unitario ?? 0}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Costo extra</label>
          <input
            type="number"
            step="0.01"
            name="costo_extra"
            defaultValue={producto?.costo_extra ?? 0}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs text-neutral-400">
            Margen (0.5 = 50%)
          </label>
          <input
            type="number"
            step="0.01"
            min={0}
            max={5}
            name="margen"
            defaultValue={producto?.margen ?? 0.5}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Lote</label>
          <select
            name="lote_id"
            defaultValue={producto?.lote_id ?? ""}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-accent"
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

      <div>
        <label className="mb-1 block text-xs text-neutral-400">Categorías</label>
        <div className="flex flex-wrap gap-3">
          {categorias.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5 text-sm text-neutral-300">
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
            <p className="text-sm text-neutral-500">No hay categorías creadas todavía.</p>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input
          type="checkbox"
          name="visible_publico"
          defaultChecked={producto?.visible_publico ?? true}
        />
        Visible en el showroom público
      </label>

      {producto && producto.fotos_producto && producto.fotos_producto.length > 0 && (
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Fotos actuales</label>
          <div className="flex flex-wrap gap-3">
            {producto.fotos_producto.map((f) => (
              <div key={f.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fotoUrl(SUPABASE_URL, f.path)}
                  alt=""
                  className="h-24 w-24 rounded-lg object-cover ring-1 ring-neutral-800"
                />
                <form
                  action={async () => {
                    "use server";
                    await eliminarFoto(f.id, producto.id);
                  }}
                  className="absolute -right-2 -top-2"
                >
                  <button className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                    ✕
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs text-neutral-400">
          Agregar fotos (máx. 4 en total)
        </label>
        <input
          type="file"
          name="fotos"
          multiple
          accept="image/*"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-300"
        />
      </div>

      <button
        type="submit"
        className="mt-2 rounded-lg bg-accent px-4 py-2 font-semibold text-neutral-950"
      >
        Guardar producto
      </button>
    </form>
  );
}
