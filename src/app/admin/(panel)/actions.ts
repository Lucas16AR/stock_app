"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ---------- Categorías ----------
export async function crearCategoria(formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return;
  const supabase = await createClient();
  await supabase.from("categorias").insert({ nombre });
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function actualizarCategoria(id: number, formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return;
  const supabase = await createClient();
  await supabase.from("categorias").update({ nombre }).eq("id", id);
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function eliminarCategoria(id: number) {
  const supabase = await createClient();
  await supabase.from("categorias").delete().eq("id", id);
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

// ---------- Lotes ----------
export async function crearLote(formData: FormData) {
  const costo_envio = Number(formData.get("costo_envio") || 0);
  const nota = String(formData.get("nota") || "").trim() || null;
  const supabase = await createClient();
  await supabase.from("lotes").insert({ costo_envio, nota });
  revalidatePath("/admin/lotes");
  redirect("/admin/lotes");
}

export async function actualizarLote(id: number, formData: FormData) {
  const costo_envio = Number(formData.get("costo_envio") || 0);
  const nota = String(formData.get("nota") || "").trim() || null;
  const supabase = await createClient();
  await supabase.from("lotes").update({ costo_envio, nota }).eq("id", id);
  revalidatePath("/admin/lotes");
  redirect("/admin/lotes");
}

export async function eliminarLote(id: number) {
  const supabase = await createClient();
  // Los productos del lote quedan sin lote (ON DELETE SET NULL)
  await supabase.from("lotes").delete().eq("id", id);
  revalidatePath("/admin/lotes");
  revalidatePath("/admin/productos");
}

// ---------- Productos ----------

// Extensión derivada del MIME type real, nunca del nombre de archivo que
// manda el cliente (evita subir .html/.svg/.exe disfrazados de imagen).
const MIME_A_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const TAMANO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB por foto

async function subirFotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productoId: number,
  files: File[]
) {
  const { count } = await supabase
    .from("fotos_producto")
    .select("id", { count: "exact", head: true })
    .eq("producto_id", productoId);

  let existentes = count ?? 0;

  for (const file of files) {
    if (!file || file.size === 0) continue;
    if (existentes >= 4) break;

    const ext = MIME_A_EXT[file.type];
    if (!ext) continue; // tipo de archivo no permitido, se ignora en silencio
    if (file.size > TAMANO_MAX_BYTES) continue; // demasiado grande, se ignora

    const path = `${productoId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("productos")
      .upload(path, file, { contentType: file.type });

    if (!uploadError) {
      await supabase
        .from("fotos_producto")
        .insert({ producto_id: productoId, path, orden: existentes });
      existentes++;
    }
  }
}

export async function crearProducto(formData: FormData) {
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const cantidad = Number(formData.get("cantidad") || 0);
  const precio_compra = Number(formData.get("precio_compra") || 0);
  const costo_envio_unitario = Number(formData.get("costo_envio_unitario") || 0);
  const costo_extra = Number(formData.get("costo_extra") || 0);
  const margen = Number(formData.get("margen") || 0.5);
  const lote_id_raw = formData.get("lote_id");
  const lote_id = lote_id_raw ? Number(lote_id_raw) : null;
  const visible_publico = formData.get("visible_publico") === "on";
  const categoriaIds = formData.getAll("categorias").map(Number);

  if (!nombre) return;

  const { data: producto, error } = await supabase
    .from("productos")
    .insert({
      nombre,
      descripcion,
      cantidad,
      precio_compra,
      costo_envio_unitario,
      costo_extra,
      margen,
      lote_id,
      visible_publico,
    })
    .select()
    .single();

  if (error || !producto) return;

  if (categoriaIds.length > 0) {
    await supabase
      .from("producto_categoria")
      .insert(categoriaIds.map((categoria_id) => ({ producto_id: producto.id, categoria_id })));
  }

  const files = formData.getAll("fotos") as File[];
  await subirFotos(supabase, producto.id, files);

  revalidatePath("/admin/productos");
  revalidatePath("/");
  redirect("/admin/productos");
}

export async function actualizarProducto(id: number, formData: FormData) {
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const cantidad = Number(formData.get("cantidad") || 0);
  const precio_compra = Number(formData.get("precio_compra") || 0);
  const costo_envio_unitario = Number(formData.get("costo_envio_unitario") || 0);
  const costo_extra = Number(formData.get("costo_extra") || 0);
  const margen = Number(formData.get("margen") || 0.5);
  const lote_id_raw = formData.get("lote_id");
  const lote_id = lote_id_raw ? Number(lote_id_raw) : null;
  const visible_publico = formData.get("visible_publico") === "on";
  const categoriaIds = formData.getAll("categorias").map(Number);

  await supabase
    .from("productos")
    .update({
      nombre,
      descripcion,
      cantidad,
      precio_compra,
      costo_envio_unitario,
      costo_extra,
      margen,
      lote_id,
      visible_publico,
    })
    .eq("id", id);

  await supabase.from("producto_categoria").delete().eq("producto_id", id);
  if (categoriaIds.length > 0) {
    await supabase
      .from("producto_categoria")
      .insert(categoriaIds.map((categoria_id) => ({ producto_id: id, categoria_id })));
  }

  const files = formData.getAll("fotos") as File[];
  await subirFotos(supabase, id, files);

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${id}`);
  revalidatePath("/");
  redirect("/admin/productos");
}

export async function eliminarProducto(id: number) {
  const supabase = await createClient();

  const { data: fotos } = await supabase
    .from("fotos_producto")
    .select("path")
    .eq("producto_id", id);

  if (fotos && fotos.length > 0) {
    await supabase.storage.from("productos").remove(fotos.map((f) => f.path));
  }

  await supabase.from("productos").delete().eq("id", id);
  revalidatePath("/admin/productos");
  revalidatePath("/");
}

export async function eliminarFoto(fotoId: number, productoId: number) {
  const supabase = await createClient();
  const { data: foto } = await supabase
    .from("fotos_producto")
    .select("path")
    .eq("id", fotoId)
    .maybeSingle();

  if (foto) {
    await supabase.storage.from("productos").remove([foto.path]);
  }
  await supabase.from("fotos_producto").delete().eq("id", fotoId);
  revalidatePath(`/admin/productos/${productoId}`);
  revalidatePath("/");
}

// ---------- Ventas ----------
export async function registrarVenta(formData: FormData) {
  const supabase = await createClient();

  const producto_id = Number(formData.get("producto_id"));
  const cantidad = Number(formData.get("cantidad") || 0);
  const precio_venta = Number(formData.get("precio_venta") || 0);

  if (!producto_id || cantidad <= 0) return { error: "Datos inválidos" };

  const { data: producto } = await supabase
    .from("productos")
    .select("cantidad")
    .eq("id", producto_id)
    .maybeSingle();

  if (!producto) return { error: "Producto no encontrado" };
  if (cantidad > producto.cantidad) {
    return { error: `No hay suficiente stock. Disponible: ${producto.cantidad}` };
  }

  await supabase.from("ventas").insert({ producto_id, cantidad, precio_venta });
  await supabase
    .from("productos")
    .update({ cantidad: producto.cantidad - cantidad })
    .eq("id", producto_id);

  revalidatePath("/admin/ventas");
  revalidatePath("/admin/productos");
  revalidatePath("/admin/inventario");
  revalidatePath("/");
  return { error: null };
}
