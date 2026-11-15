import { mensajeError } from "./acciones";

// Traduce los errores de las funciones registrar_venta / anular_venta
// (migración 005) a castellano para el aviso.
export function mensajeErrorVenta(
  error: { code?: string; message?: string } | null | undefined,
  queHacia: string
): string {
  const msg = error?.message ?? "";
  const stock = msg.match(/stock_insuficiente:(\d+)/);
  if (stock) {
    const n = Number(stock[1]);
    return n === 0 ? "No hay stock: esa gorra ya está vendida." : `No hay stock suficiente: ${n === 1 ? "queda 1" : `quedan ${n}`}.`;
  }
  if (msg.includes("fecha_futura")) return "La fecha de la venta no puede ser posterior a hoy.";
  if (msg.includes("cantidad_invalida")) return "La cantidad tiene que ser 1 o más.";
  if (msg.includes("precio_invalido")) return "El precio no puede ser negativo.";
  if (msg.includes("producto_no_encontrado")) return "Esa gorra ya no existe. Recargá la página.";
  if (msg.includes("venta_no_encontrada")) return "Esa venta ya no existe (¿ya estaba anulada?). Recargá la página.";
  // La función no existe: falta aplicar la migración 005.
  if (error?.code === "PGRST202" || error?.code === "42883") {
    return `No se pudo ${queHacia}: la base todavía no tiene las funciones de ventas (falta aplicar la migración 005).`;
  }
  return mensajeError(error, queHacia);
}
