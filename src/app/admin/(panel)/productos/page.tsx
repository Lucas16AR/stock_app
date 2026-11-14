import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Producto } from "@/lib/types";
import { formatARS } from "@/lib/pricing";
import { motivoNoBorrarProducto, plural } from "@/lib/acciones";
import BotonBorrar from "@/components/admin/BotonBorrar";
import { btnPrimario, btnSecundario } from "@/components/admin/estilos";
import { eliminarProducto } from "../actions";

export const revalidate = 0;

type ProductoListado = Producto & { ventas: { count: number }[] };

export default async function ProductosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("productos")
    .select("*, fotos_producto(id), categorias(id, nombre), ventas(count)")
    .order("fecha_creacion", { ascending: false });

  const productos = (data ?? []) as ProductoListado[];

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-foreground">Productos</h1>
        <Link href="/admin/productos/nuevo" className={`${btnPrimario} text-sm`}>
          + Nuevo producto
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-card text-muted">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Precio de venta</th>
              <th className="px-4 py-2">Visible</th>
              <th className="px-4 py-2">Categorías</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => {
              const ventas = p.ventas?.[0]?.count ?? 0;
              const fotos = p.fotos_producto?.length ?? 0;
              return (
                <tr key={p.id} className="border-t border-border bg-card">
                  <td className="px-4 py-2 text-foreground">{p.nombre}</td>
                  <td className="px-4 py-2">{p.cantidad}</td>
                  <td className="px-4 py-2 text-accent">{formatARS(p.precio_venta)}</td>
                  <td className="px-4 py-2">{p.visible_publico ? "Sí" : "No"}</td>
                  <td className="px-4 py-2 text-muted">
                    {p.categorias?.map((c) => c.nombre).join(", ") || "-"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {/* Borrar va aparte, a la derecha y con espacio, para no tocarlo por Editar. */}
                    <div className="flex items-center justify-end gap-4">
                      <Link href={`/admin/productos/${p.id}`} className={btnSecundario}>
                        Editar
                      </Link>
                      <BotonBorrar
                        accion={eliminarProducto.bind(null, p.id)}
                        etiqueta={`Borrar «${p.nombre}»`}
                        titulo={`¿Borrar «${p.nombre}»?`}
                        detalle={`Se borra el producto${fotos > 0 ? ` y sus ${plural(fotos, "foto")}` : ""}. No se puede deshacer.`}
                        bloqueo={ventas > 0 ? motivoNoBorrarProducto(ventas) : undefined}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {productos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
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
