import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Lote } from "@/lib/types";
import { formatARS } from "@/lib/pricing";
import { plural } from "@/lib/acciones";
import { primeraFoto } from "@/lib/fotos";
import { hoyAR } from "@/lib/fechas";
import { envioPorGorra } from "@/lib/lotes";
import { resumenCompras } from "@/lib/compras";
import LoteForm from "@/components/admin/LoteForm";
import CargarGorras, { type GorraExistente } from "@/components/admin/CargarGorras";
import ListaCompras, { type FilaCompra } from "@/components/admin/ListaCompras";
import type { LoteOpcion } from "@/components/admin/CamposCompra";
import { actualizarLote } from "../../actions";

type Foto = { path: string; orden: number };
type CompraConsulta = {
  id: number;
  producto_id: number;
  unidades: number;
  precio_compra: number;
  costo_envio_unitario: number;
  costo_extra: number;
  ref_interna: string | null;
  fecha: string;
  productos: { nombre: string; cantidad: number; fotos_producto: Foto[] | null } | null;
};
type ProductoConsulta = {
  id: number;
  nombre: string;
  ref_interna: string | null;
  cantidad: number;
  precio_compra: number;
  costo_extra: number;
  fotos_producto: Foto[] | null;
  categorias: { nombre: string }[] | null;
};

export default async function EditarLotePage(props: PageProps<"/admin/lotes/[id]">) {
  const { id: idTexto } = await props.params;
  const { cargar } = await props.searchParams;
  const id = Number(idTexto);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const supabase = await createClient();
  const [{ data: loteData }, { data: comprasData, error }, { data: productos }] = await Promise.all([
    supabase.from("lotes").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("compras")
      .select("id, producto_id, unidades, precio_compra, costo_envio_unitario, costo_extra, ref_interna, fecha, productos(nombre, cantidad, fotos_producto(path, orden))")
      .eq("lote_id", id)
      .order("id")
      .returns<CompraConsulta[]>(),
    supabase
      .from("productos")
      .select("id, nombre, ref_interna, cantidad, precio_compra, costo_extra, fotos_producto(path, orden), categorias(nombre)")
      .order("nombre")
      .returns<ProductoConsulta[]>(),
  ]);
  const lote = loteData as Lote | null;
  if (!lote) notFound();

  const compras = (comprasData ?? []).map((c) => ({
    ...c,
    precio_compra: Number(c.precio_compra),
    costo_envio_unitario: Number(c.costo_envio_unitario),
    costo_extra: Number(c.costo_extra),
  }));
  const resumen = resumenCompras(compras);
  const costoEnvio = Number(lote.costo_envio);
  const opcion: LoteOpcion = { id: lote.id, fecha: lote.fecha, nota: lote.nota, costo_envio: costoEnvio, unidades: resumen.unidades };

  const filas: FilaCompra[] = compras
    .map((c) => ({
      id: c.id,
      producto_id: c.producto_id,
      nombre: c.productos?.nombre ?? "Gorra borrada",
      foto: primeraFoto(c.productos?.fotos_producto)?.path ?? null,
      ref: c.ref_interna,
      unidades: c.unidades,
      precio: c.precio_compra,
      envio: c.costo_envio_unitario,
      extra: c.costo_extra,
      fecha: c.fecha,
      stock: c.productos?.cantidad ?? 0,
      lote: opcion,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const gorras: GorraExistente[] = (productos ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    ref_interna: p.ref_interna,
    foto: primeraFoto(p.fotos_producto)?.path ?? null,
    categorias: (p.categorias ?? []).map((c) => c.nombre),
    stock: p.cantidad,
    precio_compra: Number(p.precio_compra),
    costo_extra: Number(p.costo_extra),
  }));
  const cargarId = Number(cargar);
  const elegidaInicial = gorras.some((g) => g.id === cargarId) ? cargarId : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-foreground">Editar lote #{lote.id}</h1>
      <LoteForm lote={lote} hoy={hoyAR()} action={actualizarLote.bind(null, lote.id)} />

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-xl text-foreground">Gorras del lote</h2>
          {resumen.compras > 0 && (
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">{plural(resumen.unidades, "gorra comprada", "gorras compradas")}</span>
              {" · "}
              {plural(resumen.modelos, "modelo")}
              {" · "}
              Invertido {formatARS(resumen.invertido)} (compras) + {formatARS(costoEnvio)} (envío)
              <br />
              Envío por gorra: {formatARS(costoEnvio)} ÷ {resumen.unidades} ={" "}
              <span className="font-semibold text-foreground">{formatARS(envioPorGorra(costoEnvio, resumen.unidades))}</span>
              {" "}(se reparte solo al cargar gorras o al guardar el lote)
            </p>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-accent">
            No se pudieron cargar las compras. Recargá la página en un rato.
          </p>
        )}
        <CargarGorras key={elegidaInicial ?? "lote"} lote={opcion} gorras={gorras} elegidaInicial={elegidaInicial} />
        <ListaCompras compras={filas} modo="lote" vacio="Este lote todavía no tiene gorras. Cargalas con el botón de arriba." />
      </section>
    </div>
  );
}
