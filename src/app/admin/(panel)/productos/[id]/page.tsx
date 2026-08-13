import { notFound } from "next/navigation";
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
      <h1 className="font-display text-2xl text-neutral-50">Editar producto</h1>
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
