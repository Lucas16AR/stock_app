// Compartido entre el formulario (cliente) y la Server Action de subida.
export const MAX_FOTOS_POR_PRODUCTO = 10;

// La foto de portada de una gorra: la de `orden` más bajo.
export function primeraFoto<T extends { orden: number }>(fotos?: T[] | null): T | undefined {
  return (fotos ?? []).reduce<T | undefined>((min, f) => (!min || f.orden < min.orden ? f : min), undefined);
}
