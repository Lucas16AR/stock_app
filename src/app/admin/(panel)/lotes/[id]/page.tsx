import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Lote } from "@/lib/types";
import LoteForm from "@/components/admin/LoteForm";
import { actualizarLote } from "../../actions";

export default async function EditarLotePage(props: PageProps<"/admin/lotes/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data } = await supabase.from("lotes").select("*").eq("id", id).maybeSingle();
  const lote = data as Lote | null;
  if (!lote) notFound();

  const actualizarConId = actualizarLote.bind(null, lote.id);

  return (
    <div>
      <h1 className="font-display text-2xl text-neutral-50">Editar lote #{lote.id}</h1>
      <div className="mt-4">
        <LoteForm lote={lote} action={actualizarConId} />
      </div>
    </div>
  );
}
