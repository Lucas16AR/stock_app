import NoExiste from "@/components/admin/NoExiste";

export default function LoteNoExiste() {
  return (
    <NoExiste
      titulo="Este lote ya no existe"
      detalle="Puede haberse borrado. Sus gorras no se borran: quedan sin lote y se pueden volver a asignar."
      volverA="/admin/lotes"
      textoVolver="Volver a lotes"
    />
  );
}
