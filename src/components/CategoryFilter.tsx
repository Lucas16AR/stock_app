import Link from "next/link";
import { Categoria } from "@/lib/types";

// Chips de categoría. En mobile se deslizan de costado en una sola fila
// en vez de ocupar media pantalla. Conservan la búsqueda y el orden.
export default function CategoryFilter({
  categorias,
  activa,
  conteo,
  q,
  orden,
}: {
  categorias: Categoria[];
  activa?: number;
  conteo: Record<number, number>;
  q: string;
  orden: string;
}) {
  if (categorias.length === 0) return null;

  function href(categoriaId?: number) {
    const params = new URLSearchParams();
    if (categoriaId) params.set("categoria", String(categoriaId));
    if (q) params.set("q", q);
    if (orden !== "nuevas") params.set("orden", orden);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  const chip = (seleccionada: boolean) =>
    `flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
      seleccionada
        ? "bg-accent text-white"
        : "bg-card text-muted ring-1 ring-border hover:text-foreground hover:ring-accent"
    }`;

  // Solo categorías con gorras cargadas, para no mostrar chips vacíos.
  const visibles = categorias.filter((c) => (conteo[c.id] ?? 0) > 0 || c.id === activa);

  return (
    <nav
      aria-label="Categorías"
      className="-mx-2 flex gap-2 overflow-x-auto px-6 py-3 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden"
    >
      <Link href={href()} scroll={false} className={chip(!activa)} aria-current={!activa ? "page" : undefined}>
        Todas
      </Link>
      {visibles.map((c) => (
        <Link
          key={c.id}
          href={href(c.id)}
          scroll={false}
          className={chip(activa === c.id)}
          aria-current={activa === c.id ? "page" : undefined}
        >
          {c.nombre}
          <span className={`text-xs ${activa === c.id ? "text-white/75" : "text-muted/70"}`}>
            {conteo[c.id] ?? 0}
          </span>
        </Link>
      ))}
    </nav>
  );
}
