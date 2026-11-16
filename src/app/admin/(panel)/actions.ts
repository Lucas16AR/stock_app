"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MAX_FOTOS_POR_PRODUCTO } from "@/lib/fotos";
import {
  exito,
  fallo,
  mensajeError,
  motivoNoBorrarProducto,
  plural,
  MENSAJE_SIN_PRECIO,
  type Resultado,
} from "@/lib/acciones";
import { esDiaValido, fechaParaGuardar, formatFechaCorta, hoyAR } from "@/lib/fechas";
import { envioPorGorra, leerFechaLote } from "@/lib/lotes";
import { formatARS } from "@/lib/pricing";
import { mensajeErrorVenta } from "@/lib/ventas";

// Todas las acciones devuelven Resultado ({ ok, mensaje } o { ok, error })
// en vez de ignorar el error de Supabase. El cliente (FormAccion /
// BotonBorrar) muestra el aviso y, si viene `redirigirA`, navega: por eso
// acá no se usa redirect().

type Supabase = Awaited<ReturnType<typeof createClient>>;

// ---------- Categorías ----------
export async function crearCategoria(formData: FormData): Promise<Resultado> {
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return fallo("Escribí un nombre para la categoría.");
  const supabase = await createClient();
  const { error } = await supabase.from("categorias").insert({ nombre });
  if (error) return fallo(mensajeError(error, "agregar la categoría"));
  revalidatePath("/admin/categorias");
  revalidatePath("/");
  return exito(`Categoría «${nombre}» agregada`);
}

export async function actualizarCategoria(id: number, formData: FormData): Promise<Resultado> {
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return fallo("Escribí un nombre para la categoría.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("categorias").update({ nombre }).eq("id", id).select("id");
  if (error) return fallo(mensajeError(error, "guardar la categoría"));
  if (!data?.length) return fallo("Esa categoría ya no existe. Recargá la página.");
  revalidatePath("/admin/categorias");
  revalidatePath("/");
  return exito("Categoría guardada");
}

export async function eliminarCategoria(id: number): Promise<Resultado> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categorias").delete().eq("id", id).select("nombre");
  if (error) return fallo(mensajeError(error, "borrar la categoría"));
  if (!data?.length) return fallo("Esa categoría ya no existe. Recargá la página.");
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/productos");
  revalidatePath("/");
  return exito(`Categoría «${data[0].nombre}» borrada`);
}

// ---------- Lotes ----------

function revalidarLote(id: number) {
  revalidatePath("/admin/lotes");
  revalidatePath(`/admin/lotes/${id}`);
  revalidatePath("/admin/productos");
  revalidatePath("/admin/inventario");
}

export async function crearLote(formData: FormData): Promise<Resultado> {
  const costo_envio = Number(formData.get("costo_envio") || 0);
  const nota = String(formData.get("nota") || "").trim() || null;
  if (!Number.isFinite(costo_envio) || costo_envio < 0) return fallo("El costo de envío no puede ser negativo.");
  const { fecha, error: errorFecha } = leerFechaLote(formData);
  if (errorFecha) return fallo(errorFecha);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lotes")
    .insert({ costo_envio, nota, ...(fecha ? { fecha } : {}) })
    .select("id")
    .single();
  if (error || !data) return fallo(mensajeError(error, "crear el lote"));
  revalidatePath("/admin/lotes");
  // A la edición: ahí se le asignan las gorras.
  return exito(`Lote #${data.id} creado`, `/admin/lotes/${data.id}`);
}

