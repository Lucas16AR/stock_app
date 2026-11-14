// Clases compartidas de los botones del panel admin. Todos llevan
// `transition` + `active:scale-95` para que al tocar se note.

export const btnPrimario =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:cursor-wait disabled:opacity-70 disabled:active:scale-100";

export const btnSecundario =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-input-border px-3 py-1.5 text-sm text-muted transition hover:bg-hover hover:text-foreground active:scale-95 disabled:opacity-60";

// Botón de borrar en los listados: solo ícono, separado de "Editar".
export const btnBorrarIcono =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-accent/10 hover:text-accent active:scale-90";

export const btnIcono =
  "flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-hover hover:text-foreground active:scale-90";
