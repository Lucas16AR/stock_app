"use client";

import { useMemo, useState, useTransition } from "react";
import { asignarLote } from "@/app/admin/(panel)/actions";
import { plural } from "@/lib/acciones";
import { coincide, textoBuscable } from "@/lib/busqueda";
import { avisar } from "./avisar";
import { Spinner } from "./BotonEnviar";
import Buscador from "./Buscador";
import MiniaturaProducto from "./MiniaturaProducto";
import { btnPrimario, btnSecundario } from "./estilos";

// Gorra que se puede agregar al lote (no está en este lote).
export type GorraCandidata = {
  id: number;
  nombre: string;
  ref_interna: string | null;
  foto: string | null;
  categorias: string[];
  lote_id: number | null;
};

// "Agregar gorras a este lote": grilla con foto, buscador y casillas para
// marcar varias; "Asignar" les pone el lote a todas juntas. Las que no
// tienen lote van primero (ya vienen ordenadas del servidor).
export default function AsignarGorras({
  loteId,
  candidatas,
  junto,
}: {
  loteId: number;
  candidatas: GorraCandidata[];
  // Otros botones que van en la misma fila (ej. repartir envío).
  junto?: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [marcadas, setMarcadas] = useState<Set<number>>(new Set());
  const [pendiente, startTransition] = useTransition();

  const buscables = useMemo(
    () => candidatas.map((g) => ({ g, texto: textoBuscable([g.nombre, g.ref_interna, ...g.categorias]) })),
    [candidatas]
  );
  const visibles = buscables.filter((b) => coincide(b.texto, busqueda)).map((b) => b.g);
  const sinLote = candidatas.filter((g) => g.lote_id === null).length;
  const todasVisiblesMarcadas = visibles.length > 0 && visibles.every((g) => marcadas.has(g.id));

  function alternar(id: number) {
    setMarcadas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  function marcarVisibles() {
    setMarcadas((prev) => {
      const nuevo = new Set(prev);
      for (const g of visibles) {
        if (todasVisiblesMarcadas) nuevo.delete(g.id);
        else nuevo.add(g.id);
      }
      return nuevo;
    });
  }

  function cerrar() {
    setAbierto(false);
    setBusqueda("");
    setMarcadas(new Set());
  }

  function asignar() {
    if (marcadas.size === 0 || pendiente) return;
    const ids = [...marcadas];
    startTransition(async () => {
      try {
        const r = await asignarLote(loteId, ids);
        if (r.ok) {
          avisar.exito(r.mensaje);
          cerrar();
        } else {
          avisar.error(r.error);
        }
      } catch {
        avisar.error("No se pudo completar: se cortó la conexión o el servidor no respondió. Probá de nuevo.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => (abierto ? cerrar() : setAbierto(true))}
          aria-expanded={abierto}
          className={abierto ? btnSecundario : `${btnPrimario} text-sm`}
        >
          {abierto ? "Cerrar" : "+ Agregar gorras a este lote"}
        </button>
        {!abierto && junto}
      </div>

      {abierto && (
        <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
          {candidatas.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">Todas las gorras ya están en este lote.</p>
          ) : (
            <>
              <Buscador valor={busqueda} onCambiar={setBusqueda} placeholder="Nombre, categoría o referencia…" />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span aria-live="polite">
                  {busqueda
                    ? `${visibles.length} de ${candidatas.length}`
                    : `${plural(candidatas.length, "gorra")} en otros lotes o sin lote · ${sinLote} sin lote (primero)`}
                </span>
                {visibles.length > 0 && (
                  <button type="button" onClick={marcarVisibles} className="font-semibold text-accent hover:underline">
                    {todasVisiblesMarcadas ? "Desmarcar las que se ven" : `Marcar las ${visibles.length} que se ven`}
                  </button>
                )}
              </div>

              {visibles.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">Ninguna gorra coincide con la búsqueda.</p>
              ) : (
                <ul className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto overscroll-contain sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {visibles.map((g) => {
                    const marcada = marcadas.has(g.id);
                    return (
                      <li key={g.id}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={marcada}
                          onClick={() => alternar(g.id)}
                          className={`relative flex w-full flex-col overflow-hidden rounded-xl bg-background text-left transition active:scale-[0.97] ${
                            marcada ? "ring-2 ring-accent" : "ring-1 ring-border hover:ring-accent"
                          }`}
                        >
                          <MiniaturaProducto
                            path={g.foto}
                            marco={false}
                            className="aspect-square w-full"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 180px"
                          />
                          <span
                            aria-hidden
                            className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold ${
                              marcada ? "bg-accent text-white" : "border-2 border-paper bg-ink/40"
                            }`}
                          >
                            {marcada ? "✓" : ""}
                          </span>
                          <span
                            className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              g.lote_id === null ? "bg-accent text-white" : "bg-ink/80 text-paper"
                            }`}
                          >
                            {g.lote_id === null ? "Sin lote" : `Lote #${g.lote_id}`}
                          </span>
                          <span className="flex flex-col gap-0.5 p-2">
                            <span className="truncate text-sm font-semibold text-foreground">{g.nombre}</span>
                            <span className="truncate text-xs text-muted">{g.ref_interna || " "}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <span className="text-sm text-muted">
                  {marcadas.size === 0 ? "Marcá las gorras que querés agregar." : `${plural(marcadas.size, "gorra marcada", "gorras marcadas")}`}
                </span>
                <button
                  type="button"
                  onClick={asignar}
                  disabled={marcadas.size === 0 || pendiente}
                  aria-busy={pendiente}
                  className={`${btnPrimario} text-sm disabled:cursor-not-allowed`}
                >
                  {pendiente ? (
                    <>
                      <Spinner />
                      Asignando…
                    </>
                  ) : marcadas.size > 0 ? (
                    `Asignar ${plural(marcadas.size, "gorra")}`
                  ) : (
                    "Asignar"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
