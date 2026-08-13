"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl bg-neutral-900 p-6 ring-1 ring-neutral-800"
      >
        <h1 className="font-display text-2xl text-neutral-50">Panel admin</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Ingresá para administrar el stock.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-accent"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-400">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg bg-accent px-4 py-2 font-semibold text-neutral-950 transition disabled:opacity-60"
          >
            {pending ? "Ingresando..." : "Ingresar"}
          </button>
        </div>
      </form>
    </main>
  );
}
