"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { Orden } from "@/lib/catalogo";

const ORDENES: { value: Orden; label: string }[] = [
  { value: "nuevas", label: "Más nuevas" },
  { value: "precio-asc", label: "Más baratas" },
  { value: "precio-desc", label: "Más caras" },
];

// Buscador + orden. Escribe en la URL (?q=&orden=) para que el filtrado
// lo haga el server y el link se pueda compartir tal cual.
export default function CatalogControls({
  q,
  orden,
  categoria,
}: {
  q: string;
  orden: Orden;
  categoria?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [texto, setTexto] = useState(q);
  const [pending, startTransition] = useTransition();
  const primerRender = useRef(true);

  function navegar(nuevoQ: string, nuevoOrden: Orden) {
    const params = new URLSearchParams();
    if (categoria) params.set("categoria", String(categoria));
    if (nuevoQ.trim()) params.set("q", nuevoQ.trim());
    if (nuevoOrden !== "nuevas") params.set("orden", nuevoOrden);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  // Búsqueda con un pequeño debounce mientras se escribe.
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    const t = setTimeout(() => navegar(texto, orden), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  return (
    <div className="flex gap-2 px-4">
      <label className="relative flex-1">
        <span className="sr-only">Buscar gorras</span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-current stroke-2 text-muted"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar gorras…"
          className="h-11 w-full rounded-full bg-card pl-10 pr-4 text-sm text-foreground ring-1 ring-border outline-none transition placeholder:text-muted focus:ring-2 focus:ring-accent"
        />
        {pending && (
          <span
            aria-hidden
            className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-muted border-t-transparent"
          />
        )}
      </label>
      <label className="relative">
        <span className="sr-only">Ordenar</span>
        <select
          value={orden}
          onChange={(e) => navegar(texto, e.target.value as Orden)}
          className="h-11 appearance-none rounded-full bg-card pl-4 pr-9 text-sm font-medium text-foreground ring-1 ring-border outline-none transition focus:ring-2 focus:ring-accent"
        >
          {ORDENES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-current stroke-2 text-muted"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </label>
    </div>
  );
}
