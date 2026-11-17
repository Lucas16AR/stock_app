import { createClient } from "@/lib/supabase/server";
import { Categoria } from "@/lib/types";
import { primeraFoto } from "@/lib/fotos";
import ProductForm from "@/components/admin/ProductForm";
import type { LoteOpcion } from "@/components/admin/CamposCompra";
import type { GorraParecida } from "@/components/admin/NombreConAviso";
import { crearProducto } from "../../actions";

type LoteConsulta = { id: number; fecha: string; nota: string | null; costo_envio: number; compras: { unidades: number }[] | null };
type GorraConsulta = {
  id: number;
  nombre: string;
  ref_interna: string | null;
  cantidad: number;
  fotos_producto: { path: string; orden: number }[] | null;
};

// Gorra nueva con su primera compra. Con ?lote=N viene de "Cargar gorras"
// de ese lote: lo trae elegido y vuelve a él al guardar.
export default async function NuevoProductoPage(props: PageProps<"/admin/productos/nuevo">) {
  const { lote } = await props.searchParams;
  const supabase = await createClient();
  const [{ data: categorias }, { data: lotesData }, { data: gorrasData }] = await Promise.all([
    supabase.from("categorias").select("*").order("nombre").returns<Categoria[]>(),
    supabase
      .from("lotes")
      .select("id, fecha, nota, costo_envio, compras(unidades)")
      .order("fecha", { ascending: false })
      .returns<LoteConsulta[]>(),
    supabase
      .from("productos")
      .select("id, nombre, ref_interna, cantidad, fotos_producto(path, orden)")
      .order("nombre")
      .returns<GorraConsulta[]>(),
  ]);

  const lotes: LoteOpcion[] = (lotesData ?? []).map((l) => ({
    id: l.id,
    fecha: l.fecha,
    nota: l.nota,
    costo_envio: Number(l.costo_envio),
    unidades: (l.compras ?? []).reduce((suma, c) => suma + c.unidades, 0),
  }));
  const existentes: GorraParecida[] = (gorrasData ?? []).map((g) => ({
    id: g.id,
    nombre: g.nombre,
    ref_interna: g.ref_interna,
    foto: primeraFoto(g.fotos_producto)?.path ?? null,
    stock: g.cantidad,
  }));
  const loteId = Number(lote);
  const loteInicial = lotes.some((l) => l.id === loteId) ? loteId : null;

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">
        Nuevo producto{loteInicial ? <span className="text-muted"> · lote #{loteInicial}</span> : null}
      </h1>
      <div className="mt-4">
        <ProductForm
          categorias={categorias ?? []}
          nueva={{ lotes, loteInicial, existentes }}
          action={crearProducto}
        />
      </div>
    </div>
  );
}
