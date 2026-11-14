import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import ThemeToggle from "@/components/ThemeToggle";
import { EyeIcon } from "@/components/icons";
import Avisos from "@/components/admin/Avisos";
import BotonSonido from "@/components/admin/BotonSonido";
import NavAdmin from "@/components/admin/NavAdmin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Link href="/admin" className="font-display text-xl text-foreground transition active:scale-95">
            INDY CAPS<span className="text-accent">.</span> admin
          </Link>
          <div className="flex items-center gap-1 text-sm text-muted sm:gap-2">
            <span className="mr-1 hidden lg:inline">{user?.email}</span>
            {/* Pestaña nueva: no se pierde lo que se estaba haciendo en el admin. */}
            <Link
              href="/"
              target="_blank"
              rel="noopener"
              title="Ver tienda (se abre en otra pestaña)"
              className="flex h-9 items-center gap-1.5 rounded-full px-2 text-muted transition hover:bg-hover hover:text-foreground active:scale-95 sm:px-3"
            >
              <EyeIcon />
              <span className="hidden sm:inline">Ver tienda</span>
            </Link>
            <BotonSonido />
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
        <NavAdmin />
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <Avisos />
    </div>
  );
}
