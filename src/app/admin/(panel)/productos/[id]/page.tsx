import Link from "next/link";
import { notFound } from "next/navigation";
import { EyeIcon } from "@/components/icons";
import { btnSecundario } from "@/components/admin/estilos";
import { createClient } from "@/lib/supabase/server";
import { Categoria, Compra, Producto } from "@/lib/types";
import { primeraFoto } from "@/lib/fotos";
import ProductForm from "@/components/admin/ProductForm";
import ListaCompras, { type FilaCompra } from "@/components/admin/ListaCompras";
import SumarCompra from "@/components/admin/SumarCompra";
import type { LoteOpcion } from "@/components/admin/CamposCompra";
import { actualizarProducto } from "../../actions";

type ProductoConsulta = Producto & { compras: Compra[] | null; ventas: { cantidad: number }[] | null };
type LoteConsulta = { id: number; fecha: string; nota: string | null; costo_envio: number; compras: { unidades: number }[] | null };

export default async function EditarProductoPage(props: PageProps<"/admin/productos/[id]">) {
  const { id } = await props.params;
  const { sumar } = await props.searchParams;
  const supabase = await createClient();

  const [{ data: productoData }, { data: categorias }, { data: lotesData }] = await Promise.all([
    supabase
      .from("productos")
      .select("*, fotos_producto(*), categorias(*), compras(*), ventas(cantidad)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categorias").select("*").order("nombre").returns<Categoria[]>(),
    supabase
      .from("lotes")
      .select("id, fecha, nota, costo_envio, compras(unidades)")
      .order("fecha", { ascending: false })
      .returns<LoteConsulta[]>(),
  ]);

  const producto = productoData as ProductoConsulta | null;
  if (!producto) notFound();

  const lotes: LoteOpcion[] = (lotesData ?? []).map((l) => ({
    id: l.id,
    fecha: l.fecha,
    nota: l.nota,
    costo_envio: Number(l.costo_envio),
    unidades: (l.compras ?? []).reduce((suma, c) => suma + c.unidades, 0),
  }));
  const loteDe = new Map(lotes.map((l) => [l.id, l]));
  const foto = primeraFoto(producto.fotos_producto)?.path ?? null;

  const compras: FilaCompra[] = (producto.compras ?? [])
    .map((c) => ({
      id: c.id,
      producto_id: producto.id,
      nombre: producto.nombre,
      foto,
      ref: c.ref_interna,
      unidades: c.unidades,
      precio: Number(c.precio_compra),
      envio: Number(c.costo_envio_unitario),
      extra: Number(c.costo_extra),
      fecha: c.fecha,
      stock: producto.cantidad,
      lote: c.lote_id ? (loteDe.get(c.lote_id) ?? null) : null,
    }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
  const compradas = compras.reduce((suma, c) => suma + c.unidades, 0);
  const vendidas = (producto.ventas ?? []).reduce((suma, v) => suma + v.cantidad, 0);
  const ultima = compras[0];

  const actualizarConId = actualizarProducto.bind(null, producto.id);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-foreground">Editar producto</h1>
        {producto.visible_publico ? (
          // Pestaña nueva: no se pierde lo que se está editando.
          <Link
            href={`/producto/${producto.id}`}
            target="_blank"
            rel="noopener"
            className={btnSecundario}
          >
            <EyeIcon className="h-4 w-4" />
            Ver en la tienda
          </Link>
        ) : (
          <span
            aria-disabled="true"
            title="Está oculta: el interruptor «Visible en la tienda» está apagado"
            className={`${btnSecundario} cursor-not-allowed opacity-60 active:scale-100`}
          >
            <EyeIcon className="h-4 w-4" />
            Ver en la tienda · oculto: no se ve en la tienda
          </span>
        )}
      </div>
      <div className="mt-4">
        <ProductForm
          producto={producto}
          unidades={{ compradas, vendidas }}
          categorias={categorias ?? []}
          action={actualizarConId}
        />
      </div>

      <section id="compras" className="mt-8 flex max-w-2xl scroll-mt-20 flex-col gap-3">
        <div>
          <h2 className="font-display text-xl text-foreground">Compras de esta gorra</h2>
          <p className="text-sm text-muted">
            El stock y el costo promedio salen de acá. Una recompra se suma como compra nueva.
          </p>
        </div>
        <SumarCompra
          productoId={producto.id}
          lotes={lotes}
          abiertoInicial={sumar === "1"}
          inicial={{
            precio: Math.round(ultima?.precio ?? Number(producto.precio_compra)),
            extra: Math.round(ultima?.extra ?? Number(producto.costo_extra)),
            ref: producto.ref_interna,
          }}
        />
        <ListaCompras compras={compras} modo="producto" vacio="Esta gorra no tiene compras cargadas." />
      </section>
    </div>
  );
}
