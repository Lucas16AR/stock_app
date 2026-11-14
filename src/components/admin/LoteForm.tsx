import { Lote } from "@/lib/types";
import type { Resultado } from "@/lib/acciones";
import FormAccion from "./FormAccion";
import BotonEnviar from "./BotonEnviar";
import { btnPrimario } from "./estilos";

export default function LoteForm({
  lote,
  action,
}: {
  lote?: Lote;
  action: (formData: FormData) => Promise<Resultado>;
}) {
  return (
    <FormAccion accion={action} className="flex max-w-md flex-col gap-4">
      <div>
        <label className="mb-1 block text-xs text-muted">Costo de envío</label>
        <input
          type="number"
          step="0.01"
          name="costo_envio"
          defaultValue={lote?.costo_envio ?? 0}
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Nota (opcional)</label>
        <input
          name="nota"
          defaultValue={lote?.nota ?? ""}
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <BotonEnviar textoPendiente="Guardando…" className={`${btnPrimario} mt-2`}>
        Guardar lote
      </BotonEnviar>
    </FormAccion>
  );
}
