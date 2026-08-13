import { createClient } from "@/lib/supabase/server";
import { Categoria } from "@/lib/types";
import { crearCategoria, eliminarCategoria } from "../actions";

export const revalidate = 0;

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("categorias").select("*").order("nombre");
  const categorias = (data ?? []) as Categoria[];

  return (
    <div>
      <h1 className="font-display text-2xl text-neutral-50">Categorías</h1>

      <form action={crearCategoria} className="mt-4 flex max-w-md gap-2">
        <input
          name="nombre"
          required
          placeholder="Nombre de la categoría"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-neutral-950">
          Agregar
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-2">
        {categorias.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-xl bg-neutral-900 px-4 py-2 ring-1 ring-neutral-800"
          >
            <span className="text-neutral-100">{c.nombre}</span>
            <form
              action={async () => {
                "use server";
                await eliminarCategoria(c.id);
              }}
            >
              <button className="rounded-lg border border-red-900 px-3 py-1 text-sm text-red-400 hover:bg-red-950">
                Eliminar
              </button>
            </form>
          </div>
        ))}
        {categorias.length === 0 && (
          <p className="rounded-2xl bg-neutral-900 p-8 text-center text-neutral-500 ring-1 ring-neutral-800">
            Todavía no hay categorías.
          </p>
        )}
      </div>
    </div>
  );
}
