"use client";

// Chips de filtro con contador. En el celular se deslizan de costado (sin
// mover la página); en la compu se acomodan en varias líneas.
export default function FiltrosRapidos({
  opciones,
  activo,
  onElegir,
}: {
  opciones: { id: string; etiqueta: string; cantidad: number }[];
  activo: string;
  onElegir: (id: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Filtros"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {opciones.map((o) => {
        const elegido = o.id === activo;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={elegido}
            onClick={() => onElegir(o.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition active:scale-95 ${
              elegido
                ? "bg-accent font-semibold text-white"
                : "border border-input-border text-muted hover:bg-hover hover:text-foreground"
            }`}
          >
            {o.etiqueta}
            <span className={`text-xs ${elegido ? "text-white/80" : "text-muted"}`}>{o.cantidad}</span>
          </button>
        );
      })}
    </div>
  );
}
