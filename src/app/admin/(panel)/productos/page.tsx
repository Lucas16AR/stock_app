import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Producto } from "@/lib/types";
import { formatARS, precioSugerido } from "@/lib/pricing";
import { eliminarProducto } from "../actions";

export const revalidate = 0;

export default async function ProductosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("productos")
    .select("*, fotos_producto(*), categorias(*)")
    .order("fecha_creacion", { ascending: false });

  const productos = (data ?? []) as Producto[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-neutral-50">Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-neutral-950"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Precio sugerido</th>
              <th className="px-4 py-2">Visible</th>
              <th className="px-4 py-2">Categorías</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} className="border-t border-neutral-800">
                <td className="px-4 py-2 text-neutral-100">{p.nombre}</td>
                <td className="px-4 py-2">{p.cantidad}</td>
                <td className="px-4 py-2 text-accent">{formatARS(precioSugerido(p))}</td>
                <td className="px-4 py-2">{p.visible_publico ? "Sí" : "No"}</td>
                <td className="px-4 py-2 text-neutral-400">
                  {p.categorias?.map((c) => c.nombre).join(", ") || "-"}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="rounded-lg border border-neutral-700 px-3 py-1 text-neutral-300 hover:bg-neutral-800"
                    >
                      Editar
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await eliminarProducto(p.id);
                      }}
                    >
                      <button className="rounded-lg border border-red-900 px-3 py-1 text-red-400 hover:bg-red-950">
                        Eliminar
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  Todavía no cargaste productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
