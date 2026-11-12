import Image from "next/image";
import { whatsappLink } from "@/lib/pricing";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { INSTAGRAM_URL, INSTAGRAM_USER, SITE_NAME, SITE_TAGLINE, UBICACION } from "@/lib/site";
import { InstagramIcon, PinIcon, WhatsappIcon } from "@/components/icons";

export default function SiteFooter() {
  const linkClase =
    "flex items-center gap-2.5 text-sm text-muted transition hover:text-foreground";

  return (
    <footer className="mt-6 border-t border-border">
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 sm:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <Image src="/brand/mark.png" alt="" width={48} height={29} className="h-8 w-auto rounded-md" />
            <span className="font-display text-2xl tracking-wide text-foreground">INDY CAPS</span>
          </div>
          <p className="mt-2 max-w-xs text-sm text-muted">{SITE_TAGLINE}</p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
            Contacto
          </p>
          <a
            href={whatsappLink(WHATSAPP_NUMBER, "Hola! Quería hacer una consulta 🧢")}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClase}
          >
            <WhatsappIcon className="h-4 w-4 text-whatsapp" />
            WhatsApp
          </a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={linkClase}>
            <InstagramIcon className="h-4 w-4 text-accent" />@{INSTAGRAM_USER}
          </a>
          <span className={linkClase}>
            <PinIcon className="h-4 w-4" />
            {UBICACION}
          </span>
        </div>
      </div>
      <p className="border-t border-border py-4 pb-24 text-center text-xs text-muted sm:pb-4">
        © {new Date().getFullYear()} {SITE_NAME}
      </p>
    </footer>
  );
}
