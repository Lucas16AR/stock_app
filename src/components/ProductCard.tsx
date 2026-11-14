import Link from "next/link";
import Image from "next/image";
import { ProductoPublico } from "@/lib/types";
import { formatARS, fotoUrl } from "@/lib/pricing";
import { SUPABASE_URL } from "@/lib/config";
import { estaVendida } from "@/lib/catalogo";

export default function ProductCard({
  producto,
  prioridad = false,
}: {
  producto: ProductoPublico;
  prioridad?: boolean;
}) {
  const fotos = (producto.fotos_producto ?? []).slice().sort((a, b) => a.orden - b.orden);
  const foto = fotos[0];
  const vendida = estaVendida(producto);
  const categoria = producto.categorias?.[0]?.nombre;
  const unica = !vendida && producto.cantidad === 1;

  return (
    <Link
      href={`/producto/${producto.id}`}
      className={`group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-accent ${
        vendida ? "opacity-70 hover:opacity-100" : ""
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-hover">
        {foto ? (
          <Image
            src={fotoUrl(SUPABASE_URL, foto.path)}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition duration-500 group-hover:scale-105 ${
              vendida ? "grayscale" : ""
            }`}
            priority={prioridad}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Sin foto
          </div>
        )}

        {vendida ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 rounded-md border-2 border-accent bg-background/85 px-3 py-0.5 font-display text-2xl tracking-widest text-accent">
              VENDIDA
            </span>
          </span>
        ) : (
          unica && (
            <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
              Pieza única
            </span>
          )
        )}

        {fotos.length > 1 && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-ink/70 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <svg viewBox="0 0 24 24" aria-hidden className="h-3 w-3 fill-none stroke-current" strokeWidth={2.2}>
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {fotos.length}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {categoria && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
            {categoria}
          </span>
        )}
        <h3 className="font-display text-xl leading-none text-foreground">{producto.nombre}</h3>
        <p
          className={`mt-auto pt-1 text-base font-bold ${
            vendida ? "text-muted line-through" : "text-accent"
          }`}
        >
          {formatARS(producto.precio_venta)}
        </p>
      </div>
    </Link>
  );
}
