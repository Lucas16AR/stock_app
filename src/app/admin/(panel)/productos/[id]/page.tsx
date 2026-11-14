import Link from "next/link";
import { notFound } from "next/navigation";
import { EyeIcon } from "@/components/icons";
import { btnSecundario } from "@/components/admin/estilos";
import { createClient } from "@/lib/supabase/server";
import { Categoria, Lote, Producto } from "@/lib/types";
import ProductForm from "@/components/admin/ProductForm";
import { actualizarProducto } from "../../actions";

export default async function EditarProductoPage(
  props: PageProps<"/admin/productos/[id]">
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: productoData }, { data: categorias }, { data: lotes }] = await Promise.all([
    supabase
      .from("productos")
      .select("*, fotos_producto(*), categorias(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categorias").select("*").order("nombre").returns<Categoria[]>(),
    supabase.from("lotes").select("*").order("fecha", { ascending: false }).returns<Lote[]>(),
  ]);

  const producto = productoData as Producto | null;
  if (!producto) notFound();

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
            title="Está oculto: destildaste «Visible al público»"
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
          categorias={categorias ?? []}
          lotes={lotes ?? []}
          action={actualizarConId}
        />
      </div>
    </div>
  );
}
