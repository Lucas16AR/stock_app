import { esDiaValido, fechaParaGuardar, hoyAR } from "./fechas";

// Envío por gorra de un lote: costo de envío / unidades compradas,
// redondeado a pesos. Es la misma cuenta que hace la base
// (repartir_envio_lote, migración 006); acá solo se usa para mostrarla.
export function envioPorGorra(costoEnvio: number, gorras: number) {
  if (gorras <= 0) return 0;
  return Math.round(costoEnvio / gorras);
}

// Fecha del lote elegida en el formulario ("AAAA-MM-DD", hora argentina).
// Devuelve el valor a guardar (null = hoy: que la base ponga now()),
// `undefined` si no hay que tocarla (al editar, el día no cambió), o un
// error.
export function leerFechaLote(
  formData: FormData,
  hoy = hoyAR()
): { fecha?: string | null; error?: string } {
  const dia = String(formData.get("fecha") || "");
  if (!esDiaValido(dia)) return { error: "Elegí la fecha del lote." };
  if (dia > hoy) return { error: "La fecha del lote no puede ser posterior a hoy." };
  if (dia === String(formData.get("fecha_original") || "")) return {};
  return { fecha: fechaParaGuardar(dia, hoy) };
}