export async function actualizarLote(id: number, formData: FormData): Promise<Resultado> {
  const costo_envio = Number(formData.get("costo_envio") || 0);
  const nota = String(formData.get("nota") || "").trim() || null;
  if (!Number.isFinite(costo_envio) || costo_envio < 0) return fallo("El costo de envío no puede ser negativo.");
  const { fecha, error: errorFecha } = leerFechaLote(formData);
  if (errorFecha) return fallo(errorFecha);

  const supabase = await createClient();
  const cambios = {
    costo_envio,
    nota,
    // Hoy elegido al editar: la hora de ahora.
    ...(fecha !== undefined ? { fecha: fecha ?? new Date().toISOString() } : {}),
  };
  const { data, error } = await supabase.from("lotes").update(cambios).eq("id", id).select("id");
  if (error) return fallo(mensajeError(error, "guardar el lote"));
  if (!data?.length) return fallo("Ese lote ya no existe. Recargá la página.");
  revalidarLote(id);
  return exito(`Lote #${id} guardado`);
}

// Asigna varias gorras a un lote de una vez (las saca del lote en que
// estuvieran).
export async function asignarLote(loteId: number, productoIds: number[]): Promise<Resultado> {
  if (!Number.isInteger(loteId) || !Array.isArray(productoIds)) return fallo("Pedido inválido. Recargá la página.");
  const ids = [...new Set(productoIds)].filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length === 0) return fallo("Marcá al menos una gorra.");

  const supabase = await createClient();
  const { data: lote, error: loteError } = await supabase.from("lotes").select("id").eq("id", loteId).maybeSingle();
  if (loteError) return fallo(mensajeError(loteError, "asignar las gorras"));
  if (!lote) return fallo("Ese lote ya no existe. Recargá la página.");

  const { data, error } = await supabase.from("productos").update({ lote_id: loteId }).in("id", ids).select("id");
  if (error) return fallo(mensajeError(error, "asignar las gorras"));
  if (!data?.length) return fallo("Esas gorras ya no existen. Recargá la página.");
  revalidarLote(loteId);
  return exito(`${plural(data.length, "gorra asignada", "gorras asignadas")} al lote #${loteId}`);
}

export async function quitarDelLote(loteId: number, productoId: number): Promise<Resultado> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("productos")
    .update({ lote_id: null })
    .eq("id", productoId)
    .eq("lote_id", loteId)
    .select("nombre");
  if (error) return fallo(mensajeError(error, "sacar la gorra del lote"));
  if (!data?.length) return fallo("Esa gorra ya no está en este lote. Recargá la página.");
  revalidarLote(loteId);
  return exito(`«${data[0].nombre}» quedó sin lote`);
}

// Pone costo_envio_unitario = costo de envío del lote / gorras del lote,
// en todas ellas. El precio sugerido se recalcula solo; el precio de
// venta no se toca.
export async function repartirEnvio(loteId: number): Promise<Resultado> {
  const supabase = await createClient();
  const { data: lote, error: loteError } = await supabase
    .from("lotes")
    .select("costo_envio")
    .eq("id", loteId)
    .maybeSingle();
  if (loteError) return fallo(mensajeError(loteError, "repartir el envío"));
  if (!lote) return fallo("Ese lote ya no existe. Recargá la página.");

  const { count, error: countError } = await supabase
    .from("productos")
    .select("id", { count: "exact", head: true })
    .eq("lote_id", loteId);
  if (countError) return fallo(mensajeError(countError, "repartir el envío"));
  const n = count ?? 0;
  if (n === 0) return fallo("El lote no tiene gorras para repartir el envío.");

  const porGorra = envioPorGorra(Number(lote.costo_envio), n);
  const { data, error } = await supabase
    .from("productos")
    .update({ costo_envio_unitario: porGorra })
    .eq("lote_id", loteId)
    .select("id");
  if (error) return fallo(mensajeError(error, "repartir el envío"));
  revalidarLote(loteId);
  return exito(`Envío repartido: ${formatARS(porGorra)} por gorra en ${plural(data?.length ?? n, "gorra")}`);
}

