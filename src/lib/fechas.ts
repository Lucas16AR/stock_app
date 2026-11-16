// Fechas del admin en hora argentina. El servidor (Vercel) corre en UTC:
// sin fijar la zona, una venta anotada a las 22:00 de acá aparecería con
// la fecha del día siguiente. La 003 va a usar esto también en lotes.

export const ZONA_AR = "America/Argentina/Buenos_Aires";

// "12/11/2026"
export function formatFecha(fecha: string | Date) {
  return new Date(fecha).toLocaleDateString("es-AR", {
    timeZone: ZONA_AR,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// "AAAA-MM-DD" de una fecha guardada, en hora argentina (para el valor
// inicial de un <input type="date">).
export function diaAR(fecha: string | Date) {
  return new Date(fecha).toLocaleDateString("en-CA", { timeZone: ZONA_AR });
}

// "12/11" (para textos cortos, como el diálogo de anular)
export function formatFechaCorta(fecha: string | Date) {
  return new Date(fecha).toLocaleDateString("es-AR", { timeZone: ZONA_AR, day: "2-digit", month: "2-digit" });
}

// Día de hoy en Argentina como "AAAA-MM-DD" (el formato de <input type="date">).
export function hoyAR(ahora = new Date()) {
  // en-CA formatea como AAAA-MM-DD.
  return ahora.toLocaleDateString("en-CA", { timeZone: ZONA_AR });
}

// Primer instante del mes actual en Argentina, para sumar las ventas del mes.
export function inicioMesAR(ahora = new Date()) {
  return `${hoyAR(ahora).slice(0, 7)}-01T00:00:00-03:00`;
}

// Nombre del mes actual en Argentina ("noviembre").
export function nombreMesAR(ahora = new Date()) {
  return ahora.toLocaleDateString("es-AR", { timeZone: ZONA_AR, month: "long" });
}

// Fecha que se guarda para un día elegido en un formulario (venta, lote):
// si es hoy, null (la base usa now() y se mantiene el orden del día por
// hora); si es otro día, el mediodía de ese día en Argentina (Argentina no
// tiene horario de verano: siempre -03:00).
export function fechaParaGuardar(dia: string, hoy = hoyAR()) {
  return dia === hoy ? null : `${dia}T12:00:00-03:00`;
}

// "AAAA-MM-DD" válido (existe en el calendario).
export function esDiaValido(dia: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return false;
  const d = new Date(`${dia}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dia;
}
