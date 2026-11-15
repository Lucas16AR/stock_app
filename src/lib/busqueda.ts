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