export async function eliminarLote(id: number): Promise<Resultado> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("productos")
    .select("id", { count: "exact", head: true })
    .eq("lote_id", id);
  // Los productos del lote quedan sin lote (ON DELETE SET NULL).
  const { data, error } = await supabase.from("lotes").delete().eq("id", id).select("id");
  if (error) return fallo(mensajeError(error, "borrar el lote"));
  if (!data?.length) return fallo("Ese lote ya no existe. Recargá la página.");
  revalidatePath("/admin/lotes");
  revalidatePath("/admin/productos");
  const gorras = count ?? 0;
  return exito(
    gorras > 0 ? `Lote #${id} borrado. ${plural(gorras, "gorra")} quedaron sin lote.` : `Lote #${id} borrado`
  );
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

// Devuelve cuántas fotos no se pudieron subir (tipo no permitido, muy
// grandes, sin lugar o error de Storage), para avisarlo.
async function subirFotos(supabase: Supabase, productoId: number, files: File[]) {
  const reales = files.filter((f) => f && f.size > 0);
  if (reales.length === 0) return 0;

  const { count } = await supabase
    .from("fotos_producto")
    .select("id", { count: "exact", head: true })
    .eq("producto_id", productoId);

  let existentes = count ?? 0;
  let fallidas = 0;

  for (const file of reales) {
    const ext = MIME_A_EXT[file.type];
    if (existentes >= MAX_FOTOS_POR_PRODUCTO || !ext || file.size > TAMANO_MAX_BYTES) {
      fallidas++;
      continue;
    }

    const path = `${productoId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("productos")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      fallidas++;
      continue;
    }

    const { error: insertError } = await supabase
      .from("fotos_producto")
      .insert({ producto_id: productoId, path, orden: existentes });
    if (insertError) {
      fallidas++;
      await supabase.storage.from("productos").remove([path]); // no dejar el archivo huérfano
      continue;
    }
    existentes++;
  }
  return fallidas;
}

function leerProducto(formData: FormData) {
  const lote_id_raw = formData.get("lote_id");
  return {
    nombre: String(formData.get("nombre") || "").trim(),
    descripcion: String(formData.get("descripcion") || "").trim() || null,
    ref_interna: String(formData.get("ref_interna") || "").trim() || null,
    cantidad: Number(formData.get("cantidad") || 0),
    precio_compra: Number(formData.get("precio_compra") || 0),
    costo_envio_unitario: Number(formData.get("costo_envio_unitario") || 0),
    costo_extra: Number(formData.get("costo_extra") || 0),
    margen: Number(formData.get("margen") || 0.5),
    precio_venta: Number(formData.get("precio_venta") || 0),
    lote_id: lote_id_raw ? Number(lote_id_raw) : null,
    visible_publico: formData.get("visible_publico") === "on",
  };
}

function notaFotos(fallidas: number) {
  return fallidas > 0 ? ` (${plural(fallidas, "foto")} no se ${fallidas === 1 ? "pudo" : "pudieron"} subir)` : "";
}

export async function crearProducto(formData: FormData): Promise<Resultado> {
  const supabase = await createClient();
  const campos = leerProducto(formData);
  const categoriaIds = formData.getAll("categorias").map(Number);
  if (!campos.nombre) return fallo("El producto necesita un nombre.");
  if (campos.visible_publico && !(campos.precio_venta > 0)) return fallo(`${MENSAJE_SIN_PRECIO} O dejala oculta.`);

  const { data: producto, error } = await supabase.from("productos").insert(campos).select("id").single();
  if (error || !producto) return fallo(mensajeError(error, "guardar el producto"));

  if (categoriaIds.length > 0) {
    const { error: catError } = await supabase
      .from("producto_categoria")
      .insert(categoriaIds.map((categoria_id) => ({ producto_id: producto.id, categoria_id })));
    if (catError) {
      revalidatePath("/admin/productos");
      return fallo(`El producto se creó, pero no se pudieron guardar las categorías. ${mensajeError(catError, "asignarlas")} Editalo para reintentar.`);
    }
  }

  const fallidas = await subirFotos(supabase, producto.id, formData.getAll("fotos") as File[]);

  revalidatePath("/admin/productos");
  revalidatePath("/");
  return exito(`Producto «${campos.nombre}» guardado${notaFotos(fallidas)}`, "/admin/productos");
}

export async function actualizarProducto(id: number, formData: FormData): Promise<Resultado> {
  const supabase = await createClient();
  const campos = leerProducto(formData);
  const categoriaIds = formData.getAll("categorias").map(Number);
  if (!campos.nombre) return fallo("El producto necesita un nombre.");
  if (campos.visible_publico && !(campos.precio_venta > 0)) return fallo(`${MENSAJE_SIN_PRECIO} O dejala oculta.`);

  const { data, error } = await supabase.from("productos").update(campos).eq("id", id).select("id");
  if (error) return fallo(mensajeError(error, "guardar el producto"));
  if (!data?.length) return fallo("Ese producto ya no existe. Recargá la página.");

  const { error: delCatError } = await supabase.from("producto_categoria").delete().eq("producto_id", id);
  const { error: catError } =
    delCatError || categoriaIds.length === 0
      ? { error: delCatError }
      : await supabase
          .from("producto_categoria")
          .insert(categoriaIds.map((categoria_id) => ({ producto_id: id, categoria_id })));
  if (catError) {
    revalidatePath(`/admin/productos/${id}`);
    return fallo(`Se guardaron los datos, pero no las categorías. ${mensajeError(catError, "asignarlas")}`);
  }

  const fallidas = await subirFotos(supabase, id, formData.getAll("fotos") as File[]);

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${id}`);
  revalidatePath("/");
  return exito(`Producto «${campos.nombre}» guardado${notaFotos(fallidas)}`, "/admin/productos");
}

