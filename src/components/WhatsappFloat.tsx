import { whatsappLink } from "@/lib/pricing";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { WhatsappIcon } from "@/components/icons";

const MENSAJE_GENERAL = "Hola! Vi el catálogo de Indy Caps y quería hacer una consulta 🧢";

// Botón verde fijo abajo a la derecha. En el detalle de producto recibe
// el mensaje de esa gorra; en el resto, uno general.
// soloDesktop: en el detalle, en el celu ya está el botón grande pegado abajo.
export default function WhatsappFloat({
  mensaje = MENSAJE_GENERAL,
  soloDesktop = false,
}: {
  mensaje?: string;
  soloDesktop?: boolean;
}) {
  return (
    <a
      href={whatsappLink(WHATSAPP_NUMBER, mensaje)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className={`group fixed bottom-5 right-5 z-20 h-14 ${soloDesktop ? "hidden md:flex" : "flex"} items-center gap-2 rounded-full bg-whatsapp pl-4 pr-4 text-white shadow-xl shadow-black/20 transition hover:brightness-105 active:scale-95 sm:pr-5`}
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <WhatsappIcon className="h-6 w-6" />
      <span className="hidden text-sm font-semibold sm:inline">Escribinos</span>
    </a>
  );
}
