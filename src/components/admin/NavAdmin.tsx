"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/lotes", label: "Lotes" },
  { href: "/admin/ventas", label: "Ventas" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/inventario", label: "Inventario" },
];

function activo(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Menú del panel. La sección actual queda resaltada; como el panel tiene
// loading.tsx, al tocar un ítem la ruta cambia al instante (se ve el
// esqueleto de carga) y el resaltado se mueve en el mismo momento.
export default function NavAdmin() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
      {NAV.map((item) => {
        const esActivo = activo(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={esActivo ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 transition active:scale-95 ${
              esActivo
                ? "bg-accent/10 font-semibold text-accent"
                : "text-muted hover:bg-hover hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
