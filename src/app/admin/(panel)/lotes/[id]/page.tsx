import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Lote } from "@/lib/types";
import { formatARS } from "@/lib/pricing";
import { plural } from "@/lib/acciones";
import { primeraFoto } from "@/lib/fotos";
import { hoyAR } from "@/lib/fechas";
import { envioPorGorra } from "@/lib/lotes";
import LoteForm from "@/components/admin/LoteForm";
import AsignarGorras, { type GorraCandidata } from "@/components/admin/AsignarGorras";
import GorrasDelLote, { type GorraDeLote } from "@/components/admin/GorrasDelLote";
import BotonBorrar from "@/components/admin/BotonBorrar";
import { btnSecundario } from "@/components/admin/estilos";
import { actualizarLote, repartirEnvio } from "../../actions";

type Foto = { path: string; orden: number };
type ProductoConsulta = {
  id: number;
  nombre: string;
  ref_interna: string | null;
  cantidad: number;
  costo_envio_unitario: number;
  lote_id: number | null;
  fotos_producto: Foto[] | null;
  categorias: { nombre: string }[] | null;
};

export default async function EditarLotePage(props: PageProps<"/admin/lotes/[id]">) {
  const { id: idTexto } = await props.params;
  const id = Number(idTexto);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const supabase = await createClient();
  const [{ data: loteData }, { data: productos, error }] = await Promise.all([
    supabase.from("lotes").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("productos")
      .select("id, nombre, ref_interna, cantidad, costo_envio_unitario, lote_id, fotos_producto(path, orden), categorias(nombre)")
      .order("nombre")
      .returns<ProductoConsulta[]>(),
  ]);
  const lote = loteData as Lote | null;
  if (!lote) notFound();

  const todos = productos ?? [];
  const delLote: GorraDeLote[] = todos
    .filter((p) => p.lote_id === lote.id)
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      ref_interna: p.ref_interna,
      cantidad: p.cantidad,
      envio: Number(p.costo_envio_unitario),
      foto: primeraFoto(p.fotos_producto)?.path ?? null,
    }));
  // Las que se pueden agregar: primero las que no tienen lote.
  const candidatas: GorraCandidata[] = todos
    .filter((p) => p.lote_id !== lote.id)
    .sort((a, b) => Number(a.lote_id !== null) - Number(b.lote_id !== null))
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      ref_interna: p.ref_interna,
      foto: primeraFoto(p.fotos_producto)?.path ?? null,
      categorias: (p.categorias ?? []).map((c) => c.nombre),
      lote_id: p.lote_id,
    }));

  const n = delLote.length;
  const costoEnvio = Number(lote.costo_envio);
  const porGorra = envioPorGorra(costoEnvio, n);
  const envios = new Set(delLote.map((g) => g.envio));
  const enviosHoy =
    envios.size === 1 ? `hoy cada una tiene ${formatARS([...envios][0])}` : "hoy tienen valores distintos";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-foreground">Editar lote #{lote.id}</h1>
      <LoteForm lote={lote} hoy={hoyAR()} action={actualizarLote.bind(null, lote.id)} />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl text-foreground">
          Gorras del lote <span className="text-muted">({n})</span>
        </h2>
        {error && (
          <p role="alert" className="text-sm text-accent">
            No se pudieron cargar las gorras. Recargá la página en un rato.
          </p>
        )}
        <AsignarGorras
          loteId={lote.id}
          candidatas={candidatas}
          junto={
            n > 0 && (
              <BotonBorrar
                accion={repartirEnvio.bind(null, lote.id)}
                etiqueta={`Repartir el envío entre las ${plural(n, "gorra")}`}
                titulo={`¿Repartir el envío entre las ${plural(n, "gorra")}?`}
                detalle={`${formatARS(costoEnvio)} ÷ ${n} = ${formatARS(porGorra)} por gorra. Se pone ese costo de envío en cada gorra del lote (${enviosHoy}) y el precio sugerido se recalcula. El precio de venta no cambia. Usa el costo de envío guardado del lote.`}
                textoConfirmar={`Poner ${formatARS(porGorra)} por gorra`}
                textoPendiente="Repartiendo…"
                tipoAviso="exito"
                className={btnSecundario}
              >
                Repartir envío entre las {n}
              </BotonBorrar>
            )
          }
        />
        <GorrasDelLote loteId={lote.id} gorras={delLote} />
      </section>
    </div>
  );
}
