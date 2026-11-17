"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { eliminarProducto } from "@/app/admin/(panel)/actions";
import { motivoNoBorrarProducto, plural } from "@/lib/acciones";
import { coincide, textoBuscable } from "@/lib/busqueda";
import { formatARS } from "@/lib/pricing";
import BotonBorrar from "./BotonBorrar";
import Buscador from "./Buscador";
import FiltrosRapidos from "./FiltrosRapidos";
import MiniaturaProducto from "./MiniaturaProducto";
import SwitchVisible from "./SwitchVisible";
import ChipCompras from "./ChipCompras";
import { btnSecundario } from "./estilos";

// Lo que la página de Productos le pasa a la lista (ya armado en el
// servidor: solo lo que se muestra o se usa para filtrar).
export type FilaProducto = {
  id: number;
  nombre: string;
  ref_interna: string | null;
  cantidad: number;
  precio_venta: number;
  visible_publico: boolean;
  lote_id: number | null;
  foto: string | null;
  categorias: string[];
  fotos: number;
  ventas: number;
  compras: number;
};

const FILTROS = [
  { id: "todas", etiqueta: "Todas", cumple: () => true },
  { id: "publicadas", etiqueta: "Publicadas", cumple: (p: FilaProducto) => p.visible_publico },
  { id: "ocultas", etiqueta: "Ocultas", cumple: (p: FilaProducto) => !p.visible_publico },
  { id: "sin-precio", etiqueta: "Sin precio", cumple: (p: FilaProducto) => !(p.precio_venta > 0) },
  { id: "vendidas", etiqueta: "Vendidas", cumple: (p: FilaProducto) => p.cantidad === 0 },
  { id: "sin-lote", etiqueta: "Sin lote", cumple: (p: FilaProducto) => p.lote_id === null },
] as const;

type IdFiltro = (typeof FILTROS)[number]["id"];

// Columnas en la compu. En el celular cada fila es una tarjeta (flex) y
// los bloques con `md:contents` se "desarman" en celdas de esta grilla.
const GRILLA =
  "md:grid md:grid-cols-[4rem_minmax(0,1fr)_4.5rem_7rem_minmax(0,9rem)_4.5rem_8rem] md:items-center md:gap-4";

export default function ListaProductos({ productos }: { productos: FilaProducto[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<IdFiltro>("todas");

  const buscables = useMemo(
    () => productos.map((p) => ({ p, texto: textoBuscable([p.nombre, p.ref_interna, ...p.categorias]) })),
    [productos]
  );
  const encontrados = useMemo(
    () => buscables.filter((b) => coincide(b.texto, busqueda)).map((b) => b.p),
    [buscables, busqueda]
  );
  const criterio = FILTROS.find((f) => f.id === filtro)!;
  const visibles = encontrados.filter(criterio.cumple);

  return (
    <div className="mt-4 flex flex-col gap-3">
      <Buscador valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar por nombre, categoría o ref. interna" />
      <FiltrosRapidos
        opciones={FILTROS.map((f) => ({ id: f.id, etiqueta: f.etiqueta, cantidad: encontrados.filter(f.cumple).length }))}
        activo={filtro}
        onElegir={(id) => setFiltro(id as IdFiltro)}
      />
      <p className="text-xs text-muted" aria-live="polite">
        Mostrando {visibles.length} de {productos.length}
      </p>

      <div className="overflow-hidden rounded-2xl ring-1 ring-border">
        <div className={`hidden bg-card px-4 py-2 text-sm text-muted ${GRILLA}`}>
          <span />
          <span>Nombre</span>
          <span>Stock</span>
          <span>Precio</span>
          <span>Categorías</span>
          <span>Visible</span>
          <span />
        </div>
        <ul>
          {visibles.map((p) => (
            <FilaListaProducto key={p.id} p={p} />
          ))}
        </ul>
        {visibles.length === 0 && (
          <div className="bg-card px-4 py-8 text-center text-sm text-muted">
            {productos.length === 0 ? (
              "Todavía no cargaste productos."
            ) : (
              <>
                Ninguna gorra coincide.{" "}
                <button
                  type="button"
                  className="font-semibold text-accent underline-offset-2 hover:underline"
                  onClick={() => {
                    setBusqueda("");
                    setFiltro("todas");
                  }}
                >
                  Ver todas
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FilaListaProducto({ p }: { p: FilaProducto }) {
  const editar = `/admin/productos/${p.id}`;
  const vendida = p.cantidad === 0;
  const sinPrecio = !(p.precio_venta > 0);

  return (
    <li className={`flex items-center gap-3 border-t border-border bg-card px-3 py-2.5 first:border-t-0 md:px-4 md:first:border-t ${GRILLA}`}>
      <Link href={editar} aria-label={`Editar «${p.nombre}»`} className="shrink-0 transition active:scale-95">
        <MiniaturaProducto path={p.foto} vendida={vendida} />
      </Link>

      <div className="min-w-0 flex-1 md:contents">
        <Link href={editar} className="block min-w-0 hover:text-accent">
          <span className="block truncate text-sm font-semibold text-foreground">{p.nombre}</span>
          {(p.ref_interna || p.compras > 1) && (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              {p.ref_interna && <span className="truncate">{p.ref_interna}</span>}
              <ChipCompras compras={p.compras} />
            </span>
          )}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-sm md:contents">
          <span className={vendida ? "text-muted" : "text-foreground"}>
            <span className="md:hidden">Stock </span>
            {p.cantidad}
            {vendida && <span className="ml-1 text-xs uppercase tracking-wide text-accent">Vendida</span>}
          </span>
          <span className={sinPrecio ? "text-xs font-semibold text-accent" : "text-accent"}>
            {sinPrecio ? "Sin precio" : formatARS(p.precio_venta)}
          </span>
        </div>
        <span className="hidden truncate text-sm text-muted md:block">
          {p.categorias.join(", ") || "-"}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:contents">
        <div>
          <SwitchVisible id={p.id} nombre={p.nombre} visible={p.visible_publico} sinPrecio={sinPrecio} />
        </div>
        {/* Borrar va aparte, a la derecha y con espacio, para no tocarlo por Editar. */}
        <div className="flex items-center justify-end gap-4">
          {/* En el celular no hace falta: la foto y el nombre ya abren la
              edición. (Envuelto porque btnSecundario trae `inline-flex`,
              que le gana a `hidden`.) */}
          <span className="hidden md:block">
            <Link href={editar} className={btnSecundario}>
              Editar
            </Link>
          </span>
          <BotonBorrar
            accion={eliminarProducto.bind(null, p.id)}
            etiqueta={`Borrar «${p.nombre}»`}
            titulo={`¿Borrar «${p.nombre}»?`}
            detalle={`Se borra el producto${
              p.fotos > 0 || p.compras > 0
                ? ` con ${[p.fotos > 0 && plural(p.fotos, "foto"), p.compras > 0 && plural(p.compras, "compra")].filter(Boolean).join(" y ")}`
                : ""
            }. No se puede deshacer.`}
            bloqueo={p.ventas > 0 ? motivoNoBorrarProducto(p.ventas) : undefined}
          />
        </div>
      </div>
    </li>
  );
}
