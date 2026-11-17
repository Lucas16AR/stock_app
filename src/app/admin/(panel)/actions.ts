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
import { leerCompra, mensajeErrorCompra, textoCompras } from "@/lib/compras";
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
  // A la edición: ahí se le cargan las gorras.
  return exito(`Lote #${data.id} creado`, `/admin/lotes/${data.id}`);
}

// Guarda el lote y reparte el envío entre las unidades de sus compras
// (repartir_envio_lote): así un cambio del costo de envío llega solo a
// cada gorra.
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

  const { error: repartoError } = await supabase.rpc("repartir_envio_lote", { p_lote_id: id });
  revalidarLote(id);
  if (repartoError) {
    return fallo(`El lote se guardó, pero no se pudo repartir el envío. ${mensajeErrorCompra(repartoError, "repartir el envío")}`);
  }
  const { data: compras } = await supabase.from("compras").select("unidades").eq("lote_id", id);
  const unidades = (compras ?? []).reduce((suma, c) => suma + c.unidades, 0);
  return exito(
    unidades > 0
      ? `Lote #${id} guardado · envío ${formatARS(envioPorGorra(costo_envio, unidades))} por gorra`
      : `Lote #${id} guardado`
  );
}

// Borra el lote con eliminar_lote: sus compras quedan sin lote (con el
// último envío calculado) y las gorras y su stock no cambian.
export async function eliminarLote(id: number): Promise<Resultado> {
  const supabase = await createClient();
  // Solo para el aviso: si no se puede leer, el lote se borra igual.
  const { data: compras } = await supabase.from("compras").select("unidades").eq("lote_id", id);
  const { error } = await supabase.rpc("eliminar_lote", { p_lote_id: id });
  if (error) return fallo(mensajeErrorCompra(error, "borrar el lote"));
  revalidarLote(id);
  const unidades = (compras ?? []).reduce((suma, c) => suma + c.unidades, 0);
  return exito(
    compras?.length
      ? `Lote #${id} borrado. ${textoCompras(compras.length, unidades)} quedaron sin lote.`
      : `Lote #${id} borrado`
  );
}

// ---------- Compras ----------
// Cada ingreso de unidades de una gorra (migración 006). Pasan por las
// funciones de la base, que tocan el stock, el costo promedio de la gorra
// y el envío del lote en una sola transacción.

