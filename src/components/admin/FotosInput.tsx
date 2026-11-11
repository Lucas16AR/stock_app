"use client";

import { useRef, useState } from "react";

// Las fotos se achican en el navegador antes de mandarlas porque el envío
// del formulario (Server Action) tiene un tope de 4 MB en total
// (next.config.ts), y Vercel corta cualquier request de más de 4,5 MB.
// Una foto de celular pesa 2–5 MB; achicada a 1600 px queda en ~150–400 KB.
const LADO_MAX_PX = 1600;
const CALIDAD = 0.82;
const ENVIO_MAX_BYTES = 3.8 * 1024 * 1024; // margen bajo el bodySizeLimit de 4 MB

async function comprimir(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const escala = Math.min(1, LADO_MAX_PX / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  const aBlob = (tipo: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, tipo, CALIDAD));

  // Algunos navegadores no codifican WebP y devuelven PNG: en ese caso, JPEG.
  let blob = await aBlob("image/webp");
  if (!blob || blob.type !== "image/webp") blob = await aBlob("image/jpeg");
  if (!blob) throw new Error("No se pudo procesar la imagen");

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const nombre = file.name.replace(/\.[^.]*$/, "") || "foto";
  return new File([blob], `${nombre}.${ext}`, { type: blob.type });
}

function formatMB(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FotosInput({ restantes }: { restantes: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<
    | { tipo: "vacio" }
    | { tipo: "procesando"; hechas: number; total: number }
    | { tipo: "listo"; cantidad: number; bytes: number; avisos: string[] }
  >({ tipo: "vacio" });

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const elegidas = Array.from(input.files ?? []);
    // Vaciamos el input mientras se procesa: si se envía el formulario a
    // mitad de camino, no viajan los originales pesados.
    input.value = "";
    if (elegidas.length === 0) {
      setEstado({ tipo: "vacio" });
      return;
    }

    const avisos: string[] = [];
    let aProcesar = elegidas;
    if (elegidas.length > restantes) {
      aProcesar = elegidas.slice(0, restantes);
      avisos.push(
        `Elegiste ${elegidas.length} fotos pero solo entran ${restantes} más; se usan las primeras ${restantes}.`
      );
    }

    const listas: File[] = [];
    let bytes = 0;
    for (let i = 0; i < aProcesar.length; i++) {
      setEstado({ tipo: "procesando", hechas: i, total: aProcesar.length });
      const original = aProcesar[i];
      try {
        const comprimida = await comprimir(original);
        if (bytes + comprimida.size > ENVIO_MAX_BYTES) {
          avisos.push(
            `"${original.name}" y las siguientes no entran en este envío (tope ${formatMB(ENVIO_MAX_BYTES)}). Guardá y subilas en otra tanda.`
          );
          break;
        }
        listas.push(comprimida);
        bytes += comprimida.size;
      } catch {
        avisos.push(`"${original.name}" no se pudo leer como imagen y se omitió.`);
      }
    }

    const dt = new DataTransfer();
    listas.forEach((f) => dt.items.add(f));
    if (inputRef.current) inputRef.current.files = dt.files;

    setEstado({ tipo: "listo", cantidad: listas.length, bytes, avisos });
  }

  if (restantes <= 0) {
    return (
      <p className="text-xs text-muted">
        Este producto ya tiene el máximo de fotos. Borrá alguna para agregar otras.
      </p>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name="fotos"
        multiple
        accept="image/*"
        onChange={alElegir}
        className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm text-muted"
      />
      {estado.tipo === "procesando" && (
        <p className="mt-1 text-xs text-muted">
          Achicando fotos… {estado.hechas}/{estado.total} (esperá antes de guardar)
        </p>
      )}
      {estado.tipo === "listo" && (
        <div className="mt-1 space-y-1 text-xs">
          <p className="text-muted">
            {estado.cantidad} {estado.cantidad === 1 ? "foto lista" : "fotos listas"} ·{" "}
            {formatMB(estado.bytes)} en total
          </p>
          {estado.avisos.map((a) => (
            <p key={a} className="text-accent">
              {a}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
