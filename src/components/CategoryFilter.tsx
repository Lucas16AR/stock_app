import Link from "next/link";
import { Categoria } from "@/lib/types";

export default function CategoryFilter({
  categorias,
  activa,
}: {
  categorias: Categoria[];
  activa?: number;
}) {
  if (categorias.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      <Link
        href="/"
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
          !activa
            ? "bg-accent text-neutral-950"
            : "bg-neutral-900 text-neutral-300 ring-1 ring-neutral-800 hover:ring-accent"
        }`}
      >
        Todas
      </Link>
      {categorias.map((c) => (
        <Link
          key={c.id}
          href={`/?categoria=${c.id}`}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            activa === c.id
              ? "bg-accent text-neutral-950"
              : "bg-neutral-900 text-neutral-300 ring-1 ring-neutral-800 hover:ring-accent"
          }`}
        >
          {c.nombre}
        </Link>
      ))}
    </div>
  );
}
