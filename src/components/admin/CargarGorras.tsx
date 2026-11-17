"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { registrarCompra } from "@/app/admin/(panel)/actions";
import { coincide, textoBuscable } from "@/lib/busqueda";
import { formatARS } from "@/lib/pricing";
import BotonEnviar from "./BotonEnviar";
import Buscador from "./Buscador";
import CamposCompra, { type LoteOpcion } from "./CamposCompra";
import FormAccion from "./FormAccion";
import MiniaturaProducto from "./MiniaturaProducto";
import { btnPrimario, btnSecundario } from "./estilos";

// Una gorra que ya existe, para recomprarla en este lote.
export type GorraExistente = {
  id: number;
  nombre: string;
  ref_interna: string | null;
  foto: string | null;
  categorias: string[];
  stock: number;
  // Su costo promedio de hoy: valor inicial de la compra nueva.
  precio_compra: number;
  costo_extra: number;
};

// "Cargar gorras" en la edición de un lote: o se elige una gorra que ya
// existe ("Ya la tengo") y se le suma una compra en este lote, o se crea
// una nueva ("Gorra nueva", que vuelve al lote al guardar). Se pueden
// cargar varias seguidas sin cerrar el panel.
export default function CargarGorras({
  lote,
  gorras,
  elegidaInicial = null,
}: {
  lote: LoteOpcion;
  gorras: GorraExistente[];
  // Viene del aviso de duplicado al crear una gorra (?cargar=ID).
  elegidaInicial?: number | null;
}) {
  const [abierto, setAbierto] = useState(elegidaInicial !== null);
  const [elegidaId, setElegidaId] = useState<number | null>(elegidaInicial);
  const [busqueda, setBusqueda] = useState("");
  // Cambia después de cada carga para volver a montar los campos.
  const [vuelta, setVuelta] = useState(0);

  const elegida = gorras.find((g) => g.id === elegidaId) ?? null;
  const buscables = useMemo(
    () => gorras.map((g) => ({ g, texto: textoBuscable([g.nombre, g.ref_interna, ...g.categorias]) })),
    [gorras]
  );
  const visibles = buscables.filter((b) => coincide(b.texto, busqueda)).map((b) => b.g);

  function cerrar() {
    setAbierto(false);
    setElegidaId(null);
    setBusqueda("");
  }

  function otra() {
    setElegidaId(null);
    setVuelta((n) => n + 1);
  }

  if (!abierto) {
    return (
      <div>
        <button type="button" onClick={() => setAbierto(true)} className={`${btnPrimario} text-sm`}>
          + Cargar gorras
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Cargar gorras al lote #{lote.id}</h3>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/productos/nuevo?lote=${lote.id}`} className={btnSecundario}>
            + Gorra nueva
          </Link>
          <button type="button" onClick={cerrar} className={btnSecundario}>
            Cerrar
          </button>
        </div>
      </div>

      {elegida ? (
        <FormAccion
          key={`${elegida.id}-${vuelta}`}
          accion={registrarCompra}
          alTerminarBien={otra}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="producto_id" value={elegida.id} />
          <div className="flex items-center gap-3">
            <MiniaturaProducto path={elegida.foto} vendida={elegida.stock === 0} className="h-16 w-16 sm:h-20 sm:w-20" sizes="80px" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{elegida.nombre}</p>
              {elegida.ref_interna && <p className="truncate text-sm text-muted">{elegida.ref_interna}</p>}
              <p className="text-sm text-muted">
                {elegida.stock === 0 ? "Vendida" : `Stock ${elegida.stock}`} · costo hoy{" "}
                {formatARS(elegida.precio_compra + elegida.costo_extra)} + envío
              </p>
            </div>
            <button type="button" onClick={otra} className={`${btnSecundario} shrink-0`}>
              Cambiar
            </button>
          </div>
          <CamposCompra
            idPrefijo="cargar"
            loteFijo={lote}
            inicial={{
              unidades: 1,
              precio: Math.round(elegida.precio_compra),
              extra: Math.round(elegida.costo_extra),
              ref: elegida.ref_interna,
            }}
          />
          <BotonEnviar textoPendiente="Agregando…" className={`${btnPrimario} sm:self-start`}>
            Agregar al lote
          </BotonEnviar>
        </FormAccion>
      ) : (
        <>
          <p className="text-sm text-muted">
            <span className="font-semibold text-foreground">Ya la tengo:</span> elegí la gorra y cargale las unidades
            de este lote. Si no está, usá «Gorra nueva».
          </p>
          <Buscador valor={busqueda} onCambiar={setBusqueda} placeholder="Nombre, categoría o referencia…" />
          <p className="text-xs text-muted" aria-live="polite">
            {busqueda ? `${visibles.length} de ${gorras.length}` : `${gorras.length} gorras (también las vendidas)`}
          </p>
          {visibles.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">
              Ninguna gorra coincide.{" "}
              <Link href={`/admin/productos/nuevo?lote=${lote.id}`} className="font-semibold text-accent hover:underline">
                Crear una gorra nueva
              </Link>
            </p>
          ) : (
            <ul className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto overscroll-contain sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {visibles.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => setElegidaId(g.id)}
                    className="flex w-full flex-col overflow-hidden rounded-xl bg-background text-left ring-1 ring-border transition hover:ring-accent active:scale-[0.97]"
                  >
                    <MiniaturaProducto
                      path={g.foto}
                      vendida={g.stock === 0}
                      marco={false}
                      className="aspect-square w-full"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 180px"
                    />
                    <span className="flex flex-col gap-0.5 p-2">
                      <span className="truncate text-sm font-semibold text-foreground">{g.nombre}</span>
                      <span className="truncate text-xs text-muted">{g.ref_interna || " "}</span>
                      <span className="text-xs text-muted">{g.stock === 0 ? "Vendida" : `Stock ${g.stock}`}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
