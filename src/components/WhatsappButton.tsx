import { whatsappLink } from "@/lib/pricing";
import { WHATSAPP_NUMBER } from "@/lib/config";

export default function WhatsappButton({
  nombreProducto,
}: {
  nombreProducto: string;
}) {
  const mensaje = `Hola! Me interesa la gorra "${nombreProducto}" que vi en el catálogo 🧢`;
  const href = whatsappLink(WHATSAPP_NUMBER, mensaje);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-semibold text-white transition hover:brightness-105 active:scale-[0.98]"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39c1.44.79 3.07 1.2 4.73 1.2h.02c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.06c-.24.68-1.4 1.32-1.94 1.4-.5.08-1.12.11-1.8-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.8-4.16-4.94-4.35-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.29.58-.36.78-.36.19 0 .39 0 .55.01.18.01.42-.07.65.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.14-.3.3-.13.58.17.29.75 1.24 1.62 2 1.11.99 2.05 1.3 2.34 1.45.29.14.46.12.63-.07.17-.19.72-.84.92-1.13.19-.29.39-.24.65-.14.27.1 1.7.8 1.99.94.29.14.48.22.55.34.07.13.07.72-.17 1.4z" />
      </svg>
      Consultar por WhatsApp
    </a>
  );
}
