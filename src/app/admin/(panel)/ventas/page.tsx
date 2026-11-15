import { createClient } from "@/lib/supabase/server";
import { formatARS } from "@/lib/pricing";
import { primeraFoto } from "@/lib/fotos";
import { plural } from "@/lib/acciones";
import { hoyAR, inicioMesAR, nombreMesAR } from "@/lib/fechas";
import VentaForm, { type GorraVendible } from "@/components/admin/VentaForm";
import HistorialVentas, { type FilaVenta } from "@/components/admin/HistorialVentas";

export const revalidate = 0;

type Foto = { path: string; orden: number };

type GorraConsulta = {
  id: number;
  nombre: string;
  ref_interna: string | null;
  precio_venta: number;
  cantidad: number;
  fotos_producto: Foto[] | null;
  categorias: { nombre: string }[] | null;
};

type VentaConsulta = {
  id: number;
  cantidad: number;
  precio_venta: number;
  fecha: string;
  productos: {
    nombre: string;
    ref_interna: string | null;
    visible_publico: boolean;
    fotos_producto: Foto[] | null;
  } | null;
};

export default async function VentasPage() {
  const supabase = await createClient();

  const [gorrasRes, ventasRes, mesRes] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, ref_interna, precio_venta, cantidad, fotos_producto(path, orden), categorias(nombre)")
      .gt("cantidad", 0)
      .order("nombre")
      .returns<GorraConsulta[]>(),
    supabase
      .from("ventas")
      .select("id, cantidad, precio_venta, fecha, productos(nombre, ref_interna, visible_publico, fotos_producto(path, orden))")
      .order("fecha", { ascending: false })
      .order("id", { ascending: false })
      .limit(50)
      .returns<VentaConsulta[]>(),
    supabase
      .from("ventas")
      .select("cantidad, precio_venta")
      .gte("fecha", inicioMesAR())
      .returns<{ cantidad: number; precio_venta: number }[]>(),
  ]);

  const gorras: GorraVendible[] = (gorrasRes.data ?? []).map((g) => ({
    id: g.id,
    nombre: g.nombre,
    ref_interna: g.ref_interna,
    precio_venta: Number(g.precio_venta),
    cantidad: g.cantidad,
    foto: primeraFoto(g.fotos_producto)?.path ?? null,
    categorias: (g.categorias ?? []).map((c) => c.nombre),
  }));

  const ventas: FilaVenta[] = (ventasRes.data ?? []).map((v) => ({
    id: v.id,
    nombre: v.productos?.nombre ?? "Gorra borrada",
    ref_interna: v.productos?.ref_interna ?? null,
    foto: primeraFoto(v.productos?.fotos_producto)?.path ?? null,
    visible: v.productos?.visible_publico ?? false,
    cantidad: v.cantidad,
    precio: Number(v.precio_venta),
    fecha: v.fecha,
  }));

  const delMes = mesRes.data ?? [];
  const unidadesMes = delMes.reduce((acc, v) => acc + v.cantidad, 0);
  const totalMes = delMes.reduce((acc, v) => acc + Number(v.precio_venta) * v.cantidad, 0);
  const error = gorrasRes.error || ventasRes.error || mesRes.error;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-foreground">Ventas</h1>

      {error && (
        <p role="alert" className="rounded-2xl bg-card px-4 py-4 text-sm text-accent ring-1 ring-border">
          No se pudieron cargar todos los datos de ventas. Recargá la página en un rato.
        </p>
      )}

      <VentaForm gorras={gorras} hoy={hoyAR()} />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl text-foreground">Historial</h2>
          <p className="text-sm text-muted">
            En {nombreMesAR()}: <span className="font-semibold text-foreground">{plural(unidadesMes, "gorra")}</span>
            {" · "}
            <span className="font-semibold text-accent">{formatARS(totalMes)}</span>
          </p>
        </div>
        <HistorialVentas ventas={ventas} />
        {ventas.length === 50 && <p className="text-xs text-muted">Se muestran las últimas 50 ventas.</p>}
      </section>
    </div>
  );
}
