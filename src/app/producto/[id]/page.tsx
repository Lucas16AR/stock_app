import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Producto } from "@/lib/types";
import { formatARS, fotoUrl } from "@/lib/pricing";
import { SUPABASE_URL } from "@/lib/config";
import { estaVendida } from "@/lib/catalogo";
import { descripcionPublica, INSTAGRAM_URL, INSTAGRAM_USER, SITE_NAME, UBICACION } from "@/lib/site";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Gallery from "@/components/Gallery";
import WhatsappButton, { mensajeProducto } from "@/components/WhatsappButton";
import WhatsappFloat from "@/components/WhatsappFloat";
import { InstagramIcon } from "@/components/icons";

export const revalidate = 0;

// Una sola consulta por request, compartida entre la metadata y la página.
const getProducto = cache(async (id: string) => {
  if (!/^\d+$/.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("productos")
    .select("*, fotos_producto(*), categorias(*)")
    .eq("id", id)
    .eq("visible_publico", true)
    .maybeSingle();
  return data as Producto | null;
});

function fotosOrdenadas(producto: Producto) {
  return (producto.fotos_producto ?? [])
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((f) => ({ id: f.id, url: fotoUrl(SUPABASE_URL, f.path) }));
}

// Vista previa al compartir el link (WhatsApp, Instagram, etc.):
// foto de la gorra, nombre y precio.
export async function generateMetadata(props: PageProps<"/producto/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const producto = await getProducto(id);
  if (!producto) return { title: `Gorra no encontrada | ${SITE_NAME}` };

  const vendida = estaVendida(producto);
  const precio = formatARS(producto.precio_venta);
  const titulo = `${producto.nombre} — ${vendida ? "Vendida" : precio}`;
  const descripcion =
    descripcionPublica(producto.descripcion) ??
    (vendida
      ? `Esta ya se vendió. Mirá las otras gorras de ${SITE_NAME}.`
      : `Pieza única a ${precio}. Consultala por WhatsApp — ${SITE_NAME}, ${UBICACION}.`);
  const foto = fotosOrdenadas(producto)[0]?.url;

  return {
    title: `${titulo} | ${SITE_NAME}`,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      type: "website",
      siteName: SITE_NAME,
      locale: "es_AR",
      images: foto ? [{ url: foto, alt: producto.nombre }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
      images: foto ? [foto] : undefined,
    },
  };
}

export default async function ProductoPage(props: PageProps<"/producto/[id]">) {
  const { id } = await props.params;
  const producto = await getProducto(id);
  if (!producto) notFound();

  const fotos = fotosOrdenadas(producto);
  const vendida = estaVendida(producto);
  const descripcion = descripcionPublica(producto.descripcion);
  const categorias = producto.categorias ?? [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 py-4 text-sm text-muted transition hover:text-accent"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-none stroke-current" strokeWidth={2.2}>
            <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver al catálogo
        </Link>

        <div className="grid gap-6 md:grid-cols-[1.15fr_1fr] md:gap-10">
          <Gallery fotos={fotos} alt={producto.nombre} vendida={vendida} />

          <div className="flex flex-col gap-4 md:sticky md:top-24 md:self-start">
            {categorias.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {categorias.map((c) => (
                  <Link
                    key={c.id}
                    href={`/?categoria=${c.id}`}
                    className="rounded-full bg-card px-3 py-1 text-xs font-medium text-muted ring-1 ring-border transition hover:text-foreground hover:ring-accent"
                  >
                    {c.nombre}
                  </Link>
                ))}
              </div>
            )}

            <h1 className="font-display text-4xl leading-none text-foreground sm:text-5xl">
              {producto.nombre}
            </h1>

            <div className="flex items-center gap-3">
              <p
                className={`font-display text-4xl ${
                  vendida ? "text-muted line-through" : "text-accent"
                }`}
              >
                {formatARS(producto.precio_venta)}
              </p>
              {vendida ? (
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Vendida
                </span>
              ) : (
                producto.cantidad === 1 && (
                  <span className="rounded-full bg-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider text-background">
                    Pieza única
                  </span>
                )
              )}
            </div>

            {descripcion && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{descripcion}</p>
            )}

            <div className="rounded-2xl bg-card p-4 text-sm text-muted ring-1 ring-border">
              {vendida ? (
                <p>
                  Esta ya encontró dueño. Escribinos y te avisamos si entra alguna parecida.
                </p>
              ) : producto.cantidad === 1 ? (
                <p>
                  <span className="font-semibold text-foreground">Hay una sola.</span> Cada gorra
                  es una pieza única: cuando se vende, no vuelve.
                </p>
              ) : (
                <p>
                  Quedan <span className="font-semibold text-foreground">{producto.cantidad}</span>{" "}
                  unidades.
                </p>
              )}
            </div>

            {/* En el celu el botón queda pegado abajo mientras se miran las fotos */}
            <div className="sticky bottom-3 z-10 md:static">
              <WhatsappButton nombreProducto={producto.nombre} vendida={vendida} />
            </div>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-muted transition hover:text-foreground"
            >
              <InstagramIcon className="h-4 w-4" />
              Más novedades en @{INSTAGRAM_USER}
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
      <WhatsappFloat mensaje={mensajeProducto(producto.nombre, vendida)} soloDesktop />
    </>
  );
}
