import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/lotes", label: "Lotes" },
  { href: "/admin/ventas", label: "Ventas" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/inventario", label: "Inventario" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="font-display text-xl text-neutral-50">
            GORRAS<span className="text-accent">.</span> admin
          </Link>
          <div className="flex items-center gap-3 text-sm text-neutral-400">
            <span className="hidden sm:inline">{user?.email}</span>
            <SignOutButton />
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-neutral-300 hover:bg-neutral-800 hover:text-neutral-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