function revalidarCompras(productoId: number, loteIds: (number | null)[]) {
  revalidatePath("/admin/lotes");
  for (const lote of new Set(loteIds)) if (lote) revalidatePath(`/admin/lotes/${lote}`);
  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${productoId}`);
  revalidatePath("/admin/inventario");
  revalidatePath("/admin");
  // El stock se ve en la tienda.
  revalidatePath("/");
  revalidatePath(`/producto/${productoId}`);
}

export async function registrarCompra(formData: FormData): Promise<Resultado> {
  const producto_id = Number(formData.get("producto_id"));
  if (!Number.isInteger(producto_id) || producto_id <= 0) return fallo("Elegí la gorra.");
  const { datos, error: errorDatos } = leerCompra(formData);
  if (!datos) return fallo(errorDatos ?? "Revisá los datos de la compra.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("registrar_compra", {
    p_producto_id: producto_id,
    p_lote_id: datos.lote_id,
    p_unidades: datos.unidades,
    p_precio: datos.precio,
    p_extra: datos.extra,
    p_ref: datos.ref,
    p_envio: datos.envio,
  });
  if (error) return fallo(mensajeErrorCompra(error, "cargar la compra"));

  const { data: producto } = await supabase.from("productos").select("nombre, cantidad").eq("id", producto_id).maybeSingle();
  revalidarCompras(producto_id, [datos.lote_id]);
  const quien = producto ? `«${producto.nombre}»` : "La gorra";
  return exito(
    `${datos.unidades > 1 ? `${datos.unidades} × ` : ""}${quien} cargada${datos.lote_id ? ` al lote #${datos.lote_id}` : ""}${
      producto ? ` · stock ${producto.cantidad}` : ""
    }`
  );
}

// Corrige una compra mal cargada (unidades, precios, ref.). El lote no se
// cambia: para eso se anula y se carga de nuevo.
export async function actualizarCompra(compraId: number, formData: FormData): Promise<Resultado> {
  if (!Number.isInteger(compraId)) return fallo("Pedido inválido. Recargá la página.");
  const { datos, error: errorDatos } = leerCompra(formData);
  if (!datos) return fallo(errorDatos ?? "Revisá los datos de la compra.");

  const supabase = await createClient();
  const { data: compra, error: leerError } = await supabase
    .from("compras")
    .select("producto_id, lote_id")
    .eq("id", compraId)
    .maybeSingle();
  if (leerError) return fallo(mensajeErrorCompra(leerError, "guardar la compra"));
  if (!compra) return fallo(mensajeErrorCompra({ message: "compra_no_encontrada" }, "guardar la compra"));

  const { error } = await supabase.rpc("actualizar_compra", {
    p_compra_id: compraId,
    p_unidades: datos.unidades,
    p_precio: datos.precio,
    p_extra: datos.extra,
    p_ref: datos.ref,
    // En un lote el envío lo reparte la base (la función lo ignora).
    p_envio: compra.lote_id === null ? datos.envio : null,
  });
  if (error) return fallo(mensajeErrorCompra(error, "guardar la compra"));
  revalidarCompras(compra.producto_id, [compra.lote_id]);
  return exito("Compra corregida");
}

export async function anularCompra(compraId: number): Promise<Resultado> {
  if (!Number.isInteger(compraId)) return fallo("Pedido inválido. Recargá la página.");
  const supabase = await createClient();
  const { data: compra, error: leerError } = await supabase
    .from("compras")
    .select("producto_id, lote_id, unidades, productos(nombre)")
    .eq("id", compraId)
    .maybeSingle<{ producto_id: number; lote_id: number | null; unidades: number; productos: { nombre: string } | null }>();
  if (leerError) return fallo(mensajeErrorCompra(leerError, "anular la compra"));
  if (!compra) return fallo(mensajeErrorCompra({ message: "compra_no_encontrada" }, "anular la compra"));

  const { error } = await supabase.rpc("anular_compra", { p_compra_id: compraId });
  if (error) return fallo(mensajeErrorCompra(error, "anular la compra"));
  revalidarCompras(compra.producto_id, [compra.lote_id]);
  const nombre = compra.productos?.nombre ? `«${compra.productos.nombre}»` : "la gorra";
  return exito(`Compra anulada · ${compra.unidades > 1 ? `${compra.unidades} unidades menos` : "una unidad menos"} de ${nombre}`);
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

// Lo que el formulario de producto escribe directo en `productos`. El
// stock, los costos y el lote NO: los mantienen las compras (migración
// 006) y las ventas.
function leerProducto(formData: FormData) {
  return {
    nombre: String(formData.get("nombre") || "").trim(),
    descripcion: String(formData.get("descripcion") || "").trim() || null,
    ref_interna: String(formData.get("ref_interna") || "").trim() || null,
    margen: Number(formData.get("margen") || 0.5),
    precio_venta: Number(formData.get("precio_venta") || 0),
    visible_publico: formData.get("visible_publico") === "on",
  };
}

function notaFotos(fallidas: number) {
  return fallidas > 0 ? ` (${plural(fallidas, "foto")} no se ${fallidas === 1 ? "pudo" : "pudieron"} subir)` : "";
}

// Crea la gorra con stock 0 y le carga la primera compra (que pone el
// stock y los costos). Si se vino desde un lote ("Gorra nueva"), vuelve
// a ese lote.
export async function crearProducto(formData: FormData): Promise<Resultado> {
  const supabase = await createClient();
  const campos = leerProducto(formData);
  const categoriaIds = formData.getAll("categorias").map(Number);
  if (!campos.nombre) return fallo("El producto necesita un nombre.");
  if (campos.visible_publico && !(campos.precio_venta > 0)) return fallo(`${MENSAJE_SIN_PRECIO} O dejala oculta.`);
  const { datos: compra, error: errorCompra } = leerCompra(formData);
  if (!compra) return fallo(`Primera compra: ${errorCompra ?? "revisá los datos."}`);
  const volverAlLote = Number(formData.get("volver_al_lote")) || null;

  const { data: producto, error } = await supabase.from("productos").insert(campos).select("id").single();
  if (error || !producto) return fallo(mensajeError(error, "guardar el producto"));

  const { error: compraError } = await supabase.rpc("registrar_compra", {
    p_producto_id: producto.id,
    p_lote_id: compra.lote_id,
    p_unidades: compra.unidades,
    p_precio: compra.precio,
    p_extra: compra.extra,
    // La ref. de la primera compra es la de la gorra.
    p_ref: compra.ref ?? campos.ref_interna,
    p_envio: compra.envio,
  });
  if (compraError) {
    // Sin su compra la gorra quedaría con stock 0 y sin costo: se borra
    // (todavía no tiene categorías, fotos ni ventas).
    await supabase.from("productos").delete().eq("id", producto.id);
    return fallo(mensajeErrorCompra(compraError, "cargar la primera compra"));
  }

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

  revalidarCompras(producto.id, [compra.lote_id]);
  return exito(
    `Producto «${campos.nombre}» guardado con ${plural(compra.unidades, "unidad", "unidades")}${notaFotos(fallidas)}`,
    volverAlLote ? `/admin/lotes/${volverAlLote}` : "/admin/productos"
  );
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
  // Sus compras se borran en cascada: después hay que repartir de nuevo el
  // envío de esos lotes entre las unidades que quedan.
  const { data: compras } = await supabase.from("compras").select("lote_id").eq("producto_id", id);
  const lotes = [...new Set((compras ?? []).map((c) => c.lote_id).filter((l): l is number => l !== null))];

  // Primero la fila (las fotos_producto y las compras se borran en
  // cascada) y recién después los archivos: si la fila no se puede
  // borrar, las fotos quedan.
  const { data, error } = await supabase.from("productos").delete().eq("id", id).select("nombre");
  if (error) {
    if (error.code === "23503") return fallo(`No se puede borrar. ${motivoNoBorrarProducto()}`);
    return fallo(mensajeError(error, "borrar el producto"));
  }
  if (!data?.length) return fallo("Ese producto ya no existe. Recargá la página.");

  if (fotos && fotos.length > 0) {
    await supabase.storage.from("productos").remove(fotos.map((f) => f.path));
  }
  const repartos = await Promise.all(lotes.map((lote) => supabase.rpc("repartir_envio_lote", { p_lote_id: lote })));

  revalidatePath("/admin/productos");
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/lotes");
  for (const lote of lotes) revalidatePath(`/admin/lotes/${lote}`);
  revalidatePath("/");
  const sinRepartir = repartos.some((r) => r.error);
  return exito(
    `Producto «${data[0].nombre}» borrado${
      sinRepartir ? " (no se pudo repartir de nuevo el envío de su lote: guardá el lote para repartirlo)" : ""
    }`
  );
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
