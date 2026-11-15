"use client";

import { useMemo, useState } from "react";
import { registrarVenta } from "@/app/admin/(panel)/actions";
import { coincide, textoBuscable } from "@/lib/busqueda";
import { formatARS } from "@/lib/pricing";
import FormAccion from "./FormAccion";
import BotonEnviar from "./BotonEnviar";
import Buscador from "./Buscador";
import MiniaturaProducto from "./MiniaturaProducto";
import { btnPrimario, btnSecundario } from "./estilos";

// Gorra que se puede vender (stock > 0), ya armada en el servidor.
export type GorraVendible = {
  id: number;
  nombre: string;
  ref_interna: string | null;
  precio_venta: number;
  cantidad: number;
  foto: string | null;
  categorias: string[];
};

const campo =
  "w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

// Registrar una venta: primero se elige la gorra viéndola (buscador +
// grilla con fotos), después cantidad, precio y fecha.
export default function VentaForm({ gorras, hoy }: { gorras: GorraVendible[]; hoy: string }) {
  const [elegidaId, setElegidaId] = useState<number | null>(null);
  const [precio, setPrecio] = useState("");
  const [busqueda, setBusqueda] = useState("");
  // Cambia después de cada venta para volver a montar los campos con sus
  // valores iniciales (cantidad 1, fecha hoy).
  const [vuelta, setVuelta] = useState(0);

  const elegida = gorras.find((g) => g.id === elegidaId) ?? null;

  function elegir(g: GorraVendible) {
    setElegidaId(g.id);
    setPrecio(g.precio_venta > 0 ? String(g.precio_venta) : "");
  }

  function reiniciar() {
    setElegidaId(null);
    setPrecio("");
    setBusqueda("");
    setVuelta((n) => n + 1);
  }

  return (
    <FormAccion
      accion={registrarVenta}
      alTerminarBien={reiniciar}
      className="flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-border"
    >
      <h2 className="text-sm font-semibold text-foreground">Registrar una venta</h2>

      {elegida ? (
        <>
          <input type="hidden" name="producto_id" value={elegida.id} />
          <div className="flex items-center gap-4">
            <MiniaturaProducto path={elegida.foto} className="h-24 w-24 sm:h-28 sm:w-28" sizes="112px" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{elegida.nombre}</p>
              {elegida.ref_interna && <p className="truncate text-sm text-muted">{elegida.ref_interna}</p>}
              <p className="mt-1 text-sm text-muted">Stock {elegida.cantidad}</p>
              {elegida.precio_venta > 0 && <p className="text-sm text-accent">{formatARS(elegida.precio_venta)}</p>}
            </div>
            <button type="button" onClick={() => setElegidaId(null)} className={`${btnSecundario} shrink-0`}>
              Cambiar
            </button>
          </div>

          <div key={vuelta} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label htmlFor="venta-cantidad" className="mb-1 block text-xs text-muted">Cantidad</label>
              <input
                id="venta-cantidad"
                type="number"
                name="cantidad"
                min={1}
                max={elegida.cantidad}
                required
                defaultValue={1}
                className={campo}
              />
            </div>
            <div>
              <label htmlFor="venta-precio" className="mb-1 block text-xs text-muted">Precio de venta (c/u)</label>
              <input
                id="venta-precio"
                type="number"
                step="0.01"
                min={0}
                name="precio_venta"
                required
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className={campo}
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="venta-fecha" className="mb-1 block text-xs text-muted">Fecha de la venta</label>
              <input
                id="venta-fecha"
                type="date"
                name="fecha"
                required
                max={hoy}
                defaultValue={hoy}
                className={campo}
              />
            </div>
          </div>

          <BotonEnviar textoPendiente="Registrando…" className={`${btnPrimario} sm:self-start`}>
            Registrar venta
          </BotonEnviar>
        </>
      ) : (
        <SelectorGorra gorras={gorras} busqueda={busqueda} onBuscar={setBusqueda} onElegir={elegir} />
      )}
    </FormAccion>
  );
}

function SelectorGorra({
  gorras,
  busqueda,
  onBuscar,
  onElegir,
}: {
  gorras: GorraVendible[];
  busqueda: string;
  onBuscar: (v: string) => void;
  onElegir: (g: GorraVendible) => void;
}) {
  const buscables = useMemo(
    () => gorras.map((g) => ({ g, texto: textoBuscable([g.nombre, g.ref_interna, ...g.categorias]) })),
    [gorras]
  );
  const visibles = buscables.filter((b) => coincide(b.texto, busqueda)).map((b) => b.g);

  if (gorras.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No hay gorras con stock para vender.</p>;
  }

  return (
    <div>
      {/* El buscador queda fijo arriba: la que se desplaza es la grilla. */}
      <div className="pb-3">
        <Buscador valor={busqueda} onCambiar={onBuscar} placeholder="Nombre, categoría o referencia…" />
        <p className="mt-2 text-xs text-muted" aria-live="polite">
          {busqueda ? `${visibles.length} de ${gorras.length} gorras con stock` : `${gorras.length} gorras con stock: tocá la que se vendió`}
        </p>
      </div>

      {visibles.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Ninguna gorra con stock coincide con la búsqueda.</p>
      ) : (
        <ul className="grid max-h-[65vh] grid-cols-2 gap-3 overflow-y-auto overscroll-contain sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visibles.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => onElegir(g)}
                className="flex w-full flex-col overflow-hidden rounded-xl bg-background text-left ring-1 ring-border transition hover:ring-accent active:scale-[0.97]"
              >
                <MiniaturaProducto
                  path={g.foto}
                  marco={false}
                  className="aspect-square w-full"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 200px"
                />
                <span className="flex flex-col gap-0.5 p-2">
                  <span className="truncate text-sm font-semibold text-foreground">{g.nombre}</span>
                  <span className="truncate text-xs text-muted">{g.ref_interna || "\u00a0"}</span>
                  <span className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="text-accent">{g.precio_venta > 0 ? formatARS(g.precio_venta) : "Sin precio"}</span>
                    <span className="text-muted">Stock {g.cantidad}</span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
