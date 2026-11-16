import NoExiste from "@/components/admin/NoExiste";

export default function GorraNoExiste() {
  return (
    <NoExiste
      titulo="Esta gorra ya no existe"
      detalle="Puede haberse borrado. Fijate en el listado de productos."
      volverA="/admin/productos"
      textoVolver="Volver a productos"
    />
  );
}
