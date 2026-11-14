// Avisos (toasts) del panel admin y sus sonidos. Es un almacén chico en
// memoria del navegador: cualquier componente cliente llama a
// `avisar.exito(...)` / `avisar.borrado(...)` / `avisar.error(...)` y el
// componente <Avisos /> (montado en el layout del panel) los muestra. Como
// el layout no se desmonta al navegar dentro del panel, un aviso disparado
// justo antes de un router.push sigue visible en la página de destino.

export type TipoAviso = "exito" | "borrado" | "error";
export type Aviso = { id: number; tipo: TipoAviso; texto: string };

const DURACION_MS: Record<TipoAviso, number> = { exito: 3500, borrado: 3500, error: 7000 };

let avisos: Aviso[] = [];
let siguienteId = 1;
const oyentes = new Set<() => void>();

function emitir() {
  oyentes.forEach((o) => o());
}

export function suscribirAvisos(oyente: () => void) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

export function leerAvisos() {
  return avisos;
}

const SIN_AVISOS: Aviso[] = [];
export function leerAvisosServidor() {
  return SIN_AVISOS;
}

export function cerrarAviso(id: number) {
  avisos = avisos.filter((a) => a.id !== id);
  emitir();
}

function mostrar(tipo: TipoAviso, texto: string) {
  const id = siguienteId++;
  avisos = [...avisos.slice(-3), { id, tipo, texto }]; // como mucho 4 a la vez
  emitir();
  sonar(tipo);
  setTimeout(() => cerrarAviso(id), DURACION_MS[tipo]);
}

export const avisar = {
  exito: (texto: string) => mostrar("exito", texto),
  borrado: (texto: string) => mostrar("borrado", texto),
  error: (texto: string) => mostrar("error", texto),
};

// ---------- Sonido (Web Audio API, sin archivos) ----------

const CLAVE_SONIDO = "admin-sonido"; // "off" = silenciado; cualquier otra cosa = activado
const oyentesSonido = new Set<() => void>();

export function sonidoActivado(): boolean {
  try {
    return localStorage.getItem(CLAVE_SONIDO) !== "off";
  } catch {
    return true;
  }
}

export function sonidoActivadoServidor() {
  return true;
}

export function suscribirSonido(oyente: () => void) {
  oyentesSonido.add(oyente);
  return () => oyentesSonido.delete(oyente);
}

export function alternarSonido() {
  const activar = !sonidoActivado();
  try {
    localStorage.setItem(CLAVE_SONIDO, activar ? "on" : "off");
  } catch {
    // sin localStorage (modo privado estricto): queda solo para esta pestaña
  }
  oyentesSonido.forEach((o) => o());
  if (activar) sonar("exito"); // que se escuche que volvió el sonido
}

let ctx: AudioContext | null = null;

function contexto(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

// Los navegadores (sobre todo Safari en iPhone) solo dejan arrancar el audio
// dentro de un toque o clic. <Avisos /> llama a esto en el primer toque de
// la página, así el sonido que llega después de una acción async suena.
export function desbloquearAudio() {
  const c = contexto();
  if (c && c.state === "suspended") void c.resume();
}

const VOLUMEN = 0.07; // moderado: que se escuche sin asustar

function nota(c: AudioContext, frecIni: number, frecFin: number, inicio: number, dur: number, forma: OscillatorType) {
  const osc = c.createOscillator();
  const gan = c.createGain();
  osc.type = forma;
  osc.frequency.setValueAtTime(frecIni, inicio);
  if (frecFin !== frecIni) osc.frequency.exponentialRampToValueAtTime(frecFin, inicio + dur);
  // Envolvente corta: sube rápido y se apaga suave, sin "click".
  gan.gain.setValueAtTime(0.0001, inicio);
  gan.gain.exponentialRampToValueAtTime(VOLUMEN, inicio + 0.012);
  gan.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
  osc.connect(gan).connect(c.destination);
  osc.start(inicio);
  osc.stop(inicio + dur + 0.02);
}

export function sonar(tipo: TipoAviso) {
  if (!sonidoActivado()) return;
  const c = contexto();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const t = c.currentTime + 0.01;
  if (tipo === "exito") {
    // "ding" de dos notas ascendentes (~150 ms)
    nota(c, 880, 880, t, 0.09, "sine");
    nota(c, 1318.5, 1318.5, t + 0.07, 0.13, "sine");
  } else if (tipo === "borrado") {
    // tono descendente suave
    nota(c, 520, 260, t, 0.22, "triangle");
  } else {
    // error: grave y corto, dos pulsos
    nota(c, 196, 185, t, 0.12, "triangle");
    nota(c, 165, 155, t + 0.13, 0.16, "triangle");
  }
}