// Interruptor "Visible" del listado: publica u oculta sin pasar por el
// formulario. Para publicar exige precio de venta > 0; la condición va en
// el mismo UPDATE, así no hay carrera entre leer el precio y publicar.
export async function cambiarVisible(id: number, visible: boolean): Promise<Resultado> {
  if (!Number.isInteger(id) || typeof visible !== "boolean") return fallo("Pedido inválido. Recargá la página.");
  const supabase = await createClient();

  let consulta = supabase.from("productos").update({ visible_publico: visible }).eq("id", id);
  if (visible) consulta = consulta.gt("precio_venta", 0);
  const { data, error } = await consulta.select("id");
  if (error) return fallo(mensajeError(error, visible ? "publicar la gorra" : "ocultar la gorra"));

  if (!data?.length) {
    // No se actualizó nada: o no existe, o (al publicar) no tiene precio.
    const { data: existe } = await supabase.from("productos").select("id").eq("id", id).maybeSingle();
    return fallo(existe ? MENSAJE_SIN_PRECIO : "Esa gorra ya no existe. Recargá la página.");
  }

  revalidatePath("/");
  revalidatePath(`/producto/${id}`);
  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${id}`);
  return exito(visible ? "Publicada en la tienda" : "Oculta de la tienda");
}

export async function eliminarProducto(id: number): Promise<Resultado> {
  const supabase = await createClient();

  const { count: ventas } = await supabase
    .from("ventas")
    .select("id", { count: "exact", head: true })
    .eq("producto_id", id);
  if ((ventas ?? 0) > 0) return fallo(`No se puede borrar. ${motivoNoBorrarProducto(ventas ?? 0)}`);

  const { data: fotos } = await supabase.from("fotos_producto").select("path").eq("producto_id", id);

  // Primero la fila (las fotos_producto se borran en cascada) y recién
  // después los archivos: si la fila no se puede borrar, las fotos quedan.
  const { data, error } = await supabase.from("productos").delete().eq("id", id).select("nombre");
  if (error) {
    if (error.code === "23503") return fallo(`No se puede borrar. ${motivoNoBorrarProducto()}`);
    return fallo(mensajeError(error, "borrar el producto"));
  }
  if (!data?.length) return fallo("Ese producto ya no existe. Recargá la página.");

  if (fotos && fotos.length > 0) {
    await supabase.storage.from("productos").remove(fotos.map((f) => f.path));
  }

  revalidatePath("/admin/productos");
  revalidatePath("/admin/inventario");
  revalidatePath("/");
  return exito(`Producto «${data[0].nombre}» borrado`);
}

export async function eliminarFoto(fotoId: number, productoId: number): Promise<Resultado> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("fotos_producto").delete().eq("id", fotoId).select("path");
  if (error) return fallo(mensajeError(error, "borrar la foto"));
  if (!data?.length) return fallo("Esa foto ya no existe. Recargá la página.");

  const { error: storageError } = await supabase.storage.from("productos").remove([data[0].path]);
  revalidatePath(`/admin/productos/${productoId}`);
  revalidatePath("/");
  // La foto ya no se muestra; si falló el archivo, solo queda ocupando lugar.
  return exito(storageError ? "Foto borrada (el archivo no se pudo limpiar del almacenamiento)" : "Foto borrada");
}

// ---------- Ventas ----------
// Las ventas pasan por las funciones de la base (migración 005), que
// validan, registran y tocan el stock en una sola transacción.

function revalidarVentas(productoId: number) {
  revalidatePath("/admin/ventas");
  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${productoId}`);
  revalidatePath("/admin/inventario");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/producto/${productoId}`);
}

export async function registrarVenta(formData: FormData): Promise<Resultado> {
  const producto_id = Number(formData.get("producto_id"));
  const cantidad = Number(formData.get("cantidad") || 0);
  const precio = Number(formData.get("precio_venta"));
  const dia = String(formData.get("fecha") || "");

  if (!Number.isInteger(producto_id) || producto_id <= 0) return fallo("Elegí qué gorra se vendió.");
  if (!Number.isInteger(cantidad) || cantidad <= 0) return fallo("La cantidad tiene que ser 1 o más.");
  if (formData.get("precio_venta") === "" || !Number.isFinite(precio) || precio < 0) {
    return fallo("Cargá el precio de venta.");
  }
  if (!esDiaValido(dia)) return fallo("Elegí la fecha de la venta.");
  const hoy = hoyAR();
  if (dia > hoy) return fallo("La fecha de la venta no puede ser posterior a hoy.");

  const supabase = await createClient();
  const fecha = fechaParaGuardar(dia, hoy);
  const { error } = await supabase.rpc("registrar_venta", {
    p_producto_id: producto_id,
    p_cantidad: cantidad,
    p_precio: precio,
    ...(fecha ? { p_fecha: fecha } : {}),
  });
  if (error) return fallo(mensajeErrorVenta(error, "registrar la venta"));

  const { data: producto } = await supabase.from("productos").select("nombre").eq("id", producto_id).maybeSingle();
  revalidarVentas(producto_id);
  const quien = producto?.nombre ?? "la gorra";
  return exito(`Venta registrada: ${cantidad > 1 ? `${cantidad} × ` : ""}${quien}${fecha ? ` (${formatFechaCorta(fecha)})` : ""}`);
}

export async function anularVenta(ventaId: number): Promise<Resultado> {
  if (!Number.isInteger(ventaId)) return fallo("Pedido inválido. Recargá la página.");
  const supabase = await createClient();

  const { data: venta, error: leerError } = await supabase
    .from("ventas")
    .select("producto_id, cantidad, productos(nombre)")
    .eq("id", ventaId)
    .maybeSingle<{ producto_id: number; cantidad: number; productos: { nombre: string } | null }>();
  if (leerError) return fallo(mensajeError(leerError, "anular la venta"));
  if (!venta) return fallo(mensajeErrorVenta({ message: "venta_no_encontrada" }, "anular la venta"));

  const { error } = await supabase.rpc("anular_venta", { p_venta_id: ventaId });
  if (error) return fallo(mensajeErrorVenta(error, "anular la venta"));

  revalidarVentas(venta.producto_id);
  const nombre = venta.productos?.nombre ?? "La gorra";
  return exito(`Venta anulada · ${nombre} volvió al stock${venta.cantidad > 1 ? ` (+${venta.cantidad})` : ""}`);
}
