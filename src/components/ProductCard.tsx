import Link from "next/link";
import Image from "next/image";
import { Producto } from "@/lib/types";
import { formatARS, fotoUrl, precioSugerido } from "@/lib/pricing";
import { SUPABASE_URL } from "@/lib/config";

export default function ProductCard({ producto }: { producto: Producto }) {
  const foto = producto.fotos_producto?.[0];
  const precio = precioSugerido(producto);

  return (
    <Link
      href={`/producto/${producto.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-neutral-800 transition hover:ring-accent"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-800">
        {foto ? (
          <Image
            src={fotoUrl(SUPABASE_URL, foto.path)}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            Sin foto
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="font-display text-lg leading-none text-neutral-50">
          {producto.nombre}
        </h3>
        <p className="text-sm font-semibold text-accent">{formatARS(precio)}</p>
      </div>
    </Link>
  );
}
