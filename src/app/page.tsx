import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Producto, Categoria } from "@/lib/types";
import { armarCatalogo, estaVendida, parseOrden } from "@/lib/catalogo";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Hero from "@/components/Hero";
import CategoryFilter from "@/components/CategoryFilter";
import CatalogControls from "@/components/CatalogControls";
import ProductCard from "@/components/ProductCard";
import WhatsappFloat from "@/components/WhatsappFloat";

export const revalidate = 0;

function primero(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function HomePage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const categoriaId = Number(primero(searchParams.categoria)) || undefined;
  const q = (primero(searchParams.q) ?? "").slice(0, 60);
  const orden = parseOrden(primero(searchParams.orden));

  const supabase = await createClient();

  const [{ data: categorias }, { data: productos }] = await Promise.all([
    supabase.from("categorias").select("*").order("nombre").returns<Categoria[]>(),
    // RLS ya limita lo que ve un visitante, pero filtramos explícito para
    // que el admin logueado vea el showroom igual que un cliente.
    supabase
      .from("productos")
      .select("*, fotos_producto(*), categorias(*)")
      .eq("visible_publico", true)
      .order("fecha_creacion", { ascending: false })
      .returns<Producto[]>(),
  ]);

  const todos = productos ?? [];
  const disponibles = todos.filter((p) => !estaVendida(p));

  const conteo: Record<number, number> = {};
  for (const p of disponibles) {
    for (const c of p.categorias ?? []) conteo[c.id] = (conteo[c.id] ?? 0) + 1;
  }

  const catalogo = armarCatalogo(todos, { categoriaId, q, orden });
  const disponiblesEnVista = catalogo.filter((p) => !estaVendida(p)).length;
  const vendidasEnVista = catalogo.length - disponiblesEnVista;
  const hayFiltros = Boolean(categoriaId || q);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-2 pb-10">
        <Hero disponibles={disponibles.length} />

        <div className="sticky top-[61px] z-[5] -mx-2 mt-5 bg-background/90 px-2 pt-3 backdrop-blur">
          <CatalogControls q={q} orden={orden} categoria={categoriaId} />
          <CategoryFilter
            categorias={categorias ?? []}
            activa={categoriaId}
            conteo={conteo}
            q={q}
            orden={orden}
          />
        </div>

        <div className="flex items-baseline justify-between px-4 pb-3 pt-1">
          <p className="text-sm text-muted">
            <span className="font-semibold text-foreground">{disponiblesEnVista}</span>{" "}
            {disponiblesEnVista === 1 ? "gorra disponible" : "gorras disponibles"}
            {vendidasEnVista > 0 && (
              <>
                {" · "}
                {vendidasEnVista} {vendidasEnVista === 1 ? "vendida" : "vendidas"}
              </>
            )}
          </p>
          {hayFiltros && (
            <Link href="/" scroll={false} className="text-sm font-medium text-accent hover:underline">
              Limpiar filtros
            </Link>
          )}
        </div>

        {catalogo.length === 0 ? (
          <div className="mx-2 flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-16 text-center ring-1 ring-border">
            <span className="text-4xl">🧢</span>
            <p className="text-muted">
              {hayFiltros
                ? "No encontramos gorras con ese filtro."
                : "No hay gorras disponibles por el momento. Volvé a pasar pronto."}
            </p>
            {hayFiltros && (
              <Link
                href="/"
                scroll={false}
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
              >
                Ver todas
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-2 sm:grid-cols-3 lg:grid-cols-4">
            {catalogo.map((p, i) => (
              <ProductCard key={p.id} producto={p} prioridad={i < 4} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
      <WhatsappFloat />
    </>
  );
}
