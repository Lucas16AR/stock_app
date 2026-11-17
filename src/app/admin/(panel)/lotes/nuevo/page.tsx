import LoteForm from "@/components/admin/LoteForm";
import { hoyAR } from "@/lib/fechas";
import { crearLote } from "../../actions";

export default function NuevoLotePage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Nuevo lote</h1>
      <p className="mt-1 text-sm text-muted">Al guardarlo, vas a poder cargarle las gorras (las que ya tenés o nuevas).</p>
      <div className="mt-4">
        <LoteForm hoy={hoyAR()} action={crearLote} />
      </div>
    </div>
  );
}
