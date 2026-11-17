"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { coincide, textoBuscable } from "@/lib/busqueda";
import { formatARS } from "@/lib/pricing";
import Buscador from "./Buscador";
import MiniaturaProducto from "./MiniaturaProducto";
import ChipCompras from "./ChipCompras";

export type FilaInventario = {
  id: number;
  nombre: string;
  ref_interna: string | null;
  cantidad: number;
  costo: number;
  sugerido: number;
  valor: number;
  foto: string | null;
  categorias: string[];
  compras: number;
};

const GRILLA =
  "md:grid md:grid-cols-[4rem_minmax(0,1fr)_5rem_8rem_8rem_8rem] md:items-center md:gap-4";

export default function ListaInventario({ productos }: { productos: FilaInventario[] }) {
  const [busqueda, setBusqueda] = useState("");

  const buscables = useMemo(
    () => productos.map((p) => ({ p, texto: textoBuscable([p.nombre, p.ref_interna, ...p.categorias]) })),
    [productos]
  );
  const visibles = useMemo(
    () => buscables.filter((b) => coincide(b.texto, busqueda)).map((b) => b.p),
    [buscables, busqueda]
  );

  return (
    <div className="mt-4 flex flex-col gap-3">
      <Buscador valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar por nombre, categoría o ref. interna" />
      <p className="text-xs text-muted" aria-live="polite">
        Mostrando {visibles.length} de {productos.length}
      </p>

      <div className="overflow-hidden rounded-2xl ring-1 ring-border">
        <div className={`hidden bg-card px-4 py-2 text-sm text-muted ${GRILLA}`}>
          <span />
          <span>Producto</span>
          <span>Stock</span>
          <span>Costo unitario</span>
          <span>Precio sugerido</span>
          <span>Valor stock</span>
        </div>
        <ul>
          {visibles.map((p) => (
            <FilaListaInventario key={p.id} p={p} />
          ))}
        </ul>
        {visibles.length === 0 && (
          <div className="bg-card px-4 py-8 text-center text-sm text-muted">
            {productos.length === 0 ? "No hay productos cargados." : "Ninguna gorra coincide con la búsqueda."}
          </div>
        )}
      </div>
    </div>
  );
}

function FilaListaInventario({ p }: { p: FilaInventario }) {
  const vendida = p.cantidad === 0;

  return (
    <li className="border-t border-border first:border-t-0 md:first:border-t">
      {/* Toda la fila abre la edición de la gorra. */}
      <Link
        href={`/admin/productos/${p.id}`}
        className={`flex items-center gap-3 bg-card px-3 py-2.5 transition hover:bg-hover active:bg-hover md:px-4 ${GRILLA} ${
          vendida ? "opacity-60" : ""
        }`}
      >
        <MiniaturaProducto path={p.foto} vendida={vendida} />

        <div className="min-w-0 flex-1 md:contents">
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">{p.nombre}</span>
            {(p.ref_interna || p.compras > 1) && (
              <span className="flex items-center gap-1.5 text-xs text-muted">
                {p.ref_interna && <span className="truncate">{p.ref_interna}</span>}
                <ChipCompras compras={p.compras} />
              </span>
            )}
          </div>
          {/* En el celular: stock a la derecha del nombre; costo y sugerido abajo. */}
          <span className="hidden text-sm md:block">
            <Stock cantidad={p.cantidad} vendida={vendida} />
          </span>
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted md:contents md:text-sm md:text-foreground">
            <span>
              <span className="md:hidden">Costo </span>
              {formatARS(p.costo)}
            </span>
            <span className="md:text-accent">
              <span className="md:hidden">Sugerido </span>
              {formatARS(p.sugerido)}
            </span>
            <span>
              <span className="md:hidden">Valor </span>
              {formatARS(p.valor)}
            </span>
          </div>
        </div>

        <span className="shrink-0 text-right text-sm md:hidden">
          <Stock cantidad={p.cantidad} vendida={vendida} />
        </span>
      </Link>
    </li>
  );
}

// Sin rojo de "stock bajo": casi todas son piezas únicas (stock 1 es lo
// normal). Solo se marca la vendida (stock 0).
function Stock({ cantidad, vendida }: { cantidad: number; vendida: boolean }) {
  if (vendida) {
    return (
      <span className="rounded-full border border-accent px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
        Vendida
      </span>
    );
  }
  return (
    <span className="text-foreground">
      <span className="md:hidden">Stock </span>
      {cantidad}
    </span>
  );
}
