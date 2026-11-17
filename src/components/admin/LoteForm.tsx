import { Lote } from "@/lib/types";
import type { Resultado } from "@/lib/acciones";
import { diaAR } from "@/lib/fechas";
import FormAccion from "./FormAccion";
import BotonEnviar from "./BotonEnviar";
import { btnPrimario } from "./estilos";

const campo =
  "w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export default function LoteForm({
  lote,
  hoy,
  action,
}: {
  lote?: Lote;
  // Hoy en hora argentina ("AAAA-MM-DD"): valor por defecto y tope de la fecha.
  hoy: string;
  action: (formData: FormData) => Promise<Resultado>;
}) {
  const diaLote = lote ? diaAR(lote.fecha) : hoy;

  return (
    <FormAccion accion={action} className="flex max-w-md flex-col gap-4">
      <div>
        <label htmlFor="lote-fecha" className="mb-1 block text-xs text-muted">Fecha de la compra</label>
        <input id="lote-fecha" type="date" name="fecha" required max={hoy} defaultValue={diaLote} className={campo} />
        {/* Al editar: si el día no cambia, la fecha guardada no se toca. */}
        {lote && <input type="hidden" name="fecha_original" value={diaLote} />}
      </div>
      <div>
        <label htmlFor="lote-envio" className="mb-1 block text-xs text-muted">Costo de envío del lote</label>
        <input
          id="lote-envio"
          type="number"
          step="0.01"
          min={0}
          name="costo_envio"
          defaultValue={lote?.costo_envio ?? 0}
          className={campo}
        />
        <p className="mt-1 text-xs text-muted">Se reparte solo entre las gorras del lote, por unidad.</p>
      </div>
      <div>
        <label htmlFor="lote-nota" className="mb-1 block text-xs text-muted">Nota (opcional)</label>
        <input id="lote-nota" name="nota" defaultValue={lote?.nota ?? ""} className={campo} />
      </div>
      <BotonEnviar textoPendiente="Guardando…" className={`${btnPrimario} mt-2`}>
        Guardar lote
      </BotonEnviar>
    </FormAccion>
  );
}
