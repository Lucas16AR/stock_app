// Datos públicos de la marca que se usan en el showroom (header, footer,
// metadata para compartir). Nada de esto es secreto.

export const SITE_NAME = "Indy Caps";

export const SITE_TAGLINE = "Gorras únicas. Hay una de cada una.";

export const INSTAGRAM_USER = "indycaps16";
export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_USER}`;

export const UBICACION = "San Rafael, Mendoza";

// URL absoluta del sitio, para que las vistas previas al compartir
// (Open Graph) apunten a imágenes con dominio completo. En Vercel se
// toma sola del dominio de producción; NEXT_PUBLIC_SITE_URL la pisa.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://stock-app-six-woad.vercel.app");

// Las descripciones de los productos cargados en masa guardan una
// referencia interna ("Ref. interna: AFA 12") para rastrear la compra.
// Eso es para el admin: en el showroom se oculta.
export function descripcionPublica(descripcion: string | null) {
  if (!descripcion) return null;
  const limpia = descripcion
    .split("\n")
    .filter((linea) => !/^\s*ref\.?\s*interna/i.test(linea))
    .join("\n")
    .trim();
  return limpia || null;
}

// Para buscar sin que importen tildes ni mayúsculas ("formula" = "Fórmula").
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
