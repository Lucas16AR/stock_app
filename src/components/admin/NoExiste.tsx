import Link from "next/link";
import { btnPrimario } from "./estilos";

// Aviso dentro del panel cuando se entra a algo que ya no existe (un lote
// o una gorra borrados), en vez del 404 genérico de Next.
export default function NoExiste({
  titulo,
  detalle,
  volverA,
  textoVolver,
}: {
  titulo: string;
  detalle: string;
  volverA: string;
  textoVolver: string;
}) {
  return (
    <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3 rounded-2xl bg-card p-8 text-center ring-1 ring-border">
      <h1 className="font-display text-2xl text-foreground">{titulo}</h1>
      <p className="text-sm text-muted">{detalle}</p>
      <Link href={volverA} className={`${btnPrimario} mt-2 text-sm`}>
        {textoVolver}
      </Link>
    </div>
  );
}
