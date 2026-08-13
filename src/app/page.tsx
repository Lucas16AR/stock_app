import { createClient } from "@/lib/supabase/server";
import { Producto, Categoria } from "@/lib/types";
import SiteHeader from "@/components/SiteHeader";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";

export const revalidate = 0;

export default async function HomePage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const categoriaId = searchParams.categoria
    ? Number(Array.isArray(searchParams.categoria) ? searchParams.categoria[0] : searchParams.categoria)
    : undefined;

  const supabase = await createClient();

  const { data: categorias } = await supabase
    .from("categorias")
    .select("*")
    .order("nombre")
    .returns<Categoria[]>();

  const query = supabase
    .from("productos")
    .select("*, fotos_producto(*), categorias(*)")
    .order("fecha_creacion", { ascending: false });

  const { data: productos } = await query.returns<Producto[]>();

  const productosFiltrados = categoriaId
    ? (productos ?? []).filter((p) =>
        p.categorias?.some((c) => c.id === categoriaId)
      )
    : productos ?? [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-2 pb-10">
        <div className="px-2 pt-6">
          <h1 className="font-display text-3xl text-neutral-50">
            Gorras disponibles
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Tocá una gorra para ver fotos y consultar por WhatsApp.
          </p>
        </div>
        <CategoryFilter categorias={categorias ?? []} activa={categoriaId} />

        {productosFiltrados.length === 0 ? (
          <p className="px-4 py-16 text-center text-neutral-500">
            No hay gorras disponibles por el momento. Volvé a pasar pronto 🧢
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-2 sm:grid-cols-3 lg:grid-cols-4">
            {productosFiltrados.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        )}
      </main>
      <footer className="border-t border-neutral-800 py-6 text-center text-xs text-neutral-600">
        © {new Date().getFullYear()} Gorras Showroom
      </footer>
    </>
  );
}
