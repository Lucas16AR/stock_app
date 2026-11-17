import { mensajeError, plural } from "./acciones";

// Compras de gorras (migración 006): cada ingreso de unidades es una fila
// de `compras`. El stock y los costos de la gorra los mantiene la base.

// Traduce los errores de registrar_compra / actualizar_compra /
// anular_compra / eliminar_lote a castellano para el aviso.
export function mensajeErrorCompra(
  error: { code?: string; message?: string } | null | undefined,
  queHacia: string
): string {
  const msg = error?.message ?? "";
  const vendidas = msg.match(/unidades_vendidas:(\d+)/);
  if (vendidas) {
    const stock = Number(vendidas[1]);
    return `No se puede: esas unidades ya se vendieron (${
      stock === 0 ? "no queda ninguna en stock" : stock === 1 ? "queda 1 en stock" : `quedan ${stock} en stock`
    }). Si la compra está mal cargada, corregí las unidades.`;
  }
  if (msg.includes("unidades_invalidas")) return "Las unidades tienen que ser 1 o más.";
  if (msg.includes("precio_invalido")) return "Los precios no pueden ser negativos.";
  if (msg.includes("producto_no_encontrado")) return "Esa gorra ya no existe. Recargá la página.";
  if (msg.includes("lote_no_encontrado")) return "Ese lote ya no existe. Recargá la página.";
  if (msg.includes("compra_no_encontrada")) return "Esa compra ya no existe (¿ya estaba anulada?). Recargá la página.";
  // La función no existe: falta aplicar la migración 006.
  if (error?.code === "PGRST202" || error?.code === "42883") {
    return `No se pudo ${queHacia}: la base todavía no tiene las funciones de compras (falta aplicar la migración 006).`;
  }
  return mensajeError(error, queHacia);
}

// Campos de una compra en un formulario. Los nombres van con prefijo
// ("compra_unidades"…) porque el formulario de producto nuevo también
// tiene los suyos.
export type DatosCompra = {
  lote_id: number | null;
  unidades: number;
  precio: number;
  extra: number;
  ref: string | null;
  envio: number;
};

export function leerCompra(formData: FormData): { datos?: DatosCompra; error?: string } {
  const texto = (campo: string) => String(formData.get(`compra_${campo}`) ?? "").trim();
  const numero = (campo: string) => (texto(campo) === "" ? 0 : Number(texto(campo)));

  const lote = texto("lote_id");
  const lote_id = lote ? Number(lote) : null;
  if (lote_id !== null && !(Number.isInteger(lote_id) && lote_id > 0)) return { error: "Elegí el lote de la compra." };

  const unidades = Number(texto("unidades"));
  if (!Number.isInteger(unidades) || unidades <= 0) return { error: "Las unidades tienen que ser 1 o más." };

  if (texto("precio") === "") return { error: "Cargá el precio de compra (puede ser 0)." };
  const precio = numero("precio");
  const extra = numero("extra");
  // El envío solo se carga a mano en compras sin lote; en un lote lo reparte la base.
  const envio = lote_id === null ? numero("envio") : 0;
  if (![precio, extra, envio].every((n) => Number.isFinite(n) && n >= 0)) {
    return { error: "Los precios no pueden ser negativos." };
  }

  return { datos: { lote_id, unidades, precio, extra, ref: texto("ref") || null, envio } };
}

// Resumen de las compras de un lote: "50 gorras compradas · 49 modelos".
// `invertido` es lo pagado por las gorras (precio de compra + extra, por
// unidad); el envío del lote va aparte.
export function resumenCompras(compras: { producto_id: number; unidades: number; precio_compra: number; costo_extra: number }[]) {
  const modelos = new Set(compras.map((c) => c.producto_id)).size;
  const unidades = compras.reduce((suma, c) => suma + c.unidades, 0);
  const invertido = compras.reduce((suma, c) => suma + c.unidades * (Number(c.precio_compra) + Number(c.costo_extra)), 0);
  return { compras: compras.length, unidades, modelos, invertido };
}

// "49 compras (50 gorras)" o "1 compra (2 gorras)".
export function textoCompras(compras: number, unidades: number) {
  return `${plural(compras, "compra")} (${plural(unidades, "gorra")})`;
}
