"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Resultado } from "@/lib/acciones";
import { avisar } from "./avisar";
import { PendienteContext } from "./BotonEnviar";

// <form> del admin que llama a una Server Action que devuelve Resultado,
// muestra el aviso (con sonido) y, si la acción lo pide, navega después.
//
// Por qué onSubmit y no `action={...}`: con `action`, React 19 vacía el
// formulario al terminar aunque la acción haya devuelto un error, y se
// pierde lo que se escribió. Acá el formulario solo se limpia si se pide
// (`limpiarAlTerminar`) y la acción salió bien.
export default function FormAccion({
  accion,
  children,
  className,
  limpiarAlTerminar = false,
}: {
  accion: (formData: FormData) => Promise<Resultado>;
  children: React.ReactNode;
  className?: string;
  limpiarAlTerminar?: boolean;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const enCurso = useRef(false);

  function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enCurso.current) return; // doble toque: se ignora
    enCurso.current = true;

    const form = e.currentTarget;
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const datos = submitter ? new FormData(form, submitter) : new FormData(form);

    startTransition(async () => {
      try {
        const r = await accion(datos);
        if (r.ok) {
          avisar.exito(r.mensaje);
          if (limpiarAlTerminar) form.reset();
          if (r.redirigirA) router.push(r.redirigirA);
        } else {
          avisar.error(r.error);
        }
      } catch {
        avisar.error("No se pudo completar: se cortó la conexión o el servidor no respondió. Probá de nuevo.");
      } finally {
        enCurso.current = false;
      }
    });
  }

  return (
    <PendienteContext value={pendiente}>
      <form onSubmit={alEnviar} className={className} aria-busy={pendiente}>
        {children}
      </form>
    </PendienteContext>
  );
}
