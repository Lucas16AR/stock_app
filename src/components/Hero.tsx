import Image from "next/image";
import { INSTAGRAM_URL, INSTAGRAM_USER, UBICACION } from "@/lib/site";
import { InstagramIcon } from "@/components/icons";

// Banner de marca arriba del catálogo. Siempre oscuro (en los dos temas)
// para que corte con el fondo crema y le dé presencia a la marca.
export default function Hero({ disponibles }: { disponibles: number }) {
  return (
    <section className="relative mx-2 mt-4 overflow-hidden rounded-3xl bg-ink px-6 py-7 text-paper ring-1 ring-white/5 sm:px-10 sm:py-10">
      {/* Líneas de velocidad, como en el logo */}
      <div aria-hidden className="pointer-events-none absolute -right-6 top-6 flex flex-col items-end gap-2 opacity-90">
        <span className="h-1 w-20 rounded-full bg-accent sm:w-24" />
        <span className="mr-6 h-1 w-12 rounded-full bg-accent/70 sm:w-16" />
        <span className="mr-2 h-1 w-8 rounded-full bg-accent/40 sm:w-10" />
      </div>

      <div className="relative flex items-center gap-6">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {UBICACION}
          </p>
          <h1 className="mt-2 font-display text-[2.5rem] leading-[0.9] sm:text-6xl">
            Gorras únicas.
            <br />
            <span className="text-paper/60">Hay una de cada una.</span>
          </h1>
          <p className="mt-3 max-w-md text-sm text-paper/70">
            Vintage, selección y marcas. Tocá una gorra para ver todas sus fotos
            y consultala por WhatsApp.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 rounded-full bg-paper/10 px-4 py-2 text-sm font-medium">
              <span className="h-2 w-2 rounded-full bg-whatsapp" />
              {disponibles} {disponibles === 1 ? "disponible" : "disponibles"}
            </span>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              <InstagramIcon className="h-4 w-4" />@{INSTAGRAM_USER}
            </a>
          </div>
        </div>

        <div className="hidden shrink-0 overflow-hidden rounded-[50%] bg-mark-bg px-7 py-6 shadow-2xl shadow-black/40 sm:block">
          <Image
            src="/brand/mark.png"
            alt=""
            width={180}
            height={108}
            className="h-auto w-40 lg:w-48"
            priority
          />
        </div>
      </div>
    </section>
  );
}
