import { normalizar } from "./site";

// Texto donde se busca: los campos juntos y normalizados (sin tildes ni
// mayúsculas). Se arma una vez por fila, no en cada tecla.
export function textoBuscable(campos: (string | null | undefined)[]) {
  return normalizar(campos.filter(Boolean).join(" "));
}

// Cada palabra de la búsqueda tiene que aparecer en el texto, en
// cualquier orden: "afa 12" encuentra la ref. "AFA 12" y "formula"
// encuentra "Fórmula 1".
export function coincide(texto: string, consulta: string) {
  const terminos = normalizar(consulta).split(/\s+/).filter(Boolean);
  return terminos.every((t) => texto.includes(t));
}

// Palabras que no sirven para decir si dos gorras se parecen.
const GENERICAS = new Set(["gorra", "gorras", "cap", "caps", "de", "la", "el", "los", "las", "con", "y"]);

// Gorras que se parecen a lo que se está escribiendo (aviso de posible
// duplicado al crear una gorra). Cuenta cuántas palabras del texto
// aparecen en cada gorra, sin contar las genéricas ("gorra", "de"…), y
// devuelve las que tienen al menos una, las más parecidas primero.
export function parecidas<T>(items: { item: T; texto: string }[], consulta: string, max = 6): T[] {
  const terminos = [...new Set(normalizar(consulta).split(/[\s\-_.,/]+/))].filter(
    (t) => t.length > 0 && !GENERICAS.has(t)
  );
  if (terminos.length === 0) return [];
  return items
    .map(({ item, texto }) => {
      const palabras = new Set(texto.split(/[\s\-_.,/]+/));
      // Palabra completa ("12" no encuentra "120"); de 3 letras o más
      // también vale el comienzo ("vint" encuentra "vintage").
      const puntos = terminos.filter((t) => palabras.has(t) || (t.length >= 3 && [...palabras].some((p) => p.startsWith(t)))).length;
      return { item, puntos };
    })
    .filter((x) => x.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, max)
    .map((x) => x.item);
}
