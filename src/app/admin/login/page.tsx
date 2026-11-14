"use client";

import { useActionState } from "react";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import BotonEnviar from "@/components/admin/BotonEnviar";
import { btnPrimario } from "@/components/admin/estilos";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction] = useActionState(login, undefined);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl bg-card p-6 ring-1 ring-border"
      >
        <div className="mb-2 flex justify-center">
          <Image
            src="/brand/logo.png"
            alt="Indy Caps"
            width={200}
            height={160}
            className="h-16 w-auto"
            priority
          />
        </div>
        <h1 className="font-display text-2xl text-foreground">Panel admin</h1>
        <p className="mt-1 text-sm text-muted">
          Ingresá para administrar el stock.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>

          {state?.error && (
            <p role="alert" className="text-sm text-accent">{state.error}</p>
          )}

          <BotonEnviar textoPendiente="Ingresando…" className={`${btnPrimario} mt-2`}>
            Ingresar
          </BotonEnviar>
        </div>
      </form>
    </main>
  );
}
