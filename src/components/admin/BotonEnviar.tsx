"use client";

import { createContext, useContext } from "react";
import { useFormStatus } from "react-dom";
import { btnPrimario } from "./estilos";

// FormAccion publica acá si su acción está en curso. Si el botón está
// dentro de un <form action={...}> común (ej. el login), se usa
// useFormStatus en su lugar.
export const PendienteContext = createContext<boolean | null>(null);

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`${className} animate-spin`}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Botón de envío con reacción: mientras la acción corre queda deshabilitado
// (no se puede tocar dos veces) y muestra un spinner con `textoPendiente`.
export default function BotonEnviar({
  children,
  textoPendiente,
  className = btnPrimario,
  disabled,
}: {
  children: React.ReactNode;
  textoPendiente: string;
  className?: string;
  disabled?: boolean;
}) {
  const desdeContexto = useContext(PendienteContext);
  const { pending } = useFormStatus();
  const pendiente = desdeContexto ?? pending;

  return (
    <button type="submit" disabled={pendiente || disabled} aria-busy={pendiente} className={className}>
      {pendiente ? (
        <>
          <Spinner />
          {textoPendiente}
        </>
      ) : (
        children
      )}
    </button>
  );
}
