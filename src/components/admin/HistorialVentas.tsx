import { anularVenta } from "@/app/admin/(panel)/actions";
import { UndoIcon } from "@/components/icons";
import { formatFecha, formatFechaCorta } from "@/lib/fechas";
import { formatARS } from "@/lib/pricing";
import BotonBorrar from "./BotonBorrar";
import MiniaturaProducto from "./MiniaturaProducto";
import { btnBorrarIcono } from "./estilos";

export type FilaVenta = {
  id: number;
  nombre: string;
  ref_interna: string | null;
  foto: string | null;
  visible: boolean;
  cantidad: number;
  precio: number;
  fecha: string;
};

const GRILLA =
  "md:grid md:grid-cols-[4rem_minmax(0,1fr)_6.5rem_4rem_7rem_7rem_2.5rem] md:items-center md:gap-4";

// Historial de ventas: tarjetas en el celular, grilla tipo tabla en la
// compu. Cada venta se puede anular (vuelve al stock).
export default function HistorialVentas({ ventas }: { ventas: FilaVenta[] }) {
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-border">
      <div className={`hidden bg-card px-4 py-2 text-sm text-muted ${GRILLA}`}>
        <span />
        <span>Gorra</span>
        <span>Fecha</span>
        <span>Cant.</span>
        <span>Precio</span>
        <span>Total</span>
        <span />
      </div>
      <ul>
        {ventas.map((v) => (
          <FilaHistorial key={v.id} v={v} />
        ))}
      </ul>
      {ventas.length === 0 && (
        <p className="bg-card px-4 py-8 text-center text-sm text-muted">Todavía no hay ventas registradas.</p>
      )}
    </div>
  );
}

function FilaHistorial({ v }: { v: FilaVenta }) {
  const quien = `«${v.nombre}»${v.ref_interna ? ` (${v.ref_interna})` : ""}`;
  const vuelve = v.cantidad === 1 ? "La gorra vuelve al stock (+1)" : `Vuelven ${v.cantidad} unidades al stock`;
  const tienda = v.visible
    ? " y, como está publicada, vuelve a aparecer disponible en la tienda."
    : ". Está oculta: no aparece en la tienda hasta que la publiques.";

  return (
    <li
      className={`flex items-center gap-3 border-t border-border bg-card px-3 py-2.5 first:border-t-0 md:px-4 md:first:border-t ${GRILLA}`}
    >
      <MiniaturaProducto path={v.foto} />

      <div className="min-w-0 flex-1 md:contents">
        <div className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">{v.nombre}</span>
          {v.ref_interna && <span className="block truncate text-xs text-muted">{v.ref_interna}</span>}
        </div>
        {/* En el celular: fecha y "2 × $ 12.000" en una línea, debajo del nombre. */}
        <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted md:contents md:text-sm">
          <span>{formatFecha(v.fecha)}</span>
          <span className="md:text-foreground">
            {v.cantidad}
            <span className="md:hidden"> ×</span>
          </span>
          <span className="md:text-foreground">{formatARS(v.precio)}</span>
        </div>
        <span className="hidden text-sm font-semibold text-accent md:block">{formatARS(v.precio * v.cantidad)}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:contents">
        <span className="text-sm font-semibold text-accent md:hidden">{formatARS(v.precio * v.cantidad)}</span>
        <BotonBorrar
          accion={anularVenta.bind(null, v.id)}
          etiqueta={`Anular la venta de ${quien}`}
          titulo={`¿Anular la venta de ${quien} del ${formatFechaCorta(v.fecha)}?`}
          detalle={`${vuelve}${tienda}`}
          textoConfirmar="Anular venta"
          textoPendiente="Anulando…"
          className={btnBorrarIcono}
        >
          <UndoIcon className="h-[18px] w-[18px]" />
        </BotonBorrar>
      </div>
    </li>
  );
}
