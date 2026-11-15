"use client";

import { useState } from "react";
import Interruptor from "./Interruptor";

// El mismo interruptor del listado, dentro del formulario de producto.
// Manda `visible_publico=on` cuando está prendido, igual que el checkbox
// que reemplaza.
export default function CampoVisible({ inicial }: { inicial: boolean }) {
  const [activo, setActivo] = useState(inicial);

  return (
    <div className="flex items-center gap-3">
      <Interruptor id="visible_publico" activo={activo} onCambiar={() => setActivo(!activo)} />
      <label htmlFor="visible_publico" className="cursor-pointer text-sm text-muted">
        {activo ? (
          <span className="font-semibold text-foreground">Visible en la tienda</span>
        ) : (
          "Oculta: no se ve en la tienda"
        )}
      </label>
      {activo && <input type="hidden" name="visible_publico" value="on" />}
    </div>
  );
}
