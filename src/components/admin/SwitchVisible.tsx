"use client";

import { useOptimistic, useTransition } from "react";
import { cambiarVisible } from "@/app/admin/(panel)/actions";
import { MENSAJE_SIN_PRECIO } from "@/lib/acciones";
import { avisar } from "./avisar";
import Interruptor from "./Interruptor";

// Publica u oculta una gorra desde el listado, sin entrar a editarla.
// Cambia al instante (optimista). Si la acción falla, al terminar vuelve
// solo al valor que tiene la base y aparece el aviso de error.
export default function SwitchVisible({
  id,
  nombre,
  visible,
  sinPrecio,
}: {
  id: number;
  nombre: string;
  visible: boolean;
  sinPrecio: boolean;
}) {
  const [optimista, setOptimista] = useOptimistic(visible);
  const [, startTransition] = useTransition();

  function alternar() {
    const nuevo = !optimista;
    if (nuevo && sinPrecio) {
      avisar.error(MENSAJE_SIN_PRECIO);
      return;
    }
    startTransition(async () => {
      setOptimista(nuevo);
      try {
        const r = await cambiarVisible(id, nuevo);
        if (r.ok) avisar.exito(r.mensaje);
        else avisar.error(r.error);
      } catch {
        avisar.error("No se pudo completar: se cortó la conexión o el servidor no respondió. Probá de nuevo.");
      }
    });
  }

  return (
    <Interruptor
      activo={optimista}
      onCambiar={alternar}
      etiqueta={`${optimista ? "Ocultar" : "Publicar"} «${nombre}» en la tienda`}
    />
  );
}
