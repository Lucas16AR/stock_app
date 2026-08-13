import LoteForm from "@/components/admin/LoteForm";
import { crearLote } from "../../actions";

export default function NuevoLotePage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-neutral-50">Nuevo lote</h1>
      <div className="mt-4">
        <LoteForm action={crearLote} />
      </div>
    </div>
  );
}
