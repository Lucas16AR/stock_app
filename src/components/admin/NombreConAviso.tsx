"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { parecidas, textoBuscable } from "@/lib/busqueda";
import MiniaturaProducto from "./MiniaturaProducto";

// Una gorra que ya existe, para el aviso de posible duplicado.
export type GorraParecida = {
  id: number;
  nombre: string;
  ref_interna: string | null;
  foto: string | null;
  stock: number;
};

const campo = "w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm outline-none focus:border-accent";

// Nombre y ref. de una gorra nueva. Mientras se escriben, abajo aparecen
// las gorras que se parecen: si es una de esas, conviene sumarle una
// compra en vez de crear otra (en el lote del que se vino, o en su
// edición).
export default function NombreConAviso({ existentes, lote }: { existentes: GorraParecida[]; lote: number | null }) {
  const [nombre, setNombre] = useState("");
  const [ref, setRef] = useState("");

  const buscables = useMemo(
    () => existentes.map((g) => ({ item: g, texto: textoBuscable([g.nombre, g.ref_interna]) })),
    [existentes]
  );
  const coinciden = parecidas(buscables, `${nombre} ${ref}`);
  const destino = (g: GorraParecida) =>
    lote ? `/admin/lotes/${lote}?cargar=${g.id}` : `/admin/productos/${g.id}?sumar=1#compras`;

  return (
    <>
      <div>
        <label htmlFor="producto-nombre" className="mb-1 block text-xs text-muted">Nombre *</label>
        <input
          id="producto-nombre"
          name="nombre"
          required
          autoComplete="off"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={campo}
        />
      </div>
      <div>
        <label htmlFor="producto-ref" className="mb-1 block text-xs text-muted">
          Referencia interna — no se muestra en la página
        </label>
        <input
          id="producto-ref"
          name="ref_interna"
          autoComplete="off"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="Ej. AFA 12"
          className={`${campo} border-dashed`}
        />
      </div>

      {coinciden.length > 0 && (
        <div role="status" className="flex flex-col gap-2 rounded-2xl bg-card p-3 ring-1 ring-accent/60">
          <p className="text-sm text-foreground">
            <span className="font-semibold">¿Es alguna de estas?</span> Sumale una compra en vez de crear otra.
          </p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {coinciden.map((g) => (
              <li key={g.id}>
                <Link
                  href={destino(g)}
                  className="flex items-center gap-3 rounded-xl bg-background p-2 ring-1 ring-border transition hover:ring-accent active:scale-[0.98]"
                >
                  <MiniaturaProducto path={g.foto} vendida={g.stock === 0} className="h-12 w-12" sizes="48px" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{g.nombre}</span>
                    <span className="block truncate text-xs text-muted">
                      {g.ref_interna ? `${g.ref_interna} · ` : ""}
                      {g.stock === 0 ? "Vendida" : `Stock ${g.stock}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-accent">Sumar compra →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
