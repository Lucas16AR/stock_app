"use client";

import { SearchIcon } from "@/components/icons";

// Campo de búsqueda de los listados del admin, con lupa y ✕ para borrar.
export default function Buscador({
  valor,
  onCambiar,
  placeholder,
}: {
  valor: string;
  onCambiar: (valor: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="text"
        inputMode="search"
        enterKeyHint="search"
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-lg border border-input-border bg-card py-2 pl-9 pr-10 text-sm text-foreground outline-none focus:border-accent"
      />
      {valor && (
        <button
          type="button"
          onClick={() => onCambiar("")}
          aria-label="Borrar la búsqueda"
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-hover hover:text-foreground active:scale-90"
        >
          ✕
        </button>
      )}
    </div>
  );
}
