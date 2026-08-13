import { createClient } from "@/lib/supabase/server";
import { Categoria, Lote } from "@/lib/types";
import ProductForm from "@/components/admin/ProductForm";
import { crearProducto } from "../../actions";

export default async function NuevoProductoPage() {
  const supabase = await createClient();
  const [{ data: categorias }, { data: lotes }] = await Promise.all([
    supabase.from("categorias").select("*").order("nombre").returns<Categoria[]>(),
    supabase.from("lotes").select("*").order("fecha", { ascending: false }).returns<Lote[]>(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-neutral-50">Nuevo producto</h1>
      <div className="mt-4">
        <ProductForm categorias={categorias ?? []} lotes={lotes ?? []} action={crearProducto} />
      </div>
    </div>
  );
}
