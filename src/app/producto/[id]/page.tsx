import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Producto } from "@/lib/types";
import { formatARS, fotoUrl, precioSugerido } from "@/lib/pricing";
import { SUPABASE_URL } from "@/lib/config";
import SiteHeader from "@/components/SiteHeader";
import WhatsappButton from "@/components/WhatsappButton";

export const revalidate = 0;

export default async function ProductoPage(props: PageProps<"/producto/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("productos")
    .select("*, fotos_producto(*), categorias(*)")
    .eq("id", id)
    .maybeSingle();

  const producto = data as Producto | null;

  if (!producto) notFound();

  const fotos = producto.fotos_producto ?? [];
  const precio = precioSugerido(producto);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10">
        <Link href="/" className="inline-block py-4 text-sm text-neutral-400 hover:text-neutral-200">
          ← Volver al catálogo
        </Link>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
          {fotos.length > 0 ? (
            fotos
              .slice()
              .sort((a, b) => a.orden - b.orden)
              .map((f, i: number) => (
                <div
                  key={f.id}
                  className={`relative aspect-square overflow-hidden rounded-2xl bg-neutral-900 ${
                    i === 0 ? "col-span-2" : ""
                  }`}
                >
                  <Image
                    src={fotoUrl(SUPABASE_URL, f.path)}
                    alt={producto.nombre}
                    fill
                    sizes="(max-width: 640px) 100vw, 640px"
                    className="object-cover"
                    priority={i === 0}
                  />
                </div>
              ))
          ) : (
            <div className="col-span-2 flex aspect-square items-center justify-center rounded-2xl bg-neutral-900 text-neutral-500">
              Sin fotos
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <div>
            <h1 className="font-display text-3xl text-neutral-50">{producto.nombre}</h1>
            {producto.categorias && producto.categorias.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {producto.categorias.map((c) => (
                  <span
                    key={c.id}
                    className="rounded-full bg-neutral-900 px-3 py-0.5 text-xs text-neutral-400 ring-1 ring-neutral-800"
                  >
                    {c.nombre}
                  </span>
                ))}
              </div>
            )}
          </div>

          {producto.descripcion && (
            <p className="text-sm leading-relaxed text-neutral-300">{producto.descripcion}</p>
          )}

          <p className="font-display text-2xl text-accent">{formatARS(precio)}</p>

          <div className="pt-2">
            <WhatsappButton nombreProducto={producto.nombre} />
          </div>
        </div>
      </main>
    </>
  );
}
