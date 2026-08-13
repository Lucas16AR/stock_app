export function costoTotal(p: {
  precio_compra: number;
  costo_envio_unitario: number;
  costo_extra: number;
}) {
  return (p.precio_compra || 0) + (p.costo_envio_unitario || 0) + (p.costo_extra || 0);
}

export function precioSugerido(p: {
  precio_compra: number;
  costo_envio_unitario: number;
  costo_extra: number;
  margen: number;
}) {
  const costo = costoTotal(p);
  return Math.round(costo * (1 + (p.margen || 0)) * 100) / 100;
}

export function formatARS(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function fotoUrl(supabaseUrl: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/productos/${path}`;
}

export function whatsappLink(numero: string, mensaje: string) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
