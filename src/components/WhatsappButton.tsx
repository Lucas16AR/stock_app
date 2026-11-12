import { whatsappLink } from "@/lib/pricing";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { WhatsappIcon } from "@/components/icons";

export function mensajeProducto(nombreProducto: string, vendida = false) {
  return vendida
    ? `Hola! Vi que la gorra "${nombreProducto}" ya se vendió. ¿Tenés alguna parecida? 🧢`
    : `Hola! Me interesa la gorra "${nombreProducto}" que vi en el catálogo 🧢`;
}

export default function WhatsappButton({
  nombreProducto,
  vendida = false,
}: {
  nombreProducto: string;
  vendida?: boolean;
}) {
  const href = whatsappLink(WHATSAPP_NUMBER, mensajeProducto(nombreProducto, vendida));

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold transition active:scale-[0.98] ${
        vendida
          ? "bg-card text-foreground shadow-lg shadow-black/10 ring-1 ring-border hover:ring-whatsapp"
          : "bg-whatsapp text-white shadow-lg shadow-whatsapp/25 hover:brightness-105"
      }`}
    >
      <WhatsappIcon className={`h-5 w-5 ${vendida ? "text-whatsapp" : ""}`} />
      {vendida ? "Preguntar por una parecida" : "Consultar por WhatsApp"}
    </a>
  );
}
