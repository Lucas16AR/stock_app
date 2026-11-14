// Resultado que devuelven todas las Server Actions del admin. El cliente
// (FormAccion / BotonBorrar) lo convierte en un aviso con sonido y, si
// viene `redirigirA`, navega después de mostrarlo. Así el aviso se ve
// también en las acciones que antes terminaban en redirect().
export type Resultado =
  | { ok: true; mensaje: string; redirigirA?: string }
  | { ok: false; error: string };

export function exito(mensaje: string, redirigirA?: string): Resultado {
  return { ok: true, mensaje, redirigirA };
}

export function fallo(error: string): Resultado {
  return { ok: false, error };
}

// Traduce un error de Supabase/Postgres a algo que se entienda en el panel.
export function mensajeError(
  error: { code?: string; message?: string } | null | undefined,
  queHacia: string
): string {
  switch (error?.code) {
    case "23503": // foreign key
      return `No se pudo ${queHacia}: está siendo usado por otros registros.`;
    case "23505": // unique
      return `No se pudo ${queHacia}: ya existe uno con ese nombre.`;
    case "42501": // permisos / RLS
    case "PGRST301":
      return `No se pudo ${queHacia}: no tenés permiso. ¿Se cerró la sesión? Volvé a ingresar.`;
    case "23514": // check
    case "22P02": // tipo inválido
      return `No se pudo ${queHacia}: hay un dato con un valor inválido.`;
  }
  return `No se pudo ${queHacia}. ${error?.message ? `(${error.message})` : "Probá de nuevo."}`;
}

export function plural(n: number, singular: string, pluralForma = `${singular}s`) {
  return `${n} ${n === 1 ? singular : pluralForma}`;
}

// Por qué no se puede borrar un producto con ventas (la FK ventas →
// productos es RESTRICT). Lo usan la acción y el listado, que directamente
// no ofrece borrar.
export function motivoNoBorrarProducto(ventas?: number) {
  const cuantas = ventas ? plural(ventas, "venta registrada", "ventas registradas") : "ventas registradas";
  return `Tiene ${cuantas} y borrarlo dejaría esas ventas sin producto. Si no querés que se vea en la tienda, ocultalo: editalo y destildá «Visible al público».`;
}
