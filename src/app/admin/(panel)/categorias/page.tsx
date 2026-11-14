import { createClient } from "@/lib/supabase/server";
import { Categoria } from "@/lib/types";
import { plural } from "@/lib/acciones";
import BotonBorrar from "@/components/admin/BotonBorrar";
import BotonEnviar from "@/components/admin/BotonEnviar";
import FormAccion from "@/components/admin/FormAccion";
import { btnPrimario } from "@/components/admin/estilos";
import { crearCategoria, eliminarCategoria } from "../actions";

export const revalidate = 0;

type CategoriaListado = Categoria & { producto_categoria: { count: number }[] };

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categorias")
    .select("id, nombre, producto_categoria(count)")
    .order("nombre");
  const categorias = (data ?? []) as CategoriaListado[];

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Categorías</h1>

      <FormAccion accion={crearCategoria} limpiarAlTerminar className="mt-4 flex max-w-md gap-2">
        <input
          name="nombre"
          required
          placeholder="Nombre de la categoría"
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
        <BotonEnviar textoPendiente="Agregando…" className={`${btnPrimario} shrink-0 text-sm`}>
          Agregar
        </BotonEnviar>
      </FormAccion>

      <div className="mt-4 flex flex-col gap-2">
        {categorias.map((c) => {
          const gorras = c.producto_categoria?.[0]?.count ?? 0;
          return (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-card px-4 py-2 ring-1 ring-border"
            >
              <span className="text-foreground">
                {c.nombre} <span className="text-sm text-muted">· {plural(gorras, "gorra")}</span>
              </span>
              <BotonBorrar
                accion={eliminarCategoria.bind(null, c.id)}
                etiqueta={`Borrar la categoría «${c.nombre}»`}
                titulo={`¿Borrar la categoría «${c.nombre}»?`}
                detalle={
                  gorras > 0
                    ? `${plural(gorras, "gorra tiene", "gorras tienen")} esta categoría; se la vas a sacar. Las gorras no se borran.`
                    : "Ninguna gorra tiene esta categoría."
                }
              />
            </div>
          );
        })}
        {categorias.length === 0 && (
          <p className="rounded-2xl bg-card p-8 text-center text-muted ring-1 ring-border">
            Todavía no hay categorías.
          </p>
        )}
      </div>
    </div>
  );
}
