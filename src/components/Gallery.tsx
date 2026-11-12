"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// Galería del detalle: foto grande deslizable (swipe en el celu, flechas
// en compu) + tira de miniaturas para saltar a cualquier foto.
export default function Gallery({
  fotos,
  alt,
  vendida = false,
}: {
  fotos: { id: number; url: string }[];
  alt: string;
  vendida?: boolean;
}) {
  const [activa, setActiva] = useState(0);
  const tira = useRef<HTMLDivElement>(null);
  const miniaturas = useRef<HTMLDivElement>(null);

  // Sincroniza la miniatura activa con lo que se ve en la tira principal.
  useEffect(() => {
    const el = tira.current;
    if (!el) return;
    const onScroll = () => {
      const i = Math.round(el.scrollLeft / el.clientWidth);
      setActiva(Math.max(0, Math.min(fotos.length - 1, i)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [fotos.length]);

  // Mantiene la miniatura activa a la vista si hay muchas.
  useEffect(() => {
    const thumb = miniaturas.current?.children[activa] as HTMLElement | undefined;
    thumb?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [activa]);

  function ir(i: number) {
    const el = tira.current;
    if (!el) return;
    const destino = (i + fotos.length) % fotos.length;
    el.scrollTo({ left: destino * el.clientWidth, behavior: "smooth" });
  }

  if (fotos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-3xl bg-card text-muted ring-1 ring-border">
        Sin fotos
      </div>
    );
  }

  const flecha =
    "absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-md backdrop-blur transition hover:bg-background sm:flex";

  return (
    <div className="flex flex-col gap-3">
      <div
        className="group relative"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") ir(activa + 1);
          if (e.key === "ArrowLeft") ir(activa - 1);
        }}
      >
        <div
          ref={tira}
          tabIndex={0}
          aria-label={`Fotos de ${alt}`}
          className="flex aspect-square snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-3xl bg-card ring-1 ring-border outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-scrollbar]:hidden"
        >
          {fotos.map((f, i) => (
            <div key={f.id} className="relative h-full w-full shrink-0 snap-center">
              <Image
                src={f.url}
                alt={`${alt} — foto ${i + 1} de ${fotos.length}`}
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                className={`object-cover ${vendida ? "grayscale" : ""}`}
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {fotos.length > 1 && (
          <>
            <button type="button" onClick={() => ir(activa - 1)} aria-label="Foto anterior" className={`${flecha} left-3`}>
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2.4}>
                <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" onClick={() => ir(activa + 1)} aria-label="Foto siguiente" className={`${flecha} right-3`}>
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2.4}>
                <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/75 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {activa + 1} / {fotos.length}
            </span>
          </>
        )}

        {vendida && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 rounded-lg border-[3px] border-accent bg-background/85 px-5 py-1 font-display text-5xl tracking-widest text-accent">
              VENDIDA
            </span>
          </span>
        )}
      </div>

      {fotos.length > 1 && (
        <div ref={miniaturas} className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {fotos.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => ir(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === activa}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl transition sm:h-20 sm:w-20 ${
                i === activa ? "ring-2 ring-accent" : "opacity-60 ring-1 ring-border hover:opacity-100"
              }`}
            >
              <Image src={f.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
