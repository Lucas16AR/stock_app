"use client";

import { useState } from "react";
import { registrarCompra } from "@/app/admin/(panel)/actions";
import BotonEnviar from "./BotonEnviar";
import CamposCompra, { type LoteOpcion } from "./CamposCompra";
import FormAccion from "./FormAccion";
import { btnPrimario, btnSecundario } from "./estilos";

// "+ Sumar compra" en la edición de una gorra: una recompra en un lote
// (el envío lo reparte el lote) o sin lote (envío a mano).
export default function SumarCompra({
  productoId,
  lotes,
  inicial,
  abiertoInicial = false,
}: {
  productoId: number;
  lotes: LoteOpcion[];
  inicial: { precio: number; extra: number; ref: string | null };
  // Viene del aviso de duplicado al crear una gorra (?sumar=1).
  abiertoInicial?: boolean;
}) {
  const [abierto, setAbierto] = useState(abiertoInicial);

  if (!abierto) {
    return (
      <div>
        <button type="button" onClick={() => setAbierto(true)} className={`${btnPrimario} text-sm`}>
          + Sumar compra
        </button>
      </div>
    );
  }

  return (
    <FormAccion
      accion={registrarCompra}
      alTerminarBien={() => setAbierto(false)}
      className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border"
    >
      <h3 className="text-sm font-semibold text-foreground">Sumar una compra de esta gorra</h3>
      <input type="hidden" name="producto_id" value={productoId} />
      <CamposCompra
        idPrefijo="sumar"
        lotes={lotes}
        inicial={{ lote_id: lotes[0]?.id ?? null, unidades: 1, precio: inicial.precio, extra: inicial.extra, ref: inicial.ref }}
      />
      <div className="flex flex-wrap gap-2">
        <BotonEnviar textoPendiente="Sumando…" className={`${btnPrimario} text-sm`}>
          Sumar compra
        </BotonEnviar>
        <button type="button" onClick={() => setAbierto(false)} className={btnSecundario}>
          Cancelar
        </button>
      </div>
    </FormAccion>
  );
}
