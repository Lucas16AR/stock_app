import { Categoria, Producto } from "@/lib/types";
import { costoTotal, formatARS, fotoUrl } from "@/lib/pricing";
import { SUPABASE_URL } from "@/lib/config";
import { eliminarFoto } from "@/app/admin/(panel)/actions";
import { MAX_FOTOS_POR_PRODUCTO } from "@/lib/fotos";
import type { Resultado } from "@/lib/acciones";
import PrecioCalculado from "./PrecioCalculado";
import PrimeraCompra from "./PrimeraCompra";
import NombreConAviso, { type GorraParecida } from "./NombreConAviso";
import type { LoteOpcion } from "./CamposCompra";
import FotosInput from "./FotosInput";
import FormAccion from "./FormAccion";
import BotonEnviar from "./BotonEnviar";
import BotonBorrar from "./BotonBorrar";
import CampoVisible from "./CampoVisible";
import { btnPrimario } from "./estilos";

const campo = "w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent";

// Formulario de una gorra. El stock, los costos y el lote no se editan
// acá: salen de sus compras (migración 006).
// - Gorra nueva (`nueva`): trae la primera compra y el aviso de posible
//   duplicado. Si se vino desde un lote, vuelve a ese lote al guardar.
// - Edición (`producto` + `unidades`): stock y costos de solo lectura; las
//   compras se corrigen o se suman debajo del formulario.
export default function ProductForm({
  producto,
  unidades,
  nueva,
  categorias,
  action,
}: {
  producto?: Producto;
  unidades?: { compradas: number; vendidas: number };
  nueva?: { lotes: LoteOpcion[]; loteInicial: number | null; existentes: GorraParecida[] };
  categorias: Categoria[];
  action: (formData: FormData) => Promise<Resultado>;
}) {
  const categoriaIds = new Set(producto?.categorias?.map((c) => c.id));

  return (
    <FormAccion accion={action} className="flex max-w-2xl flex-col gap-4">
      {nueva ? (
        <>
          <NombreConAviso existentes={nueva.existentes} lote={nueva.loteInicial} />
          {nueva.loteInicial && <input type="hidden" name="volver_al_lote" value={nueva.loteInicial} />}
        </>
      ) : (
        <>
          <div>
            <label htmlFor="producto-nombre" className="mb-1 block text-xs text-muted">Nombre *</label>
            <input id="producto-nombre" name="nombre" required defaultValue={producto?.nombre} className={campo} />
          </div>
          <div>
            <label htmlFor="producto-ref" className="mb-1 block text-xs text-muted">
              Referencia interna — no se muestra en la página
            </label>
            <input
              id="producto-ref"
              name="ref_interna"
              defaultValue={producto?.ref_interna ?? ""}
              placeholder="Ej. AFA 12"
              className={`${campo} border-dashed`}
            />
          </div>
        </>
      )}

      <div>
        <label htmlFor="producto-descripcion" className="mb-1 block text-xs text-muted">Descripción</label>
        <textarea
          id="producto-descripcion"
          name="descripcion"
          rows={3}
          defaultValue={producto?.descripcion ?? ""}
          className={campo}
        />
      </div>

      {nueva ? (
        <PrimeraCompra lotes={nueva.lotes} loteInicial={nueva.loteInicial} />
      ) : (
        producto && (
          <>
            <div className="flex flex-col gap-1 rounded-2xl bg-card px-4 py-3 text-sm ring-1 ring-border">
              <p className="text-foreground">
                <span className="font-semibold">Stock {producto.cantidad}</span>
                {unidades && (
                  <span className="text-muted">
                    {" · "}compradas {unidades.compradas} · vendidas {unidades.vendidas}
                  </span>
                )}
              </p>
              <p className="text-muted">
                Costo promedio por unidad: compra {formatARS(producto.precio_compra)} + envío{" "}
                {formatARS(producto.costo_envio_unitario)} + extra {formatARS(producto.costo_extra)} ={" "}
                <span className="font-semibold text-foreground">{formatARS(costoTotal(producto))}</span>
              </p>
              <p className="text-xs text-muted">
                Salen de sus compras (abajo): se cambian corrigiendo o sumando compras, no a mano.
              </p>
            </div>
            <PrecioCalculado
              costo={costoTotal(producto)}
              margenInicial={producto.margen}
              precioVentaInicial={producto.precio_venta}
            />
          </>
        )
      )}

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

      <CampoVisible inicial={producto?.visible_publico ?? true} />

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
                {/* Botón común (type="button") que abre la confirmación: no
                    puede ser un <form> propio porque quedaría anidado dentro
                    del form del producto. */}
                <BotonBorrar
                  accion={eliminarFoto.bind(null, f.id, producto.id)}
                  etiqueta="Borrar esta foto"
                  titulo="¿Borrar esta foto?"
                  detalle="Se borra de la gorra y de la tienda. No se puede deshacer. Lo demás que hayas cambiado en el formulario no se pierde."
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs text-white shadow transition active:scale-90"
                >
                  ✕
                </BotonBorrar>
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

      <BotonEnviar textoPendiente="Guardando…" className={`${btnPrimario} mt-2`}>
        Guardar producto
      </BotonEnviar>
    </FormAccion>
  );
}
