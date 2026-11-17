import NoExiste from "@/components/admin/NoExiste";

export default function LoteNoExiste() {
  return (
    <NoExiste
      titulo="Este lote ya no existe"
      detalle="Puede haberse borrado. Sus gorras no se borran: sus compras quedan sin lote y el stock no cambia."
      volverA="/admin/lotes"
      textoVolver="Volver a lotes"
    />
  );
}
