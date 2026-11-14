"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Resultado } from "@/lib/acciones";
import { TrashIcon } from "@/components/icons";
import { avisar } from "./avisar";
import { Spinner } from "./BotonEnviar";
import { btnBorrarIcono } from "./estilos";

// Botón de borrar + diálogo de confirmación con estilo de la marca (no
// window.confirm). Sirve para toda acción destructiva del panel.
//
// - `titulo`: la pregunta ("¿Borrar el lote #3?").
// - `detalle`: las consecuencias ("Tiene 12 gorras: van a quedar sin lote.").
// - `bloqueo`: si viene, no se ofrece borrar; el diálogo explica por qué y
//   qué hacer en su lugar (ej. producto con ventas → ocultarlo).
//
// El foco arranca en "Cancelar" y Escape cierra sin borrar.
export default function BotonBorrar({
  accion,
  titulo,
  detalle,
  bloqueo,
  etiqueta,
  className = btnBorrarIcono,
  children,
}: {
  accion: () => Promise<Resultado>;
  titulo: string;
  detalle?: string;
  bloqueo?: string;
  etiqueta: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const cancelar = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  function abrir() {
    dialogo.current?.showModal();
    cancelar.current?.focus();
  }

  function cerrar() {
    if (!pendiente) dialogo.current?.close();
  }

  function borrar() {
    startTransition(async () => {
      try {
        const r = await accion();
        if (r.ok) {
          avisar.borrado(r.mensaje);
          dialogo.current?.close();
          if (r.redirigirA) router.push(r.redirigirA);
        } else {
          avisar.error(r.error);
          dialogo.current?.close();
        }
      } catch {
        avisar.error("No se pudo borrar: se cortó la conexión o el servidor no respondió. Probá de nuevo.");
        dialogo.current?.close();
      }
    });
  }

  return (
    <>
      <button type="button" onClick={abrir} aria-label={etiqueta} title={etiqueta} className={className}>
        {children ?? <TrashIcon className="h-[18px] w-[18px]" />}
      </button>

      <dialog
        ref={dialogo}
        className="confirmacion aviso-entrada m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-card p-0 text-left text-foreground shadow-xl ring-1 ring-border"
        onCancel={(e) => {
          if (pendiente) e.preventDefault(); // mientras borra no se cierra
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) cerrar(); // toque en el fondo
        }}
      >
        <div className="p-5">
          <h2 className="text-base font-semibold text-foreground">{bloqueo ? "No se puede borrar" : titulo}</h2>
          {(bloqueo ?? detalle) && (
            <p className="mt-2 text-sm leading-relaxed text-muted">{bloqueo ?? detalle}</p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button
              ref={cancelar}
              type="button"
              onClick={cerrar}
              disabled={pendiente}
              className="rounded-lg border border-input-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-hover active:scale-95 disabled:opacity-60"
            >
              {bloqueo ? "Entendido" : "Cancelar"}
            </button>
            {!bloqueo && (
              <button
                type="button"
                onClick={borrar}
                disabled={pendiente}
                aria-busy={pendiente}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:cursor-wait disabled:opacity-80"
              >
                {pendiente ? (
                  <>
                    <Spinner />
                    Borrando…
                  </>
                ) : (
                  "Borrar"
                )}
              </button>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
