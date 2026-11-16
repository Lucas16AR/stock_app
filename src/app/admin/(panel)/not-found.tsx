import NoExiste from "@/components/admin/NoExiste";

// Para cualquier otra pantalla del panel que llame a notFound().
export default function PanelNoExiste() {
  return (
    <NoExiste
      titulo="Esto ya no existe"
      detalle="Puede haberse borrado o el link está mal."
      volverA="/admin"
      textoVolver="Volver al panel"
    />
  );
}
