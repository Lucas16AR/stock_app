"use client";

// Interruptor (switch) del admin. Solo dibuja: quien lo usa decide qué
// pasa al tocarlo (SwitchVisible llama a la acción; CampoVisible cambia un
// campo del formulario).
export default function Interruptor({
  activo,
  onCambiar,
  etiqueta,
  id,
}: {
  activo: boolean;
  onCambiar: () => void;
  etiqueta?: string;
  id?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={activo}
      aria-label={etiqueta}
      title={etiqueta}
      onClick={onCambiar}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        activo ? "bg-exito" : "bg-input-border"
      }`}
    >
      <span
        aria-hidden
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          activo ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
