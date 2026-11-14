"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  cerrarAviso,
  desbloquearAudio,
  leerAvisos,
  leerAvisosServidor,
  suscribirAvisos,
  type TipoAviso,
} from "./avisar";

const ESTILO: Record<TipoAviso, { barra: string; icono: string; etiqueta: string }> = {
  exito: { barra: "bg-exito", icono: "✓", etiqueta: "Listo" },
  borrado: { barra: "bg-muted", icono: "−", etiqueta: "Borrado" },
  error: { barra: "bg-accent", icono: "!", etiqueta: "Error" },
};

// Contenedor de los avisos del panel. Va una sola vez, en el layout del
// panel admin. Abajo al centro en el celular (arriba taparían el header y
// el menú) y abajo a la derecha en pantallas anchas.
export default function Avisos() {
  const avisos = useSyncExternalStore(suscribirAvisos, leerAvisos, leerAvisosServidor);

  useEffect(() => {
    const alTocar = () => desbloquearAudio();
    window.addEventListener("pointerdown", alTocar, { once: true });
    window.addEventListener("keydown", alTocar, { once: true });
    return () => {
      window.removeEventListener("pointerdown", alTocar);
      window.removeEventListener("keydown", alTocar);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-3 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:items-end"
    >
      {avisos.map((a) => {
        const e = ESTILO[a.tipo];
        return (
          <div
            key={a.id}
            role={a.tipo === "error" ? "alert" : "status"}
            className="aviso-entrada pointer-events-auto flex w-full max-w-sm items-stretch overflow-hidden rounded-xl bg-card text-sm text-foreground shadow-lg shadow-black/15 ring-1 ring-border"
          >
            <span className={`w-1.5 shrink-0 ${e.barra}`} />
            <span
              aria-hidden
              className={`ml-3 mt-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${e.barra}`}
            >
              {e.icono}
            </span>
            <p className="flex-1 px-3 py-3">
              <span className="sr-only">{e.etiqueta}: </span>
              {a.texto}
            </p>
            <button
              type="button"
              onClick={() => cerrarAviso(a.id)}
              aria-label="Cerrar aviso"
              className="px-3 text-muted transition hover:text-foreground active:scale-90"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
