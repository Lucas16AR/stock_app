"use client";

import { useSyncExternalStore } from "react";
import { SpeakerIcon, SpeakerOffIcon } from "@/components/icons";
import { alternarSonido, sonidoActivado, sonidoActivadoServidor, suscribirSonido } from "./avisar";
import { btnIcono } from "./estilos";

// Activa/silencia los sonidos de los avisos. Se guarda en localStorage.
export default function BotonSonido() {
  const activado = useSyncExternalStore(suscribirSonido, sonidoActivado, sonidoActivadoServidor);
  const etiqueta = activado ? "Silenciar sonidos" : "Activar sonidos";

  return (
    <button
      type="button"
      onClick={alternarSonido}
      aria-label={etiqueta}
      aria-pressed={!activado}
      title={etiqueta}
      className={btnIcono}
    >
      {activado ? <SpeakerIcon /> : <SpeakerOffIcon />}
    </button>
  );
}
