// Esqueleto que se ve al instante al navegar dentro del panel, mientras el
// servidor arma la página (todas son dinámicas y consultan la base).
export default function CargandoPanel() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="animate-pulse">
      <div className="h-7 w-48 rounded-lg bg-border" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-card ring-1 ring-border" />
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-2xl bg-card ring-1 ring-border" />
        ))}
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
