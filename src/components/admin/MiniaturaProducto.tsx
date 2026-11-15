import Image from "next/image";
import { CapIcon } from "@/components/icons";
import { fotoUrl } from "@/lib/pricing";
import { SUPABASE_URL } from "@/lib/config";

// Foto cuadrada chica de una gorra para los listados del admin (productos,
// inventario y, más adelante, lotes y ventas). Sin foto: recuadro con el
// ícono de gorra. `path` es el de la portada (ver `primeraFoto`).
export default function MiniaturaProducto({
  path,
  vendida = false,
  className = "h-14 w-14 md:h-16 md:w-16",
  sizes = "64px",
  marco = true,
}: {
  path?: string | null;
  vendida?: boolean;
  className?: string;
  // Ancho con que se muestra (para que next/image elija el tamaño).
  sizes?: string;
  // Borde redondeado con línea; sin marco cuando va dentro de una tarjeta.
  marco?: boolean;
}) {
  return (
    <div className={`relative shrink-0 overflow-hidden bg-hover ${marco ? "rounded-lg ring-1 ring-border" : ""} ${className}`}>
      {path ? (
        <Image
          src={fotoUrl(SUPABASE_URL, path)}
          alt=""
          fill
          sizes={sizes}
          className={`object-cover ${vendida ? "grayscale" : ""}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted">
          <CapIcon className="h-1/2 w-1/2" />
        </div>
      )}
    </div>
  );
}
